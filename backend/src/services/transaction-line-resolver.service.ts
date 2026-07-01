import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { resolveFabricVariant, resolveYarnVariant } from "./variant.service.js";

type Tx = Prisma.TransactionClient;

export interface TransactionLineInput {
  yarnVariantId?: number;
  fabricVariantId?: number;
  yarnTypeId?: number;
  colorId?: number;
  supplierId?: number;
  productId?: number;
  warpColorId?: number;
  weftColorId?: number;
  designId?: number | null;
  quantity: number;
  unitPrice: number;
  description?: string;
}

export interface ResolvedTransactionLine {
  yarnVariantId: number | null;
  fabricVariantId: number | null;
  yarnTypeId: number | null;
  colorId: number | null;
  supplierId: number | null;
  productId: number | null;
  warpColorId: number | null;
  weftColorId: number | null;
  designId: number | null;
  quantity: number;
  unitPrice: number;
  description?: string;
  variantCreated: boolean;
  sku: string | null;
}

export async function resolveTransactionLine(
  kind: "yarn" | "fabric",
  line: TransactionLineInput,
  tx: Tx = prisma,
): Promise<ResolvedTransactionLine> {
  if (kind === "yarn") {
    if (line.yarnVariantId) {
      const variant = await tx.yarnVariant.findUniqueOrThrow({
        where: { yarnVariantId: line.yarnVariantId },
      });
      return {
        yarnVariantId: variant.yarnVariantId,
        fabricVariantId: null,
        yarnTypeId: variant.yarnTypeId,
        colorId: variant.colorId,
        supplierId: variant.supplierId,
        productId: null,
        warpColorId: null,
        weftColorId: null,
        designId: null,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        description: line.description,
        variantCreated: false,
        sku: variant.sku,
      };
    }

    if (!line.yarnTypeId || !line.colorId || !line.supplierId) {
      throw new Error("VALIDATION:Yarn line requires variant or type, color, and supplier.");
    }

    const resolved = await resolveYarnVariant(
      {
        yarnTypeId: line.yarnTypeId,
        colorId: line.colorId,
        supplierId: line.supplierId,
        basePrice: line.unitPrice,
      },
      tx,
    );

    return {
      yarnVariantId: resolved.variantId,
      fabricVariantId: null,
      yarnTypeId: line.yarnTypeId,
      colorId: line.colorId,
      supplierId: line.supplierId,
      productId: null,
      warpColorId: null,
      weftColorId: null,
      designId: null,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      description: line.description,
      variantCreated: resolved.created,
      sku: resolved.sku,
    };
  }

  if (line.fabricVariantId) {
    const variant = await tx.fabricVariant.findUniqueOrThrow({
      where: { fabricVariantId: line.fabricVariantId },
      include: { product: true },
    });
    return {
      yarnVariantId: null,
      fabricVariantId: variant.fabricVariantId,
      yarnTypeId: null,
      colorId: null,
      supplierId: null,
      productId: variant.productId,
      warpColorId: variant.warpColorId,
      weftColorId: variant.weftColorId,
      designId: variant.designId,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      description: line.description,
      variantCreated: false,
      sku: variant.sku,
    };
  }

  if (!line.productId || !line.warpColorId || !line.weftColorId) {
    throw new Error("VALIDATION:Fabric line requires variant or product, warp, and weft colors.");
  }

  const resolved = await resolveFabricVariant(
    {
      productId: line.productId,
      warpColorId: line.warpColorId,
      weftColorId: line.weftColorId,
      designId: line.designId ?? null,
      basePrice: line.unitPrice,
    },
    tx,
  );

  return {
    yarnVariantId: null,
    fabricVariantId: resolved.variantId,
    yarnTypeId: null,
    colorId: null,
    supplierId: null,
    productId: line.productId,
    warpColorId: line.warpColorId,
    weftColorId: line.weftColorId,
    designId: line.designId ?? null,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    description: line.description,
    variantCreated: resolved.created,
    sku: resolved.sku,
  };
}