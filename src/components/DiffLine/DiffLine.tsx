import type { ReactNode } from "react";
import { IconArrowRight12 } from "../icons";
import styles from "./DiffLine.module.css";

export type DiffLineProps = {
  /** Field name in sentence case, for example "Technical score". */
  label: string;
  /** The current (new) value. */
  value: ReactNode;
  /** The previous value. Present only when the field changed. */
  previous?: ReactNode;
  /**
   * row: label column beside the values (C3 modal, A1 audit row).
   * stacked: label above "old → new" (P3 history drawer).
   */
  layout?: "row" | "stacked";
  /** Row layout only: wide label column (160px, A1) instead of 120px (C3). */
  wideLabel?: boolean;
  /** Row layout only: marks the whole line on Highlighter even without a previous value,
   * as C3's "Your changes" column does for fields the reader edited. */
  highlight?: boolean;
};

/**
 * One field in a version comparison. A changed field is set on Highlighter, the old value
 * struck through in secondary text and the new value in semibold (C3, A1, P3).
 */
export function DiffLine({ label, value, previous, layout = "row", wideLabel = false, highlight = false }: DiffLineProps) {
  const changed = previous !== undefined;
  const marked = changed || highlight;

  const values = (
    <span className={styles.values}>
      {changed ? (
        <>
          <del className={styles.previous}>
            <span className="visually-hidden">Previous value: </span>
            {previous}
          </del>
          {layout === "stacked" ? <IconArrowRight12 className={styles.arrow} /> : null}
          <ins className={styles.value}>
            <span className="visually-hidden">New value: </span>
            {value}
          </ins>
        </>
      ) : (
        <span className={styles.value}>{value}</span>
      )}
    </span>
  );

  return (
    <div
      className={styles.line}
      data-layout={layout}
      data-wide={wideLabel || undefined}
      data-marked={marked || undefined}
    >
      <span className={styles.label}>{label}</span>
      {values}
    </div>
  );
}

/**
 * A ruled list of DiffLines, 1px Rule around and between lines. Unchanged lines sit on
 * Paper in C3's comparison columns and on Sheet in A1's audit rows.
 */
export function DiffList({ children, surface = "paper" }: { children: ReactNode; surface?: "paper" | "sheet" }) {
  return (
    <div className={styles.list} data-surface={surface}>
      {children}
    </div>
  );
}
