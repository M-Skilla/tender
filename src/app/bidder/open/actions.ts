"use server";

import { NotAuthorizedError, requireActionUser } from "@/lib/auth";
import { OpeningError, submitReveal } from "@/lib/bid-opening";
import { MAX_DOCUMENT_BYTES, storeDocument } from "@/lib/documents";
import { getBid, getTender } from "@/services/amanadb";

export type RevealResult =
  | { ok: true; verified: boolean; sealed: string; recomputed: string; tenderTitle: string; amount: number }
  | { ok: false; error: string };

// B5: the bidder reveals their own bid after the closing time. The server hashes the uploaded
// document itself (never trusting the receipt's value), stores it on disk, recomputes the
// commitment and records the reveal.
export async function revealBidAction(formData: FormData): Promise<RevealResult> {
  const bidKey = String(formData.get("bidKey") ?? "");
  const amount = Number(formData.get("amount"));
  const salt = String(formData.get("salt") ?? "");
  const file = formData.get("document");
  if (!bidKey || !Number.isInteger(amount) || amount <= 0 || !/^[0-9a-f]{32}$/.test(salt)) {
    return { ok: false, error: "This receipt is incomplete. Load the receipt file you downloaded when you sealed the bid." };
  }
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose the bid document you sealed with this bid." };
  if (file.size > MAX_DOCUMENT_BYTES) return { ok: false, error: "The document is larger than 10 MB." };
  try {
    const user = await requireActionUser(["bidder"]);
    const bid = await getBid(bidKey);
    if (!bid || bid.data.bidderId !== user.userId) {
      return { ok: false, error: "This receipt belongs to another bidder's bid. Sign in with the account that sealed it." };
    }
    const tender = await getTender(bid.data.tenderId);
    const { docHash } = await storeDocument(file);
    const result = await submitReveal({ bidKey, amount, docHash, salt });
    return { ok: true, ...result, tenderTitle: tender?.data.title ?? "", amount };
  } catch (err) {
    if (err instanceof NotAuthorizedError || err instanceof OpeningError) return { ok: false, error: err.message };
    return { ok: false, error: "Your bid could not be opened because the record service did not respond. Try again." };
  }
}
