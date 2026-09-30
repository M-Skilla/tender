"use client";

import { IconChevronDown14, IconFunnel16 } from "../icons";
import styles from "./FilterSelect.module.css";

/**
 * A1/P1 filter pill: "Date range: All time". A native select inside a GET form; changing it
 * submits the form. `withIcon` adds the funnel (A1's first filter).
 */
export function FilterSelect({
  name,
  label,
  value,
  options,
  withIcon = false,
}: {
  name: string;
  label: string;
  value: string;
  options: readonly { id: string; label: string }[];
  withIcon?: boolean;
}) {
  return (
    <label className={styles.pill}>
      {withIcon ? <IconFunnel16 className={styles.funnel} /> : null}
      <span className={styles.label}>{label}:</span>
      <select
        name={name}
        defaultValue={value}
        className={styles.select}
        data-plain={withIcon || undefined}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      {/* A1 draws the funnel pill without a chevron. */}
      {withIcon ? null : <IconChevronDown14 className={styles.chevron} />}
    </label>
  );
}
