import type { ReactNode } from "react";
import styles from "./RecordFields.module.css";

/**
 * A record's fields as ruled label/value rows: B3's review list (200px labels), or P4's award
 * document (`variant="document"`: 280px labels, 15px values, 16px above and below each rule).
 */
export function RecordFields({
  fields,
  variant = "list",
}: {
  fields: { label: string; value: ReactNode }[];
  variant?: "list" | "document";
}) {
  return (
    <dl className={styles.list} data-variant={variant}>
      {fields.map((field) => (
        <div key={field.label} className={styles.row}>
          <dt className={styles.label}>{field.label}</dt>
          <dd className={styles.value}>{field.value}</dd>
        </div>
      ))}
    </dl>
  );
}
