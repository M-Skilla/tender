import { AccessDenied } from "@/components/AccessDenied/AccessDenied";
import { AuditLogView } from "@/components/AuditLog/AuditLogView";
import { SiteHeader } from "@/components/NavigationBar/SiteHeader";
import { auditLogPage, parseFilters } from "@/lib/audit-log";
import { requirePageUser } from "@/lib/auth";

// Audit entries change with every write: never cached.
export const dynamic = "force-dynamic";
export const metadata = { title: "Audit log" };

// A1 audit log: oversight (auditors) and procuring entity admins. The users collection is never listed.
export default async function AuditLogPage(props: PageProps<"/audit">) {
  const params = await props.searchParams;
  const filters = parseFilters(params);
  const user = await requirePageUser(["auditor", "pe_admin"], "/audit");
  if (!user) {
    return (
      <>
        <SiteHeader />
        <AccessDenied who="auditors and procuring entity administrators" />
      </>
    );
  }
  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;
  const log = await auditLogPage(filters, page);
  return (
    <AuditLogView
      header={<SiteHeader active="audit" />}
      filters={filters}
      rows={log.rows}
      total={log.total}
      page={log.page}
      pageCount={log.pageCount}
    />
  );
}
