import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient, WorkOrderStatus } from "@prisma/client";

const prisma = new PrismaClient();
const root = process.env.CSV_DIR ? resolve(process.env.CSV_DIR) : resolve(process.cwd(), "..");

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  values.push(current.trim());
  return values;
}

function parseCsv(content: string): Record<string, string>[] {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = (values[index] ?? "").trim();
    });
    return row;
  });
}

function cleanNumber(value: string): number {
  const text = value.replace(/[^0-9.\-]/g, "");
  const num = Number(text);
  return Number.isFinite(num) ? num : 0;
}

function mapStatus(status: string): WorkOrderStatus {
  const normalized = status.trim().toLowerCase();
  if (normalized === "settled") return WorkOrderStatus.reconciled;
  if (normalized === "completed") return WorkOrderStatus.returned;
  if (normalized === "ongoing") return WorkOrderStatus.in_progress;
  return WorkOrderStatus.assigned;
}

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: "admin" } });
  if (!admin) throw new Error("Admin user not found. Run db:seed first.");

  const fabricVariants = await prisma.fabricVariant.findMany({
    include: { product: true },
  });

  const fabricMap = new Map<string, number>();
  for (const variant of fabricVariants) {
    const match = variant.product.name.match(/\(f-\d+\)/);
    if (match) {
      const code = match[0].slice(1, -1);
      fabricMap.set(code, variant.fabricVariantId);
    }
  }

  const yarnVariant = await prisma.yarnVariant.findFirst();
  if (!yarnVariant) throw new Error("No yarn variant found. Run db:seed first.");

  const weaversCsv = parseCsv(readFileSync(resolve(root, "weavers.csv"), "utf8"));
  for (const row of weaversCsv) {
    const weaverId = Number(row.weaver_id);
    if (!weaverId || weaverId <= 0) continue;
    await prisma.weaver.upsert({
      where: { weaverId },
      update: {
        firstName: row.first_name,
        lastName: row.last_name,
        bankAccountNumber: row.bank_account_number || null,
      },
      create: {
        weaverId,
        firstName: row.first_name || "Unknown",
        lastName: row.last_name || "Unknown",
        bankAccountNumber: row.bank_account_number || null,
      },
    });
  }

  const zigsCsv = parseCsv(readFileSync(resolve(root, "zigs.csv"), "utf8"));
  for (const row of zigsCsv) {
    const zigId = row.zig_id;
    const weaverId = Number(row.weaver_id);
    const fabricCode = row["zig-type"];
    if (!zigId || !weaverId || weaverId <= 0) continue;

    const weaverExists = await prisma.weaver.findUnique({ where: { weaverId } });
    if (!weaverExists) continue;

    const fabricVariantId =
      fabricMap.get(fabricCode) ?? fabricVariants[0]?.fabricVariantId;
    if (!fabricVariantId) continue;

    await prisma.workOrder.upsert({
      where: { zigId },
      update: {
        weaverId,
        fabricVariantId,
        status: mapStatus(row.status ?? ""),
      },
      create: {
        zigId,
        weaverId,
        fabricVariantId,
        status: mapStatus(row.status ?? ""),
        issuedByUserId: admin.userId,
      },
    });
  }

  const yarnCsv = parseCsv(readFileSync(resolve(root, "yarn_given.csv"), "utf8"));
  let yarnCount = 0;
  for (const row of yarnCsv) {
    const zigId = row.zig_id;
    const quantity = cleanNumber(row.quantity);
    const unitPrice = cleanNumber(row.unit_price);
    if (!zigId || quantity <= 0) continue;

    const workOrder = await prisma.workOrder.findUnique({ where: { zigId } });
    if (!workOrder) continue;

    const exists = await prisma.yarnGiven.findFirst({
      where: { zigId, quantity, unitPrice },
    });
    if (exists) continue;

    await prisma.yarnGiven.create({
      data: {
        zigId,
        yarnVariantId: yarnVariant.yarnVariantId,
        quantity,
        unitPrice,
        recordedByUserId: admin.userId,
      },
    });
    yarnCount += 1;
  }

  const returnsCsv = parseCsv(
    readFileSync(resolve(root, "fabric_returned.csv"), "utf8"),
  );
  let returnCount = 0;
  for (const row of returnsCsv) {
    const zigId = row.zig_id;
    const fabricCode = row.fabric_id?.trim();
    if (fabricCode === "custom") continue;
    const quantityReturned = Math.round(cleanNumber(row.quantity));
    const totalWeight = cleanNumber(row.total_weight);
    const unitPrice = cleanNumber(row.unit_price);
    if (!zigId || quantityReturned <= 0 || totalWeight <= 0) continue;

    const workOrder = await prisma.workOrder.findUnique({ where: { zigId } });
    if (!workOrder) continue;

    const fabricVariantId = fabricMap.get(fabricCode) ?? workOrder.fabricVariantId;

    const exists = await prisma.fabricReturn.findFirst({
      where: { zigId, fabricVariantId, quantityReturned, totalWeight },
    });
    if (exists) continue;

    await prisma.fabricReturn.create({
      data: {
        zigId,
        fabricVariantId,
        quantityReturned,
        totalWeight,
        unitPrice: unitPrice || 0,
        recordedByUserId: admin.userId,
      },
    });
    returnCount += 1;
  }

  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('weavers', 'weaver_id'), COALESCE((SELECT MAX(weaver_id) FROM weavers), 1))`,
  );

  const [weaverCount, zigCount, yarnTotal, returnTotal] = await Promise.all([
    prisma.weaver.count(),
    prisma.workOrder.count(),
    prisma.yarnGiven.count(),
    prisma.fabricReturn.count(),
  ]);

  console.log("Import complete.");
  console.log(`Weaver rows in CSV: ${weaversCsv.length} | in DB: ${weaverCount}`);
  console.log(`Work order rows in CSV: ${zigsCsv.length} | in DB: ${zigCount}`);
  console.log(`Yarn deliveries created this run: ${yarnCount} | total in DB: ${yarnTotal}`);
  console.log(`Fabric returns created this run: ${returnCount} | total in DB: ${returnTotal}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });