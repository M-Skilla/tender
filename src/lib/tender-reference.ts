import "server-only";

import { listTenders } from "@/services/amanadb";

/** The next free reference for a year: TND-2026-0143 after the highest TND-2026-NNNN. */
export async function nextTenderReference(year: number): Promise<string> {
  const prefix = `TND-${year}-`;
  const numbers = (await listTenders())
    .map((t) => t.data.reference)
    .filter((r) => r.startsWith(prefix))
    .map((r) => Number(r.slice(prefix.length)))
    .filter((n) => Number.isInteger(n));
  const next = (numbers.length ? Math.max(...numbers) : 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}
