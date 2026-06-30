import { ProductCategory } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
export const catalogRouter = Router();

catalogRouter.get("/fabric-variants", async (_req, res, next) => {
  try {
    const variants = await prisma.fabricVariant.findMany({
      where: { isActive: true },
      include: {
        product: true,
        design: true,
        warpColor: true,
        weftColor: true,
        qualityRule: true,
        bonusRule: true,
      },
      orderBy: { fabricVariantId: "asc" },
    });
    res.json(variants);
  } catch (error) {
    next(error);
  }
});

catalogRouter.get("/yarn-variants", authenticate, async (_req, res, next) => {
  try {
    const variants = await prisma.yarnVariant.findMany({
      where: { isActive: true },
      include: { yarnType: true, color: true, supplier: true },
      orderBy: { yarnVariantId: "asc" },
    });
    res.json(variants);
  } catch (error) {
    next(error);
  }
});

catalogRouter.get("/products", authenticate, async (_req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { productId: "asc" },
    });
    res.json(products);
  } catch (error) {
    next(error);
  }
});

catalogRouter.get("/colors", authenticate, async (_req, res, next) => {
  try {
    const colors = await prisma.color.findMany({ orderBy: { colorCode: "asc" } });
    res.json(colors);
  } catch (error) {
    next(error);
  }
});

catalogRouter.get("/designs", authenticate, async (_req, res, next) => {
  try {
    const designs = await prisma.design.findMany({ orderBy: { name: "asc" } });
    res.json(designs);
  } catch (error) {
    next(error);
  }
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

catalogRouter.get("/lookup", authenticate, async (_req, res, next) => {
  try {
    const [colors, designs, products, suppliers, yarnTypes] = await Promise.all([
      prisma.color.findMany({ orderBy: { colorCode: "asc" } }),
      prisma.design.findMany({ orderBy: { name: "asc" } }),
      prisma.product.findMany({ where: { isActive: true }, orderBy: { productId: "asc" } }),
      prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
      prisma.yarnType.findMany({ orderBy: { materialName: "asc" } }),
    ]);
    res.json({
      colors,
      designs,
      products,
      suppliers,
      yarnTypes,
    });
  } catch (error) {
    next(error);
  }
});

catalogRouter.get("/yarn-types", authenticate, async (_req, res, next) => {
  try {
    const yarnTypes = await prisma.yarnType.findMany({ orderBy: { materialName: "asc" } });
    res.json(yarnTypes);
  } catch (error) {
    next(error);
  }
});

// --- Admin create endpoints ---

const colorSchema = z.object({
  colorCode: z.string().min(1).max(10),
  name: z.string().min(1).max(80),
});

const designSchema = z.object({
  name: z.string().min(1).max(120),
});

const productSchema = z.object({
  name: z.string().min(1).max(120),
  category: z.nativeEnum(ProductCategory),
  basePrice: z.number().positive(),
  standardLengthCm: z.number().positive().optional(),
  standardWidthCm: z.number().positive().optional(),
});

const supplierSchema = z.object({
  name: z.string().min(1).max(120),
  contactPhone: z.string().max(30).optional(),
});

const yarnTypeSchema = z.object({
  materialName: z.string().min(1).max(80),
});

const fabricVariantSchema = z.object({
  productId: z.number().int().positive(),
  warpColorId: z.number().int().positive(),
  weftColorId: z.number().int().positive(),
  designId: z.number().int().positive().optional(),
  basePrice: z.number().positive().optional(),
  sku: z.string().min(1).max(40).optional(),
});

const yarnVariantSchema = z.object({
  yarnTypeId: z.number().int().positive(),
  colorId: z.number().int().positive(),
  supplierId: z.number().int().positive(),
  basePrice: z.number().positive().optional(),
  sku: z.string().min(1).max(40).optional(),
});

catalogRouter.post("/colors", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const body = colorSchema.parse(req.body);
    const color = await prisma.color.create({ data: body });
    res.status(201).json(color);
  } catch (error) {
    next(error);
  }
});

catalogRouter.post("/designs", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const body = designSchema.parse(req.body);
    const design = await prisma.design.create({ data: body });
    res.status(201).json(design);
  } catch (error) {
    next(error);
  }
});

catalogRouter.post("/products", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const body = productSchema.parse(req.body);
    const product = await prisma.product.create({ data: body });
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

catalogRouter.post("/suppliers", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const body = supplierSchema.parse(req.body);
    const supplier = await prisma.supplier.create({ data: body });
    res.status(201).json(supplier);
  } catch (error) {
    next(error);
  }
});

catalogRouter.post("/yarn-types", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const body = yarnTypeSchema.parse(req.body);
    const yarnType = await prisma.yarnType.create({ data: body });
    res.status(201).json(yarnType);
  } catch (error) {
    next(error);
  }
});

catalogRouter.post("/fabric-variants", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const body = fabricVariantSchema.parse(req.body);
    const warp = await prisma.color.findUnique({ where: { colorId: body.warpColorId } });
    const weft = await prisma.color.findUnique({ where: { colorId: body.weftColorId } });
    if (!warp || !weft) {
      res.status(400).json({ error: "Invalid color IDs" });
      return;
    }
    const sku =
      body.sku ??
      `FAB-${body.productId}-${warp.colorCode}-${weft.colorCode}${body.designId ? `-D${body.designId}` : ""}`;
    const variant = await prisma.fabricVariant.create({
      data: {
        productId: body.productId,
        warpColorId: body.warpColorId,
        weftColorId: body.weftColorId,
        designId: body.designId ?? null,
        basePrice: body.basePrice,
        sku,
      },
      include: { product: true, warpColor: true, weftColor: true, design: true },
    });
    res.status(201).json(variant);
  } catch (error) {
    next(error);
  }
});

catalogRouter.post("/yarn-variants", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const body = yarnVariantSchema.parse(req.body);
    const color = await prisma.color.findUnique({ where: { colorId: body.colorId } });
    if (!color) {
      res.status(400).json({ error: "Invalid color ID" });
      return;
    }
    const sku =
      body.sku ?? `YRN-${body.yarnTypeId}-${body.supplierId}-${color.colorCode}`;
    const variant = await prisma.yarnVariant.create({
      data: {
        yarnTypeId: body.yarnTypeId,
        colorId: body.colorId,
        supplierId: body.supplierId,
        basePrice: body.basePrice,
        sku,
      },
      include: { yarnType: true, color: true, supplier: true },
    });
    res.status(201).json(variant);
  } catch (error) {
    next(error);
  }
});