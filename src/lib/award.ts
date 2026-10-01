import "server-only";

// H4 award decision: the committee's scores per bid, ranked, and whether the tender can be awarded.
import { scoringProgress } from "@/lib/evaluation-queue";
import { CRITERIA } from "@/lib/evaluation";
import type { StoredRecord, Tender } from "@/lib/types";
import { listBidsForTender, listEvaluationsForTender, listRevealsForTender } from "@/services/amanadb";

const PRICE = "Price competitiveness";

export type Standing = {
  bidKey: string;
  bidderName: string;
  amount: number;
  /** Points out of 100: each criterion's score (of 20) times its weight, over 20. */
  technical: number;
  price: number;
  total: number;
  rank: number;
};

export type AwardReadiness =
  | { ready: true; standings: Standing[] }
  | { ready: false; reason: "not-opened" | "closed-out" | "scoring"; scored?: number; toScore?: number };

const points = (score: number | null, weight: number) => ((score ?? 0) * weight) / 20;

/**
 * `hasAward`: an award record exists. A tender marked AWARDED without one (the second of the two
 * writes failed) can be awarded again, so the record is completed rather than left missing.
 */
export async function awardReadiness(tender: StoredRecord<Tender>, hasAward: boolean): Promise<AwardReadiness> {
  const t = tender.data;
  if (!t.openedAt) return { ready: false, reason: "not-opened" };
  if (t.status === "CANCELLED" || hasAward) return { ready: false, reason: "closed-out" };
  const progress = await scoringProgress(tender.key);
  if (progress.toScore === 0 || progress.scored < progress.toScore) {
    return { ready: false, reason: "scoring", scored: progress.scored, toScore: progress.toScore };
  }

  const [bids, reveals, evaluations] = await Promise.all([
    listBidsForTender(tender.key),
    listRevealsForTender(tender.key),
    listEvaluationsForTender(tender.key),
  ]);
  const standings: Standing[] = [];
  for (const reveal of reveals) {
    if (!reveal.data.verified) continue;
    const bid = bids.find((b) => b.key === reveal.data.bidId);
    const evaluation = evaluations.find((e) => e.data.bidId === reveal.data.bidId);
    if (!bid || !evaluation) continue;
    let technical = 0;
    let price = 0;
    for (const c of evaluation.data.criteria) {
      const weight = CRITERIA.find((k) => k.name === c.name)?.weight ?? c.weight;
      if (c.name === PRICE) price += points(c.score, weight);
      else technical += points(c.score, weight);
    }
    standings.push({ bidKey: bid.key, bidderName: bid.data.bidderName, amount: reveal.data.amount, technical, price, total: technical + price, rank: 0 });
  }
  // Highest total first; a tie goes to the lower price.
  standings.sort((a, b) => b.total - a.total || a.amount - b.amount);
  standings.forEach((s, i) => (s.rank = i + 1));
  return { ready: true, standings };
}
