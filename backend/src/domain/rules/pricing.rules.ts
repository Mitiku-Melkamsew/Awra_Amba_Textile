export interface PriceWindow {
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  isActive: boolean;
}

/**
 * Checks if a price is valid for a given target timestamp (defaulting to current time)
 */
export function isPriceEffective<T extends PriceWindow>(
  price: T,
  targetDate: Date = new Date(),
): boolean {
  if (!price.isActive) return false;
  if (price.effectiveFrom > targetDate) return false;
  if (price.effectiveTo && price.effectiveTo < targetDate) return false;
  return true;
}

/**
 * Resolves the currently effective price from a list of price records
 */
export function resolveEffectivePrice<T extends PriceWindow>(
  prices: T[],
  targetDate: Date = new Date(),
): T | undefined {
  return prices
    .filter((p) => isPriceEffective(p, targetDate))
    .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())[0];
}
