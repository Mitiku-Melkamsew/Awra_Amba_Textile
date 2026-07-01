import { PrismaClient, ProductCategory, UserRole } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

const FABRIC_PRODUCTS = [
  { code: "f-01", name: "መደበኛ", basePrice: 1300, threshold: 64, width: 150, length: 225 },
  { code: "f-02", name: "በ 2.50 ሜ", basePrice: 1436, threshold: 71, width: 150, length: 250 },
  { code: "f-03", name: "በ 2.75 ሜ", basePrice: 1572, threshold: 78, width: 150, length: 275 },
  { code: "f-04", name: "በ 3.00 ሜ", basePrice: 1707, threshold: 84, width: 150, length: 300 },
  { code: "f-05", name: "ከ 60", basePrice: 1860, threshold: 90, width: 160, length: 300 },
  { code: "f-06", name: "ከ 10", basePrice: 950, threshold: 0, width: 110, length: 200 },
  { code: "f-07", name: "yalga libs", basePrice: 1500, threshold: 70, width: 180, length: 250 },
  { code: "f-08", name: "sharp", basePrice: 800, threshold: 0, width: 25, length: 200 },
  { code: "f-09", name: "gabi", basePrice: 1860, threshold: 90, width: 160, length: 300 },
  { code: "f-10", name: "ferj", basePrice: 1200, threshold: 60, width: 75, length: 300 },
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
          standardWidthCm: fabric.width,
          standardLengthCm: fabric.length,
        },
      });
    } else {
      product = await prisma.product.update({
        where: { productId: product.productId },
        data: {
          standardWidthCm: fabric.width,
          standardLengthCm: fabric.length,
        },
      });
    }

    const sku = `FAB-${product.productId}-${defaultColor.colorCode}-${defaultColor.colorCode}`;
    const variant = await prisma.fabricVariant.upsert({
      where: { sku },
      update: { basePrice: fabric.basePrice },
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

  const adminHash = await argon2.hash("admin123");
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: { passwordHash: adminHash },
    create: {
      username: "admin",
      passwordHash: adminHash,
      role: UserRole.admin,
    },
  });

  let demoWeaver = await prisma.weaver.findFirst({
    where: { firstName: "Demo", lastName: "Weaver" },
  });
  if (!demoWeaver) {
    demoWeaver = await prisma.weaver.create({
      data: {
        firstName: "Demo",
        lastName: "Weaver",
        phone: "0911000000",
        email: "demo.weaver@awraamba.local",
      },
    });
  }

  const demoHash = await argon2.hash("demo123");
  await prisma.user.upsert({
    where: { username: "demo" },
    update: { passwordHash: demoHash, weaverId: demoWeaver.weaverId, role: UserRole.weaver },
    create: {
      username: "demo",
      passwordHash: demoHash,
      role: UserRole.weaver,
      weaverId: demoWeaver.weaverId,
    },
  });

  const fabricVariant = await prisma.fabricVariant.findFirst({
    where: { sku: { startsWith: "FAB-" } },
    orderBy: { fabricVariantId: "asc" },
  });

  if (fabricVariant) {
    await prisma.workOrder.upsert({
      where: { zigId: "z-demo-001" },
      update: { weaverId: demoWeaver.weaverId, status: "assigned" },
      create: {
        zigId: "z-demo-001",
        weaverId: demoWeaver.weaverId,
        fabricVariantId: fabricVariant.fabricVariantId,
        status: "assigned",
        issuedByUserId: admin.userId,
      },
    });

    await prisma.workOrder.upsert({
      where: { zigId: "z-demo-002" },
      update: { weaverId: demoWeaver.weaverId, status: "returned" },
      create: {
        zigId: "z-demo-002",
        weaverId: demoWeaver.weaverId,
        fabricVariantId: fabricVariant.fabricVariantId,
        status: "returned",
        issuedByUserId: admin.userId,
      },
    });

    const hasYarn = await prisma.yarnGiven.findFirst({ where: { zigId: "z-demo-001" } });
    if (!hasYarn) {
      await prisma.yarnGiven.create({
        data: {
          zigId: "z-demo-001",
          yarnVariantId: yarnVariant.yarnVariantId,
          quantity: 110,
          unitPrice: 400,
          recordedByUserId: admin.userId,
        },
      });
    }

    const product = await prisma.product.findFirst({
      where: { productId: fabricVariant.productId },
    });
    const hasReturn = await prisma.fabricReturn.findFirst({ where: { zigId: "z-demo-002" } });
    if (!hasReturn) {
      await prisma.fabricReturn.create({
        data: {
          zigId: "z-demo-002",
          fabricVariantId: fabricVariant.fabricVariantId,
          quantityReturned: 40,
          totalWeight: 2560,
          unitPrice: 1300,
          lengthCm: product?.standardLengthCm ?? 225,
          widthCm: product?.standardWidthCm ?? 150,
          recordedByUserId: admin.userId,
        },
      });
    }
  }

  console.log("Seed complete.");
  console.log("Admin login: admin / admin123");
  console.log("Demo weaver login: demo / demo123");
  console.log(`Demo weaver id: ${demoWeaver.weaverId}`);
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