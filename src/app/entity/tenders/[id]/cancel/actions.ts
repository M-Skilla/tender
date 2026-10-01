"use server";

import { redirect } from "next/navigation";
import { NotAuthorizedError, requireActionUser } from "@/lib/auth";
import { getTender, getUser, updateTender } from "@/services/amanadb";

export type CancelState = { reason?: string; error?: string; fieldError?: string };

// H5 "Cancel tender": the procuring entity's own admins only, before the award. An update to
// status CANCELLED at the version the page loaded, never a delete: the tender and its history
// stay public.
export async function cancelTenderAction(_prev: CancelState, formData: FormData): Promise<CancelState> {
  const tenderKey = String(formData.get("tenderKey") ?? "");
  const version = Number(formData.get("version"));
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 20) return { reason, fieldError: "Give the reason for cancelling in at least 20 characters." };

  try {
    const user = await requireActionUser(["pe_admin"]);
    const [tender, account] = await Promise.all([getTender(tenderKey), getUser(user.userId)]);
    if (!tender) return { reason, error: "This tender no longer exists." };
    if (tender.data.publishedBy !== user.userId && tender.data.entity !== account?.data.entity) {
      return { reason, error: "Only the procuring entity that published this tender can cancel it." };
    }
    if (tender.data.status === "AWARDED" || tender.data.status === "CANCELLED") {
      return { reason, error: `This tender is already ${tender.data.status === "AWARDED" ? "awarded" : "cancelled"}.` };
    }
    if (tender.version !== version) {
      return { reason, error: "This tender changed since you opened the page. Reload it and check before you cancel." };
    }
    await updateTender(
      tenderKey,
      { ...tender.data, status: "CANCELLED", cancelledAt: new Date().toISOString(), cancelledBy: user.userId, cancellationReason: reason },
      version,
    );
  } catch (err) {
    if (err instanceof NotAuthorizedError) return { reason, error: err.message };
    return { reason, error: "The tender could not be cancelled because the record service did not respond. Try again." };
  }
  redirect(`/tenders/${tenderKey}?cancelled=1`);
}
