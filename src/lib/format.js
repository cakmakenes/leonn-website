/**
 * Reservation dates are persisted as UTC midnight, so they must be formatted
 * in UTC. Formatting in the server's local zone would shift the displayed day
 * by one for any negative offset.
 */
export function formatGermanDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Menu prices are persisted as integer cents. Display always goes through
 * here so the public menu and the admin panel can never disagree about
 * formatting.
 */
export function formatEuroFromCents(cents) {
  const value = Number(cents);
  if (!Number.isFinite(value)) return "";

  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

/**
 * Cents as a plain editable string ("12.50") for form inputs. Deliberately
 * uses a dot so the value round-trips through a `type="number"` field.
 */
export function centsToPriceInput(cents) {
  const value = Number(cents);
  if (!Number.isFinite(value)) return "";
  return (value / 100).toFixed(2);
}
