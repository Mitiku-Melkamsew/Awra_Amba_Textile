import type { FabricVariant } from "../api";
import type { YarnVariantOption } from "./yarnLines";
import { toTitleCase } from "./formatters";

const isReal = (name?: string | null): name is string =>
  typeof name === "string" && name.trim().length > 0 && name.toLowerCase() !== "default";

/**
 * Readable name of a fabric type, e.g. "Medebegna - Biret - Geberdin":
 *   product - colour - design
 * Warp and weft colour are shown once when they are the same, as "warp/weft" when they differ,
 * and left out when both are "Default" or missing. Design is left out when there is none.
 */
export function fabricNameFromParts(
  productName: string,
  warpName?: string | null,
  weftName?: string | null,
  designName?: string | null,
  separator: string = " - ",
): string {
  const parts = [toTitleCase(productName)];
  if (isReal(warpName) || isReal(weftName)) {
    const warp = toTitleCase(warpName);
    const weft = toTitleCase(weftName);
    parts.push(warp === weft ? warp : `${warp || "-"} / ${weft || "-"}`);
  }
  if (isReal(designName)) parts.push(toTitleCase(designName));
  return parts.join(separator);
}

export function fabricVariantName(variant: FabricVariant, separator: string = " - "): string {
  return fabricNameFromParts(
    variant.fabric?.name ?? "Fabric",
    variant.warpColor?.name,
    variant.weftColor?.name,
    variant.design?.name,
    separator,
  );
}

/**
 * Readable names for yarn variants: "Type - Colour". The supplier is added in brackets only
 * where two variants would otherwise have the same name.
 */
export function yarnVariantLabels(variants: YarnVariantOption[]): Map<number, string> {
  const base = (v: YarnVariantOption) =>
    [toTitleCase(v.yarn?.name), toTitleCase(v.color?.name)].filter(Boolean).join(" - ") || v.sku;

  const counts = new Map<string, number>();
  for (const v of variants) counts.set(base(v), (counts.get(base(v)) ?? 0) + 1);

  return new Map(
    variants.map((v) => {
      const name = base(v);
      const label =
        (counts.get(name) ?? 0) > 1 && v.supplier?.name ? `${name} (${toTitleCase(v.supplier.name)})` : name;
      return [v.yarnVariantId, label];
    }),
  );
}
