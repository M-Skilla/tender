import { StatusLabel, type Status } from "../StatusLabel/StatusLabel";
import styles from "./TenderHeader.module.css";

export type TenderHeaderProps = {
  title: string;
  reference: string;
  status: Status;
  /** Labelled fields under the rule, in order (P2: procuring entity, budget ceiling, closes). */
  fields: { label: string; value: string }[];
};

/** The tender's header sheet (P2, A2): title, reference, status and key fields. */
export function TenderHeader({ title, reference, status, fields }: TenderHeaderProps) {
  return (
    <section className={styles.sheet} aria-labelledby="tender-title">
      <div className={styles.titleRow}>
        <div className={styles.titleBlock}>
          <h1 id="tender-title" className={styles.title}>
            {title}
          </h1>
          <p className={styles.reference}>Reference: {reference}</p>
        </div>
        <StatusLabel status={status} />
      </div>
      <hr className={styles.rule} />
      <dl className={styles.fields}>
        {fields.map((field) => (
          <div key={field.label} className={styles.field}>
            <dt className={styles.label}>{field.label}</dt>
            <dd className={styles.value}>{field.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
