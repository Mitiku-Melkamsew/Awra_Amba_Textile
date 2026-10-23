import type { FabricVariant } from "../api";
import type { YarnVariantOption } from "./yarnLines";

const isReal = (name?: string | null): name is string => Boolean(name) && name !== "Default";

/**
 * Readable name of a fabric type, e.g. "medebegna-biret-geberdin":
 *   product - colour - design
 * Warp and weft colour are shown once when they are the same, as "warp/weft" when they differ,
 * and left out when both are "Default" or missing. Design is left out when there is none.
 */
export function fabricNameFromParts(
  productName: string,
  warpName?: string | null,
  weftName?: string | null,
  designName?: string | null,
): string {
  const parts = [productName];
  if (isReal(warpName) || isReal(weftName)) {
    parts.push(warpName === weftName ? (warpName as string) : `${warpName ?? "—"}/${weftName ?? "—"}`);
  }
  if (isReal(designName)) parts.push(designName);
  return parts.join("-");
}

export function fabricVariantName(variant: FabricVariant): string {
  return fabricNameFromParts(
    variant.product.name,
    variant.warpColor?.name,
    variant.weftColor?.name,
    variant.design?.name,
  );
}

/**
 * Readable names for yarn variants: "type-colour". The supplier is added in brackets only
 * where two variants would otherwise have the same name.
 */
export function yarnVariantLabels(variants: YarnVariantOption[]): Map<number, string> {
  const base = (v: YarnVariantOption) =>
    [v.yarnType?.materialName, v.color?.name].filter(Boolean).join("-") || v.sku;

  const counts = new Map<string, number>();
  for (const v of variants) counts.set(base(v), (counts.get(base(v)) ?? 0) + 1);

  return new Map(
    variants.map((v) => {
      const name = base(v);
      const label =
        (counts.get(name) ?? 0) > 1 && v.supplier?.name ? `${name} (${v.supplier.name})` : name;
      return [v.yarnVariantId, label];
    }),
  );
}
