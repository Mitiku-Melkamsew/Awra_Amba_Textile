import { PrismaClient, UserRole, WorkOrderStatus } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

const FABRICS = [
  { code: "f-01", name: "መደበኛ", weaverRate: 1300, sellingPrice: 1600, threshold: 64, width: 150, length: 225 },
  { code: "f-02", name: "በ 2.50 ሜ", weaverRate: 1436, sellingPrice: 1750, threshold: 71, width: 150, length: 250 },
  { code: "f-03", name: "በ 2.75 ሜ", weaverRate: 1572, sellingPrice: 1900, threshold: 78, width: 150, length: 275 },
  { code: "f-04", name: "በ 3.00 ሜ", weaverRate: 1707, sellingPrice: 2100, threshold: 84, width: 150, length: 300 },
  { code: "f-05", name: "ከ 60", weaverRate: 1860, sellingPrice: 2300, threshold: 90, width: 160, length: 300 },
  { code: "f-06", name: "ከ 10", weaverRate: 950, sellingPrice: 1200, threshold: 42, width: 110, length: 200 },
  { code: "f-07", name: "yalga libs", weaverRate: 1500, sellingPrice: 1850, threshold: 70, width: 180, length: 250 },
  { code: "f-08", name: "sharp", weaverRate: 800, sellingPrice: 1000, threshold: 0, width: 25, length: 200 },
  { code: "f-09", name: "gabi", weaverRate: 1860, sellingPrice: 2300, threshold: 90, width: 160, length: 300 },
  { code: "f-10", name: "ferj", weaverRate: 1200, sellingPrice: 1500, threshold: 60, width: 75, length: 300 },
];

const YARNS = [
  { name: "Tilet", purchasePrice: 400, sellingPrice: 450 },
  { name: "Warba", purchasePrice: 350, sellingPrice: 400 },
  { name: "Dir", purchasePrice: 320, sellingPrice: 380 },
  { name: "Kezere", purchasePrice: 420, sellingPrice: 480 },
];

async function main() {
  console.log("Seeding redesigned database...");

  // 1. Quality rule (Global)
  await prisma.qualityRule.deleteMany({});
  await prisma.qualityRule.create({
    data: {
      factor: "weight",
      unit: "g",
      deductionPerUnit: 10,
      isActive: true,
    },
  });

  // 2. Colors
  const colorNames = ["Default", "White", "Black", "Red", "Blue", "Green", "Yellow", "Natural"];
  const colorMap = new Map<string, number>();
  for (const name of colorNames) {
    const c = await prisma.color.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    colorMap.set(name, c.colorId);
  }
  const defaultColorId = colorMap.get("Default")!;

  // 3. Designs
  const designNames = ["መደበኛ", "ጥልፍ", "ሰብለ", "መስቀል", "ድርብ"];
  const designMap = new Map<string, number>();
  for (const name of designNames) {
    const d = await prisma.design.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    designMap.set(name, d.designId);
  }
  const defaultDesignId = designMap.get("መደበኛ")!;

  // 4. Suppliers
  const supplierNames = ["Default Supplier", "Awra Amba Mills", "Kombolcha Textile"];
  const supplierMap = new Map<string, number>();
  for (const name of supplierNames) {
    const s = await prisma.supplier.upsert({
      where: { name },
      update: {},
      create: { name, contactPhone: "0911223344" },
    });
    supplierMap.set(name, s.supplierId);
  }
  const defaultSupplierId = supplierMap.get("Default Supplier")!;

  // 5. Yarns & Yarn Prices & Variants
  for (const y of YARNS) {
    const yarn = await prisma.yarn.upsert({
      where: { name: y.name },
      update: {},
      create: { name: y.name },
    });

    await prisma.yarnPrice.create({
      data: {
        yarnId: yarn.yarnId,
        supplierId: defaultSupplierId,
        purchasePrice: y.purchasePrice,
        sellingPrice: y.sellingPrice,
      },
    });

    await prisma.yarnVariant.upsert({
      where: { sku: `YRN-${yarn.yarnId}-${defaultSupplierId}-${defaultColorId}` },
      update: {},
      create: {
        yarnId: yarn.yarnId,
        supplierId: defaultSupplierId,
        colorId: defaultColorId,
        sku: `YRN-${yarn.yarnId}-${defaultSupplierId}-${defaultColorId}`,
        stockSnapshot: 50,
      },
    });
  }

  // 6. Fabrics & Fabric Prices & Variants
  for (const fabric of FABRICS) {
    const f = await prisma.fabric.upsert({
      where: { name: fabric.name },
      update: {
        standardLengthCm: fabric.length,
        standardWidthCm: fabric.width,
        standardWeightG: fabric.threshold,
      },
      create: {
        name: fabric.name,
        standardLengthCm: fabric.length,
        standardWidthCm: fabric.width,
        standardWeightG: fabric.threshold,
      },
    });

    await prisma.fabricPrice.create({
      data: {
        fabricId: f.fabricId,
        weaverRate: fabric.weaverRate,
        sellingPrice: fabric.sellingPrice,
      },
    });

    const sku = `FAB-${f.fabricId}-${defaultDesignId}-${defaultColorId}-${defaultColorId}`;
    await prisma.fabricVariant.upsert({
      where: { sku },
      update: {},
      create: {
        fabricId: f.fabricId,
        designId: defaultDesignId,
        warpColorId: defaultColorId,
        weftColorId: defaultColorId,
        sku,
        stockSnapshot: 20,
      },
    });
  }

  // 7. Users with roles
  const adminHash = await argon2.hash("admin123");
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: { passwordHash: adminHash, fullName: "System Admin" },
    create: {
      username: "admin",
      fullName: "System Admin",
      passwordHash: adminHash,
      roles: {
        create: [{ role: UserRole.admin }],
      },
    },
  });

  const demoHash = await argon2.hash("demo123");
  const demoWeaver = await prisma.user.upsert({
    where: { username: "demo" },
    update: { passwordHash: demoHash, fullName: "Demo Weaver" },
    create: {
      username: "demo",
      fullName: "Demo Weaver",
      phone: "0911000000",
      email: "demo.weaver@awraamba.local",
      passwordHash: demoHash,
      roles: {
        create: [{ role: UserRole.weaver }],
      },
    },
  });

  const merchantHash = await argon2.hash("merchant123");
  await prisma.user.upsert({
    where: { username: "merchant" },
    update: { passwordHash: merchantHash, fullName: "Addis Fabric Merchant" },
    create: {
      username: "merchant",
      fullName: "Addis Fabric Merchant",
      phone: "0922000000",
      email: "merchant@addis.local",
      passwordHash: merchantHash,
      roles: {
        create: [{ role: UserRole.merchant }],
      },
    },
  });

  // 8. Demo Work Order with initial yarn
  const firstVariant = await prisma.fabricVariant.findFirstOrThrow({
    orderBy: { fabricVariantId: "asc" },
  });
  const firstYarnVariant = await prisma.yarnVariant.findFirstOrThrow({
    orderBy: { yarnVariantId: "asc" },
  });

  const workOrder = await prisma.workOrder.upsert({
    where: { zigId: "z-demo-001" },
    update: { weaverUserId: demoWeaver.userId, status: WorkOrderStatus.in_progress },
    create: {
      zigId: "z-demo-001",
      weaverUserId: demoWeaver.userId,
      fabricVariantId: firstVariant.fabricVariantId,
      status: WorkOrderStatus.in_progress,
      issuedByUserId: admin.userId,
    },
  });

  await prisma.yarnGiven.create({
    data: {
      zigId: workOrder.zigId,
      yarnVariantId: firstYarnVariant.yarnVariantId,
      quantity: 5,
      unitPrice: 400,
      recordedByUserId: admin.userId,
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
