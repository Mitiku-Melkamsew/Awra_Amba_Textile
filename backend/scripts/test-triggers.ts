import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
}

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: "admin" } });
  if (!admin) throw new Error("Admin user missing. Run npm run db:seed first.");

  const yarnVariant = await prisma.yarnVariant.findFirst();
  const fabricVariant = await prisma.fabricVariant.findFirst();
  let weaver = await prisma.weaver.findFirst();
  if (!yarnVariant || !fabricVariant) {
    throw new Error("Seed data missing. Run npm run db:seed first.");
  }
  if (!weaver) {
    weaver = await prisma.weaver.create({
      data: { firstName: "Test", lastName: "Weaver" },
    });
  }

  const supplier = await prisma.supplier.findFirst();
  if (!supplier) throw new Error("Supplier missing from seed.");

  const yarnBefore = Number(yarnVariant.stockSnapshot);
  const fabricBefore = Number(fabricVariant.stockSnapshot);

  const purchase = await prisma.yarnPurchase.create({
    data: {
      supplierId: supplier.supplierId,
      createdByUserId: admin.userId,
      lines: {
        create: {
          yarnVariantId: yarnVariant.yarnVariantId,
          quantity: 100,
          unitPrice: 400,
        },
      },
    },
    include: { lines: true },
  });

  const yarnAfterPurchase = await prisma.yarnVariant.findUnique({
    where: { yarnVariantId: yarnVariant.yarnVariantId },
  });
  await assert(
    Number(yarnAfterPurchase?.stockSnapshot) === yarnBefore + 100,
    "yarn_purchase_lines increases yarn stock_snapshot by 100",
  );

  const zigId = `z-test-${Date.now()}`;
  await prisma.workOrder.create({
    data: {
      zigId,
      weaverId: weaver.weaverId,
      fabricVariantId: fabricVariant.fabricVariantId,
      status: "assigned",
      issuedByUserId: admin.userId,
    },
  });

  await prisma.yarnGiven.create({
    data: {
      zigId,
      yarnVariantId: yarnVariant.yarnVariantId,
      quantity: 30,
      unitPrice: 400,
      recordedByUserId: admin.userId,
    },
  });

  const yarnAfterGiven = await prisma.yarnVariant.findUnique({
    where: { yarnVariantId: yarnVariant.yarnVariantId },
  });
  await assert(
    Number(yarnAfterGiven?.stockSnapshot) === yarnBefore + 100 - 30,
    "yarn_given decreases yarn stock_snapshot by 30",
  );

  const workOrderAfterYarn = await prisma.workOrder.findUnique({ where: { zigId } });
  await assert(
    workOrderAfterYarn?.status === "assigned",
    "yarn_given does not change work order status (stays assigned)",
  );

  await prisma.fabricReturn.create({
    data: {
      zigId,
      fabricVariantId: fabricVariant.fabricVariantId,
      quantityReturned: 12,
      totalWeight: 768,
      unitPrice: 1300,
      recordedByUserId: admin.userId,
    },
  });

  const workOrderAfterFabric = await prisma.workOrder.findUnique({ where: { zigId } });
  await assert(
    workOrderAfterFabric?.status === "in_progress",
    "first fabric_return moves work order assigned -> in_progress",
  );

  const fabricAfterReturn = await prisma.fabricVariant.findUnique({
    where: { fabricVariantId: fabricVariant.fabricVariantId },
  });
  await assert(
    Number(fabricAfterReturn?.stockSnapshot) === fabricBefore + 12,
    "fabric_returns increases fabric stock_snapshot by 12",
  );

  await prisma.workOrder.update({
    where: { zigId },
    data: { status: "returned" },
  });

  const fabricReturn = await prisma.fabricReturn.findFirst({
    where: { zigId },
  });
  if (!fabricReturn) throw new Error("Fabric return not found for settlement test.");

  const payment = await prisma.payment.create({
    data: {
      weaverId: weaver.weaverId,
      amount: 1000,
      recordedByUserId: admin.userId,
    },
  });

  await prisma.fabricReturn.update({
    where: { returnId: fabricReturn.returnId },
    data: { paymentId: payment.paymentId, calculatedDeduction: 0, netCreditValue: 15600 },
  });

  const workOrderAfterSettlement = await prisma.workOrder.findUnique({ where: { zigId } });
  await assert(
    workOrderAfterSettlement?.status === "reconciled",
    "settling all fabric returns moves work order returned -> reconciled",
  );

  let immutabilityFailed = false;
  try {
    await prisma.fabricReturn.update({
      where: { returnId: fabricReturn.returnId },
      data: { remark: "should fail" },
    });
  } catch {
    immutabilityFailed = true;
  }
  await assert(immutabilityFailed, "settled fabric_return cannot be modified");

  console.log("\nAll trigger tests passed.");
  console.log(`Cleanup note: created zig ${zigId}, purchase ${purchase.purchaseId}, payment ${payment.paymentId}`);
}

main()
  .catch((error) => {
    console.error("FAIL:", error.message ?? error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });