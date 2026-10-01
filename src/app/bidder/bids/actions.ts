"use server";

import { revalidatePath } from "next/cache";
import { NotAuthorizedError, requireActionUser } from "@/lib/auth";
import { getBid, getTender, VersionConflictError, withdrawBid } from "@/services/amanadb";

export type WithdrawResult = { ok: true } | { ok: false; error: string };

// B2: a bidder withdraws their own sealed bid while the tender is open. A soft delete: the bid
// leaves the tender's list, its versions and audit entries stay.
export async function withdrawBidAction(bidKey: string, version: number): Promise<WithdrawResult> {
  try {
    const user = await requireActionUser(["bidder"]);
    const bid = await getBid(bidKey);
    if (!bid || bid.data.bidderId !== user.userId) return { ok: false, error: "This bid is not one of yours, or it was already withdrawn." };
    const tender = await getTender(bid.data.tenderId);
    if (!tender || tender.data.status !== "PUBLISHED" || Date.now() >= new Date(tender.data.closeDate).getTime()) {
      return { ok: false, error: "This tender has closed. A bid cannot be withdrawn after the closing time." };
    }
    await withdrawBid(bidKey, version);
    revalidatePath("/bidder/bids");
    return { ok: true };
  } catch (err) {
    if (err instanceof NotAuthorizedError) return { ok: false, error: err.message };
    if (err instanceof VersionConflictError) return { ok: false, error: "This bid changed since you loaded the page. Reload and try again." };
    return { ok: false, error: "Your bid could not be withdrawn because the record service did not respond. Try again." };
  }
}
