/** "40 €" from a stored price in euro cents. */
export function formatPrice(priceEurCents: number): string {
  return `${(priceEurCents / 100).toLocaleString("fr-FR")} €`;
}

/** "1 h 25 min" / "45 min" from seconds; null-ish → "". */
export function formatDuration(totalSec?: number | null): string {
  if (!totalSec || totalSec <= 0) return "";
  const h = Math.floor(totalSec / 3600);
  const m = Math.round((totalSec % 3600) / 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m.toString().padStart(2, "0")} min`;
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
