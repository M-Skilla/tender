"use server";

import { redirect } from "next/navigation";
import { NotAuthorizedError, requireActionUser } from "@/lib/auth";
import { MAX_DOCUMENT_BYTES, storeDocument } from "@/lib/documents";
import { CATEGORIES } from "@/lib/tender-form";
import { getUser, insertTender, listTenders } from "@/services/amanadb";
import { nextTenderReference } from "@/lib/tender-reference";

export type PublishState = {
  values?: Record<string, string>;
  errors?: Partial<Record<"title" | "category" | "budget" | "closeDate" | "description" | "document", string>>;
  error?: string;
};

/** The admin's procuring entity: from their account, else from the tenders they published. */
async function entityOf(userId: string): Promise<string | undefined> {
  const user = await getUser(userId);
  if (user?.data.entity) return user.data.entity;
  const mine = (await listTenders()).filter((t) => t.data.publishedBy === userId);
  return mine[0]?.data.entity;
}

// H2 "Publish tender": procuring entity admins only. The record is permanent once written.
export async function publishTenderAction(_prev: PublishState, formData: FormData): Promise<PublishState> {
  const values = {
    title: String(formData.get("title") ?? "").trim(),
    category: String(formData.get("category") ?? ""),
    budget: String(formData.get("budget") ?? "").replace(/[,\s]/g, ""),
    closeDate: String(formData.get("closeDate") ?? ""),
    description: String(formData.get("description") ?? "").trim(),
  };
  const file = formData.get("document");
  const document = file instanceof File && file.size > 0 ? file : null;

  const errors: PublishState["errors"] = {};
  if (values.title.length < 5) errors.title = "Enter the tender title, at least 5 characters.";
  if (!CATEGORIES.includes(values.category)) errors.category = "Choose a category.";
  const budget = Number(values.budget);
  if (!values.budget || !Number.isInteger(budget) || budget <= 0) errors.budget = "Enter the budget ceiling in shillings, digits only.";
  const close = values.closeDate ? new Date(`${values.closeDate}:00+03:00`) : null;
  if (!close || Number.isNaN(close.getTime())) errors.closeDate = "Enter the closing date and time.";
  else if (close.getTime() < Date.now() + 3_600_000) errors.closeDate = "The closing time must be at least one hour from now.";
  if (values.description.length < 20) errors.description = "Describe the work in at least 20 characters.";
  if (document && document.size > MAX_DOCUMENT_BYTES) errors.document = "The document is larger than 10 MB. Upload a smaller PDF.";
  else if (document && !/\.pdf$/i.test(document.name)) errors.document = "Upload the tender document as a PDF.";
  if (Object.keys(errors).length) return { values, errors };

  let key: string;
  try {
    const user = await requireActionUser(["pe_admin"]);
    const entity = await entityOf(user.userId);
    if (!entity) return { values, error: "Your account has no procuring entity. Ask the system administrator to set it." };
    const stored = document ? await storeDocument(document) : null;
    const now = new Date();
    key = await insertTender({
      reference: await nextTenderReference(Number(new Date(now.getTime() + 3 * 3_600_000).toISOString().slice(0, 4))),
      title: values.title,
      description: values.description,
      entity,
      category: values.category,
      budgetCeiling: budget,
      openDate: now.toISOString(),
      closeDate: close!.toISOString(),
      status: "PUBLISHED",
      ...(stored ? { docHash: stored.docHash, docName: stored.docName } : {}),
      publishedBy: user.userId,
    });
  } catch (err) {
    if (err instanceof NotAuthorizedError) return { values, error: err.message };
    return { values, error: "The tender could not be published because the record service did not respond. Try again." };
  }
  redirect(`/tenders/${key}?published=1`);
}
