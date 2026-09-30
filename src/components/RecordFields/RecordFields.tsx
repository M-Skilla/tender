import type { ReactNode } from "react";
import styles from "./RecordFields.module.css";

/** A record's fields as ruled label/value rows (B3's review list: 200px label column). */
export function RecordFields({ fields }: { fields: { label: string; value: ReactNode }[] }) {
  return (
    <dl className={styles.list}>
      {fields.map((field) => (
        <div key={field.label} className={styles.row}>
          <dt className={styles.label}>{field.label}</dt>
          <dd className={styles.value}>{field.value}</dd>
        </div>
      ))}
    </dl>
  );
}
