"use client";

import { Fragment, useId, useState, type ReactNode } from "react";
import { IconChevronDown14 } from "../icons";
import styles from "./RuledTable.module.css";

export type RuledTableColumn = {
  key: string;
  header: string;
  /** Share of the table width as a percentage, for example "34%". Omit to share the rest. */
  width?: string;
};

export type RuledTableRow = {
  id: string;
  cells: Record<string, ReactNode>;
  /** Selected row: pen blue left edge, not a fill (brief section 7). */
  selected?: boolean;
  /** Content shown under the row when expanded (A1: changed fields). */
  expansion?: ReactNode;
  /** Accessible name for the expand button, for example "Show changes to TND-2026-0142 v1". */
  expandLabel?: string;
};

export type RuledTableProps = {
  /** Describes the table for screen readers; not shown. */
  caption: string;
  columns: RuledTableColumn[];
  rows: RuledTableRow[];
  /** default: 16px cells (P1, H3, B2). compact: 12px cells (P2 detail, A1). */
  density?: "default" | "compact";
  /** Shows static placeholder rows instead of data. */
  loading?: boolean;
  loadingRows?: number;
  /** One sentence and one action, shown when there are no rows. */
  empty?: { message: string; action?: ReactNode };
  /** Row expanded on first render. */
  defaultExpandedId?: string;
};

export function RuledTable({
  caption,
  columns,
  rows,
  density = "default",
  loading = false,
  loadingRows = 5,
  empty,
  defaultExpandedId,
}: RuledTableProps) {
  const baseId = useId();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(defaultExpandedId ? [defaultExpandedId] : []));
  const expandable = rows.some((row) => row.expansion);
  const span = columns.length + (expandable ? 1 : 0);

  function toggle(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  let body: ReactNode;
  if (loading) {
    body = Array.from({ length: loadingRows }, (_, index) => (
      <tr key={`skeleton-${index}`} className={styles.row} aria-hidden="true">
        {columns.map((column) => (
          <td key={column.key} className={styles.cell}>
            <span className={styles.skeleton} />
          </td>
        ))}
        {expandable ? <td className={styles.cell} /> : null}
      </tr>
    ));
  } else if (rows.length === 0 && empty) {
    body = (
      <tr>
        <td colSpan={span} className={styles.empty}>
          <p>{empty.message}</p>
          {empty.action}
        </td>
      </tr>
    );
  } else {
    body = rows.map((row) => {
      const isOpen = expanded.has(row.id);
      const panelId = `${baseId}-${row.id}`;
      return (
        <Fragment key={row.id}>
          <tr
            className={styles.row}
            data-selected={row.selected || undefined}
            data-expanded={isOpen || undefined}
            aria-current={row.selected ? "true" : undefined}
          >
            {columns.map((column) => (
              <td key={column.key} className={styles.cell} data-label={column.header}>
                {row.cells[column.key]}
              </td>
            ))}
            {expandable ? (
              <td className={`${styles.cell} ${styles.toggleCell}`}>
                {row.expansion ? (
                  <button
                    type="button"
                    className={styles.toggle}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    aria-label={row.expandLabel ?? "Show changes"}
                    onClick={() => toggle(row.id)}
                  >
                    <IconChevronDown14 />
                  </button>
                ) : null}
              </td>
            ) : null}
          </tr>
          {row.expansion && isOpen ? (
            <tr className={styles.panelRow} id={panelId}>
              <td colSpan={span} className={styles.panel}>
                {row.expansion}
              </td>
            </tr>
          ) : null}
        </Fragment>
      );
    });
  }

  return (
    <div className={styles.sheet} data-density={density}>
      <table className={styles.table} aria-busy={loading || undefined}>
        <caption className="visually-hidden">
          {caption}
          {loading ? ". Loading records." : ""}
        </caption>
        <colgroup>
          {columns.map((column) => (
            <col key={column.key} style={column.width ? { width: column.width } : undefined} />
          ))}
          {expandable ? <col className={styles.toggleCol} /> : null}
        </colgroup>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={styles.head}>
                {column.header}
              </th>
            ))}
            {expandable ? (
              <th scope="col" className={styles.head}>
                <span className="visually-hidden">Details</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>{body}</tbody>
      </table>
    </div>
  );
}
