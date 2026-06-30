export function formatDateDDMMYY(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}