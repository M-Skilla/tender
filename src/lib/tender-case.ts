// Builds the tender case file (P2) from AmanaDB records. Pure apart from hashing, so the page
// and the dev review route share it. Verification rules (GAPS.md "What matches means"):
//   1. A record matches when its current version equals the version of its last audited
//      write in the collection audit log.
//   2. A record that carries a document hash also needs the stored file to re-hash to it.
import type { Status } from "@/components/StatusLabel/StatusLabel";
import type { SpineNodeState } from "@/components/SpineNode/SpineNode";
import type { VerificationResult } from "@/components/VerificationMark/VerificationMark";
import { canonicalJson, sha256Hex } from "./commitment";
import { formatDate, formatDateTime } from "./format";
import type { AuditedVersion, Award, Bid, BidReveal, DocumentCheck, Evaluation, StoredRecord, Tender } from "./types";

export type EventId = "published" | "bids" | "opened" | "scored" | "awarded";

export type CaseEvent = {
  id: EventId;
  title: string;
  state: SpineNodeState;
  version?: number;
  latest?: boolean;
  time?: string;
  dateTime?: string;
  actor?: string;
  fingerprint?: string;
  result?: VerificationResult;
  note?: string;
  /** Has a record to show in the detail panel. */
  selectable: boolean;
};

export type BidRow = {
  key: string;
  bidderName: string;
  received: string;
  fingerprint: string;
  result: VerificationResult;
};

export type TenderCase = {
  key: string;
  reference: string;
  title: string;
  description: string;
  entity: string;
  category: string;
  budgetCeiling: number;
  opens: string;
  closes: string;
  status: Status;
  document?: { name: string; fingerprint: string; result: VerificationResult };
  tenderFingerprint: string;
  tenderResult: VerificationResult;
  publishedAt: string;
  events: CaseEvent[];
  bids: BidRow[];
  closed: boolean;
  opened: boolean;
  check: { total: number; mismatched: number; documentMismatch: boolean; checkedAt: string };
};

export type TenderCaseInput = {
  tender: StoredRecord<Tender>;
  bids: StoredRecord<Bid>[];
  reveals: StoredRecord<BidReveal>[];
  evaluations: StoredRecord<Evaluation>[];
  awards: StoredRecord<Award>[];
  /** Last audited version per "collection/key". */
  audited: Map<string, AuditedVersion>;
  documentCheck: DocumentCheck | null;
  now: Date;
};

/** SHA-256 of the record's identity, version and data: what the spine shows as its fingerprint. */
export function recordFingerprint(record: StoredRecord<unknown>): Promise<string> {
  return sha256Hex(
    canonicalJson({ collection: record.collection, key: record.key, version: record.version, data: record.data }),
  );
}

function auditResult(record: StoredRecord<unknown>, audited: Map<string, AuditedVersion>): VerificationResult {
  const entry = audited.get(`${record.collection}/${record.key}`);
  return entry && entry.version === record.version ? "matches" : "does-not-match";
}

const STATUS: Record<Tender["status"], Status> = {
  DRAFT: "draft",
  PUBLISHED: "published",
  CLOSED: "closed",
  AWARDED: "awarded",
  CANCELLED: "cancelled",
};

function worst(results: VerificationResult[]): VerificationResult {
  return results.includes("does-not-match") ? "does-not-match" : "matches";
}

function latestIso(values: string[]): string | undefined {
  return values.length ? values.reduce((a, b) => (a > b ? a : b)) : undefined;
}

export async function buildTenderCase(input: TenderCaseInput): Promise<TenderCase> {
  const { tender, bids, reveals, evaluations, awards, audited, documentCheck, now } = input;
  const t = tender.data;
  const closed = now.getTime() >= new Date(t.closeDate).getTime();

  // Tender record: audit check, plus its document when it has one.
  const tenderAudit = auditResult(tender, audited);
  const documentResult: VerificationResult | undefined =
    t.docHash && documentCheck ? (documentCheck === "matches" ? "matches" : "does-not-match") : undefined;
  const tenderResult = worst([tenderAudit, ...(documentResult ? [documentResult] : [])]);

  // Bids: the fingerprint shown is the sealed commitment itself.
  const bidRows: BidRow[] = [...bids]
    .sort((a, b) => a.data.submittedAt.localeCompare(b.data.submittedAt))
    .map((bid) => ({
      key: bid.key,
      bidderName: bid.data.bidderName,
      received: formatDateTime(bid.data.submittedAt),
      fingerprint: bid.data.commitment,
      result: auditResult(bid, audited),
    }));

  const revealResults = reveals.map((r) => worst([auditResult(r, audited), r.data.verified ? "matches" : "does-not-match"]));
  const evaluationResults = evaluations.map((e) => auditResult(e, audited));
  const awardResults = awards.map((a) => auditResult(a, audited));

  const allResults = [tenderResult, ...bidRows.map((b) => b.result), ...revealResults, ...evaluationResults, ...awardResults];
  const mismatched = allResults.filter((r) => r === "does-not-match").length;

  const tenderAudited = audited.get(`${tender.collection}/${tender.key}`);
  const publishedAt = tenderAudited?.firstWriteAt ?? tender.createdAt;

  // Fingerprint of a group of records: SHA-256 over their fingerprints in submission order.
  const groupFingerprint = async (records: StoredRecord<unknown>[]) =>
    records.length ? sha256Hex((await Promise.all(records.map(recordFingerprint))).join("")) : undefined;

  const sortedBids = [...bids].sort((a, b) => a.data.submittedAt.localeCompare(b.data.submittedAt));
  const events: CaseEvent[] = [
    {
      id: "published",
      title: "Published",
      state: tenderResult === "matches" ? "completed" : "mismatch",
      version: tender.version,
      time: formatDateTime(publishedAt),
      dateTime: publishedAt,
      actor: "Procuring entity",
      fingerprint: await recordFingerprint(tender),
      result: tenderResult,
      selectable: true,
    },
  ];

  const lastBidAt = latestIso(bids.map((b) => b.data.submittedAt));
  events.push(
    bids.length
      ? {
          id: "bids",
          title: "Bids received",
          state: worst(bidRows.map((b) => b.result)) === "matches" ? "completed" : "mismatch",
          time: lastBidAt ? formatDateTime(lastBidAt) : undefined,
          dateTime: lastBidAt,
          actor: `${bids.length} ${bids.length === 1 ? "bidder" : "bidders"}`,
          fingerprint: await groupFingerprint(sortedBids),
          result: worst(bidRows.map((b) => b.result)),
          selectable: true,
        }
      : { id: "bids", title: "Bids received", state: "upcoming", note: closed ? "No bids" : "No bids yet", selectable: true },
  );

  const firstRevealAt = reveals.length ? reveals.map((r) => r.data.revealedAt).sort()[0] : undefined;
  events.push(
    reveals.length
      ? {
          id: "opened",
          title: "Opened",
          state: worst(revealResults) === "matches" ? "completed" : "mismatch",
          time: firstRevealAt ? formatDateTime(firstRevealAt) : undefined,
          dateTime: firstRevealAt,
          actor: "Procuring entity",
          fingerprint: await groupFingerprint(reveals),
          result: worst(revealResults),
          selectable: false,
        }
      : closed
        ? { id: "opened", title: "Opened", state: "upcoming", note: "Ready to open", selectable: false }
        : { id: "opened", title: "Opened", state: "sealed", note: formatDate(t.closeDate), selectable: false },
  );

  const lastScoredAt = latestIso(evaluations.map((e) => e.updatedAt));
  events.push(
    evaluations.length
      ? {
          id: "scored",
          title: "Scored",
          state: worst(evaluationResults) === "matches" ? "completed" : "mismatch",
          version: Math.max(...evaluations.map((e) => e.version)),
          time: lastScoredAt ? formatDateTime(lastScoredAt) : undefined,
          dateTime: lastScoredAt,
          actor: "Committee",
          fingerprint: await groupFingerprint(evaluations),
          result: worst(evaluationResults),
          selectable: false,
        }
      : { id: "scored", title: "Scored", state: "upcoming", selectable: false },
  );

  const award = awards[0];
  events.push(
    award
      ? {
          id: "awarded",
          title: "Awarded",
          state: awardResults[0] === "matches" ? "completed" : "mismatch",
          version: award.version,
          time: formatDateTime(award.data.decidedAt),
          dateTime: award.data.decidedAt,
          actor: "Procuring entity",
          fingerprint: await recordFingerprint(award),
          result: awardResults[0],
          selectable: false,
        }
      : { id: "awarded", title: "Awarded", state: "upcoming", selectable: false },
  );

  // The latest event that has happened is the current one (pen blue ring), unless it failed
  // its check, in which case it keeps the mismatch marker and no earlier event is marked.
  const lastHappened = [...events].reverse().find((e) => e.state === "completed" || e.state === "mismatch");
  if (lastHappened?.state === "completed") {
    lastHappened.state = "current";
    lastHappened.latest = lastHappened.version !== undefined;
  }

  return {
    key: tender.key,
    reference: t.reference,
    title: t.title,
    description: t.description,
    entity: t.entity,
    category: t.category,
    budgetCeiling: t.budgetCeiling,
    opens: formatDateTime(t.openDate),
    closes: formatDateTime(t.closeDate),
    status: mismatched > 0 ? "tampered" : STATUS[t.status],
    document:
      t.docHash && t.docName && documentResult
        ? { name: t.docName, fingerprint: t.docHash, result: documentResult }
        : undefined,
    tenderFingerprint: events[0].fingerprint as string,
    tenderResult,
    publishedAt: formatDateTime(publishedAt),
    events,
    bids: bidRows,
    closed,
    opened: reveals.length > 0,
    check: {
      total: allResults.length,
      mismatched,
      documentMismatch: documentResult === "does-not-match",
      checkedAt: formatDateTime(now.toISOString()),
    },
  };
}
