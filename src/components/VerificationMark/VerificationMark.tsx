import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { ComponentType } from "react";
import {
  IconAlertTriangle16,
  IconAlertTriangle24,
  IconCheckCircle16,
  IconCheckCircle18,
  IconCircleDashed16,
  IconCircleDashed18,
} from "../icons";
import styles from "./VerificationMark.module.css";

/**
 * "matches" and "does-not-match" are drawn in H3, P2 and A2. "checking" (recomputing the
 * fingerprint) is a task 1 review decision: neutral colour, dashed circle, no motion.
 */
export type VerificationResult = "matches" | "does-not-match" | "checking";

type Icon = ComponentType<{ className?: string }>;

const INLINE: Record<VerificationResult, { word: string; tone: string; Icon: Icon }> = {
  matches: { word: "Matches", tone: "pine", Icon: IconCheckCircle16 },
  "does-not-match": { word: "Does not match", tone: "waxRed", Icon: IconAlertTriangle16 },
  checking: { word: "Checking", tone: "neutral", Icon: IconCircleDashed16 },
};

const BANNER: Record<VerificationResult, { tone: string; Icon: Icon }> = {
  matches: { tone: "bannerPine", Icon: IconCheckCircle18 },
  "does-not-match": { tone: "bannerWaxRed", Icon: IconAlertTriangle24 },
  checking: { tone: "bannerNeutral", Icon: IconCircleDashed18 },
};

/** Inline mark, as on H3 bid rows: icon plus the word. */
export function VerificationMark({ result }: { result: VerificationResult }) {
  const { word, tone, Icon } = INLINE[result];
  return (
    <span className={`${styles.inline} ${styles[tone]}`}>
      <Icon />
      {word}
    </span>
  );
}

/**
 * Banner size, as on P2 ("All 14 records match…") and A2 (tamper sentence).
 * The sentence is passed as children because it carries record counts and times.
 */
export function VerificationBanner({
  result,
  children,
  action,
}: {
  result: VerificationResult;
  children: ReactNode;
  action?: ReactNode;
}) {
  const { tone, Icon } = BANNER[result];
  return (
    <div role="status" className={`${styles.banner} ${styles[tone]}`}>
      <div className={styles.bannerMessage}>
        <Icon className={styles.bannerIcon} />
        <p className={styles.bannerText}>{children}</p>
      </div>
      {action}
    </div>
  );
}

/** The outlined action inside a matching banner ("Check again" on P2). */
export function VerificationBannerAction({ type = "button", className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={[styles.bannerAction, className].filter(Boolean).join(" ")} {...rest} />;
}
