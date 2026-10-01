import "server-only";

// P1 tender list: published tenders with search, filters and pages, computed on the server
// over the whole collection (AmanaDB has no text search or sort).
import type { Status } from "@/components/StatusLabel/StatusLabel";
import { formatDateTime, formatTzs } from "@/lib/format";
import type { StoredRecord, Tender } from "@/lib/types";
import { listTenders } from "@/services/amanadb";

export const PAGE_SIZE = 20;
const WEEK = 7 * 86_400_000;

export const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "closed", label: "Closed" },
  { id: "awarded", label: "Awarded" },
  { id: "cancelled", label: "Cancelled" },
] as const;

export type TenderListFilters = {
  q: string;
  status: (typeof STATUS_FILTERS)[number]["id"];
  category: string;
  entity: string;
  closingSoon: boolean;
};

export type TenderListRow = {
  key: string;
  title: string;
  entity: string;
  budget: string;
  closes: string;
  status: Status;
};

/** What the public sees: a published tender past its closing time reads as Closed. */
export function publicStatus(t: Tender, now: Date): Status {
  if (t.status === "AWARDED") return "awarded";
  if (t.status === "CANCELLED") return "cancelled";
  if (t.status === "CLOSED" || now.getTime() >= new Date(t.closeDate).getTime()) return "closed";
  return "published";
}

export function parseListFilters(params: Record<string, string | string[] | undefined>): TenderListFilters {
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
  const status = STATUS_FILTERS.find((s) => s.id === one(params.status))?.id ?? "all";
  return {
    q: one(params.q).trim(),
    status,
    category: one(params.category) || "all",
    entity: one(params.entity) || "all",
    closingSoon: one(params.soon) === "1",
  };
}

export async function tenderListPage(filters: TenderListFilters, page: number, now = new Date()) {
  const all = (await listTenders()).filter((t) => t.data.status !== "DRAFT");
  const categories = [...new Set(all.map((t) => t.data.category))].sort();
  const entities = [...new Set(all.map((t) => t.data.entity))].sort();
  const q = filters.q.toLowerCase();

  const matches = all.filter((t: StoredRecord<Tender>) => {
    const d = t.data;
    const status = publicStatus(d, now);
    if (q && ![d.title, d.reference, d.entity].some((v) => v.toLowerCase().includes(q))) return false;
    if (filters.status !== "all" && status !== filters.status) return false;
    if (filters.category !== "all" && d.category !== filters.category) return false;
    if (filters.entity !== "all" && d.entity !== filters.entity) return false;
    if (filters.closingSoon) {
      const left = new Date(d.closeDate).getTime() - now.getTime();
      if (status !== "published" || left < 0 || left > WEEK) return false;
    }
    return true;
  });

  // Open tenders first, soonest closing first; then the rest, most recently closed first.
  matches.sort((a, b) => {
    const aOpen = publicStatus(a.data, now) === "published";
    const bOpen = publicStatus(b.data, now) === "published";
    if (aOpen !== bOpen) return aOpen ? -1 : 1;
    const diff = new Date(a.data.closeDate).getTime() - new Date(b.data.closeDate).getTime();
    return aOpen ? diff : -diff;
  });

  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pageCount);
  const rows: TenderListRow[] = matches.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE).map((t) => ({
    key: t.key,
    title: t.data.title,
    entity: t.data.entity,
    budget: formatTzs(t.data.budgetCeiling),
    closes: formatDateTime(t.data.closeDate),
    status: publicStatus(t.data, now),
  }));
  return { rows, total: matches.length, published: all.length, page: current, pageCount, categories, entities };
}
