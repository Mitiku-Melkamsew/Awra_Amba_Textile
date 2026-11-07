import { prisma } from "../../lib/prisma.js";
import { AuditService } from "./audit.service.js";
import { NotFoundError } from "../../domain/errors/domain-errors.js";

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
        yarnVariantId: number;
        quantity: number;
        unitPrice: number;
      }>;
    },
    actorUserId: number,
  ) {
    return prisma.$transaction(async (tx) => {
      const purchase = await tx.yarnPurchase.create({
        data: {
          supplierId: input.supplierId,
          purchaseDate: input.purchaseDate ?? new Date(),
          notes: input.notes,
          createdByUserId: actorUserId,
          lines: {
            create: input.lines.map((l) => ({
              yarnVariantId: l.yarnVariantId,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
            })),
          },
        },
        include: purchaseInclude,
      });

      for (const line of input.lines) {
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
          details: { supplierId: input.supplierId, lineCount: input.lines.length },
        },
        tx,
      );

      return purchase;
    });
  }
}
