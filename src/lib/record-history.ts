import "server-only";

// P3 record history: every version of a tender record, newest first, from its per-record audit
// trail, with who, what and which fields changed (the same reading as A1).
import { describeAuditRows, type AuditChange } from "@/lib/audit-log";
import { COLLECTIONS, recordAuditRows } from "@/services/amanadb";

export type HistoryVersion = {
  version: number;
  latest: boolean;
  time: string;
  dateTime: string;
  actor: string;
  action: string;
  /** Changed fields; empty for the first version, which records every field. */
  changes: AuditChange[];
  fingerprint: string;
};

export async function tenderHistory(tenderKey: string): Promise<HistoryVersion[]> {
  const rows = await recordAuditRows(COLLECTIONS.tenders, tenderKey);
  const described = await describeAuditRows(rows);
  const latest = Math.max(...rows.map((r) => r.version));
  return described
    .map((row, i) => ({
      version: row.version,
      latest: row.version === latest,
      time: row.time,
      dateTime: row.iso,
      actor: row.actor,
      action: row.action,
      changes: rows[i]!.action === "CREATE" ? [] : row.changes,
      fingerprint: row.fingerprint,
    }))
    .sort((a, b) => b.version - a.version);
}
