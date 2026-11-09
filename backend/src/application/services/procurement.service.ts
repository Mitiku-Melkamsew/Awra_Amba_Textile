import { prisma } from "../../lib/prisma.js";
import { AuditService } from "./audit.service.js";
import { NotFoundError, ValidationError } from "../../domain/errors/domain-errors.js";
import { resolveYarnVariant } from "../../services/variant.service.js";

const purchaseInclude = {
  supplier: true,
  lines: {
    include: {
      yarnVariant: { include: { yarn: true, color: true } },
    },
  },
  createdBy: { select: { userId: true, username: true, fullName: true } },
};

export class ProcurementService {
  static async listPurchases(limit = 100, offset = 0) {
    const [purchases, total] = await Promise.all([
      prisma.yarnPurchase.findMany({
        include: purchaseInclude,
        orderBy: { purchaseDate: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.yarnPurchase.count(),
    ]);

    return { purchases, total };
  }

  static async getPurchase(purchaseId: number) {
    const purchase = await prisma.yarnPurchase.findUnique({
      where: { purchaseId },
      include: purchaseInclude,
    });

    if (!purchase) {
      throw new NotFoundError(`Yarn purchase ${purchaseId} not found`);
    }

    return purchase;
  }

  static async createPurchase(
    input: {
      supplierId: number;
      purchaseDate?: Date;
      notes?: string;
      lines: Array<{
        yarnVariantId?: number;
        yarnId?: number;
        yarnTypeId?: number;
        colorId?: number;
        supplierId?: number;
        quantity?: number;
        quantityKg?: number;
        unitPrice?: number;
        unitCost?: number;
      }>;
    },
    actorUserId: number,
  ) {
    return prisma.$transaction(async (tx) => {
      const resolvedLines: Array<{ yarnVariantId: number; quantity: number; unitPrice: number }> = [];

      for (const line of input.lines) {
        const qty = line.quantity ?? line.quantityKg ?? 0;
        const price = line.unitPrice ?? line.unitCost ?? 0;
        if (qty <= 0) {
          throw new ValidationError("Procurement line quantity must be greater than 0");
        }

        let yarnVariantId = line.yarnVariantId;
        if (!yarnVariantId) {
          const yarnId = line.yarnId ?? line.yarnTypeId;
          const colorId = line.colorId;
          const supplierId = line.supplierId ?? input.supplierId;
          if (yarnId && colorId && supplierId) {
            const res = await resolveYarnVariant({ yarnId, colorId, supplierId }, tx);
            yarnVariantId = res.variantId;
          } else {
            throw new ValidationError("yarnVariantId or (yarnId, colorId, supplierId) is required for each procurement line");
          }
        }

        resolvedLines.push({
          yarnVariantId,
          quantity: qty,
          unitPrice: price,
        });
      }

      const purchase = await tx.yarnPurchase.create({
        data: {
          supplierId: input.supplierId,
          purchaseDate: input.purchaseDate ?? new Date(),
          notes: input.notes,
          createdByUserId: actorUserId,
          lines: {
            create: resolvedLines.map((l) => ({
              yarnVariantId: l.yarnVariantId,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
            })),
          },
        },
        include: purchaseInclude,
      });

      for (const line of resolvedLines) {
        await tx.yarnVariant.update({
          where: { yarnVariantId: line.yarnVariantId },
          data: { stockSnapshot: { increment: line.quantity } },
        });
      }

      await AuditService.record(
        {
          actorUserId,
          action: "procurement.yarn_purchase",
          entityType: "yarn_purchase",
          entityId: purchase.purchaseId,
          details: { supplierId: input.supplierId, lineCount: resolvedLines.length },
        },
        tx,
      );

      return purchase;
    });
  }
}
