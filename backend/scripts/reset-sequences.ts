import { prisma } from "../src/lib/prisma.js";

async function resetAllSequences() {
  console.log("🔍 Discovering all table sequences in awra_amba_v3...");

  // Query PostgreSQL catalog for all sequences tied to table columns
  const seqList = await prisma.$queryRawUnsafe<
    Array<{ table_name: string; column_name: string; sequence_name: string }>
  >(`
    SELECT
      t.relname AS table_name,
      a.attname AS column_name,
      s.relname AS sequence_name
    FROM pg_class s
    JOIN pg_depend d ON d.objid = s.oid
    JOIN pg_class t ON d.refobjid = t.oid
    JOIN pg_attribute a ON (d.refobjid = a.attrelid AND d.refobjsubid = a.attnum)
    WHERE s.relkind = 'S' AND t.relkind = 'r'
    ORDER BY t.relname;
  `);

  console.log(`Found ${seqList.length} sequence(s) across all tables:`);

  for (const { table_name, column_name, sequence_name } of seqList) {
    try {
      const maxRes = await prisma.$queryRawUnsafe<Array<{ max_val: any }>>(
        `SELECT COALESCE(MAX("${column_name}"), 0) AS max_val FROM "${table_name}";`
      );
      const maxVal = Number(maxRes[0]?.max_val ?? 0);
      const nextVal = maxVal + 1;

      await prisma.$executeRawUnsafe(`
        SELECT setval('${sequence_name}', ${nextVal}, false);
      `);

      console.log(
        `  ✓ ${table_name}.${column_name} (seq: ${sequence_name}) -> max in DB is ${maxVal}, nextval set to ${nextVal}`
      );
    } catch (err: any) {
      console.warn(`  ⚠ Error on ${table_name}.${column_name}:`, err.message);
    }
  }

  console.log("\n🎉 All PostgreSQL sequences have been dynamically synchronized!");
  await prisma.$disconnect();
}

resetAllSequences().catch((err) => {
  console.error("❌ Failed to reset sequences:", err);
  process.exit(1);
});
