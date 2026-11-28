import { prisma } from "../../lib/prisma.js";
import { AuditService } from "./audit.service.js";
import { NotFoundError, ValidationError } from "../../domain/errors/domain-errors.js";

const purchaseInclude = {
  supplier: true,
  lines: {
    include: {
      yarnVariant: { include: { yarn: true, color: true } },
    },
  },
  createdBy: { select: { userId: true, username: true, firstName: true, lastName: true } },
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
      supplierId?: number | null;
      purchaseDate?: Date;
      notes?: string | null;
      lines: Array<{
        yarnVariantId: number;
        quantity: number;
        unitPrice: number;
      }>;
    },
    actorUserId: number,
  ) {
    return prisma.$transaction(async (tx) => {
      let supplierId = input.supplierId ?? null;
      if (supplierId == null && input.lines[0]?.yarnVariantId) {
        const firstVariant = await tx.yarnVariant.findUnique({
          where: { yarnVariantId: input.lines[0].yarnVariantId },
          select: { supplierId: true },
        });
        if (firstVariant) supplierId = firstVariant.supplierId;
      }
      if (supplierId == null) {
        throw new ValidationError("supplierId is required for yarn purchases.");
      }

      const resolvedLines: Array<{ yarnVariantId: number; quantity: number; unitPrice: number }> = [];

      for (const line of input.lines) {
        if (!line.yarnVariantId) {
          throw new ValidationError("yarnVariantId is required for each procurement line");
        }
        if (line.quantity <= 0) {
          throw new ValidationError("Procurement line quantity must be greater than 0");
        }
        if (line.unitPrice <= 0) {
          throw new ValidationError("Procurement line unitPrice must be greater than 0");
        }

        const yv = await tx.yarnVariant.findUnique({ where: { yarnVariantId: line.yarnVariantId } });
        if (!yv) {
          throw new NotFoundError(`Yarn variant ${line.yarnVariantId} not found`);
        }

        resolvedLines.push({
          yarnVariantId: line.yarnVariantId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        });
      }

      const purchase = await tx.yarnPurchase.create({
        data: {
          supplierId,
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
          details: { supplierId, lineCount: resolvedLines.length },
        },
        tx,
      );

      return purchase;
    });
  }
}
