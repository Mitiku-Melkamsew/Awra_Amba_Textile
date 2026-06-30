export function findZigZagDesignId(
  designs: Array<{ designId: number; name: string }>,
): number | null {
  return designs.find((d) => d.name.toLowerCase() === "zigzag")?.designId ?? null;
}