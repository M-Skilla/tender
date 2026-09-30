import "server-only";

// Revealing and opening sealed bids (spec flows 3 and 4, task 4 decision "bidders reveal, the
// procuring entity opens"):
//   1. After the closing time, each bidder submits the reveal data from their receipt. The
//      server recomputes the commitment and stores the reveal with `verified` (B5 submits it).
//   2. The procuring entity opens the bids (H3). Amounts are shown only after this, even though
//      reveals are stored earlier: AmanaDB has no delayed visibility, so the app hides them.
import { bidCommitment } from "@/lib/commitment";
import type { SessionUser } from "@/lib/auth";
import { getBid, getTender, insertReveal, listRevealsForTender, updateTender } from "@/services/amanadb";

export class OpeningError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpeningError";
  }
}

const isClosed = (closeDate: string, now: Date) => now.getTime() >= new Date(closeDate).getTime();

/** Stores one bid's reveal. Rejected before the closing time and after a reveal already exists. */
export async function submitReveal(
  reveal: { bidKey: string; amount: number; docHash: string; salt: string },
  now = new Date(),
): Promise<{ verified: boolean }> {
  const bid = await getBid(reveal.bidKey);
  if (!bid) throw new OpeningError("No sealed bid has this reference. Check the receipt.");
  const tender = await getTender(bid.data.tenderId);
  if (!tender) throw new OpeningError("The tender for this bid no longer exists.");
  if (!isClosed(tender.data.closeDate, now)) {
    throw new OpeningError("Bids can be revealed only after the closing time. Try again after the tender closes.");
  }
  const existing = await listRevealsForTender(tender.key);
  if (existing.some((r) => r.data.bidId === bid.key)) {
    throw new OpeningError("This bid has already been revealed. A reveal cannot be replaced.");
  }

  const recomputed = await bidCommitment({ amount: reveal.amount, docHash: reveal.docHash, salt: reveal.salt });
  const verified = recomputed === bid.data.commitment;
  await insertReveal({
    bidId: bid.key,
    tenderId: tender.key,
    amount: reveal.amount,
    docHash: reveal.docHash,
    salt: reveal.salt,
    revealedAt: now.toISOString(),
    verified,
  });
  return { verified };
}

/** Opens a tender's bids: rejected before the closing time and when already opened. */
export async function openBids(tenderKey: string, user: SessionUser, now = new Date()): Promise<void> {
  const tender = await getTender(tenderKey);
  if (!tender) throw new OpeningError("This tender no longer exists.");
  if (tender.data.openedAt) throw new OpeningError("These bids were already opened.");
  if (!isClosed(tender.data.closeDate, now)) {
    throw new OpeningError("Bids cannot be opened before the closing time.");
  }
  await updateTender(
    tender.key,
    { ...tender.data, status: "CLOSED", openedAt: now.toISOString(), openedBy: user.userId },
    tender.version,
  );
}
