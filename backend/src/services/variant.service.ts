import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

type Tx = Prisma.TransactionClient;

export interface ResolveFabricInput {
  fabricId?: number;
  productId?: number;
  warpColorId: number;
  weftColorId: number;
  designId?: number | null;
}

export interface ResolveYarnInput {
  yarnId?: number;
  yarnTypeId?: number;
  colorId: number;
  supplierId: number;
}

export interface ResolveResult {
  variantId: number;
  created: boolean;
  sku: string;
}

async function getOrCreateDefaultDesign(tx: Tx): Promise<number> {
  const existing = await tx.design.findFirst({
    orderBy: { designId: "asc" },
  });
  if (existing) return existing.designId;

  const created = await tx.design.create({
    data: { name: "መደበኛ" }, // Standard design
  });
  return created.designId;
}

export async function resolveFabricVariant(
  input: ResolveFabricInput,
  tx: Tx = prisma,
): Promise<ResolveResult> {
  const fabricId = input.fabricId ?? input.productId;
  if (!fabricId) {
    throw new Error("VALIDATION: fabricId (or productId) is required.");
  }

  const designId = input.designId ?? (await getOrCreateDefaultDesign(tx));

  const existing = await tx.fabricVariant.findFirst({
    where: {
      fabricId,
      warpColorId: input.warpColorId,
      weftColorId: input.weftColorId,
      designId,
    },
  });

  if (existing) {
    if (!existing.isActive) {
      await tx.fabricVariant.update({
        where: { fabricVariantId: existing.fabricVariantId },
        data: { isActive: true },
      });
    }
    return {
      variantId: existing.fabricVariantId,
      created: false,
      sku: existing.sku,
    };
  }

  const [fabric, warp, weft, design] = await Promise.all([
    tx.fabric.findUniqueOrThrow({ where: { fabricId } }),
    tx.color.findUniqueOrThrow({ where: { colorId: input.warpColorId } }),
    tx.color.findUniqueOrThrow({ where: { colorId: input.weftColorId } }),
    tx.design.findUniqueOrThrow({ where: { designId } }),
  ]);

  const baseSku = `FV-${fabric.fabricId}-${design.designId}-${warp.colorId}-${weft.colorId}`;
  let sku = baseSku;
  const existingSku = await tx.fabricVariant.findUnique({ where: { sku } });
  if (existingSku) {
    sku = `${baseSku}-${Date.now().toString(36)}`;
  }

  const created = await tx.fabricVariant.create({
    data: {
      fabricId: fabric.fabricId,
      designId,
      warpColorId: warp.colorId,
      weftColorId: weft.colorId,
      sku,
      stockSnapshot: 0,
      isActive: true,
    },
  });

  return {
    variantId: created.fabricVariantId,
    created: true,
    sku: created.sku,
  };
}

export async function resolveYarnVariant(
  input: ResolveYarnInput,
  tx: Tx = prisma,
): Promise<ResolveResult> {
  const yarnId = input.yarnId ?? input.yarnTypeId;
  if (!yarnId) {
    throw new Error("VALIDATION: yarnId (or yarnTypeId) is required.");
  }

  const existing = await tx.yarnVariant.findFirst({
    where: {
      yarnId,
      colorId: input.colorId,
      supplierId: input.supplierId,
    },
  });

  if (existing) {
    if (!existing.isActive) {
      await tx.yarnVariant.update({
        where: { yarnVariantId: existing.yarnVariantId },
        data: { isActive: true },
      });
    }
    return {
      variantId: existing.yarnVariantId,
      created: false,
      sku: existing.sku,
    };
  }

  const [yarn, color, supplier] = await Promise.all([
    tx.yarn.findUniqueOrThrow({ where: { yarnId } }),
    tx.color.findUniqueOrThrow({ where: { colorId: input.colorId } }),
    tx.supplier.findUniqueOrThrow({ where: { supplierId: input.supplierId } }),
  ]);

  const baseSku = `YV-${yarn.yarnId}-${supplier.supplierId}-${color.colorId}`;
  let sku = baseSku;
  const existingSku = await tx.yarnVariant.findUnique({ where: { sku } });
  if (existingSku) {
    sku = `${baseSku}-${Date.now().toString(36)}`;
  }

  const created = await tx.yarnVariant.create({
    data: {
      yarnId: yarn.yarnId,
      colorId: color.colorId,
      supplierId: supplier.supplierId,
      sku,
      stockSnapshot: 0,
      isActive: true,
    },
  });

  return {
    variantId: created.yarnVariantId,
    created: true,
    sku: created.sku,
  };
}
