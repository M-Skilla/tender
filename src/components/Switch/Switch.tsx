"use client";

import styles from "./Switch.module.css";

/** P1 "Closing soon": a checkbox drawn as a 36x20 switch; toggling submits its GET form. */
export function Switch({ name, label, checked }: { name: string; label: string; checked: boolean }) {
  return (
    <label className={styles.wrap}>
      <span>{label}</span>
      <input
        type="checkbox"
        role="switch"
        name={name}
        value="1"
        defaultChecked={checked}
        className={styles.input}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      />
      <span className={styles.track} aria-hidden="true">
        <span className={styles.knob} />
      </span>
    </label>
  );
}
