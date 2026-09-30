// Display formats from the brief (section 8): "28 Oct 2026, 14:00", 24-hour times,
// amounts as "TZS 2,450,000,000". Times are shown in Tanzania's time zone.

const TIME_ZONE = "Africa/Dar_es_Salaam";

// Three-letter months, fixed: ICU's en-GB data now abbreviates September as "Sept".
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const parts = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: TIME_ZONE,
});

function local(iso: string) {
  const out: Record<string, string> = {};
  for (const part of parts.formatToParts(new Date(iso))) out[part.type] = part.value;
  return { day: out.day, month: MONTHS[Number(out.month) - 1], year: out.year, hour: out.hour, minute: out.minute };
}

/** "28 Oct 2026, 14:00" */
export function formatDateTime(iso: string): string {
  const d = local(iso);
  return `${d.day} ${d.month} ${d.year}, ${d.hour}:${d.minute}`;
}

/** "14:15" */
export function formatTime(iso: string): string {
  const d = local(iso);
  return `${d.hour}:${d.minute}`;
}

/** "28 Oct 2026" */
export function formatDate(iso: string): string {
  const d = local(iso);
  return `${d.day} ${d.month} ${d.year}`;
}

/** "TZS 2,450,000,000" */
export function formatTzs(amount: number): string {
  return `TZS ${Math.round(amount).toLocaleString("en-US")}`;
}

/** First 4 and last 3 characters of a fingerprint ("7be1…90d"), for plain-text places. */
export function shortFingerprint(value: string): string {
  return value.length > 8 ? `${value.slice(0, 4)}…${value.slice(-3)}` : value;
}
