"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import type { HistoryVersion } from "@/lib/record-history";
import { FingerprintChip } from "../FingerprintChip/FingerprintChip";
import { IconArrowRight12, IconXCircle14 } from "../icons";
import styles from "./RecordHistoryDrawer.module.css";

/**
 * P3: the tender record's versions in a drawer over the case file. A native modal dialog, so
 * focus stays inside and Escape closes it; closing returns to the case file's own URL.
 */
export function RecordHistoryDrawer({ reference, versions, closeHref }: { reference: string; versions: HistoryVersion[]; closeHref: string }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
    return () => el?.close();
  }, []);
  const close = () => router.push(closeHref, { scroll: false });

  return (
    <dialog
      ref={dialog}
      className={styles.drawer}
      aria-labelledby="history-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        // A click on the backdrop (the dialog element itself, outside the panel) closes it.
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 id="history-title" className={styles.title}>
            Record history
          </h2>
          <button type="button" className={styles.close} onClick={close} aria-label="Close record history">
            <IconXCircle14 />
          </button>
        </div>
        <p className={styles.subtitle}>
          Every version of {reference}, newest first. Earlier versions stay in AmanaDB&rsquo;s history; none can be erased.
        </p>
        <hr className={styles.rule} />
        <ol className={styles.list}>
          {versions.map((v) => (
            <li key={v.version} className={styles.version}>
              <div className={styles.titleRow}>
                <h3 className={v.latest ? styles.latest : styles.versionTitle}>
                  Version {v.version}
                  {v.latest ? " (latest)" : ""}
                </h3>
                <time dateTime={v.dateTime} className={styles.time}>
                  {v.time}
                </time>
              </div>
              <p className={styles.actor}>
                Actor: <strong>{v.actor}</strong>
              </p>
              <div className={styles.action}>Action: {v.action}</div>
              {v.changes.length > 0 ? (
                <div className={styles.changed}>
                  {v.changes.map((c) => (
                    <div key={c.label} className={styles.change}>
                      <p className={styles.changeLabel}>Field changed: {c.label}</p>
                      <p className={styles.values}>
                        {c.previous !== undefined ? (
                          <>
                            <del className={styles.old}>{c.previous}</del>
                            <IconArrowRight12 className={styles.arrow} aria-label="changed to" />
                          </>
                        ) : null}
                        <ins className={styles.new}>{c.value}</ins>
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
              <FingerprintChip value={v.fingerprint} />
            </li>
          ))}
        </ol>
      </div>
    </dialog>
  );
}
