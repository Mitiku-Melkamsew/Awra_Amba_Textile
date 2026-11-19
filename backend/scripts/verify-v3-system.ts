import { prisma } from "../src/lib/prisma.js";
import { SettlementService } from "../src/application/services/settlement.service.js";

async function runVerification() {
  console.log("=== V3 SYSTEM VERIFICATION ===");
  console.log("Checking DB connection and counts in awra_amba_v3...");

  const userCount = await prisma.user.count();
  const workOrderCount = await prisma.workOrder.count();
  const yarnGivenCount = await prisma.yarnGiven.count();
  const fabricReturnCount = await prisma.fabricReturn.count();

  console.log(`Users: ${userCount}`);
  console.log(`Work Orders: ${workOrderCount}`);
  console.log(`Yarn Deliveries: ${yarnGivenCount}`);
  console.log(`Fabric Returns: ${fabricReturnCount}`);

  // 1. Pending settlements summary
  console.log("\n--- Testing Pending Liability Summary ---");
  const summary = await SettlementService.getPendingSettlementsSummary();
  console.log("Pending Liability Summary:", JSON.stringify(summary, null, 2));

  // 2. Zigs Ledger
  console.log("\n--- Testing Zigs Ledger ---");
  const ledger = await SettlementService.getZigsLedger();
  console.log(`Ledger returned ${ledger.length} zigs:`);
  for (const zig of ledger.slice(0, 5)) {
    console.log(
      `  • Zig ${zig.zigId} (${zig.weaverName}): status=${zig.status}, fabricPieces=${zig.fabric.receivedQuantity}, yarnKg=${zig.yarn.issuedQuantity}, netPayable=${zig.netPayable} ETB`
    );
  }

  // 3. Settlement Preview
  console.log("\n--- Testing Ephemeral Batch Preview ---");
  const adminUser = await prisma.user.findFirst();
  const preview = await SettlementService.generatePreview(
    new Date("2026-12-31T23:59:59Z"),
    adminUser?.userId ?? 1,
    [],
    []
  );
  console.log(`Preview eligible weavers: ${preview.weavers.length}`);
  console.log(`Preview totals: Gross=${preview.grossFabricValue}, Deductions=${preview.totalDeductions}, YarnCost=${preview.totalYarnCost}, Net=${preview.grandTotal} ETB`);
  for (const w of preview.weavers) {
    console.log(`  Weaver ${w.weaverName} (ID: ${w.weaverUserId}):`);
    console.log(`    Zigs: ${w.zigIds.join(", ")}`);
    console.log(`    Fabric lines: ${w.fabricLines.length}, Yarn lines: ${w.yarnLines.length}`);
    console.log(`    Net payable: ${w.netSettlement} ETB`);
  }

  console.log("\n✅ ALL SYSTEM CHECKS PASSED SUCCESSFULLY!");
  await prisma.$disconnect();
}

runVerification().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
