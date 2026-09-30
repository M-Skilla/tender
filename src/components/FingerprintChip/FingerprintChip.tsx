"use client";

import { useEffect, useState } from "react";
import { IconClipboardCopy14 } from "../icons";
import styles from "./FingerprintChip.module.css";

/** First 4 and last 3 characters with an ellipsis, as in every frame ("7be1…90d"). */
export function truncateFingerprint(value: string): string {
  return value.length > 8 ? `${value.slice(0, 4)}…${value.slice(-3)}` : value;
}

export function FingerprintChip({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      className={styles.chip}
      onClick={copy}
      title={value}
      aria-label={`Copy fingerprint ${value}`}
      data-copied={copied || undefined}
    >
      <span className={styles.value}>{truncateFingerprint(value)}</span>
      <IconClipboardCopy14 className={styles.icon} />
      <span className="visually-hidden" aria-live="polite">
        {copied ? "Fingerprint copied" : ""}
      </span>
    </button>
  );
}
