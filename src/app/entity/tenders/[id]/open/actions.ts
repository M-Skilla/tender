"use server";

import { redirect } from "next/navigation";
import { NotAuthorizedError, requireActionUser } from "@/lib/auth";
import { OpeningError, openBids } from "@/lib/bid-opening";

export type OpenBidsState = { error?: string };

// H3 "Open all bids": procuring entity admins only, after the closing time, once.
export async function openBidsAction(tenderKey: string, _prev: OpenBidsState): Promise<OpenBidsState> {
  try {
    const user = await requireActionUser(["pe_admin"]);
    await openBids(tenderKey, user);
  } catch (err) {
    if (err instanceof NotAuthorizedError || err instanceof OpeningError) return { error: err.message };
    return { error: "The bids could not be opened because the record service did not respond. Try again." };
  }
  redirect(`/entity/tenders/${tenderKey}/open?opened=1`);
}
