import { PrismaClient, ProductCategory, UserRole } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

const FABRIC_PRODUCTS = [
  { code: "f-01", name: "መደበኛ", basePrice: 1300, threshold: 64 },
  { code: "f-02", name: "በ 2.50 ሜ", basePrice: 1436, threshold: 71 },
  { code: "f-03", name: "በ 2.75 ሜ", basePrice: 1572, threshold: 78 },
  { code: "f-04", name: "በ 3.00 ሜ", basePrice: 1707, threshold: 84 },
  { code: "f-05", name: "ከ 60", basePrice: 1860, threshold: 90 },
  { code: "f-06", name: "ከ 10", basePrice: 950, threshold: 0 },
];

async function main() {
  const defaultColor = await prisma.color.upsert({
    where: { colorCode: "C-001" },
    update: {},
    create: { colorCode: "C-001", name: "Default" },
  });

  const supplier = await prisma.supplier.upsert({
    where: { name: "Default Supplier" },
    update: {},
    create: { name: "Default Supplier", contactPhone: "0000000000" },
  });

  const yarnType = await prisma.yarnType.upsert({
    where: { materialName: "Tilet" },
    update: {},
    create: { materialName: "Tilet" },
  });

  const yarnVariant = await prisma.yarnVariant.upsert({
    where: { sku: "YRN-1-1-C-001" },
    update: {},
    create: {
      yarnTypeId: yarnType.yarnTypeId,
      colorId: defaultColor.colorId,
      supplierId: supplier.supplierId,
      sku: "YRN-1-1-C-001",
      basePrice: 400,
    },
  });

  for (const fabric of FABRIC_PRODUCTS) {
    const productName = `${fabric.name} (${fabric.code})`;
    let product = await prisma.product.findFirst({ where: { name: productName } });
    if (!product) {
      product = await prisma.product.create({
        data: {
          name: productName,
          category: ProductCategory.fabric,
          basePrice: fabric.basePrice,
        },
      });
    }

    const sku = `FAB-${product.productId}-${defaultColor.colorCode}-${defaultColor.colorCode}`;
    const variant = await prisma.fabricVariant.upsert({
      where: { sku },
      update: {},
      create: {
        productId: product.productId,
        warpColorId: defaultColor.colorId,
        weftColorId: defaultColor.colorId,
        sku,
        basePrice: fabric.basePrice,
      },
    });

    if (fabric.threshold > 0) {
      await prisma.qualityRule.upsert({
        where: { fabricVariantId: variant.fabricVariantId },
        update: {
          minWeightThreshold: fabric.threshold,
          deductionRatePerUnit: 10,
        },
        create: {
          fabricVariantId: variant.fabricVariantId,
          minWeightThreshold: fabric.threshold,
          deductionRatePerUnit: 10,
        },
      });

      await prisma.bonusRule.upsert({
        where: { fabricVariantId: variant.fabricVariantId },
        update: {
          minWeightThreshold: fabric.threshold,
          bonusRatePerUnit: 10,
          maxBonusPerPiece: 100,
        },
        create: {
          fabricVariantId: variant.fabricVariantId,
          minWeightThreshold: fabric.threshold,
          bonusRatePerUnit: 10,
          maxBonusPerPiece: 100,
        },
      });
    }
  }

  const passwordHash = await argon2.hash("admin123");
  await prisma.user.upsert({
    where: { username: "admin" },
    update: { passwordHash },
    create: {
      username: "admin",
      passwordHash,
      role: UserRole.admin,
    },
  });

  console.log("Seed complete.");
  console.log("Admin login: admin / admin123");
  console.log(`Default yarn variant id: ${yarnVariant.yarnVariantId}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });