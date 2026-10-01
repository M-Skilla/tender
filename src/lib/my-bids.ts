import "server-only";

// B2 my bids: one bidder's sealed, opened and withdrawn bids, newest first.
import type { Status } from "@/components/StatusLabel/StatusLabel";
import { formatDateTime } from "@/lib/format";
import type { Bid, StoredRecord, Tender } from "@/lib/types";
import { getTender, listBidsForBidder, listRevealsForTender, listWithdrawnBidsForBidder } from "@/services/amanadb";

export type MyBidRow = {
  key: string;
  version: number;
  tenderKey: string;
  tenderTitle: string;
  submitted: string;
  fingerprint: string;
  status: Status;
  /** Sealed and the tender still open: the bidder may withdraw it. */
  canWithdraw: boolean;
  /** Sealed and the tender closed (not cancelled): the bidder should open it (B5). */
  awaitingOpen: boolean;
};

export async function myBids(bidderId: string, now = new Date()): Promise<MyBidRow[]> {
  const [live, withdrawn] = await Promise.all([listBidsForBidder(bidderId), listWithdrawnBidsForBidder(bidderId)]);
  const all: { bid: StoredRecord<Bid>; withdrawn: boolean }[] = [
    ...live.map((bid) => ({ bid, withdrawn: false })),
    ...withdrawn.map(({ bid }) => ({ bid, withdrawn: true })),
  ];

  const tenderIds = [...new Set(all.map(({ bid }) => bid.data.tenderId))];
  const tenders = new Map<string, StoredRecord<Tender> | null>();
  const revealed = new Map<string, boolean>();
  await Promise.all(
    tenderIds.map(async (id) => {
      const [tender, reveals] = await Promise.all([getTender(id), listRevealsForTender(id)]);
      tenders.set(id, tender);
      for (const r of reveals) revealed.set(r.data.bidId, r.data.verified);
    }),
  );

  return all
    .sort((a, b) => b.bid.data.submittedAt.localeCompare(a.bid.data.submittedAt))
    .map(({ bid, withdrawn: isWithdrawn }) => {
      const tender = tenders.get(bid.data.tenderId)?.data;
      const verified = revealed.get(bid.key);
      const status: Status = isWithdrawn
        ? "withdrawn"
        : verified === undefined
          ? "sealed"
          : verified
            ? "opened-matches"
            : "opened-does-not-match";
      const closed = !tender || now.getTime() >= new Date(tender.closeDate).getTime() || tender.status !== "PUBLISHED";
      return {
        key: bid.key,
        version: bid.version,
        tenderKey: bid.data.tenderId,
        tenderTitle: tender?.title ?? "Tender no longer available",
        submitted: formatDateTime(bid.data.submittedAt),
        fingerprint: bid.data.commitment,
        status,
        canWithdraw: status === "sealed" && !closed,
        awaitingOpen: status === "sealed" && closed && tender?.status !== "CANCELLED",
      };
    });
}
