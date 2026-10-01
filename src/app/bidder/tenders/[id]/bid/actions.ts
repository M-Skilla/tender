"use server";

import { NotAuthorizedError, requireActionUser } from "@/lib/auth";
import { formatTime } from "@/lib/format";
import { getTender, insertBid, listBidsForTender } from "@/services/amanadb";

export type SealResult =
  | { ok: true; bidKey: string; reference: string; submittedAt: string }
  | { ok: false; error: string };

// B3 "Seal and submit": bidders only, before the closing time, one bid per bidder per tender.
// Receives only the commitment: the amount, document and salt never reach the server here.
export async function sealBidAction(tenderKey: string, commitment: string): Promise<SealResult> {
  if (!/^[0-9a-f]{64}$/.test(commitment)) return { ok: false, error: "The bid fingerprint is not valid. Start again." };
  try {
    const user = await requireActionUser(["bidder"]);
    const tender = await getTender(tenderKey);
    if (!tender || tender.data.status === "CANCELLED") return { ok: false, error: "This tender is not accepting bids." };
    const now = new Date();
    if (now.getTime() >= new Date(tender.data.closeDate).getTime()) {
      return {
        ok: false,
        error: `Your bid could not be sealed because the tender closed at ${formatTime(tender.data.closeDate)}. Contact the procuring entity.`,
      };
    }
    const existing = await listBidsForTender(tender.key);
    if (existing.some((b) => b.data.bidderId === user.userId)) {
      return { ok: false, error: "You have already submitted a bid for this tender. A sealed bid cannot be replaced." };
    }
    const reference = `BID-${tender.data.reference.slice(4)}-${String(existing.length + 1).padStart(3, "0")}`;
    const submittedAt = now.toISOString();
    const bidKey = await insertBid({
      tenderId: tender.key,
      bidderId: user.userId,
      bidderName: user.name,
      commitment,
      submittedAt,
      reference,
    });
    return { ok: true, bidKey, reference, submittedAt };
  } catch (err) {
    if (err instanceof NotAuthorizedError) return { ok: false, error: err.message };
    return { ok: false, error: "Your bid could not be sealed because the record service did not respond. Try again." };
  }
}
