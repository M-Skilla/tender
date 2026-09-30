import { auditLogAll, parseFilters } from "@/lib/audit-log";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

// A1 "Export log": the filtered view as CSV, with full fingerprints and transaction ids.
export async function GET(request: Request): Promise<Response> {
  const user = await currentUser();
  if (!user || !["auditor", "pe_admin"].includes(user.role)) {
    return new Response("Sign in as an auditor or a procuring entity administrator to export the audit log.", { status: 403 });
  }
  const url = new URL(request.url);
  const filters = parseFilters(Object.fromEntries(url.searchParams));
  const rows = await auditLogAll(filters);
  const lines = [
    ["Time", "Actor", "Action", "Collection", "Record", "Version", "Fingerprint", "Transaction"],
    ...rows.map((r) => [r.iso, r.actor, r.action, r.collection, r.record.label, r.version, r.fingerprint, r.txId]),
  ].map((cells) => cells.map(csvCell).join(","));
  const date = new Date().toISOString().slice(0, 10);
  return new Response(lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit-log-${filters.section}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
