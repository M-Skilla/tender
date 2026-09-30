import "server-only";

// A1 audit log: entries from AmanaDB's collection audit logs, newest first, with each row's
// actor, plain-language action and changed fields rebuilt from the record's own history. The
// ledger's actor is always the app's credential (GAPS.md: one project credential), so the person
// comes from the record data at that version. The users collection is never listed.
import { formatDateTime, formatTzs, shortFingerprint } from "@/lib/format";
import type { Award, Bid, BidReveal, Evaluation, StoredRecord, Tender } from "@/lib/types";
import { collectionAudit, COLLECTIONS, getBid, getTender, getUser, recordVersions, type AuditRow } from "@/services/amanadb";

export const AUDIT_SECTIONS = [
  {
    id: "all",
    label: "All records",
    collections: [COLLECTIONS.tenders, COLLECTIONS.bids, COLLECTIONS.bidReveals, COLLECTIONS.evaluations, COLLECTIONS.awards],
  },
  { id: "tenders", label: "Tenders", collections: [COLLECTIONS.tenders] },
  { id: "bids", label: "Bids", collections: [COLLECTIONS.bids, COLLECTIONS.bidReveals] },
  { id: "evaluations", label: "Evaluations", collections: [COLLECTIONS.evaluations] },
  { id: "awards", label: "Awards", collections: [COLLECTIONS.awards] },
] as const;

export type AuditSection = (typeof AUDIT_SECTIONS)[number]["id"];

export const RANGES = [
  { id: "all", label: "All time" },
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
] as const;
export const ROLES = [
  { id: "all", label: "All" },
  { id: "entity", label: "Procuring entity" },
  { id: "committee", label: "Committee" },
  { id: "bidder", label: "Bidders" },
  { id: "system", label: "System" },
] as const;
export const ACTIONS = [
  { id: "all", label: "All" },
  { id: "created", label: "Created" },
  { id: "changed", label: "Changed" },
  { id: "deleted", label: "Deleted" },
] as const;

export type AuditFilters = {
  section: AuditSection;
  range: (typeof RANGES)[number]["id"];
  role: (typeof ROLES)[number]["id"];
  action: (typeof ACTIONS)[number]["id"];
};

export type AuditChange = { label: string; previous?: string; value: string };

export type AuditLogRow = {
  id: string;
  iso: string;
  time: string;
  actor: string;
  action: string;
  record: { label: string; href?: string };
  version: number;
  fingerprint: string;
  txId: string;
  collection: string;
  /** Fields that changed at this version (all fields for a create); empty for a soft delete. */
  changes: AuditChange[];
};

const pick = <T extends readonly { id: string }[]>(list: T, value: unknown): T[number]["id"] =>
  (list.find((x) => x.id === value) ?? list[0]!).id;

export function parseFilters(params: Record<string, string | string[] | undefined>): AuditFilters {
  return {
    section: pick(AUDIT_SECTIONS, params.collection) as AuditSection,
    range: pick(RANGES, params.range) as AuditFilters["range"],
    role: pick(ROLES, params.actor) as AuditFilters["role"],
    action: pick(ACTIONS, params.action) as AuditFilters["action"],
  };
}

/** Who acts on a collection, known without reading data (evaluations start as a System record). */
function roleOf(row: AuditRow): AuditFilters["role"] {
  if (row.collection === COLLECTIONS.evaluations) return row.version === 1 && row.action === "CREATE" ? "system" : "committee";
  if (row.collection === COLLECTIONS.bids || row.collection === COLLECTIONS.bidReveals) return "bidder";
  return "entity";
}

function actionKind(action: string): AuditFilters["action"] {
  if (action === "CREATE") return "created";
  if (action === "DELETE") return "deleted";
  return "changed";
}

function inRange(iso: string, range: AuditFilters["range"], now: Date): boolean {
  if (range === "all") return true;
  const t = new Date(iso).getTime();
  if (range === "today") return formatDateTime(iso).slice(0, 11) === formatDateTime(now.toISOString()).slice(0, 11);
  const days = range === "7d" ? 7 : 30;
  return now.getTime() - t <= days * 86_400_000;
}

// Field labels and display per collection. Internal ids and the reveal's salt are left out.
type Fields = Record<string, string>;
const dt = (v: unknown) => (typeof v === "string" && v ? formatDateTime(v) : "Not set");
const fp = (v: unknown) => (typeof v === "string" && v ? shortFingerprint(v) : "None");

function fieldsOf(collection: string, data: unknown): Fields {
  if (!data || typeof data !== "object") return {};
  if (collection === COLLECTIONS.tenders) {
    const t = data as Tender;
    return {
      Reference: t.reference,
      Title: t.title,
      Description: t.description,
      "Procuring entity": t.entity,
      Category: t.category,
      "Budget ceiling": formatTzs(t.budgetCeiling),
      Opens: dt(t.openDate),
      Closes: dt(t.closeDate),
      Status: t.status.charAt(0) + t.status.slice(1).toLowerCase(),
      Document: t.docName ?? "None",
      "Document fingerprint": fp(t.docHash),
      "Bids opened": t.openedAt ? dt(t.openedAt) : "Not opened",
    };
  }
  if (collection === COLLECTIONS.bids) {
    const b = data as Bid;
    return { Bidder: b.bidderName, "Sealed fingerprint": fp(b.commitment), Submitted: dt(b.submittedAt) };
  }
  if (collection === COLLECTIONS.bidReveals) {
    const r = data as BidReveal;
    return {
      "Revealed amount": formatTzs(r.amount),
      "Bid document fingerprint": fp(r.docHash),
      Revealed: dt(r.revealedAt),
      "Matches sealed bid": r.verified ? "Yes" : "No",
    };
  }
  if (collection === COLLECTIONS.evaluations) {
    const e = data as Evaluation;
    const out: Fields = {};
    for (const c of e.criteria) out[c.name] = c.score === null ? "Not scored" : String(c.score);
    out.Comment = e.comment || "No comment";
    out["Weighted total"] = `${e.total.toFixed(1)} / 20.0`;
    return out;
  }
  const a = data as Award;
  return { Justification: a.justification, Decided: dt(a.decidedAt) };
}

function diff(collection: string, current: unknown, previous: unknown | undefined, action: string): AuditChange[] {
  const now = fieldsOf(collection, current);
  if (action === "DELETE") return [];
  if (previous === undefined) return Object.entries(now).map(([label, value]) => ({ label, value }));
  const before = fieldsOf(collection, previous);
  return Object.entries(now)
    .filter(([label, value]) => before[label] !== value)
    .map(([label, value]) => ({ label, previous: before[label], value }));
}

/** Reads each record, bid, tender and user once per request. */
function cached<T>(load: (key: string) => Promise<T>) {
  const cache = new Map<string, Promise<T>>();
  return (key: string) => {
    if (!cache.has(key)) cache.set(key, load(key));
    return cache.get(key)!;
  };
}

async function detail(rows: AuditRow[]): Promise<AuditLogRow[]> {
  const versionsOf = cached((id: string) => {
    const [collection, key] = id.split("/") as [string, string];
    return recordVersions<unknown>(collection, key);
  });
  const tenderOf = cached((key: string) => getTender(key));
  const bidOf = cached((key: string) => getBid(key));
  const userName = cached(async (key: string) => (key ? (await getUser(key))?.data.name ?? "Unknown user" : "Unknown user"));

  return Promise.all(
    rows.map(async (row): Promise<AuditLogRow> => {
      const versions = await versionsOf(`${row.collection}/${row.key}`);
      const current = versions.get(row.version) as StoredRecord<Record<string, unknown>> | undefined;
      const previous = versions.get(row.version - 1) as StoredRecord<Record<string, unknown>> | undefined;
      const data = current?.data;

      let actor = "System";
      let action = "Changed record";
      let record: AuditLogRow["record"] = { label: row.key };

      if (row.collection === COLLECTIONS.tenders && data) {
        const t = data as unknown as Tender;
        const opened = Boolean(t.openedAt) && !(previous?.data as unknown as Tender | undefined)?.openedAt;
        actor = `${await userName(opened ? (t.openedBy ?? "") : t.publishedBy)} (Procuring entity)`;
        action =
          row.action === "CREATE"
            ? "Published"
            : opened
              ? "Opened bids"
              : t.status === "CANCELLED"
                ? "Cancelled tender"
                : row.action === "DELETE"
                  ? "Deleted tender"
                  : "Amended tender";
        record = { label: t.reference, href: `/tenders/${row.key}` };
      } else if (row.collection === COLLECTIONS.bids && data) {
        const b = data as unknown as Bid;
        actor = `${b.bidderName} (Bidder)`;
        action = row.action === "CREATE" ? "Submitted bid" : row.action === "DELETE" ? "Withdrew bid" : "Amended bid";
        const tender = await tenderOf(b.tenderId);
        record = { label: tender?.data.reference ?? b.tenderId, href: `/tenders/${b.tenderId}` };
      } else if (row.collection === COLLECTIONS.bidReveals && data) {
        const r = data as unknown as BidReveal;
        const bid = await bidOf(r.bidId);
        actor = `${bid?.data.bidderName ?? "Bidder"} (Bidder)`;
        action = "Revealed bid";
        const tender = await tenderOf(r.tenderId);
        record = { label: tender?.data.reference ?? r.tenderId, href: `/tenders/${r.tenderId}` };
      } else if (row.collection === COLLECTIONS.evaluations && data) {
        const e = data as unknown as Evaluation;
        const started = row.action === "CREATE" && !e.evaluatorName;
        actor = started ? "System" : `${e.evaluatorName} (Committee)`;
        action = started ? "Started evaluation" : "Saved evaluation";
        const tender = await tenderOf(e.tenderId);
        record = { label: tender?.data.reference ?? e.tenderId, href: `/tenders/${e.tenderId}` };
      } else if (row.collection === COLLECTIONS.awards && data) {
        const a = data as unknown as Award;
        actor = `${await userName(a.decidedBy)} (Procuring entity)`;
        action = row.action === "CREATE" ? "Recorded award" : "Amended award";
        const tender = await tenderOf(a.tenderId);
        record = { label: tender?.data.reference ?? a.tenderId, href: `/tenders/${a.tenderId}` };
      }
      if (row.action.includes("ACCESS") || row.action.includes("ROLE")) action = "Changed access";

      return {
        id: `${row.collection}/${row.key}/${row.txId}`,
        iso: row.timestamp,
        time: formatDateTime(row.timestamp),
        actor,
        action,
        record,
        version: row.version,
        fingerprint: row.dataHash,
        txId: row.txId,
        collection: row.collection,
        changes: data ? diff(row.collection, data, previous?.data, row.action) : [],
      };
    }),
  );
}

/** Filtered entries, newest first, without detail (cheap: no history reads). */
async function filteredRows(filters: AuditFilters, now: Date): Promise<AuditRow[]> {
  const section = AUDIT_SECTIONS.find((s) => s.id === filters.section)!;
  const all = (await Promise.all(section.collections.map((c) => collectionAudit(c)))).flat();
  return all
    .filter((r) => inRange(r.timestamp, filters.range, now))
    .filter((r) => filters.role === "all" || roleOf(r) === filters.role)
    .filter((r) => filters.action === "all" || actionKind(r.action) === filters.action)
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : a.timestamp > b.timestamp ? -1 : b.version - a.version));
}

export const PAGE_SIZE = 20;

export async function auditLogPage(filters: AuditFilters, page: number, now = new Date()) {
  const rows = await filteredRows(filters, now);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pageCount);
  const slice = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  return { rows: await detail(slice), total: rows.length, page: current, pageCount };
}

/** Every filtered entry with detail, for the CSV export. */
export async function auditLogAll(filters: AuditFilters, now = new Date()): Promise<AuditLogRow[]> {
  return detail(await filteredRows(filters, now));
}
