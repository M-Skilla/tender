import type { ReactNode } from "react";
import { AUDIT_SECTIONS, ACTIONS, RANGES, ROLES, type AuditFilters, type AuditLogRow } from "@/lib/audit-log";
import { ButtonLink } from "../Button/Button";
import { DiffLine, DiffList } from "../DiffLine/DiffLine";
import { FilterSelect } from "../FilterSelect/FilterSelect";
import { FingerprintChip } from "../FingerprintChip/FingerprintChip";
import { IconDownload16 } from "../icons";
import { Pagination } from "../Pagination/Pagination";
import { RuledTable, type RuledTableColumn } from "../RuledTable/RuledTable";
import { SegmentedControl } from "../SegmentedControl/SegmentedControl";
import { VersionMark } from "../VersionMark/VersionMark";
import styles from "./AuditLogView.module.css";

// A1 widths: 160, 220, 140, 160 and 80px text columns plus Figma's 16px gaps, over 1280.
const COLUMNS: RuledTableColumn[] = [
  { key: "time", header: "Time", width: "13.75%" },
  { key: "actor", header: "Actor", width: "18.44%" },
  { key: "action", header: "Action", width: "12.19%" },
  { key: "record", header: "Record", width: "13.75%" },
  { key: "version", header: "Version", width: "7.5%" },
  { key: "fingerprint", header: "Fingerprint" },
];

export function query(filters: AuditFilters, page?: number): string {
  const params = new URLSearchParams();
  if (filters.section !== "all") params.set("collection", filters.section);
  if (filters.range !== "all") params.set("range", filters.range);
  if (filters.role !== "all") params.set("actor", filters.role);
  if (filters.action !== "all") params.set("action", filters.action);
  if (page && page > 1) params.set("page", String(page));
  const s = params.toString();
  return s ? `?${s}` : "";
}

function Changes({ row }: { row: AuditLogRow }) {
  if (row.changes.length === 0) {
    return <p className={styles.note}>The record was withdrawn. Its earlier versions remain in the history.</p>;
  }
  return (
    <div className={styles.changes}>
      <p className={styles.changesTitle}>{row.version === 1 ? "Recorded fields" : "Changed fields"}</p>
      <DiffList surface="sheet">
        {row.changes.map((c) =>
          c.previous !== undefined ? (
            <DiffLine key={c.label} wideLabel label={c.label} previous={c.previous} value={c.value} />
          ) : (
            <DiffLine key={c.label} wideLabel label={c.label} value={c.value} />
          ),
        )}
      </DiffList>
      <p className={styles.note}>Transaction {row.txId}</p>
    </div>
  );
}

export function AuditLogView({
  header,
  filters,
  rows,
  total,
  page,
  pageCount,
}: {
  header: ReactNode;
  filters: AuditFilters;
  rows: AuditLogRow[];
  total: number;
  page: number;
  pageCount: number;
}) {
  const first = total === 0 ? 0 : (page - 1) * 20 + 1;
  const last = Math.min(page * 20, total);
  const filtered = filters.range !== "all" || filters.role !== "all" || filters.action !== "all";
  return (
    <>
      {header}
      <main className={styles.page}>
        <div className={styles.titleRow}>
          <h1 className="text-title">Audit log</h1>
          <ButtonLink href={`/audit/export${query(filters)}`} variant="secondary" size="small" className={styles.export}>
            <IconDownload16 />
            Export log
          </ButtonLink>
        </div>

        <SegmentedControl
          label="Collection"
          items={AUDIT_SECTIONS.map((s) => ({
            id: s.id,
            label: s.label,
            href: `/audit${query({ ...filters, section: s.id })}`,
            current: s.id === filters.section,
          }))}
        />

        <form method="get" className={styles.filters}>
          {filters.section !== "all" ? <input type="hidden" name="collection" value={filters.section} /> : null}
          <FilterSelect name="range" label="Date range" value={filters.range} options={RANGES} withIcon />
          <FilterSelect name="actor" label="Actor" value={filters.role} options={ROLES} />
          <FilterSelect name="action" label="Action" value={filters.action} options={ACTIONS} />
          <noscript>
            <button type="submit">Apply filters</button>
          </noscript>
        </form>

        <RuledTable
          caption="Audit log"
          density="compact"
          columns={COLUMNS}
          rows={rows.map((row) => ({
            id: row.id,
            cells: {
              time: <time dateTime={row.iso}>{row.time}</time>,
              actor: <span className={styles.muted}>{row.actor}</span>,
              action: row.action,
              record: row.record.href ? (
                <a className={styles.record} href={row.record.href}>
                  {row.record.label}
                </a>
              ) : (
                row.record.label
              ),
              version: <VersionMark version={row.version} />,
              fingerprint: row.fingerprint ? <FingerprintChip value={row.fingerprint} /> : <span className={styles.muted}>None</span>,
            },
            expansion: <Changes row={row} />,
            expandLabel: `Show changes to ${row.record.label} version ${row.version}`,
          }))}
          empty={{
            message: filtered
              ? "No operations match these filters. Clear the filters to see the whole log."
              : "No operations yet. Operations appear here as records are written.",
            action: filtered ? (
              <ButtonLink href={`/audit${query({ ...filters, range: "all", role: "all", action: "all" })}`} variant="secondary" size="small">
                Clear filters
              </ButtonLink>
            ) : undefined,
          }}
        />

        {total > 0 ? (
          <Pagination
            summary={`Showing ${first}–${last} of ${total.toLocaleString("en-US")} ${total === 1 ? "operation" : "operations"}`}
            page={page}
            pageCount={pageCount}
            showPages={false}
            hrefForPage={(n) => `/audit${query(filters, n)}`}
          />
        ) : null}
      </main>
    </>
  );
}
