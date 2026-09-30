import type { ComponentType } from "react";
import {
  IconAward12,
  IconCheck14,
  IconCheckCircle14,
  IconCircleDot12,
  IconLock14,
  IconWarning14,
  IconXCircle12,
} from "../icons";
import styles from "./StatusLabel.module.css";

/** Every status the Figma frames show (P1 tender list, B2 my bids). */
export type Status =
  | "published"
  | "closed"
  | "awarded"
  | "cancelled"
  | "sealed"
  | "opened-matches"
  | "opened-does-not-match"
  | "withdrawn";

const STATUSES: Record<Status, { word: string; tone: string; Icon?: ComponentType<{ className?: string }> }> = {
  published: { word: "Published", tone: "pine", Icon: IconCheckCircle14 },
  closed: { word: "Closed", tone: "closed", Icon: IconCircleDot12 },
  awarded: { word: "Awarded", tone: "penBlue", Icon: IconAward12 },
  cancelled: { word: "Cancelled", tone: "waxRed", Icon: IconXCircle12 },
  sealed: { word: "Sealed", tone: "amber", Icon: IconLock14 },
  "opened-matches": { word: "Opened, matches", tone: "pine", Icon: IconCheck14 },
  "opened-does-not-match": { word: "Opened, does not match", tone: "waxRed", Icon: IconWarning14 },
  // B2 shows Withdrawn with no icon.
  withdrawn: { word: "Withdrawn", tone: "neutral" },
};

export function StatusLabel({ status }: { status: Status }) {
  const { word, tone, Icon } = STATUSES[status];
  return (
    <span className={`${styles.label} ${styles[tone]}`}>
      {Icon ? (
        <span className={styles.iconWrap}>
          <Icon />
        </span>
      ) : null}
      {word}
    </span>
  );
}
