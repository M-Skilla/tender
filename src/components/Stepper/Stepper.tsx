import { Fragment } from "react";
import styles from "./Stepper.module.css";

export type StepperProps = {
  /** Step names in order, for example ["Bid details", "Review", "Seal and submit"]. */
  steps: string[];
  /** Zero-based index of the current step. */
  current: number;
  /** Describes the sequence for screen readers, for example "Submit bid". */
  label: string;
};

/**
 * Three-step sequence (B3). Numbered because it is a real sequence (brief section 7);
 * B3 draws the circles empty, so the numbers and the completed look are review decisions.
 */
export function Stepper({ steps, current, label }: StepperProps) {
  return (
    <nav className={styles.stepper} aria-label={label}>
      <ol className={styles.list}>
        {steps.map((step, index) => {
          const state = index < current ? "completed" : index === current ? "current" : "upcoming";
          return (
            <Fragment key={step}>
              {index > 0 ? <li className={styles.connector} aria-hidden="true" /> : null}
              <li className={styles.step} data-state={state} aria-current={state === "current" ? "step" : undefined}>
                <span className={styles.number} aria-hidden="true">
                  {index + 1}
                </span>
                <span className={styles.name}>
                  <span className="visually-hidden">{`Step ${index + 1}: `}</span>
                  {step}
                  {state === "completed" ? <span className="visually-hidden">, completed</span> : null}
                </span>
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
