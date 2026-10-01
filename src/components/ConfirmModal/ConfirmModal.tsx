"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./ConfirmModal.module.css";

/**
 * Standard and destructive confirmation (brief section 7: modal, standard and destructive).
 * A native dialog: focus stays inside, Escape cancels, no slide-in. Actions are passed in, in
 * order of safety (the safe choice first).
 */
export function ConfirmModal({
  title,
  icon,
  tone = "standard",
  children,
  actions,
  onCancel,
}: {
  title: string;
  icon?: ReactNode;
  tone?: "standard" | "destructive";
  children: ReactNode;
  actions: ReactNode;
  onCancel: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className={styles.modal}
      data-tone={tone}
      aria-labelledby="confirm-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <h2 id="confirm-title" className={styles.title}>
        {icon}
        {title}
      </h2>
      <div className={styles.body}>{children}</div>
      <hr className={styles.rule} />
      <div className={styles.actions}>{actions}</div>
    </dialog>
  );
}
