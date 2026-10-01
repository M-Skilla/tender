"use client";

import { useRef, useState } from "react";
import { Button } from "../Button/Button";
import { IconAlertTriangle16, IconHash16 } from "../icons";
import styles from "./CheckRecordView.module.css";

const hex = (buffer: ArrayBuffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

/**
 * P5's fingerprint field. A chosen document is fingerprinted in the browser (SHA-256, as the
 * app records documents) and never uploaded; the check itself is a plain GET of /check.
 */
export function CheckForm({ value, error }: { value: string; error?: string }) {
  const form = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [hashing, setHashing] = useState(false);

  async function fingerprintFile(file: File) {
    setHashing(true);
    try {
      const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
      if (input.current) input.current.value = hex(digest);
      form.current?.requestSubmit();
    } finally {
      setHashing(false);
    }
  }

  return (
    <form ref={form} method="get" action="/check" className={styles.tool} role="search">
      <div className={styles.inputRow}>
        <label className={styles.field} data-invalid={error ? true : undefined}>
          <IconHash16 className={styles.hashIcon} />
          <span className="visually-hidden">Fingerprint</span>
          <input
            ref={input}
            name="fingerprint"
            defaultValue={value}
            placeholder="Paste a 64-character fingerprint"
            spellCheck={false}
            autoComplete="off"
            className={styles.input}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "fingerprint-error" : undefined}
          />
        </label>
        <Button type="submit" className={styles.submit} loading={hashing} loadingLabel="Fingerprinting document">
          Check fingerprint
        </Button>
      </div>
      {error ? (
        <p id="fingerprint-error" className={styles.error}>
          <IconAlertTriangle16 />
          {error}
        </p>
      ) : null}
      <label className={styles.fileLabel}>
        Or choose a document to fingerprint it on this computer
        <input
          type="file"
          className={styles.fileInput}
          onChange={(ev) => {
            const file = ev.target.files?.[0];
            if (file) void fingerprintFile(file);
          }}
        />
      </label>
    </form>
  );
}
