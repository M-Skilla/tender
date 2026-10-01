import "server-only";

// C1 evaluation queue: opened tenders still in evaluation, with how many bids are fully scored.
import { listBidsForTender, listEvaluationsForTender, listRevealsForTender, listTenders } from "@/services/amanadb";

export type QueueRow = {
  tenderKey: string;
  title: string;
  /** Bids whose reveal recomputes to the sealed fingerprint: the only ones that can be scored. */
  toScore: number;
  scored: number;
  /** The first bid not fully scored, in order of submission (C2 link). */
  nextBidKey?: string;
};

export async function evaluationQueue(): Promise<QueueRow[]> {
  const tenders = (await listTenders()).filter(
    (t) => t.data.openedAt && t.data.status !== "AWARDED" && t.data.status !== "CANCELLED",
  );
  const rows = await Promise.all(
    tenders.map(async (t): Promise<QueueRow> => {
      const [bids, reveals, evaluations] = await Promise.all([
        listBidsForTender(t.key),
        listRevealsForTender(t.key),
        listEvaluationsForTender(t.key),
      ]);
      const valid = new Set(reveals.filter((r) => r.data.verified).map((r) => r.data.bidId));
      const complete = new Set(
        evaluations.filter((e) => e.data.criteria.every((c) => c.score !== null)).map((e) => e.data.bidId),
      );
      const scorable = bids
        .filter((b) => valid.has(b.key))
        .sort((a, b) => a.data.submittedAt.localeCompare(b.data.submittedAt));
      return {
        tenderKey: t.key,
        title: t.data.title,
        toScore: scorable.length,
        scored: scorable.filter((b) => complete.has(b.key)).length,
        nextBidKey: scorable.find((b) => !complete.has(b.key))?.key,
      };
    }),
  );
  // Most work left first; finished reviews last.
  return rows.sort((a, b) => b.toScore - b.scored - (a.toScore - a.scored) || a.title.localeCompare(b.title));
}
