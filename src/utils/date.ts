export function formatTimestampToLocal(timestamp?: string | null): string {
  if (!timestamp) return "N/A";
  const value = Number(timestamp);
  if (!Number.isFinite(value)) return "N/A";
  const date = new Date(value * 1000);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
