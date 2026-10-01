import type { ReactNode } from "react";
import { FingerprintChip } from "../FingerprintChip/FingerprintChip";
import {
  IconLockKeyhole16,
  SpineMarkerDot,
  SpineMarkerHollow,
  SpineMarkerRing,
} from "../icons";
import { VerificationMark, type VerificationResult } from "../VerificationMark/VerificationMark";
import { VersionMark } from "../VersionMark/VersionMark";
import styles from "./SpineNode.module.css";

/**
 * completed, current, upcoming and sealed are drawn in P2; mismatch in A2.
 * "sealed" is an event that exists but is locked until the closing time (brief section 4).
 */
export type SpineNodeState = "completed" | "current" | "upcoming" | "sealed" | "mismatch";

export type SpineNodeProps = {
  state: SpineNodeState;
  /** Event name: "Published", "Bids received", "Opened", "Scored", "Awarded". */
  title: string;
  version?: number;
  /** Marks the version as the record's latest (pen blue). */
  latest?: boolean;
  /** Display time, for example "30 Sep 2026, 09:12". */
  time?: string;
  /** Machine-readable time for the <time> element. */
  dateTime?: string;
  /** Actor role, for example "Procuring entity". */
  actor?: string;
  fingerprint?: string;
  /** Recomputed-fingerprint result shown next to the chip. */
  result?: VerificationResult;
  /** Short line for upcoming and sealed events, for example "28 Oct 2026". */
  note?: string;
  /** Replaces "Upcoming" or "Sealed", for example "Not reached" on a cancelled tender. */
  pendingLabel?: string;
  /** Shows the record box. Only one node on a spine is selected. */
  selected?: boolean;
  /** Link that selects this node's record. Omit for events with nothing to show yet. */
  href?: string;
};

function Marker({ state }: { state: SpineNodeState }) {
  switch (state) {
    case "completed":
      return <SpineMarkerDot />;
    case "current":
    case "mismatch":
      return <SpineMarkerRing />;
    case "sealed":
      return <IconLockKeyhole16 />;
    default:
      return <SpineMarkerHollow />;
  }
}

export function SpineNode({
  state,
  title,
  version,
  latest = false,
  time,
  dateTime,
  actor,
  fingerprint,
  result,
  note,
  pendingLabel,
  selected = false,
  href,
}: SpineNodeProps) {
  const pending = state === "upcoming" || state === "sealed";
  const mismatch = state === "mismatch";

  let heading: ReactNode = title;
  if (href) {
    heading = (
      <a href={href} className={styles.link} aria-current={selected ? "true" : undefined}>
        {title}
      </a>
    );
  }

  return (
    <li className={styles.node} data-state={state} data-selected={selected || undefined}>
      <span className={styles.marker}>
        <Marker state={state} />
      </span>

      {pending ? (
        <div className={styles.pendingBody}>
          <h3 className={styles.title}>{heading}</h3>
          <p className={styles.meta}>
            <span>{pendingLabel ?? (state === "sealed" ? "Sealed" : "Upcoming")}</span>
            {note ? <span>{note}</span> : null}
          </p>
        </div>
      ) : (
        <div className={styles.body}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>{heading}</h3>
            {version !== undefined ? (
              <span className={styles.version}>
                <VersionMark version={version} latest={latest} />
              </span>
            ) : null}
          </div>
          {time || actor ? (
            <p className={styles.meta}>
              {time ? <time dateTime={dateTime}>{time}</time> : null}
              {actor ? <span>{actor}</span> : null}
            </p>
          ) : null}
          {fingerprint || result ? (
            <div className={styles.proof}>
              {fingerprint ? <FingerprintChip value={fingerprint} tone={mismatch ? "mismatch" : "default"} /> : null}
              {result ? <VerificationMark result={result} /> : null}
            </div>
          ) : null}
        </div>
      )}
    </li>
  );
}

/** The spine: an ordered list of nodes on a continuous 2px rule. */
export function Spine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ol className={styles.spine} aria-label={label}>
      {children}
    </ol>
  );
}
