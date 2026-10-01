import type { ReactNode } from "react";
import type { CheckResult } from "@/lib/check-record";
import { ButtonLink } from "../Button/Button";
import { IconAlertTriangle24, IconCheckCircle24 } from "../icons";
import { VerificationMark } from "../VerificationMark/VerificationMark";
import { CheckForm } from "./CheckForm";
import styles from "./CheckRecordView.module.css";

const STORED: Record<string, { text: string; tone: "pine" | "waxRed" }> = {
  matches: { text: "Stored copy matches", tone: "pine" },
  "does-not-match": { text: "Stored copy does not match", tone: "waxRed" },
  missing: { text: "Stored copy missing", tone: "waxRed" },
};

/** P5: paste a fingerprint (or fingerprint a document) and see what it was recorded as. */
export function CheckRecordView({ header, value, result }: { header: ReactNode; value: string; result?: CheckResult }) {
  return (
    <>
      {header}
      <main className={styles.page}>
        <div className={styles.intro}>
          <h1 className="text-title">Check a record</h1>
          <p className={styles.lead}>
            Every version of every record in Tender Tracker has a fingerprint: a SHA-256 of its contents, kept in AmanaDB&rsquo;s audit
            trail from the moment it was written. Documents and sealed bids have fingerprints too.
          </p>
          <p className={styles.lead}>
            Paste a fingerprint, or choose a document to fingerprint it in your browser. The check shows which record version, sealed bid or
            document it belongs to, and whether that record still matches.
          </p>
        </div>

        <div className={styles.toolBox}>
          <CheckForm value={value} error={result?.kind === "invalid" ? "Enter a fingerprint of 64 characters, 0 to 9 and a to f." : undefined} />
        </div>

        {result?.kind === "none" ? (
          <div className={styles.banner} data-tone="waxRed" role="status">
            <IconAlertTriangle24 className={styles.bannerIcon} />
            <div className={styles.bannerText}>
              <p className={styles.bannerTitle}>No record has this fingerprint</p>
              <p>
                Check that all 64 characters were copied. A document or record that was changed after it was recorded has a different
                fingerprint, so it cannot be found.
              </p>
            </div>
          </div>
        ) : null}

        {result?.kind === "found" ? (
          <div className={styles.results}>
            <div className={styles.banner} data-tone="pine" role="status">
              <IconCheckCircle24 className={styles.bannerIcon} />
              <div className={styles.bannerText}>
                <p className={styles.bannerTitle}>{result.title}</p>
                <p>{result.sentence}</p>
              </div>
            </div>
            <section className={styles.sheet} aria-labelledby="record-details">
              <div className={styles.sheetHead}>
                <h2 id="record-details" className="text-record">
                  Record details
                </h2>
                {result.tender.key ? (
                  <ButtonLink href={`/tenders/${result.tender.key}`} variant="text" size="small">
                    Open case file
                  </ButtonLink>
                ) : null}
              </div>
              <hr className={styles.rule} />
              <dl className={styles.split}>
                <div>
                  <dt>Tender reference</dt>
                  <dd>{result.tender.reference}</dd>
                </div>
                <div>
                  <dt>Procuring entity</dt>
                  <dd>{result.tender.entity}</dd>
                </div>
                {result.details.map((d) => (
                  <div key={d.label}>
                    <dt>{d.label}</dt>
                    <dd>{d.value}</dd>
                  </div>
                ))}
                {result.current ? (
                  <div>
                    <dt>Current record</dt>
                    <dd>
                      <VerificationMark result={result.current} />
                    </dd>
                  </div>
                ) : null}
                {result.storedCopy ? (
                  <div>
                    <dt>Procuring entity&rsquo;s copy</dt>
                    <dd data-tone={STORED[result.storedCopy]!.tone}>{STORED[result.storedCopy]!.text}</dd>
                  </div>
                ) : null}
              </dl>
            </section>
          </div>
        ) : null}
      </main>
    </>
  );
}
