// Builds the tender case file (P2) from AmanaDB records. Pure apart from hashing, so the page
// and the dev review route share it. A record matches when (GAPS.md "What matches means"):
//   1. its data re-hashes to the dataHash AmanaDB stored with it (SDK integrity "verified"), and
//   2. its last audited write has the same version and the same dataHash, and
//   3. a document it points to still re-hashes to the recorded docHash, and a bid reveal still
//      recomputes to its sealed commitment.
import type { Status } from "@/components/StatusLabel/StatusLabel";
import type { SpineNodeState } from "@/components/SpineNode/SpineNode";
import type { VerificationResult } from "@/components/VerificationMark/VerificationMark";
import { bidCommitment, sha256Hex } from "./commitment";
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
  /** The bid record's own check (integrity and audit). */
  result: VerificationResult;
  /** Whether the bidder has submitted reveal data (known before opening; the amount is not). */
  revealReceived: boolean;
  /** After opening: whether the bid's stored document still re-hashes to the revealed fingerprint. */
  documentResult?: VerificationResult;
  /** The bid's stored document was altered (A2): its row is marked and the node fails. */
  tampered: boolean;
  /** After opening: the revealed amount and whether it recomputes to the sealed fingerprint. */
  revealed?: { amount: number; result: VerificationResult };
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
  /** ISO closing time, for countdowns. */
  closeDate: string;
  status: Status;
  document?: { name: string; fingerprint: string; result: VerificationResult };
  tenderFingerprint: string;
  /** The tender record's own check (integrity and audit), without its document. */
  tenderRecordResult: VerificationResult;
  publishedAt: string;
  events: CaseEvent[];
  bids: BidRow[];
  closed: boolean;
  opened: boolean;
  openedAt?: string;
  check: { total: number; mismatched: number; documentMismatch: boolean; checkedAt: string };
  /** A2: the first bid whose stored document no longer matches, if any. */
  tamperedBid?: { bidderName: string; received: string };
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
  /** After opening: each revealed bid document's check, by its fingerprint. */
  bidDocumentChecks?: Map<string, DocumentCheck>;
  now: Date;
};

/**
 * A record matches when the SDK re-hashed its data to the dataHash AmanaDB stored with it, and
 * its latest audited write has the same version and dataHash.
 */
export function auditResult(record: StoredRecord<unknown>, audited: Map<string, AuditedVersion>): VerificationResult {
  const entry = audited.get(`${record.collection}/${record.key}`);
  const ok =
    record.integrity === "verified" &&
    entry !== undefined &&
    entry.version === record.version &&
    entry.dataHash === record.dataHash;
  return ok ? "matches" : "does-not-match";
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
  const { tender, bids, reveals, evaluations, awards, audited, documentCheck, bidDocumentChecks, now } = input;
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
      revealReceived: reveals.some((r) => r.data.bidId === bid.key),
      tampered: false,
    }));

  // Reveal records are checked like any record. Whether a reveal recomputes to its bid's sealed
  // commitment is a separate question about the bid, not the record: see revealMatches below.
  const revealResults = reveals.map((r) => auditResult(r, audited));
  const commitments = new Map(bids.map((b) => [b.key, b.data.commitment]));
  const revealMatches = new Map<string, VerificationResult>(
    await Promise.all(
      reveals.map(async (r): Promise<[string, VerificationResult]> => {
        const recomputed = await bidCommitment({ amount: r.data.amount, docHash: r.data.docHash, salt: r.data.salt });
        return [r.data.bidId, recomputed === commitments.get(r.data.bidId) ? "matches" : "does-not-match"];
      }),
    ),
  );
  const evaluationResults = evaluations.map((e) => auditResult(e, audited));
  const awardResults = awards.map((a) => auditResult(a, audited));

  if (t.openedAt) {
    const revealByBid = new Map(reveals.map((r) => [r.data.bidId, r.data]));
    for (const row of bidRows) {
      const reveal = revealByBid.get(row.key);
      const result = revealMatches.get(row.key);
      if (reveal && result) row.revealed = { amount: reveal.amount, result };
      // A2: the bid's stored document must still re-hash to the fingerprint it was revealed with.
      const check = reveal ? bidDocumentChecks?.get(reveal.docHash) : undefined;
      if (check) {
        row.documentResult = check === "matches" ? "matches" : "does-not-match";
        if (row.documentResult === "does-not-match") {
          row.tampered = true;
          row.result = "does-not-match";
        }
      }
    }
  }
  const tamperedBid = bidRows.find((row) => row.tampered);

  const allResults = [tenderResult, ...bidRows.map((b) => b.result), ...revealResults, ...evaluationResults, ...awardResults];
  const mismatched = allResults.filter((r) => r === "does-not-match").length;

  const tenderAudited = audited.get(`${tender.collection}/${tender.key}`);
  const publishedAt = tenderAudited?.firstWriteAt ?? tender.createdAt;

  // Fingerprint of a group of records: SHA-256 over their stored fingerprints in order.
  const groupFingerprint = async (records: StoredRecord<unknown>[]) =>
    records.length ? sha256Hex(records.map((r) => r.dataHash).join("")) : undefined;

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
      fingerprint: tender.dataHash,
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

  const openedAt = t.openedAt;
  events.push(
    openedAt
      ? {
          id: "opened",
          title: "Opened",
          state: worst(revealResults) === "matches" ? "completed" : "mismatch",
          time: formatDateTime(openedAt),
          dateTime: openedAt,
          actor: "Procuring entity",
          fingerprint: await groupFingerprint(reveals),
          result: reveals.length ? worst(revealResults) : undefined,
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
          fingerprint: award.dataHash,
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
    closeDate: t.closeDate,
    status: mismatched > 0 ? "tampered" : STATUS[t.status],
    document:
      t.docHash && t.docName && documentResult
        ? { name: t.docName, fingerprint: t.docHash, result: documentResult }
        : undefined,
    tenderFingerprint: events[0].fingerprint as string,
    tenderRecordResult: tenderAudit,
    publishedAt: formatDateTime(publishedAt),
    events,
    bids: bidRows,
    closed,
    opened: Boolean(openedAt),
    openedAt: openedAt ? formatDateTime(openedAt) : undefined,
    tamperedBid: tamperedBid ? { bidderName: tamperedBid.bidderName, received: tamperedBid.received } : undefined,
    check: {
      total: allResults.length,
      mismatched,
      documentMismatch: documentResult === "does-not-match" || Boolean(tamperedBid),
      checkedAt: formatDateTime(now.toISOString()),
    },
  };
}
