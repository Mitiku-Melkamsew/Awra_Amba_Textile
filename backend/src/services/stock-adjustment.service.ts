import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/** Fabric returns add stock on insert; adjust delta on update. */
export async function adjustFabricReturnStock(
  tx: Tx,
  oldVariantId: number,
  oldQty: number,
  newVariantId: number,
  newQty: number,
) {
  if (oldVariantId === newVariantId) {
    const delta = newQty - oldQty;
    if (delta !== 0) {
      await tx.fabricVariant.update({
        where: { fabricVariantId: oldVariantId },
        data: { stockSnapshot: { increment: delta } },
      });
    }
    return;
  }

  await tx.fabricVariant.update({
    where: { fabricVariantId: oldVariantId },
    data: { stockSnapshot: { decrement: oldQty } },
  });
  await tx.fabricVariant.update({
    where: { fabricVariantId: newVariantId },
    data: { stockSnapshot: { increment: newQty } },
  });
}

/** Yarn given subtracts stock on insert; revert old and apply new on update. */
export async function adjustYarnGivenStock(
  tx: Tx,
  oldVariantId: number,
  oldQty: number | Prisma.Decimal,
  newVariantId: number,
  newQty: number,
) {
  const oldQtyNum = Number(oldQty);

  if (oldVariantId === newVariantId) {
    const delta = oldQtyNum - newQty;
    if (delta !== 0) {
      await tx.yarnVariant.update({
        where: { yarnVariantId: oldVariantId },
        data: { stockSnapshot: { increment: delta } },
      });
    }
    return;
  }

  await tx.yarnVariant.update({
    where: { yarnVariantId: oldVariantId },
    data: { stockSnapshot: { increment: oldQtyNum } },
  });
  await tx.yarnVariant.update({
    where: { yarnVariantId: newVariantId },
    data: { stockSnapshot: { decrement: newQty } },
  });
}