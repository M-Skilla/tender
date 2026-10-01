import "server-only";

// H1 worklist: the admin's procuring entity's tenders that need something next.
import { inEvaluation, scoringProgress } from "@/lib/evaluation-queue";
import { formatDateTime } from "@/lib/format";
import type { StoredRecord, Tender } from "@/lib/types";
import { getUser, listBidsForTender, listTenders } from "@/services/amanadb";

const WEEK = 7 * 86_400_000;

export type WorkItem = { key: string; title: string; meta: string[] };

export type Worklist = {
  entity?: string;
  readyToOpen: WorkItem[];
  waitingForScores: WorkItem[];
  readyToAward: WorkItem[];
  closingThisWeek: WorkItem[];
};

const ref = (t: Tender) => `Reference: ${t.reference}`;
const bids = (n: number) => `${n} ${n === 1 ? "bid" : "bids"}`;

export async function worklist(userId: string, now = new Date()): Promise<Worklist> {
  const [user, all] = await Promise.all([getUser(userId), listTenders()]);
  const entity = user?.data.entity ?? all.find((t) => t.data.publishedBy === userId)?.data.entity;
  const mine = all.filter((t) => t.data.publishedBy === userId || (entity !== undefined && t.data.entity === entity));
  const time = (iso: string) => new Date(iso).getTime();

  const published = mine.filter((t) => t.data.status === "PUBLISHED" && !t.data.openedAt);
  const toOpen = published
    .filter((t) => time(t.data.closeDate) <= now.getTime())
    .sort((a, b) => time(a.data.closeDate) - time(b.data.closeDate));
  const closing = published
    .filter((t) => time(t.data.closeDate) > now.getTime() && time(t.data.closeDate) - now.getTime() <= WEEK)
    .sort((a, b) => time(a.data.closeDate) - time(b.data.closeDate));
  const evaluating = mine.filter((t) => inEvaluation(t.data));

  const [closingCounts, progress] = await Promise.all([
    Promise.all(closing.map(async (t) => (await listBidsForTender(t.key)).length)),
    Promise.all(evaluating.map((t) => scoringProgress(t.key))),
  ]);

  const waiting: WorkItem[] = [];
  const award: WorkItem[] = [];
  evaluating.forEach((t: StoredRecord<Tender>, i) => {
    const p = progress[i];
    if (p.toScore > 0 && p.scored === p.toScore) {
      award.push({ key: t.key, title: t.data.title, meta: [ref(t.data), `All ${bids(p.toScore)} scored`] });
    } else {
      const detail = p.toScore === 0 ? "No bids can be scored" : `${p.scored} of ${p.toScore} scored by the committee`;
      waiting.push({ key: t.key, title: t.data.title, meta: [ref(t.data), detail] });
    }
  });

  return {
    entity,
    readyToOpen: toOpen.map((t) => ({
      key: t.key,
      title: t.data.title,
      meta: [ref(t.data), `Closed ${formatDateTime(t.data.closeDate)}`],
    })),
    waitingForScores: waiting,
    readyToAward: award,
    closingThisWeek: closing.map((t, i) => ({
      key: t.key,
      title: t.data.title,
      meta: [ref(t.data), `Closes ${formatDateTime(t.data.closeDate)}`, `${bids(closingCounts[i])} received`],
    })),
  };
}
