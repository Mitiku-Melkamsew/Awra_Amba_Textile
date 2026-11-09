import { WorkOrderStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AuditService } from "./audit.service.js";
import { resolveFabricVariant, resolveYarnVariant } from "../../services/variant.service.js";
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from "../../domain/errors/domain-errors.js";

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

  static async listWorkOrders(filter: {
    status?: WorkOrderStatus;
    weaverUserId?: number;
    limit?: number;
    offset?: number;
  } = {}) {
    const where: any = {};
    if (filter.status) where.status = filter.status;
    if (filter.weaverUserId) where.weaverUserId = filter.weaverUserId;

    const [workOrders, total] = await Promise.all([
      prisma.workOrder.findMany({
        where,
        include: {
          weaver: {
            select: { userId: true, fullName: true, username: true, phone: true },
          },
          fabricVariant: { include: fabricVariantInclude },
          _count: {
            select: {
              yarnGiven: true,
              fabricReturns: true,
              yarnReturns: true,
              fabricReturnsToWeaver: true,
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
        yarnGiven: {
          include: { yarnVariant: { include: yarnVariantInclude } },
          orderBy: { dateGiven: "asc" },
        },
        fabricReturns: {
          include: { fabricVariant: { include: fabricVariantInclude } },
          orderBy: { dateReturned: "asc" },
        },
        yarnReturns: {
          include: { yarnVariant: { include: yarnVariantInclude } },
          orderBy: { dateReturned: "asc" },
        },
        fabricReturnsToWeaver: {
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
      weaverUserId?: number;
      weaverId?: number;
      fabricVariantId?: number;
      fabricId?: number;
      productId?: number;
      warpColorId?: number | null;
      weftColorId?: number | null;
      designId?: number | null;
      yarnLines?: Array<{
        yarnVariantId?: number;
        yarnId?: number;
        yarnTypeId?: number;
        colorId?: number | null;
        supplierId?: number | null;
        quantity?: number;
        quantityKg?: number;
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

    const weaverUserId = input.weaverUserId ?? input.weaverId;
    if (!weaverUserId) throw new ValidationError("weaverUserId or weaverId is required");

    const weaver = await prisma.user.findUnique({
      where: { userId: weaverUserId },
      include: { roles: true },
    });
    if (!weaver) throw new NotFoundError(`Weaver user ${weaverUserId} not found`);
    if (!weaver.roles.some((r) => r.role === "weaver")) {
      throw new ValidationError(`User ${weaverUserId} is not assigned the weaver role`);
    }

    let fabricVariantId = input.fabricVariantId;
    if (!fabricVariantId) {
      const fabricId = input.fabricId ?? input.productId;
      if (!fabricId) throw new ValidationError("fabricVariantId or fabricId is required");
      let warpColorId = input.warpColorId;
      let weftColorId = input.weftColorId;
      if (!warpColorId || !weftColorId) {
        let firstColor = await prisma.color.findFirst({ orderBy: { colorId: "asc" } });
        if (!firstColor) {
          firstColor = await prisma.color.create({ data: { name: "መደበኛ ቀለም" } });
        }
        warpColorId = warpColorId ?? firstColor.colorId;
        weftColorId = weftColorId ?? firstColor.colorId;
      }
      const res = await resolveFabricVariant({
        fabricId,
        warpColorId,
        weftColorId,
        designId: input.designId,
      });
      fabricVariantId = res.variantId;
    }

    // Resolve any missing yarnVariantId in yarnLines
    const resolvedYarnLines: Array<{ yarnVariantId: number; quantity: number; unitPrice: number }> = [];
    if (input.yarnLines && input.yarnLines.length > 0) {
      for (const line of input.yarnLines) {
        const qty = line.quantity ?? line.quantityKg ?? 0;
        if (qty <= 0) continue;
        let yvId = line.yarnVariantId;
        if (!yvId) {
          const yId = line.yarnId ?? line.yarnTypeId;
          if (yId) {
            let sId = line.supplierId;
            if (!sId) {
              let firstSupplier = await prisma.supplier.findFirst({ orderBy: { supplierId: "asc" } });
              if (!firstSupplier) {
                firstSupplier = await prisma.supplier.create({ data: { name: "መደበኛ አቅራቢ" } });
              }
              sId = firstSupplier.supplierId;
            }
            let cId = line.colorId;
            if (!cId) {
              let firstColor = await prisma.color.findFirst({ orderBy: { colorId: "asc" } });
              if (!firstColor) {
                firstColor = await prisma.color.create({ data: { name: "መደበኛ ቀለም" } });
              }
              cId = firstColor.colorId;
            }
            const res = await resolveYarnVariant({ yarnId: yId, supplierId: sId, colorId: cId });
            yvId = res.variantId;
          }
        }
        if (yvId) {
          resolvedYarnLines.push({
            yarnVariantId: yvId,
            quantity: qty,
            unitPrice: line.unitPrice ?? 0,
          });
        }
      }
    }

    return prisma.$transaction(async (tx) => {
      const order = await tx.workOrder.create({
        data: {
          zigId,
          weaverUserId,
          fabricVariantId: fabricVariantId!,
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

      return order;
    });
  }

  static async updateStatus(zigId: string, status: WorkOrderStatus, actorUserId: number) {
    const order = await this.getWorkOrder(zigId);
    if (order.status === WorkOrderStatus.reconciled) {
      throw new ConflictError("Cannot modify a reconciled work order");
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { zigId },
        data: { status },
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
    if (order.status === WorkOrderStatus.reconciled) {
      throw new ConflictError("Cannot cancel a reconciled work order");
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
    if (order.status === WorkOrderStatus.reconciled || order.status === WorkOrderStatus.cancelled) {
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
    data: { quantity?: number; unitPrice?: number },
    actorUserId: number,
  ) {
    const existing = await prisma.yarnGiven.findUnique({
      where: { yarnGivenId },
      include: { settlementYarnLines: true },
    });
    if (!existing) throw new NotFoundError(`Yarn given record ${yarnGivenId} not found`);
    if (existing.settlementYarnLines.length > 0) {
      throw new ConflictError("Cannot modify settled yarn given record");
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
      include: { settlementYarnLines: true },
    });
    if (!existing) throw new NotFoundError(`Yarn given record ${yarnGivenId} not found`);
    if (existing.settlementYarnLines.length > 0) {
      throw new ConflictError("Cannot delete settled yarn given record");
    }

    return prisma.$transaction(async (tx) => {
      await tx.yarnGiven.delete({ where: { yarnGivenId } });
      await tx.yarnVariant.update({
        where: { yarnVariantId: existing.yarnVariantId },
        data: { stockSnapshot: { increment: existing.quantity } },
      });

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
      fabricVariantId?: number;
      productId?: number;
      fabricId?: number;
      warpColorId?: number | null;
      weftColorId?: number | null;
      designId?: number | null;
      quantityReturned: number;
      totalWeight?: number;
      actualWeightG?: number;
      unitPrice?: number;
      lengthCm?: number | null;
      widthCm?: number | null;
      remark?: string | null;
      notes?: string | null;
    },
    actorUserId: number,
  ) {
    const order = await this.getWorkOrder(input.zigId);
    if (order.status === WorkOrderStatus.reconciled || order.status === WorkOrderStatus.cancelled) {
      throw new ConflictError(`Cannot add fabric return to ${order.status} work order`);
    }

    let fabricVariantId = input.fabricVariantId;
    const fabricId = input.fabricId ?? input.productId;
    if (fabricId) {
      let warpColorId = input.warpColorId;
      let weftColorId = input.weftColorId;
      if (!warpColorId || !weftColorId) {
        const firstColor = await prisma.color.findFirst({ orderBy: { colorId: "asc" } });
        warpColorId = warpColorId ?? firstColor?.colorId ?? 1;
        weftColorId = weftColorId ?? firstColor?.colorId ?? 1;
      }
      const res = await resolveFabricVariant({
        fabricId,
        warpColorId,
        weftColorId,
        designId: input.designId,
      });
      fabricVariantId = res.variantId;
    } else if (!fabricVariantId) {
      fabricVariantId = order.fabricVariantId;
    }

    const totalWeight = input.totalWeight ?? input.actualWeightG ?? 0;
    const remark = input.remark ?? input.notes ?? undefined;
    const unitPrice = input.unitPrice ?? 0;

    return prisma.$transaction(async (tx) => {
      const created = await tx.fabricReturn.create({
        data: {
          zigId: input.zigId,
          fabricVariantId,
          quantityReturned: input.quantityReturned,
          totalWeight,
          unitPrice,
          lengthCm: input.lengthCm,
          widthCm: input.widthCm,
          remark,
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

      await AuditService.record(
        {
          actorUserId,
          action: "fabric_return.create",
          entityType: "work_order",
          entityId: input.zigId,
          details: { quantityReturned: input.quantityReturned, totalWeight },
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
      actualWeightG?: number;
      unitPrice?: number;
      lengthCm?: number | null;
      widthCm?: number | null;
      remark?: string | null;
      notes?: string | null;
    },
    actorUserId: number,
  ) {
    const existing = await prisma.fabricReturn.findUnique({
      where: { returnId },
      include: { settlementLineReturns: true },
    });
    if (!existing) throw new NotFoundError(`Fabric return record ${returnId} not found`);
    if (existing.settlementLineReturns.length > 0) {
      throw new ConflictError("Cannot modify settled fabric return record");
    }

    const totalWeight = data.totalWeight ?? data.actualWeightG;
    const remark = data.remark ?? data.notes;

    return prisma.$transaction(async (tx) => {
      const deltaQty = data.quantityReturned !== undefined ? data.quantityReturned - Number(existing.quantityReturned) : 0;

      const updated = await tx.fabricReturn.update({
        where: { returnId },
        data: {
          quantityReturned: data.quantityReturned,
          totalWeight,
          unitPrice: data.unitPrice,
          lengthCm: data.lengthCm,
          widthCm: data.widthCm,
          remark,
        },
      });

      if (deltaQty !== 0) {
        await tx.fabricVariant.update({
          where: { fabricVariantId: existing.fabricVariantId },
          data: { stockSnapshot: { increment: deltaQty } },
        });
      }

      await AuditService.record(
        {
          actorUserId,
          action: "fabric_return.update",
          entityType: "fabric_return",
          entityId: returnId,
          details: data,
        },
        tx,
      );

      return updated;
    });
  }

  static async deleteFabricReturn(returnId: number, actorUserId: number) {
    const existing = await prisma.fabricReturn.findUnique({
      where: { returnId },
      include: { settlementLineReturns: true },
    });
    if (!existing) throw new NotFoundError(`Fabric return record ${returnId} not found`);
    if (existing.settlementLineReturns.length > 0) {
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

  // --- Yarn Returns (Unused yarn returned by weaver) ---

  static async addYarnReturn(
    input: {
      zigId: string;
      yarnVariantId?: number;
      yarnId?: number;
      quantity?: number;
      quantityKg?: number;
      remark?: string | null;
    },
    actorUserId: number,
  ) {
    const order = await this.getWorkOrder(input.zigId);
    if (order.status === WorkOrderStatus.reconciled || order.status === WorkOrderStatus.cancelled) {
      throw new ConflictError(`Cannot return yarn for ${order.status} work order`);
    }

    let yarnVariantId = input.yarnVariantId;
    if (!yarnVariantId) {
      const match = order.yarnGiven.find((yg) => !input.yarnId || yg.yarnVariant.yarnId === input.yarnId);
      if (match) {
        yarnVariantId = match.yarnVariantId;
      } else if (order.yarnGiven[0]) {
        yarnVariantId = order.yarnGiven[0].yarnVariantId;
      } else {
        throw new ValidationError("yarnVariantId could not be resolved from work order");
      }
    }

    const quantity = input.quantity ?? input.quantityKg ?? 0;
    if (quantity <= 0) throw new ValidationError("Returned yarn quantity must be greater than 0");

    return prisma.$transaction(async (tx) => {
      const created = await tx.yarnReturn.create({
        data: {
          zigId: input.zigId,
          yarnVariantId,
          quantity,
          recordedByUserId: actorUserId,
          remark: input.remark,
        },
      });

      await tx.yarnVariant.update({
        where: { yarnVariantId },
        data: { stockSnapshot: { increment: quantity } },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "yarn_return.create",
          entityType: "work_order",
          entityId: input.zigId,
          details: { yarnVariantId, quantity, remark: input.remark },
        },
        tx,
      );

      return created;
    });
  }

  // --- Fabric Returns to Weaver (Defective fabric) ---

  static async addFabricReturnToWeaver(
    input: {
      zigId: string;
      fabricVariantId?: number;
      quantity: number;
      remark?: string | null;
      reason?: string | null;
    },
    actorUserId: number,
  ) {
    const order = await this.getWorkOrder(input.zigId);
    if (order.status === WorkOrderStatus.reconciled || order.status === WorkOrderStatus.cancelled) {
      throw new ConflictError(`Cannot return fabric to weaver for ${order.status} work order`);
    }

    const fabricVariantId = input.fabricVariantId ?? order.fabricVariantId;
    const remark = input.remark ?? input.reason ?? undefined;

    return prisma.$transaction(async (tx) => {
      const fv = await tx.fabricVariant.findUniqueOrThrow({
        where: { fabricVariantId },
      });
      if (Number(fv.stockSnapshot) < input.quantity) {
        throw new ConflictError(
          `Cannot return fabric to weaver: insufficient stock for "${fv.sku}". Available: ${fv.stockSnapshot}, requested: ${input.quantity}`,
        );
      }

      const created = await tx.fabricReturnToWeaver.create({
        data: {
          zigId: input.zigId,
          fabricVariantId,
          quantity: input.quantity,
          recordedByUserId: actorUserId,
          remark,
        },
      });

      await tx.fabricVariant.update({
        where: { fabricVariantId },
        data: { stockSnapshot: { decrement: input.quantity } },
      });

      await AuditService.record(
        {
          actorUserId,
          action: "fabric_return_to_weaver.create",
          entityType: "work_order",
          entityId: input.zigId,
          details: { fabricVariantId, quantity: input.quantity, remark },
        },
        tx,
      );

      return created;
    });
  }
}
