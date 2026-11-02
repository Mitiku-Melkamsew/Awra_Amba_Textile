import { UserRole } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const catalogRouter = Router();

// ==========================================
// FABRICS (PRODUCTS)
// ==========================================

const fabricCreateSchema = z.object({
  name: z.string().min(1).max(120),
  standardLengthCm: z.number().positive(),
  standardWidthCm: z.number().positive(),
  standardWeightG: z.number().positive(),
});

const fabricUpdateSchema = z.object({
  standardLengthCm: z.number().positive().optional(),
  standardWidthCm: z.number().positive().optional(),
  standardWeightG: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

catalogRouter.get("/fabrics", authenticate, async (req, res, next) => {
  try {
    const isOnlyMerchant = req.user?.roles?.includes(UserRole.merchant) && !req.user?.roles?.includes(UserRole.admin);
    const fabrics = await prisma.fabric.findMany({
      orderBy: { fabricId: "asc" },
      include: {
        prices: {
          where: { isActive: true },
          orderBy: { effectiveFrom: "desc" },
          take: 1,
        },
      },
    });
    if (isOnlyMerchant) {
      const sanitized = fabrics.map((f) => ({
        ...f,
        prices: f.prices.map((p) => ({
          fabricPriceId: p.fabricPriceId,
          fabricId: p.fabricId,
          sellingPrice: p.sellingPrice,
          effectiveFrom: p.effectiveFrom,
          effectiveTo: p.effectiveTo,
          isActive: p.isActive,
          createdAt: p.createdAt,
        })),
      }));
      res.json(sanitized);
      return;
    }
    res.json(fabrics);
  } catch (error) {
    next(error);
  }
});

// Backwards-compatibility alias for frontend
catalogRouter.get("/products", authenticate, async (_req, res, next) => {
  try {
    const fabrics = await prisma.fabric.findMany({
      where: { isActive: true },
      orderBy: { fabricId: "asc" },
    });
    res.json(
      fabrics.map((f) => ({
        productId: f.fabricId,
        name: f.name,
        category: "fabric",
        basePrice: 0,
        standardLengthCm: f.standardLengthCm,
        standardWidthCm: f.standardWidthCm,
        standardWeightG: f.standardWeightG,
        isActive: f.isActive,
      })),
    );
  } catch (error) {
    next(error);
  }
});

catalogRouter.post("/fabrics", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const body = fabricCreateSchema.parse(req.body);
    const fabric = await prisma.fabric.create({
      data: {
        name: body.name.trim(),
        standardLengthCm: body.standardLengthCm,
        standardWidthCm: body.standardWidthCm,
        standardWeightG: body.standardWeightG,
      },
    });
    res.status(201).json(fabric);
  } catch (error) {
    next(error);
  }
});

catalogRouter.patch("/fabrics/:id", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const body = fabricUpdateSchema.parse(req.body);
    const updated = await prisma.fabric.update({
      where: { fabricId: id },
      data: {
        standardLengthCm: body.standardLengthCm,
        standardWidthCm: body.standardWidthCm,
        standardWeightG: body.standardWeightG,
        isActive: body.isActive,
      },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// YARNS (YARN TYPES)
// ==========================================

const yarnCreateSchema = z.object({
  name: z.string().min(1).max(80),
});

const yarnUpdateSchema = z.object({
  isActive: z.boolean().optional(),
});

catalogRouter.get("/yarns", authenticate, async (_req, res, next) => {
  try {
    const yarns = await prisma.yarn.findMany({
      orderBy: { yarnId: "asc" },
      include: {
        yarnPrices: {
          where: { isActive: true },
          orderBy: { effectiveFrom: "desc" },
        },
      },
    });
    res.json(yarns);
  } catch (error) {
    next(error);
  }
});

// Backwards compatibility alias
catalogRouter.get("/yarn-types", authenticate, async (_req, res, next) => {
  try {
    const yarns = await prisma.yarn.findMany({
      where: { isActive: true },
      orderBy: { yarnId: "asc" },
    });
    res.json(
      yarns.map((y) => ({
        yarnTypeId: y.yarnId,
        materialName: y.name,
      })),
    );
  } catch (error) {
    next(error);
  }
});

catalogRouter.post("/yarns", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const body = yarnCreateSchema.parse(req.body);
    const yarn = await prisma.yarn.create({
      data: { name: body.name.trim() },
    });
    res.status(201).json(yarn);
  } catch (error) {
    next(error);
  }
});

catalogRouter.patch("/yarns/:id", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const body = yarnUpdateSchema.parse(req.body);
    const updated = await prisma.yarn.update({
      where: { yarnId: id },
      data: { isActive: body.isActive },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// COLORS & DESIGNS & SUPPLIERS
// ==========================================

const colorSchema = z.object({
  name: z.string().min(1).max(80),
});

catalogRouter.get("/colors", authenticate, async (_req, res, next) => {
  try {
    const colors = await prisma.color.findMany({ orderBy: { name: "asc" } });
    res.json(
      colors.map((c) => ({
        colorId: c.colorId,
        name: c.name,
        colorCode: c.name.slice(0, 6).toUpperCase(), // fallback for older frontend
      })),
    );
  } catch (error) {
    next(error);
  }
});

catalogRouter.post("/colors", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const body = colorSchema.parse(req.body);
    const color = await prisma.color.create({
      data: { name: body.name.trim() },
    });
    res.status(201).json(color);
  } catch (error) {
    next(error);
  }
});

const designSchema = z.object({
  name: z.string().min(1).max(120),
});

catalogRouter.get("/designs", authenticate, async (_req, res, next) => {
  try {
    const designs = await prisma.design.findMany({ orderBy: { name: "asc" } });
    res.json(designs);
  } catch (error) {
    next(error);
  }
});

catalogRouter.post("/designs", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const body = designSchema.parse(req.body);
    const design = await prisma.design.create({
      data: { name: body.name.trim() },
    });
    res.status(201).json(design);
  } catch (error) {
    next(error);
  }
});

const supplierSchema = z.object({
  name: z.string().min(1).max(120),
  contactPhone: z.string().max(30).optional(),
});

catalogRouter.get("/suppliers", authenticate, async (_req, res, next) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    res.json(suppliers);
  } catch (error) {
    next(error);
  }
});

catalogRouter.post("/suppliers", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const body = supplierSchema.parse(req.body);
    const supplier = await prisma.supplier.create({
      data: {
        name: body.name.trim(),
        contactPhone: body.contactPhone,
      },
    });
    res.status(201).json(supplier);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// FABRIC VARIANTS & YARN VARIANTS
// ==========================================

const fabricVariantSchema = z.object({
  fabricId: z.number().int().positive().optional(),
  productId: z.number().int().positive().optional(), // alias
  designId: z.number().int().positive(),
  warpColorId: z.number().int().positive(),
  weftColorId: z.number().int().positive(),
  sku: z.string().min(1).max(40).optional(),
});

catalogRouter.get("/fabric-variants", authenticate, async (_req, res, next) => {
  try {
    const variants = await prisma.fabricVariant.findMany({
      where: { isActive: true },
      include: {
        fabric: true,
        design: true,
        warpColor: true,
        weftColor: true,
      },
      orderBy: { fabricVariantId: "asc" },
    });
    res.json(
      variants.map((v) => ({
        ...v,
        product: v.fabric, // alias for frontend compatibility
        productId: v.fabricId,
      })),
    );
  } catch (error) {
    next(error);
  }
});

catalogRouter.post("/fabric-variants", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const body = fabricVariantSchema.parse(req.body);
    const fabricId = body.fabricId ?? body.productId;
    if (!fabricId) {
      throw new Error("VALIDATION: fabricId (or productId) is required.");
    }

    const sku =
      body.sku ??
      `FV-${fabricId}-${body.designId}-${body.warpColorId}-${body.weftColorId}-${Date.now().toString(36)}`;

    const variant = await prisma.fabricVariant.create({
      data: {
        fabricId,
        designId: body.designId,
        warpColorId: body.warpColorId,
        weftColorId: body.weftColorId,
        sku,
      },
      include: {
        fabric: true,
        design: true,
        warpColor: true,
        weftColor: true,
      },
    });
    res.status(201).json(variant);
  } catch (error) {
    next(error);
  }
});

const yarnVariantSchema = z.object({
  yarnId: z.number().int().positive().optional(),
  yarnTypeId: z.number().int().positive().optional(), // alias
  colorId: z.number().int().positive(),
  supplierId: z.number().int().positive(),
  sku: z.string().min(1).max(40).optional(),
});

catalogRouter.get("/yarn-variants", authenticate, async (_req, res, next) => {
  try {
    const variants = await prisma.yarnVariant.findMany({
      where: { isActive: true },
      include: {
        yarn: true,
        color: true,
        supplier: true,
      },
      orderBy: { yarnVariantId: "asc" },
    });
    res.json(
      variants.map((v) => ({
        ...v,
        yarnType: { yarnTypeId: v.yarnId, materialName: v.yarn.name }, // alias
      })),
    );
  } catch (error) {
    next(error);
  }
});

catalogRouter.post("/yarn-variants", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const body = yarnVariantSchema.parse(req.body);
    const yarnId = body.yarnId ?? body.yarnTypeId;
    if (!yarnId) {
      throw new Error("VALIDATION: yarnId (or yarnTypeId) is required.");
    }

    const sku =
      body.sku ??
      `YV-${yarnId}-${body.supplierId}-${body.colorId}-${Date.now().toString(36)}`;

    const variant = await prisma.yarnVariant.create({
      data: {
        yarnId,
        colorId: body.colorId,
        supplierId: body.supplierId,
        sku,
      },
      include: {
        yarn: true,
        color: true,
        supplier: true,
      },
    });
    res.status(201).json(variant);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// PRICES: FABRIC & YARN
// ==========================================

const fabricPriceSchema = z.object({
  fabricId: z.number().int().positive(),
  weaverRate: z.number().positive(),
  sellingPrice: z.number().positive(),
  effectiveFrom: z.string().datetime().optional().or(z.string()),
});

catalogRouter.get("/fabric-prices", authenticate, async (req, res, next) => {
  try {
    const isOnlyMerchant = req.user?.roles?.includes(UserRole.merchant) && !req.user?.roles?.includes(UserRole.admin);
    const fabricId = req.query.fabricId ? Number(req.query.fabricId) : undefined;
    const prices = await prisma.fabricPrice.findMany({
      where: {
        ...(fabricId ? { fabricId } : {}),
      },
      include: { fabric: true },
      orderBy: { effectiveFrom: "desc" },
    });
    if (isOnlyMerchant) {
      const sanitized = prices.map((p) => ({
        fabricPriceId: p.fabricPriceId,
        fabricId: p.fabricId,
        fabric: p.fabric,
        sellingPrice: p.sellingPrice,
        effectiveFrom: p.effectiveFrom,
        effectiveTo: p.effectiveTo,
        isActive: p.isActive,
        createdAt: p.createdAt,
      }));
      res.json(sanitized);
      return;
    }
    res.json(prices);
  } catch (error) {
    next(error);
  }
});

catalogRouter.post("/fabric-prices", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const body = fabricPriceSchema.parse(req.body);
    const price = await prisma.fabricPrice.create({
      data: {
        fabricId: body.fabricId,
        weaverRate: body.weaverRate,
        sellingPrice: body.sellingPrice,
        effectiveFrom: body.effectiveFrom ? new Date(body.effectiveFrom) : new Date(),
      },
    });
    res.status(201).json(price);
  } catch (error) {
    next(error);
  }
});

const yarnPriceSchema = z.object({
  yarnId: z.number().int().positive(),
  supplierId: z.number().int().positive(),
  purchasePrice: z.number().positive(),
  sellingPrice: z.number().positive(),
  effectiveFrom: z.string().datetime().optional().or(z.string()),
});

catalogRouter.get("/yarn-prices", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const yarnId = req.query.yarnId ? Number(req.query.yarnId) : undefined;
    const supplierId = req.query.supplierId ? Number(req.query.supplierId) : undefined;
    const prices = await prisma.yarnPrice.findMany({
      where: {
        ...(yarnId ? { yarnId } : {}),
        ...(supplierId ? { supplierId } : {}),
      },
      include: { yarn: true, supplier: true },
      orderBy: { effectiveFrom: "desc" },
    });
    res.json(prices);
  } catch (error) {
    next(error);
  }
});

catalogRouter.post("/yarn-prices", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const body = yarnPriceSchema.parse(req.body);
    const price = await prisma.yarnPrice.create({
      data: {
        yarnId: body.yarnId,
        supplierId: body.supplierId,
        purchasePrice: body.purchasePrice,
        sellingPrice: body.sellingPrice,
        effectiveFrom: body.effectiveFrom ? new Date(body.effectiveFrom) : new Date(),
      },
    });
    res.status(201).json(price);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// QUALITY RULES
// ==========================================

const qualityRuleSchema = z.object({
  factor: z.string().min(1).max(30),
  unit: z.string().min(1).max(20),
  deductionPerUnit: z.number().positive(),
});

catalogRouter.get("/quality-rules", authenticate, async (_req, res, next) => {
  try {
    const rules = await prisma.qualityRule.findMany({
      orderBy: { qualityRuleId: "asc" },
    });
    res.json(rules);
  } catch (error) {
    next(error);
  }
});

catalogRouter.post("/quality-rules", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const body = qualityRuleSchema.parse(req.body);
    const rule = await prisma.qualityRule.create({
      data: {
        factor: body.factor,
        unit: body.unit,
        deductionPerUnit: body.deductionPerUnit,
      },
    });
    res.status(201).json(rule);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// CATALOG LOOKUP AGGREGATE
// ==========================================

catalogRouter.get("/lookup", authenticate, async (_req, res, next) => {
  try {
    const [colors, designs, fabrics, suppliers, yarns, qualityRules] = await Promise.all([
      prisma.color.findMany({ orderBy: { name: "asc" } }),
      prisma.design.findMany({ orderBy: { name: "asc" } }),
      prisma.fabric.findMany({ where: { isActive: true }, orderBy: { fabricId: "asc" } }),
      prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
      prisma.yarn.findMany({ where: { isActive: true }, orderBy: { yarnId: "asc" } }),
      prisma.qualityRule.findMany({ where: { isActive: true } }),
    ]);

    res.json({
      colors: colors.map((c) => ({ ...c, colorCode: c.name.slice(0, 6).toUpperCase() })),
      designs,
      fabrics,
      products: fabrics.map((f) => ({ ...f, productId: f.fabricId })),
      suppliers,
      yarns,
      yarnTypes: yarns.map((y) => ({ yarnTypeId: y.yarnId, materialName: y.name })),
      qualityRules,
    });
  } catch (error) {
    next(error);
  }
});
