import type { ComponentType } from "react";
import {
  IconAward12,
  IconCheck14,
  IconCheckCircle14,
  IconCircleDashed12,
  IconCircleDot12,
  IconLock14,
  IconLockOpen14,
  IconMinusCircle12,
  IconWarning14,
  IconXCircle12,
} from "../icons";
import styles from "./StatusLabel.module.css";

/**
 * Tender statuses (draft to cancelled) and bid states (sealed to withdrawn). P1 and B2
 * show all but Draft and Opened, which follow the same pattern (task 1 review decision).
 */
export type Status =
  | "draft"
  | "published"
  | "closed"
  | "awarded"
  | "cancelled"
  | "sealed"
  | "opened"
  | "opened-matches"
  | "opened-does-not-match"
  | "withdrawn";

const STATUSES: Record<Status, { word: string; tone: string; Icon: ComponentType<{ className?: string }> }> = {
  draft: { word: "Draft", tone: "neutral", Icon: IconCircleDashed12 },
  published: { word: "Published", tone: "pine", Icon: IconCheckCircle14 },
  closed: { word: "Closed", tone: "closed", Icon: IconCircleDot12 },
  awarded: { word: "Awarded", tone: "penBlue", Icon: IconAward12 },
  cancelled: { word: "Cancelled", tone: "waxRed", Icon: IconXCircle12 },
  sealed: { word: "Sealed", tone: "amber", Icon: IconLock14 },
  // Opened before its reveal has been checked; the result labels below replace it.
  opened: { word: "Opened", tone: "opened", Icon: IconLockOpen14 },
  "opened-matches": { word: "Opened, matches", tone: "pine", Icon: IconCheck14 },
  "opened-does-not-match": { word: "Opened, does not match", tone: "waxRed", Icon: IconWarning14 },
  // B2 draws Withdrawn without an icon; it gets one so status is never shown by colour alone.
  withdrawn: { word: "Withdrawn", tone: "neutral", Icon: IconMinusCircle12 },
};

export function StatusLabel({ status }: { status: Status }) {
  const { word, tone, Icon } = STATUSES[status];
  return (
    <span className={`${styles.label} ${styles[tone]}`}>
      <span className={styles.iconWrap}>
        <Icon />
      </span>
      {word}
    </span>
  );
}
