import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { resolveFabricVariant, resolveYarnVariant } from "./variant.service.js";

type Tx = Prisma.TransactionClient;

export interface TransactionLineInput {
  yarnVariantId?: number;
  fabricVariantId?: number;
  yarnId?: number;
  yarnTypeId?: number;
  colorId?: number;
  supplierId?: number;
  fabricId?: number;
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
  yarnId: number | null;
  yarnTypeId: number | null;
  colorId: number | null;
  supplierId: number | null;
  fabricId: number | null;
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
        yarnId: variant.yarnId,
        yarnTypeId: variant.yarnId,
        colorId: variant.colorId,
        supplierId: variant.supplierId,
        fabricId: null,
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

    const yarnId = line.yarnId ?? line.yarnTypeId;
    if (!yarnId || !line.colorId || !line.supplierId) {
      throw new Error("VALIDATION: Yarn line requires variant or yarn, color, and supplier.");
    }

    const resolved = await resolveYarnVariant(
      {
        yarnId,
        colorId: line.colorId,
        supplierId: line.supplierId,
      },
      tx,
    );

    return {
      yarnVariantId: resolved.variantId,
      fabricVariantId: null,
      yarnId,
      yarnTypeId: yarnId,
      colorId: line.colorId,
      supplierId: line.supplierId,
      fabricId: null,
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

  // Fabric
  if (line.fabricVariantId) {
    const variant = await tx.fabricVariant.findUniqueOrThrow({
      where: { fabricVariantId: line.fabricVariantId },
    });
    return {
      yarnVariantId: null,
      fabricVariantId: variant.fabricVariantId,
      yarnId: null,
      yarnTypeId: null,
      colorId: null,
      supplierId: null,
      fabricId: variant.fabricId,
      productId: variant.fabricId,
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

  const fabricId = line.fabricId ?? line.productId;
  if (!fabricId || !line.warpColorId || !line.weftColorId) {
    throw new Error("VALIDATION: Fabric line requires variant or fabric, warp, and weft colors.");
  }

  const resolved = await resolveFabricVariant(
    {
      fabricId,
      warpColorId: line.warpColorId,
      weftColorId: line.weftColorId,
      designId: line.designId ?? null,
    },
    tx,
  );

  return {
    yarnVariantId: null,
    fabricVariantId: resolved.variantId,
    yarnId: null,
    yarnTypeId: null,
    colorId: null,
    supplierId: null,
    fabricId,
    productId: fabricId,
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
