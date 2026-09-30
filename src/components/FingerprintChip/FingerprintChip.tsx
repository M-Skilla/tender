"use client";

import { useEffect, useId, useState } from "react";
import { IconCheckCircle14, IconClipboardCopy14, IconWarning14 } from "../icons";
import styles from "./FingerprintChip.module.css";

/** First 4 and last 3 characters with an ellipsis, as in every frame ("7be1…90d"). */
export function truncateFingerprint(value: string): string {
  return value.length > 8 ? `${value.slice(0, 4)}…${value.slice(-3)}` : value;
}

type CopyState = "idle" | "copied" | "failed";

const ANNOUNCEMENTS: Record<CopyState, string> = {
  idle: "",
  copied: "Fingerprint copied",
  failed: "Fingerprint not copied. Select the full value in the tooltip and copy it.",
};

export function FingerprintChip({ value }: { value: string }) {
  const tooltipId = useId();
  const [copyState, setCopyState] = useState<CopyState>("idle");
  // Escape hides the tooltip until the pointer or focus leaves (WCAG 1.4.13).
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (copyState === "idle") return;
    const timer = setTimeout(() => setCopyState("idle"), 2000);
    return () => clearTimeout(timer);
  }, [copyState]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  const shown = copyState === "copied" ? "Copied" : copyState === "failed" ? "Failed" : truncateFingerprint(value);
  const Icon = copyState === "copied" ? IconCheckCircle14 : copyState === "failed" ? IconWarning14 : IconClipboardCopy14;

  return (
    <span
      className={styles.wrap}
      data-dismissed={dismissed || undefined}
      onMouseLeave={() => setDismissed(false)}
      onBlur={() => setDismissed(false)}
      onKeyDown={(event) => {
        if (event.key === "Escape") setDismissed(true);
      }}
    >
      <button
        type="button"
        className={styles.chip}
        onClick={copy}
        aria-label="Copy fingerprint"
        aria-describedby={tooltipId}
        data-state={copyState}
      >
        <span className={styles.value}>{shown}</span>
        <Icon className={styles.icon} />
      </button>
      <span className={styles.tooltip} role="tooltip" id={tooltipId}>
        <span className={styles.tooltipText}>{value}</span>
      </span>
      <span className="visually-hidden" aria-live="polite">
        {ANNOUNCEMENTS[copyState]}
      </span>
    </span>
  );
}
