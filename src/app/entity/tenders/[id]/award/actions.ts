"use server";

import { redirect } from "next/navigation";
import { awardReadiness } from "@/lib/award";
import { NotAuthorizedError, requireActionUser } from "@/lib/auth";
import { getTender, listAwardsForTender, recordAward, updateTender } from "@/services/amanadb";

export type AwardState = { winner?: string; justification?: string; errors?: { winner?: string; justification?: string }; error?: string };

// H4 "Record award": procuring entity admins only. Marks the tender AWARDED at the version the
// page was loaded with (so a second admin, or a cancellation, cannot be overwritten), then
// writes the award record.
export async function recordAwardAction(_prev: AwardState, formData: FormData): Promise<AwardState> {
  const tenderKey = String(formData.get("tenderKey") ?? "");
  const version = Number(formData.get("version"));
  const winner = String(formData.get("winner") ?? "");
  const justification = String(formData.get("justification") ?? "").trim();
  const values = { winner, justification };

  const errors: AwardState["errors"] = {};
  if (!winner) errors.winner = "Choose the winning bid.";
  if (justification.length < 20) errors.justification = "Give the reason for this award in at least 20 characters.";
  if (Object.keys(errors).length) return { ...values, errors };

  try {
    const user = await requireActionUser(["pe_admin"]);
    const tender = await getTender(tenderKey);
    if (!tender) return { ...values, error: "This tender no longer exists." };
    const awards = await listAwardsForTender(tenderKey);
    const readiness = await awardReadiness(tender, awards.length > 0);
    if (!readiness.ready) return { ...values, error: "This tender can no longer be awarded. Reload the page to see its state." };
    if (!readiness.standings.some((s) => s.bidKey === winner)) return { ...values, errors: { winner: "Choose one of the scored bids." } };

    if (tender.data.status !== "AWARDED") {
      if (tender.version !== version) {
        return { ...values, error: "This tender changed since you opened the page. Reload it and check before you record the award." };
      }
      await updateTender(tenderKey, { ...tender.data, status: "AWARDED" }, version);
    }
    await recordAward({ tenderId: tenderKey, winningBidId: winner, justification, decidedBy: user.userId, decidedAt: new Date().toISOString() });
  } catch (err) {
    if (err instanceof NotAuthorizedError) return { ...values, error: err.message };
    return { ...values, error: "The award could not be recorded because the record service did not respond. Try again." };
  }
  redirect(`/tenders/${tenderKey}/award?recorded=1`);
}
