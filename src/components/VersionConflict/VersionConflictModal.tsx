"use client";

import { useEffect, useRef, useState } from "react";
import { fieldsOf, type EvaluationValues } from "@/lib/evaluation";
import { Button } from "../Button/Button";
import { DiffLine, DiffList } from "../DiffLine/DiffLine";
import { IconAlertTriangle20 } from "../icons";
import styles from "./VersionConflictModal.module.css";

export type ConflictInfo = {
  mine: EvaluationValues;
  base: EvaluationValues;
  latest: EvaluationValues;
  baseVersion: number;
  latestVersion: number;
  savedBy: string;
  savedAt: string;
};

/**
 * C3: someone saved a newer version first. Shows the reader's changes beside the latest saved
 * version, only for fields either side changed. No option to overwrite; buttons are ordered by
 * safety. Opens with both columns in place (no slide-in).
 */
export function VersionConflictModal({
  conflict,
  onCancel,
  onLoadLatest,
}: {
  conflict: ConflictInfo;
  onCancel: () => void;
  onLoadLatest: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
    return () => el?.close();
  }, []);

  const mine = fieldsOf(conflict.mine);
  const base = fieldsOf(conflict.base);
  const latest = fieldsOf(conflict.latest);
  const rows = mine
    .map((field, i) => ({
      label: field.label,
      mine: field.value,
      base: base[i]!.value,
      latest: latest[i]!.value,
    }))
    .filter((row) => row.mine !== row.base || row.latest !== row.base);

  async function copyMine() {
    const text = mine.map((f) => `${f.label}: ${f.value}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className={styles.modal}
      aria-labelledby="conflict-title"
      aria-describedby="conflict-summary"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <div className={styles.header}>
        <h2 id="conflict-title" className={styles.title}>
          <IconAlertTriangle20 className={styles.icon} />
          Someone saved this evaluation before you
        </h2>
        <p id="conflict-summary" className={styles.summary}>
          {conflict.savedBy} saved version {conflict.latestVersion} at {conflict.savedAt}. You started from version{" "}
          {conflict.baseVersion}.
        </p>
      </div>
      <hr className={styles.rule} />
      <div className={styles.columns}>
        <section className={styles.column} aria-labelledby="conflict-mine">
          <h3 id="conflict-mine" className={styles.columnTitle}>
            Your changes
          </h3>
          <DiffList>
            {rows.map((row) => (
              <DiffLine key={row.label} label={row.label} value={row.mine} highlight={row.mine !== row.base} />
            ))}
          </DiffList>
        </section>
        <section className={styles.column} aria-labelledby="conflict-latest">
          <h3 id="conflict-latest" className={styles.columnTitle}>
            Latest saved (v{conflict.latestVersion})
          </h3>
          <DiffList>
            {rows.map((row) =>
              row.latest !== row.base ? (
                <DiffLine key={row.label} label={row.label} previous={row.base} value={row.latest} />
              ) : (
                <DiffLine key={row.label} label={row.label} value={row.latest} />
              ),
            )}
          </DiffList>
        </section>
      </div>
      <hr className={styles.rule} />
      <div className={styles.actions}>
        <Button variant="text" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="secondary" onClick={copyMine}>
          {copied ? "Copied" : "Copy my changes"}
        </Button>
        <Button onClick={onLoadLatest}>Load latest version</Button>
      </div>
      <span className="visually-hidden" aria-live="polite">
        {copied ? "Your changes were copied" : ""}
      </span>
    </dialog>
  );
}
