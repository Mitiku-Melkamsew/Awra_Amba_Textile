import { prisma } from "../src/lib/prisma.js";

async function resetSequences() {
  console.log("Resetting PostgreSQL sequences in awra_amba_v3...");

  const tables = [
    { table: "users", id: "user_id" },
    { table: "fabrics", id: "fabric_id" },
    { table: "colors", id: "color_id" },
    { table: "designs", id: "design_id" },
    { table: "suppliers", id: "supplier_id" },
    { table: "yarns", id: "yarn_id" },
    { table: "yarn_variants", id: "yarn_variant_id" },
    { table: "fabric_variants", id: "fabric_variant_id" },
    { table: "fabric_prices", id: "fabric_price_id" },
    { table: "yarn_prices", id: "yarn_price_id" },
    { table: "quality_rules", id: "quality_rule_id" },
    { table: "yarn_given", id: "yarn_given_id" },
    { table: "fabric_returns", id: "return_id" },
    { table: "settlement_batches", id: "batch_id" },
    { table: "settlements", id: "settlement_id" },
    { table: "settlement_payments", id: "settlement_payment_id" },
    { table: "audit_logs", id: "audit_log_id" },
  ];

  for (const { table, id } of tables) {
    try {
      await prisma.$executeRawUnsafe(`
        SELECT setval(
          pg_get_serial_sequence('${table}', '${id}'),
          COALESCE((SELECT MAX(${id}) FROM "${table}"), 0) + 1,
          false
        );
      `);
      console.log(`  ✓ Reset sequence for ${table}.${id}`);
    } catch (e: any) {
      console.log(`  - Note on ${table}.${id}: ${e.message}`);
    }
  }

  console.log("All sequences reset successfully!");
  await prisma.$disconnect();
}

resetSequences().catch((err) => {
  console.error(err);
  process.exit(1);
});
