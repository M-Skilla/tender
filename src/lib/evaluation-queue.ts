import "server-only";

// C1 evaluation queue: opened tenders still in evaluation, with how many bids are fully scored.
// H1 uses the same progress to split "Waiting for scores" from "Ready to award".
import type { StoredRecord, Tender } from "@/lib/types";
import { listBidsForTender, listEvaluationsForTender, listRevealsForTender, listTenders } from "@/services/amanadb";

export type ScoringProgress = {
  /** Bids whose reveal recomputes to the sealed fingerprint: the only ones that can be scored. */
  toScore: number;
  scored: number;
  /** The first bid not fully scored, in order of submission (C2 link). */
  nextBidKey?: string;
};

export type QueueRow = ScoringProgress & { tenderKey: string; title: string };

/** A tender in evaluation: opened, and neither awarded nor cancelled. */
export function inEvaluation(t: Tender): boolean {
  return Boolean(t.openedAt) && t.status !== "AWARDED" && t.status !== "CANCELLED";
}

export async function scoringProgress(tenderKey: string): Promise<ScoringProgress> {
  const [bids, reveals, evaluations] = await Promise.all([
    listBidsForTender(tenderKey),
    listRevealsForTender(tenderKey),
    listEvaluationsForTender(tenderKey),
  ]);
  const valid = new Set(reveals.filter((r) => r.data.verified).map((r) => r.data.bidId));
  const complete = new Set(
    evaluations.filter((e) => e.data.criteria.every((c) => c.score !== null)).map((e) => e.data.bidId),
  );
  const scorable = bids
    .filter((b) => valid.has(b.key))
    .sort((a, b) => a.data.submittedAt.localeCompare(b.data.submittedAt));
  return {
    toScore: scorable.length,
    scored: scorable.filter((b) => complete.has(b.key)).length,
    nextBidKey: scorable.find((b) => !complete.has(b.key))?.key,
  };
}

export async function evaluationQueue(): Promise<QueueRow[]> {
  const tenders: StoredRecord<Tender>[] = (await listTenders()).filter((t) => inEvaluation(t.data));
  const rows = await Promise.all(
    tenders.map(async (t) => ({ tenderKey: t.key, title: t.data.title, ...(await scoringProgress(t.key)) })),
  );
  // Most work left first; finished reviews last.
  return rows.sort((a, b) => b.toScore - b.scored - (a.toScore - a.scored) || a.title.localeCompare(b.title));
}
