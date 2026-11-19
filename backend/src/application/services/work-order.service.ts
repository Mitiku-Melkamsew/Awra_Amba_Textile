import { WorkOrderStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AuditService } from "./audit.service.js";
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from "../../domain/errors/domain-errors.js";
import {
  computeDeductionAmount,
  computeGrossFabricValue,
  computeNetFabricValue,
  computeNetPayable,
  suggestWeightDeduction,
  DeductionEntry,
} from "./calculation.service.js";

const fabricVariantInclude = {
  fabric: true,
  warpColor: true,
  weftColor: true,
  design: true,
};

const yarnVariantInclude = {
  yarn: true,
  color: true,
  supplier: true,
};

/** A work order is locked as soon as it belongs to a settlement (paid or not). */
function isSettled(order: { status: string; settlementId?: number | null }) {
  return order.settlementId != null || order.status === WorkOrderStatus.reconciled;
}

export class WorkOrderService {
  static async generateNextZigId(): Promise<string> {
    const orders = await prisma.workOrder.findMany({
      select: { zigId: true },
      orderBy: { dateIssued: "desc" },
      take: 200,
    });
    let max = 0;
    for (const order of orders) {
      const match = order.zigId.match(/^z-(\d+)$/i);
      if (match) max = Math.max(max, Number(match[1]));
    }
    return `z-${max + 1}`;
  }

  static async recalculateAndSaveNetPayable(zigId: string, tx: any): Promise<number> {
    const [fabricReturns, yarnGiven] = await Promise.all([
      tx.fabricReturn.findMany({
        where: { zigId },
        select: { grossFabricValue: true, deductionAmount: true },
      }),
      tx.yarnGiven.findMany({
        where: { zigId },
        select: { quantity: true, unitPrice: true },
      }),
    ]);

    const netPayable = computeNetPayable(
      fabricReturns.map((fr: any) => ({
        grossFabricValue: Number(fr.grossFabricValue),
        deductionAmount: Number(fr.deductionAmount),
      })),
      yarnGiven.map((yg: any) => ({
        quantity: Number(yg.quantity),
        unitPrice: Number(yg.unitPrice),
      })),
    );

    await tx.workOrder.update({
      where: { zigId },
      data: { netPayable },
    });

    return netPayable;
  }

  static async listWorkOrders(filter: {
    status?: WorkOrderStatus;
    weaverUserId?: number;
    userId?: number;
    limit?: number;
    offset?: number;
  } = {}) {
    const where: any = {};
    if (filter.status) where.status = filter.status;
    const wid = filter.weaverUserId ?? filter.userId;
    if (wid) where.weaverUserId = wid;

    const [workOrders, total] = await Promise.all([
      prisma.workOrder.findMany({
        where,
        include: {
          weaver: {
            select: { userId: true, fullName: true, username: true, phone: true, isActive: true },
          },
          fabricVariant: { include: fabricVariantInclude },
          _count: {
            select: {
              yarnGiven: true,
              fabricReturns: true,
            },
          },
        },
        orderBy: { dateIssued: "desc" },
        take: filter.limit ?? 100,
        skip: filter.offset ?? 0,
      }),
      prisma.workOrder.count({ where }),
    ]);

    return { workOrders, total };
  }

  static async getWorkOrder(zigId: string) {
    const order = await prisma.workOrder.findUnique({
      where: { zigId },
      include: {
        weaver: { select: { userId: true, fullName: true, username: true, phone: true } },
        issuedBy: { select: { userId: true, fullName: true, username: true } },
        fabricVariant: { include: fabricVariantInclude },
        settlement: true,
        settlementBatch: true,
        yarnGiven: {
          include: { yarnVariant: { include: yarnVariantInclude } },
          orderBy: { dateGiven: "asc" },
        },
        fabricReturns: {
          include: { fabricVariant: { include: fabricVariantInclude } },
          orderBy: { dateReturned: "asc" },
        },
      },
    });

    if (!order) {
      throw new NotFoundError(`Work order ${zigId} not found`);
    }

    return order;
  }

  static async createWorkOrder(
    input: {
      zigId?: string;
      weaverUserId: number;
      fabricVariantId: number;
      yarnLines?: Array<{
        yarnVariantId: number;
        quantity: number;
        unitPrice?: number;
      }>;
    },
    actorUserId: number,
  ) {
    const zigId = input.zigId ?? (await this.generateNextZigId());

    const existing = await prisma.workOrder.findUnique({ where: { zigId } });
    if (existing) {
      throw new ConflictError(`Work order ${zigId} already exists`);
    }

    const weaverUserId = input.weaverUserId;
    if (!weaverUserId) throw new ValidationError("weaverUserId is required");

    const weaver = await prisma.user.findUnique({
      where: { userId: weaverUserId },
      include: { roles: true },
    });
    if (!weaver) throw new NotFoundError(`Weaver user ${weaverUserId} not found`);
    if (!weaver.isActive) {
      throw new ValidationError(`Cannot issue work order to deactivated weaver (User ID: ${weaverUserId})`);
    }
    if (!weaver.roles.some((r) => r.role === "weaver")) {
      throw new ValidationError(`User ${weaverUserId} is not assigned the weaver role`);
    }

    const fabricVariantId = input.fabricVariantId;
    if (!fabricVariantId) throw new ValidationError("fabricVariantId is required");

    const fabricVariant = await prisma.fabricVariant.findUnique({
      where: { fabricVariantId },
    });
    if (!fabricVariant) {
      throw new NotFoundError(`Fabric variant ${fabricVariantId} not found`);
    }

    const resolvedYarnLines: Array<{ yarnVariantId: number; quantity: number; unitPrice: number }> = [];
    if (input.yarnLines && input.yarnLines.length > 0) {
      for (const line of input.yarnLines) {
        if (line.quantity <= 0) continue;
        resolvedYarnLines.push({
          yarnVariantId: line.yarnVariantId,
          quantity: line.quantity,
          unitPrice: line.unitPrice ?? 0,
        });
      }
    }

    return prisma.$transaction(async (tx) => {
      const order = await tx.workOrder.create({
        data: {
          zigId,
          weaverUserId,
          fabricVariantId,
          status: resolvedYarnLines.length > 0
            ? WorkOrderStatus.in_progress
            : WorkOrderStatus.assigned,
          issuedByUserId: actorUserId,
        },
        include: {
          weaver: { select: { userId: true, fullName: true, username: true } },
          fabricVariant: { include: fabricVariantInclude },
        },
      });

      if (resolvedYarnLines.length > 0) {
        for (const line of resolvedYarnLines) {
          const yv = await tx.yarnVariant.findUniqueOrThrow({
            where: { yarnVariantId: line.yarnVariantId },
          });
          if (Number(yv.stockSnapshot) < line.quantity) {
            throw new ConflictError(
              `Insufficient yarn stock for "${yv.sku}". Available: ${yv.stockSnapshot}, Requested: ${line.quantity}`,
            );
          }

          await tx.yarnGiven.create({
            data: {
              zigId: order.zigId,
              yarnVariantId: line.yarnVariantId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              recordedByUserId: actorUserId,
            },
          });

          await tx.yarnVariant.update({
            where: { yarnVariantId: line.yarnVariantId },
            data: { stockSnapshot: { decrement: line.quantity } },
          });
        }
      }

      const netPayable = await this.recalculateAndSaveNetPayable(zigId, tx);

      await AuditService.record(
        {
          actorUserId,
          action: "work_order.create",
          entityType: "work_order",
          entityId: zigId,
          details: { weaverUserId, fabricVariantId, yarnLineCount: resolvedYarnLines.length },
        },
        tx,
      );

      return { ...order, netPayable };
    });
  }

  static async updateStatus(zigId: string, status: WorkOrderStatus, actorUserId: number) {
    const order = await this.getWorkOrder(zigId);
    if (isSettled(order)) {
      throw new ConflictError("Cannot modify a settled work order");
    }

    return prisma.$transaction(async (tx) => {
      const updateData: any = { status };
      if (status === WorkOrderStatus.returned && !order.dateReturned) {
        updateData.dateReturned = new Date();
      }

      const updated = await tx.workOrder.update({
        where: { zigId },
        data: updateData,
      });

      await AuditService.record(
        {
          actorUserId,
          action: "work_order.status_update",
          entityType: "work_order",
          entityId: zigId,
          details: { from: order.status, to: status },
        },
        tx,
      );

      return updated;
    });
  }

  static async cancelWorkOrder(zigId: string, actorUserId: number) {
    const order = await this.getWorkOrder(zigId);
    if (isSettled(order)) {
      throw new ConflictError("Cannot cancel a settled work order");
    }
    if (order.yarnGiven.length > 0 || order.fabricReturns.length > 0) {
      throw new ConflictError("Cannot cancel a work order with issued yarn or returned fabric");
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { zigId },
        data: { status: WorkOrderStatus.cancelled },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "work_order.cancel",
          entityType: "work_order",
          entityId: zigId,
        },
        tx,
      );

      return updated;
    });
  }

  // --- Yarn Given ---

  static async addYarnGiven(
    zigId: string,
    lines: Array<{ yarnVariantId: number; quantity: number; unitPrice: number }>,
    actorUserId: number,
  ) {
    const order = await this.getWorkOrder(zigId);
    if (isSettled(order)) {
      throw new ConflictError("Cannot issue yarn to a settled work order");
    }
    if (order.status === WorkOrderStatus.cancelled) {
      throw new ConflictError(`Cannot issue yarn to ${order.status} work order`);
    }

    return prisma.$transaction(async (tx) => {
      const created = [];
      for (const line of lines) {
        const yv = await tx.yarnVariant.findUniqueOrThrow({
          where: { yarnVariantId: line.yarnVariantId },
        });
        if (Number(yv.stockSnapshot) < line.quantity) {
          throw new ConflictError(
            `Insufficient yarn stock for "${yv.sku}". Available: ${yv.stockSnapshot}, Requested: ${line.quantity}`,
          );
        }

        const item = await tx.yarnGiven.create({
          data: {
            zigId,
            yarnVariantId: line.yarnVariantId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            recordedByUserId: actorUserId,
          },
          include: { yarnVariant: { include: yarnVariantInclude } },
        });

        await tx.yarnVariant.update({
          where: { yarnVariantId: line.yarnVariantId },
          data: { stockSnapshot: { decrement: line.quantity } },
        });

        created.push(item);
      }

      if (order.status === WorkOrderStatus.assigned) {
        await tx.workOrder.update({
          where: { zigId },
          data: { status: WorkOrderStatus.in_progress },
        });
      }

      await this.recalculateAndSaveNetPayable(zigId, tx);

      await AuditService.record(
        {
          actorUserId,
          action: "yarn_given.create",
          entityType: "work_order",
          entityId: zigId,
          details: { lineCount: lines.length },
        },
        tx,
      );

      return created;
    });
  }

  static async updateYarnGiven(
    yarnGivenId: number,
    data: { quantity?: number; unitPrice?: number; remark?: string | null },
    actorUserId: number,
  ) {
    const existing = await prisma.yarnGiven.findUnique({
      where: { yarnGivenId },
      include: { workOrder: true },
    });
    if (!existing) throw new NotFoundError(`Yarn given record ${yarnGivenId} not found`);
    if (isSettled(existing.workOrder)) {
      throw new ConflictError("Cannot modify yarn on a settled work order");
    }

    return prisma.$transaction(async (tx) => {
      let deltaQty = 0;
      if (data.quantity !== undefined) {
        deltaQty = data.quantity - Number(existing.quantity);
      }

      const updated = await tx.yarnGiven.update({
        where: { yarnGivenId },
        data: {
          quantity: data.quantity !== undefined ? data.quantity : undefined,
          unitPrice: data.unitPrice !== undefined ? data.unitPrice : undefined,
          remark: data.remark !== undefined ? data.remark : undefined,
        },
      });

      if (deltaQty !== 0) {
        if (deltaQty > 0) {
          const yv = await tx.yarnVariant.findUniqueOrThrow({
            where: { yarnVariantId: existing.yarnVariantId },
          });
          if (Number(yv.stockSnapshot) < deltaQty) {
            throw new ConflictError(
              `Insufficient yarn stock for "${yv.sku}". Available: ${yv.stockSnapshot}, additional requested: ${deltaQty}`,
            );
          }
        }
        await tx.yarnVariant.update({
          where: { yarnVariantId: existing.yarnVariantId },
          data: { stockSnapshot: { decrement: deltaQty } },
        });
      }

      await this.recalculateAndSaveNetPayable(existing.zigId, tx);

      await AuditService.record(
        {
          actorUserId,
          action: "yarn_given.update",
          entityType: "yarn_given",
          entityId: yarnGivenId,
          details: data,
        },
        tx,
      );

      return updated;
    });
  }

  static async deleteYarnGiven(yarnGivenId: number, actorUserId: number) {
    const existing = await prisma.yarnGiven.findUnique({
      where: { yarnGivenId },
      include: { workOrder: true },
    });
    if (!existing) throw new NotFoundError(`Yarn given record ${yarnGivenId} not found`);
    if (isSettled(existing.workOrder)) {
      throw new ConflictError("Cannot delete yarn on a settled work order");
    }

    return prisma.$transaction(async (tx) => {
      await tx.yarnGiven.delete({ where: { yarnGivenId } });
      await tx.yarnVariant.update({
        where: { yarnVariantId: existing.yarnVariantId },
        data: { stockSnapshot: { increment: existing.quantity } },
      });

      await this.recalculateAndSaveNetPayable(existing.zigId, tx);

      await AuditService.record(
        {
          actorUserId,
          action: "yarn_given.delete",
          entityType: "yarn_given",
          entityId: yarnGivenId,
        },
        tx,
      );

      return { success: true };
    });
  }

  // --- Fabric Returns ---

  static async addFabricReturn(
    input: {
      zigId: string;
      fabricVariantId: number;
      quantityReturned: number;
      totalWeight: number;
      unitPrice?: number;
      lengthCm?: number | null;
      widthCm?: number | null;
      remark?: string | null;
      deductions?: DeductionEntry[];
      dateReturned?: string;
    },
    actorUserId: number,
  ) {
    const order = await this.getWorkOrder(input.zigId);
    if (isSettled(order)) {
      throw new ConflictError("Cannot add a fabric return to a settled work order");
    }
    if (order.status === WorkOrderStatus.cancelled) {
      throw new ConflictError(`Cannot add fabric return to ${order.status} work order`);
    }

    const fabricVariantId = input.fabricVariantId;
    const fv = await prisma.fabricVariant.findUnique({
      where: { fabricVariantId },
      include: { fabric: true },
    });
    if (!fv) throw new NotFoundError(`Fabric variant ${fabricVariantId} not found`);

    const totalWeight = input.totalWeight;
    if (totalWeight <= 0) throw new ValidationError("totalWeight must be greater than 0");
    const remark = input.remark ?? undefined;
    const unitPrice = input.unitPrice ?? 0;
    const grossFabricValue = computeGrossFabricValue(input.quantityReturned, unitPrice);

    return prisma.$transaction(async (tx) => {
      let deductions: DeductionEntry[] = input.deductions ?? [];
      // Auto-suggest weight deduction if none supplied and fabric has standard weight
      if (deductions.length === 0 && fv.fabric?.standardWeightG) {
        const weightRule = await tx.qualityRule.findFirst({
          where: { factor: "weight", isActive: true },
        });
        const deductionRate = weightRule ? Number(weightRule.deductionPerUnit) : 10;
        const suggestion = suggestWeightDeduction(
          totalWeight,
          input.quantityReturned,
          Number(fv.fabric.standardWeightG),
          deductionRate,
        );
        if (suggestion) {
          deductions = [suggestion];
        }
      }

      const deductionAmount = computeDeductionAmount(deductions, input.quantityReturned);

      const created = await tx.fabricReturn.create({
        data: {
          zigId: input.zigId,
          fabricVariantId,
          quantityReturned: input.quantityReturned,
          totalWeight,
          unitPrice,
          grossFabricValue,
          deductionAmount,
          deductions: deductions as any,
          lengthCm: input.lengthCm,
          widthCm: input.widthCm,
          remark,
          dateReturned: input.dateReturned ? new Date(input.dateReturned) : undefined,
          recordedByUserId: actorUserId,
        },
        include: { fabricVariant: { include: fabricVariantInclude } },
      });

      // Increase fabric stock snapshot
      await tx.fabricVariant.update({
        where: { fabricVariantId },
        data: { stockSnapshot: { increment: input.quantityReturned } },
      });

      if (order.status === WorkOrderStatus.assigned) {
        await tx.workOrder.update({
          where: { zigId: input.zigId },
          data: { status: WorkOrderStatus.in_progress },
        });
      }

      await this.recalculateAndSaveNetPayable(input.zigId, tx);

      await AuditService.record(
        {
          actorUserId,
          action: "fabric_return.create",
          entityType: "work_order",
          entityId: input.zigId,
          details: { quantityReturned: input.quantityReturned, totalWeight, grossFabricValue, deductionAmount },
        },
        tx,
      );

      return created;
    });
  }

  static async updateFabricReturn(
    returnId: number,
    data: {
      quantityReturned?: number;
      totalWeight?: number;
      unitPrice?: number;
      lengthCm?: number | null;
      widthCm?: number | null;
      remark?: string | null;
      deductions?: DeductionEntry[];
      dateReturned?: string;
    },
    actorUserId: number,
  ) {
    const existing = await prisma.fabricReturn.findUnique({
      where: { returnId },
      include: { workOrder: true },
    });
    if (!existing) throw new NotFoundError(`Fabric return record ${returnId} not found`);
    if (isSettled(existing.workOrder)) {
      throw new ConflictError("Cannot modify settled fabric return record");
    }

    const totalWeight = data.totalWeight ?? Number(existing.totalWeight);
    const quantityReturned = data.quantityReturned ?? existing.quantityReturned;
    const unitPrice = data.unitPrice ?? Number(existing.unitPrice);
    const remark = data.remark !== undefined ? data.remark : existing.remark;

    const grossFabricValue = computeGrossFabricValue(quantityReturned, unitPrice);
    const deductions = data.deductions ?? (existing.deductions as unknown as DeductionEntry[] ?? []);
    const deductionAmount = computeDeductionAmount(deductions, quantityReturned);

    return prisma.$transaction(async (tx) => {
      const deltaQty = data.quantityReturned !== undefined ? data.quantityReturned - Number(existing.quantityReturned) : 0;

      const updated = await tx.fabricReturn.update({
        where: { returnId },
        data: {
          quantityReturned: data.quantityReturned,
          totalWeight: data.totalWeight,
          unitPrice: data.unitPrice,
          grossFabricValue,
          deductionAmount,
          deductions: deductions as any,
          lengthCm: data.lengthCm,
          widthCm: data.widthCm,
          remark,
          dateReturned: data.dateReturned ? new Date(data.dateReturned) : undefined,
        },
      });

      if (deltaQty !== 0) {
        await tx.fabricVariant.update({
          where: { fabricVariantId: existing.fabricVariantId },
          data: { stockSnapshot: { increment: deltaQty } },
        });
      }

      await this.recalculateAndSaveNetPayable(existing.zigId, tx);

      await AuditService.record(
        {
          actorUserId,
          action: "fabric_return.update",
          entityType: "fabric_return",
          entityId: returnId,
          details: data as any,
        },
        tx,
      );

      return updated;
    });
  }

  static async deleteFabricReturn(returnId: number, actorUserId: number) {
    const existing = await prisma.fabricReturn.findUnique({
      where: { returnId },
      include: { workOrder: true },
    });
    if (!existing) throw new NotFoundError(`Fabric return record ${returnId} not found`);
    if (isSettled(existing.workOrder)) {
      throw new ConflictError("Cannot delete settled fabric return record");
    }

    return prisma.$transaction(async (tx) => {
      const fv = await tx.fabricVariant.findUniqueOrThrow({
        where: { fabricVariantId: existing.fabricVariantId },
      });
      if (Number(fv.stockSnapshot) < existing.quantityReturned) {
        throw new ConflictError(
          `Cannot delete fabric return: insufficient stock for "${fv.sku}". Available: ${fv.stockSnapshot}, to reverse: ${existing.quantityReturned}`,
        );
      }
      await tx.fabricReturn.delete({ where: { returnId } });
      await tx.fabricVariant.update({
        where: { fabricVariantId: existing.fabricVariantId },
        data: { stockSnapshot: { decrement: existing.quantityReturned } },
      });

      await this.recalculateAndSaveNetPayable(existing.zigId, tx);

      await AuditService.record(
        {
          actorUserId,
          action: "fabric_return.delete",
          entityType: "fabric_return",
          entityId: returnId,
        },
        tx,
      );

      return { success: true };
    });
  }
}
