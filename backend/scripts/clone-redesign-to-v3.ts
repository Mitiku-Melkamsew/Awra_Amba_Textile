import { PrismaClient } from "@prisma/client";
import {
  computeDeductionAmount,
  computeGrossFabricValue,
  computeNetPayable,
  suggestWeightDeduction,
} from "../src/application/services/calculation.service.js";

// Source Prisma Client (awra_amba_redesign)
const sourcePrisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://awra_amba:awra_amba_dev@localhost:5433/awra_amba_redesign?schema=public",
    },
  },
});

// Target Prisma Client (awra_amba_v3)
const targetPrisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://awra_amba:awra_amba_dev@localhost:5433/awra_amba_v3?schema=public",
    },
  },
});

async function main() {
  console.log("🚀 Starting database clone from awra_amba_redesign to awra_amba_v3...");

  // 1. Clean existing data in target database
  console.log("🧹 Cleaning target tables...");
  await targetPrisma.$executeRawUnsafe(`TRUNCATE TABLE 
    direct_transaction_payments, direct_transaction_lines, direct_transactions,
    settlement_payments, settlements, settlement_batches,
    fabric_returns, yarn_given, work_orders,
    fabric_prices, yarn_prices, quality_rules,
    fabric_variants, yarn_variants, yarns, suppliers, designs, colors, fabrics,
    user_roles, users, audit_logs
    CASCADE;`);

  // 2. Users and User Roles
  console.log("👤 Copying users...");
  const users = await sourcePrisma.user.findMany();
  for (const u of users) {
    await targetPrisma.user.create({
      data: {
        userId: u.userId,
        username: u.username,
        passwordHash: u.passwordHash,
        fullName: u.fullName,
        phone: u.phone,
        isActive: u.isActive,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      },
    });
  }

  const userRoles = await sourcePrisma.userRoleAssignment.findMany();
  for (const ur of userRoles) {
    await targetPrisma.userRoleAssignment.create({
      data: {
        userId: ur.userId,
        role: ur.role,
      },
    });
  }

  // 3. Fabrics, Colors, Designs
  console.log("🎨 Copying catalog lookups...");
  const fabrics = await sourcePrisma.fabric.findMany();
  for (const f of fabrics) {
    await targetPrisma.fabric.create({
      data: {
        fabricId: f.fabricId,
        name: f.name,
        standardLengthCm: f.standardLengthCm,
        standardWidthCm: f.standardWidthCm,
        standardWeightG: f.standardWeightG,
        isActive: f.isActive,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      },
    });
  }

  const colors = await sourcePrisma.color.findMany();
  for (const c of colors) {
    await targetPrisma.color.create({
      data: {
        colorId: c.colorId,
        name: c.name,
        colorCode: c.colorCode,
        isActive: c.isActive,
      },
    });
  }

  const designs = await sourcePrisma.design.findMany();
  for (const d of designs) {
    await targetPrisma.design.create({
      data: {
        designId: d.designId,
        name: d.name,
        description: d.description,
        isActive: d.isActive,
      },
    });
  }

  const suppliers = await sourcePrisma.supplier.findMany();
  for (const s of suppliers) {
    await targetPrisma.supplier.create({
      data: {
        supplierId: s.supplierId,
        name: s.name,
        contactInfo: s.contactInfo,
        isActive: s.isActive,
        createdAt: s.createdAt,
      },
    });
  }

  const yarns = await sourcePrisma.yarn.findMany();
  for (const y of yarns) {
    await targetPrisma.yarn.create({
      data: {
        yarnId: y.yarnId,
        name: y.name,
        fiberType: y.fiberType,
        count: y.count,
        unit: y.unit,
        isActive: y.isActive,
        createdAt: y.createdAt,
        updatedAt: y.updatedAt,
      },
    });
  }

  // 4. Variants
  console.log("🧶 Copying yarn and fabric variants...");
  const yarnVariants = await sourcePrisma.yarnVariant.findMany();
  for (const yv of yarnVariants) {
    await targetPrisma.yarnVariant.create({
      data: {
        yarnVariantId: yv.yarnVariantId,
        yarnId: yv.yarnId,
        colorId: yv.colorId,
        supplierId: yv.supplierId,
        sku: yv.sku,
        stockSnapshot: yv.stockSnapshot,
        isActive: yv.isActive,
        createdAt: yv.createdAt,
        updatedAt: yv.updatedAt,
      },
    });
  }

  const fabricVariants = await sourcePrisma.fabricVariant.findMany();
  for (const fv of fabricVariants) {
    await targetPrisma.fabricVariant.create({
      data: {
        fabricVariantId: fv.fabricVariantId,
        fabricId: fv.fabricId,
        warpColorId: fv.warpColorId,
        weftColorId: fv.weftColorId,
        designId: fv.designId,
        sku: fv.sku,
        stockSnapshot: fv.stockSnapshot,
        isActive: fv.isActive,
        createdAt: fv.createdAt,
        updatedAt: fv.updatedAt,
      },
    });
  }

  // 5. Prices and Quality Rules
  console.log("🏷️ Copying prices and quality rules...");
  const fabricPrices = await sourcePrisma.fabricPrice.findMany();
  for (const fp of fabricPrices) {
    await targetPrisma.fabricPrice.create({
      data: {
        fabricPriceId: fp.fabricPriceId,
        fabricId: fp.fabricId,
        weaverRate: fp.weaverRate,
        sellingPrice: fp.sellingPrice,
        effectiveFrom: fp.effectiveFrom,
        effectiveTo: fp.effectiveTo,
        isActive: fp.isActive,
        createdAt: fp.createdAt,
      },
    });
  }

  const yarnPrices = await sourcePrisma.yarnPrice.findMany();
  for (const yp of yarnPrices) {
    await targetPrisma.yarnPrice.create({
      data: {
        yarnPriceId: yp.yarnPriceId,
        yarnId: yp.yarnId,
        supplierId: yp.supplierId,
        purchasePrice: yp.purchasePrice,
        sellingPrice: yp.sellingPrice,
        effectiveFrom: yp.effectiveFrom,
        effectiveTo: yp.effectiveTo,
        isActive: yp.isActive,
        createdAt: yp.createdAt,
      },
    });
  }

  const qualityRules = await sourcePrisma.qualityRule.findMany();
  for (const qr of qualityRules) {
    await targetPrisma.qualityRule.create({
      data: {
        qualityRuleId: qr.qualityRuleId,
        factor: qr.factor,
        unit: qr.unit,
        deductionPerUnit: qr.deductionPerUnit,
        isActive: qr.isActive,
      },
    });
  }

  // 6. Work Orders
  console.log("📜 Copying work orders...");
  const workOrders: any[] = await sourcePrisma.$queryRawUnsafe("SELECT * FROM work_orders;");
  for (const wo of workOrders) {
    const isReturned = wo.status === "returned" || wo.status === "reconciled";
    await targetPrisma.workOrder.create({
      data: {
        zigId: wo.zig_id,
        weaverUserId: wo.weaver_user_id,
        fabricVariantId: wo.fabric_variant_id,
        status: wo.status,
        dateIssued: wo.date_issued,
        dateReturned: isReturned ? wo.date_issued : null,
        issuedByUserId: wo.issued_by_user_id,
        netPayable: 0, // Recalculated below after lines are inserted
      },
    });
  }

  // 7. Yarn Given
  console.log("📦 Copying yarn deliveries...");
  const yarnGivens: any[] = await sourcePrisma.$queryRawUnsafe("SELECT * FROM yarn_given;");
  for (const yg of yarnGivens) {
    await targetPrisma.yarnGiven.create({
      data: {
        yarnGivenId: yg.yarn_given_id,
        zigId: yg.zig_id,
        yarnVariantId: yg.yarn_variant_id,
        quantity: yg.quantity,
        unitPrice: yg.unit_price,
        dateGiven: yg.date_given,
        recordedByUserId: yg.recorded_by_user_id,
        remark: null,
      },
    });
  }

  // Check yarn returns in redesign to append note to yarnGiven if relevant
  try {
    const yarnReturns: any[] = await sourcePrisma.$queryRawUnsafe("SELECT * FROM yarn_returns;");
    for (const yr of yarnReturns) {
      const match = await targetPrisma.yarnGiven.findFirst({
        where: { zigId: yr.zig_id, yarnVariantId: yr.yarn_variant_id },
      });
      if (match) {
        const note = `Adjusted: weaver returned ${yr.quantity} unused yarn on ${new Date(yr.date_returned).toISOString().slice(0, 10)}`;
        await targetPrisma.yarnGiven.update({
          where: { yarnGivenId: match.yarnGivenId },
          data: { remark: match.remark ? `${match.remark}; ${note}` : note },
        });
      }
    }
  } catch (err) {
    console.warn("Could not check yarn_returns:", err);
  }

  // 8. Fabric Returns
  console.log("🪡 Copying fabric returns and computing quality deductions...");
  const fabricReturns: any[] = await sourcePrisma.$queryRawUnsafe(`
    SELECT fr.*, f.standard_weight_g 
    FROM fabric_returns fr
    JOIN fabric_variants fv ON fr.fabric_variant_id = fv.fabric_variant_id
    JOIN fabrics f ON fv.fabric_id = f.fabric_id;
  `);

  for (const fr of fabricReturns) {
    const qty = Number(fr.quantity_returned);
    const unitPrice = Number(fr.unit_price);
    const totalWeight = Number(fr.total_weight);
    const grossValue = computeGrossFabricValue(qty, unitPrice);

    // Quality weight deduction check
    const stdWeight = Number(fr.standard_weight_g || 64);
    const suggestion = suggestWeightDeduction(totalWeight, qty, stdWeight, 10);
    const deductions = suggestion ? [suggestion] : [];
    const deductionAmount = computeDeductionAmount(deductions, qty);

    await targetPrisma.fabricReturn.create({
      data: {
        returnId: fr.return_id,
        zigId: fr.zig_id,
        fabricVariantId: fr.fabric_variant_id,
        quantityReturned: qty,
        totalWeight: fr.total_weight,
        unitPrice: fr.unit_price,
        grossFabricValue: grossValue,
        deductionAmount: deductionAmount,
        deductions: deductions as any,
        lengthCm: fr.length_cm,
        widthCm: fr.width_cm,
        remark: fr.remark,
        dateReturned: fr.date_returned,
        recordedByUserId: fr.recorded_by_user_id,
      },
    });
  }

  // 9. Recalculate netPayable for every work order
  console.log("⚡ Recalculating netPayable across all work orders...");
  const allOrders = await targetPrisma.workOrder.findMany({
    include: {
      fabricReturns: true,
      yarnGiven: true,
    },
  });

  for (const order of allOrders) {
    const net = computeNetPayable(
      order.fabricReturns.map((fr) => ({
        grossFabricValue: Number(fr.grossFabricValue),
        deductionAmount: Number(fr.deductionAmount),
      })),
      order.yarnGiven.map((yg) => ({
        quantity: Number(yg.quantity),
        unitPrice: Number(yg.unitPrice),
      })),
    );

    await targetPrisma.workOrder.update({
      where: { zigId: order.zigId },
      data: { netPayable: net },
    });

    console.log(
      `   Zig ${order.zigId} (${order.status}): Yarn cost -${order.yarnGiven.reduce((s, y) => s + Number(y.quantity) * Number(y.unitPrice), 0)} + Fabric net ${order.fabricReturns.reduce((s, f) => s + (Number(f.grossFabricValue) - Number(f.deductionAmount)), 0)} = netPayable ${net} ETB`,
    );
  }

  // 10. Direct Transactions
  console.log("💳 Copying direct transactions (if any)...");
  try {
    const directTxns = await sourcePrisma.directTransaction.findMany();
    for (const dt of directTxns) {
      await targetPrisma.directTransaction.create({
        data: {
          transactionId: dt.transactionId,
          type: dt.type,
          weaverUserId: dt.weaverUserId,
          merchantUserId: dt.merchantUserId,
          totalAmount: dt.totalAmount,
          amountPaid: dt.amountPaid,
          status: dt.status,
          transactionDate: dt.transactionDate,
          createdByUserId: dt.createdByUserId,
          notes: dt.notes,
        },
      });
    }

    const lines = await sourcePrisma.directTransactionLine.findMany();
    for (const l of lines) {
      await targetPrisma.directTransactionLine.create({
        data: {
          lineId: l.lineId,
          transactionId: l.transactionId,
          fabricVariantId: l.fabricVariantId,
          yarnVariantId: l.yarnVariantId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          lineTotal: l.lineTotal,
          description: l.description,
        },
      });
    }

    const payments = await sourcePrisma.directTransactionPayment.findMany();
    for (const p of payments) {
      await targetPrisma.directTransactionPayment.create({
        data: {
          paymentId: p.paymentId,
          transactionId: p.transactionId,
          amount: p.amount,
          paymentMethod: p.paymentMethod,
          paymentDate: p.paymentDate,
          recordedByUserId: p.recordedByUserId,
          notes: p.notes,
        },
      });
    }
  } catch (err) {
    console.warn("No direct transactions or error copying:", err);
  }

  // Reset all PostgreSQL sequences to MAX(id) + 1
  console.log("🔄 Resetting all PostgreSQL sequences...");
  const seqTables = [
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

  for (const { table, id } of seqTables) {
    try {
      await targetPrisma.$executeRawUnsafe(`
        SELECT setval(
          pg_get_serial_sequence('${table}', '${id}'),
          COALESCE((SELECT MAX(${id}) FROM "${table}"), 0) + 1,
          false
        );
      `);
    } catch (e: any) {
      console.warn(`Could not reset sequence for ${table}.${id}:`, e.message);
    }
  }

  console.log("🎉 Database clone and v3 migration complete!");
  console.log(`Summary:`);
  console.log(`  Users: ${users.length}`);
  console.log(`  Fabrics: ${fabrics.length}`);
  console.log(`  Variants: ${fabricVariants.length}`);
  console.log(`  Work Orders: ${workOrders.length}`);
  console.log(`  Yarn Deliveries: ${yarnGivens.length}`);
  console.log(`  Fabric Returns: ${fabricReturns.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Error cloning database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  });
