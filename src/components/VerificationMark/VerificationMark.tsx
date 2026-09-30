import type { ButtonHTMLAttributes, ReactNode } from "react";
import { IconAlertTriangle16, IconAlertTriangle24, IconCheckCircle16, IconCheckCircle18 } from "../icons";
import styles from "./VerificationMark.module.css";

/** The two results the design shows. "Checking" has no design yet. */
export type VerificationResult = "matches" | "does-not-match";

/** Inline mark, as on H3 bid rows: icon plus the word. */
export function VerificationMark({ result }: { result: VerificationResult }) {
  const matches = result === "matches";
  return (
    <span className={`${styles.inline} ${matches ? styles.pine : styles.waxRed}`}>
      {matches ? <IconCheckCircle16 /> : <IconAlertTriangle16 />}
      {matches ? "Matches" : "Does not match"}
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
  const matches = result === "matches";
  return (
    <div
      role="status"
      className={`${styles.banner} ${matches ? styles.bannerPine : styles.bannerWaxRed}`}
    >
      <div className={styles.bannerMessage}>
        {matches ? <IconCheckCircle18 className={styles.bannerIcon} /> : <IconAlertTriangle24 className={styles.bannerIcon} />}
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
