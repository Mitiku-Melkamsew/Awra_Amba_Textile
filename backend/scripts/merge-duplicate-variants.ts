import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function mergeDuplicateVariants() {
  console.log("🔍 Scanning for duplicate variants in database...\n");

  await prisma.$transaction(async (tx) => {
    // 1. Yarn Variants
    const allYarnVariants = await tx.yarnVariant.findMany({
      include: {
        yarn: true,
        color: true,
        supplier: true,
      },
      orderBy: { yarnVariantId: "asc" },
    });

    const yarnGroups = new Map<string, typeof allYarnVariants>();
    for (const yv of allYarnVariants) {
      const key = `${yv.yarnId}-${yv.colorId}-${yv.supplierId}`;
      if (!yarnGroups.has(key)) {
        yarnGroups.set(key, []);
      }
      yarnGroups.get(key)!.push(yv);
    }

    let mergedYarnCount = 0;

    for (const [key, variants] of yarnGroups.entries()) {
      if (variants.length <= 1) continue;

      const [primary, ...duplicates] = variants;
      console.log(
        `🧵 Found duplicate Yarn Variant group (${variants.length} items):`,
      );
      console.log(
        `   Material: "${primary.yarn.name}", Color: "${primary.color.name}", Supplier: "${primary.supplier.name}"`,
      );
      console.log(
        `   → Keeping Primary ID: ${primary.yarnVariantId} (SKU: ${primary.sku})`,
      );

      let totalStockToAdd = 0;

      for (const dup of duplicates) {
        console.log(
          `   → Merging Duplicate ID: ${dup.yarnVariantId} (SKU: ${dup.sku}, Stock: ${dup.stockSnapshot})`,
        );

        // Re-link foreign keys to primary
        const [purchases, given, returns, settlement, directTxns] =
          await Promise.all([
            tx.yarnPurchaseLine.updateMany({
              where: { yarnVariantId: dup.yarnVariantId },
              data: { yarnVariantId: primary.yarnVariantId },
            }),
            tx.yarnGiven.updateMany({
              where: { yarnVariantId: dup.yarnVariantId },
              data: { yarnVariantId: primary.yarnVariantId },
            }),
            tx.yarnReturn.updateMany({
              where: { yarnVariantId: dup.yarnVariantId },
              data: { yarnVariantId: primary.yarnVariantId },
            }),
            tx.settlementYarnLine.updateMany({
              where: { yarnVariantId: dup.yarnVariantId },
              data: { yarnVariantId: primary.yarnVariantId },
            }),
            tx.directTransactionLine.updateMany({
              where: { yarnVariantId: dup.yarnVariantId },
              data: { yarnVariantId: primary.yarnVariantId },
            }),
          ]);

        console.log(
          `     Reassigned: ${purchases.count} purchase lines, ${given.count} yarn given, ${returns.count} yarn returns, ${settlement.count} settlement lines, ${directTxns.count} direct txns.`,
        );

        totalStockToAdd += Number(dup.stockSnapshot);

        // Delete duplicate variant
        await tx.yarnVariant.delete({
          where: { yarnVariantId: dup.yarnVariantId },
        });

        mergedYarnCount++;
      }

      if (totalStockToAdd > 0) {
        await tx.yarnVariant.update({
          where: { yarnVariantId: primary.yarnVariantId },
          data: { stockSnapshot: { increment: totalStockToAdd } },
        });
        console.log(
          `   ✓ Added ${totalStockToAdd} stock to Primary ID ${primary.yarnVariantId}`,
        );
      }
      console.log("");
    }

    // 2. Fabric Variants
    const allFabricVariants = await tx.fabricVariant.findMany({
      include: {
        fabric: true,
        design: true,
        warpColor: true,
        weftColor: true,
      },
      orderBy: { fabricVariantId: "asc" },
    });

    const fabricGroups = new Map<string, typeof allFabricVariants>();
    for (const fv of allFabricVariants) {
      const key = `${fv.fabricId}-${fv.designId}-${fv.warpColorId}-${fv.weftColorId}`;
      if (!fabricGroups.has(key)) {
        fabricGroups.set(key, []);
      }
      fabricGroups.get(key)!.push(fv);
    }

    let mergedFabricCount = 0;

    for (const [key, variants] of fabricGroups.entries()) {
      if (variants.length <= 1) continue;

      const [primary, ...duplicates] = variants;
      console.log(
        `🧣 Found duplicate Fabric Variant group (${variants.length} items):`,
      );
      console.log(
        `   Fabric: "${primary.fabric.name}", Design: "${primary.design.name}", Warp: "${primary.warpColor.name}", Weft: "${primary.weftColor.name}"`,
      );
      console.log(
        `   → Keeping Primary ID: ${primary.fabricVariantId} (SKU: ${primary.sku})`,
      );

      let totalStockToAdd = 0;

      for (const dup of duplicates) {
        console.log(
          `   → Merging Duplicate ID: ${dup.fabricVariantId} (SKU: ${dup.sku}, Stock: ${dup.stockSnapshot})`,
        );

        const [workOrders, returns, weaverReturns, directTxns] =
          await Promise.all([
            tx.workOrder.updateMany({
              where: { fabricVariantId: dup.fabricVariantId },
              data: { fabricVariantId: primary.fabricVariantId },
            }),
            tx.fabricReturn.updateMany({
              where: { fabricVariantId: dup.fabricVariantId },
              data: { fabricVariantId: primary.fabricVariantId },
            }),
            tx.fabricReturnToWeaver.updateMany({
              where: { fabricVariantId: dup.fabricVariantId },
              data: { fabricVariantId: primary.fabricVariantId },
            }),
            tx.directTransactionLine.updateMany({
              where: { fabricVariantId: dup.fabricVariantId },
              data: { fabricVariantId: primary.fabricVariantId },
            }),
          ]);

        console.log(
          `     Reassigned: ${workOrders.count} work orders, ${returns.count} fabric returns, ${weaverReturns.count} weaver returns, ${directTxns.count} direct txns.`,
        );

        totalStockToAdd += Number(dup.stockSnapshot);

        await tx.fabricVariant.delete({
          where: { fabricVariantId: dup.fabricVariantId },
        });

        mergedFabricCount++;
      }

      if (totalStockToAdd > 0) {
        await tx.fabricVariant.update({
          where: { fabricVariantId: primary.fabricVariantId },
          data: { stockSnapshot: { increment: totalStockToAdd } },
        });
        console.log(
          `   ✓ Added ${totalStockToAdd} stock to Primary ID ${primary.fabricVariantId}`,
        );
      }
      console.log("");
    }

    console.log("==================================================");
    console.log(
      `🎉 Deduplication complete! Merged ${mergedYarnCount} duplicate yarn variants and ${mergedFabricCount} duplicate fabric variants.`,
    );
    console.log("==================================================");
  });
}

mergeDuplicateVariants()
  .catch((err) => {
    console.error("❌ Deduplication failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
