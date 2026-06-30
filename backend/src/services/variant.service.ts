import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

type Tx = Prisma.TransactionClient;

export interface ResolveFabricInput {
  productId: number;
  warpColorId: number;
  weftColorId: number;
  designId?: number | null;
  basePrice?: number;
}

export interface ResolveYarnInput {
  yarnTypeId: number;
  colorId: number;
  supplierId: number;
  basePrice?: number;
}

export interface ResolveResult {
  variantId: number;
  created: boolean;
  sku: string;
}

async function findFabricVariant(tx: Tx, input: ResolveFabricInput, designId: number | null) {
  const designKey = designId;
  return tx.fabricVariant.findFirst({
    where: {
      productId: input.productId,
      warpColorId: input.warpColorId,
      weftColorId: input.weftColorId,
      designId: designKey,
      isActive: true,
    },
  });
}

async function copyRulesFromSibling(
  tx: Tx,
  productId: number,
  newVariantId: number,
) {
  const sibling = await tx.fabricVariant.findFirst({
    where: { productId, NOT: { fabricVariantId: newVariantId } },
    include: { qualityRule: true, bonusRule: true },
    orderBy: { fabricVariantId: "asc" },
  });
  if (!sibling) return;

  if (sibling.qualityRule) {
    await tx.qualityRule.upsert({
      where: { fabricVariantId: newVariantId },
      update: {
        minWeightThreshold: sibling.qualityRule.minWeightThreshold,
        deductionRatePerUnit: sibling.qualityRule.deductionRatePerUnit,
      },
      create: {
        fabricVariantId: newVariantId,
        minWeightThreshold: sibling.qualityRule.minWeightThreshold,
        deductionRatePerUnit: sibling.qualityRule.deductionRatePerUnit,
      },
    });
  }

  if (sibling.bonusRule) {
    await tx.bonusRule.upsert({
      where: { fabricVariantId: newVariantId },
      update: {
        minWeightThreshold: sibling.bonusRule.minWeightThreshold,
        bonusRatePerUnit: sibling.bonusRule.bonusRatePerUnit,
        maxBonusPerPiece: sibling.bonusRule.maxBonusPerPiece,
      },
      create: {
        fabricVariantId: newVariantId,
        minWeightThreshold: sibling.bonusRule.minWeightThreshold,
        bonusRatePerUnit: sibling.bonusRule.bonusRatePerUnit,
        maxBonusPerPiece: sibling.bonusRule.maxBonusPerPiece,
      },
    });
  }
}

export async function resolveFabricVariant(
  input: ResolveFabricInput,
  tx: Tx = prisma,
): Promise<ResolveResult> {
  const designId = input.designId ?? null;
  const existing = await findFabricVariant(tx, input, designId);
  if (existing) {
    return {
      variantId: existing.fabricVariantId,
      created: false,
      sku: existing.sku,
    };
  }

  const [product, warp, weft] = await Promise.all([
    tx.product.findUniqueOrThrow({ where: { productId: input.productId } }),
    tx.color.findUniqueOrThrow({ where: { colorId: input.warpColorId } }),
    tx.color.findUniqueOrThrow({ where: { colorId: input.weftColorId } }),
  ]);

  const skuBase = `FAB-${input.productId}-${warp.colorCode}-${weft.colorCode}`;
  const sku = designId ? `${skuBase}-D${designId}` : skuBase;
  const basePrice = input.basePrice ?? Number(product.basePrice);

  const variant = await tx.fabricVariant.create({
    data: {
      productId: input.productId,
      warpColorId: input.warpColorId,
      weftColorId: input.weftColorId,
      designId,
      sku,
      basePrice,
    },
  });

  await copyRulesFromSibling(tx, input.productId, variant.fabricVariantId);

  return {
    variantId: variant.fabricVariantId,
    created: true,
    sku: variant.sku,
  };
}

export async function resolveYarnVariant(
  input: ResolveYarnInput,
  tx: Tx = prisma,
): Promise<ResolveResult> {
  const existing = await tx.yarnVariant.findFirst({
    where: {
      yarnTypeId: input.yarnTypeId,
      colorId: input.colorId,
      supplierId: input.supplierId,
      isActive: true,
    },
  });

  if (existing) {
    return {
      variantId: existing.yarnVariantId,
      created: false,
      sku: existing.sku,
    };
  }

  const color = await tx.color.findUniqueOrThrow({
    where: { colorId: input.colorId },
  });

  const sku = `YRN-${input.yarnTypeId}-${input.supplierId}-${color.colorCode}`;

  const variant = await tx.yarnVariant.create({
    data: {
      yarnTypeId: input.yarnTypeId,
      colorId: input.colorId,
      supplierId: input.supplierId,
      sku,
      basePrice: input.basePrice,
    },
  });

  return {
    variantId: variant.yarnVariantId,
    created: true,
    sku: variant.sku,
  };
}