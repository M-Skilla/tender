import type { ReactNode } from "react";
import { formatTzs } from "@/lib/format";
import { FingerprintChip } from "../FingerprintChip/FingerprintChip";
import { IconCheckCircle16 } from "../icons";
import { Toast } from "../Toast/Toast";
import { VerificationMark, type VerificationResult } from "../VerificationMark/VerificationMark";
import styles from "./EvaluationView.module.css";

export type EvaluationSummary = {
  tenderTitle: string;
  reference: string;
  bidderName: string;
  version: number;
  /** "Version 3, last saved by Amina Mussa (30 Sep 2026, 14:15)" or the unscored wording. */
  versionText: string;
  bid: {
    fingerprint: string;
    amount?: number;
    revealResult?: VerificationResult;
    documentHash?: string;
  };
};

/** C2 layout: version banner, header, bid summary beside the scoring form, sticky footer. */
export function EvaluationView({
  summary,
  header,
  form,
  saved = false,
}: {
  summary: EvaluationSummary;
  header: ReactNode;
  form: ReactNode;
  saved?: boolean;
}) {
  const { bid } = summary;
  return (
    <>
      {header}
      <main className={styles.page}>
        <div className={styles.versionBanner} role="status">
          <p className={styles.versionText}>
            <IconCheckCircle16 className={styles.versionIcon} />
            {summary.versionText}
          </p>
          <p className={styles.versionState}>Latest version loaded</p>
        </div>

        <div className={styles.heading}>
          <h1 className="text-title">{summary.tenderTitle}</h1>
          <p className={styles.meta}>
            <span>Bidder: {summary.bidderName}</span>
            <span>{summary.reference}</span>
          </p>
        </div>

        <div className={styles.split}>
          <section className={styles.summary} aria-labelledby="bid-summary">
            <h2 id="bid-summary" className={styles.sheetTitle}>
              Bid summary
            </h2>
            <hr className={styles.rule} />
            <dl className={styles.fields}>
              <div className={styles.field}>
                <dt>Bid amount</dt>
                <dd className={styles.amount}>{bid.amount !== undefined ? formatTzs(bid.amount) : "Not revealed"}</dd>
              </div>
              <div className={styles.field}>
                <dt>Sealed fingerprint</dt>
                <dd className={styles.proof}>
                  <FingerprintChip value={bid.fingerprint} />
                  {bid.revealResult ? <VerificationMark result={bid.revealResult} /> : null}
                </dd>
              </div>
              {bid.documentHash ? (
                <div className={styles.field}>
                  <dt>Bid document</dt>
                  <dd>
                    <FingerprintChip value={bid.documentHash} />
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>
          <div className={styles.scoring}>{form}</div>
        </div>
      </main>
      {saved ? <Toast aboveFooter>Evaluation saved</Toast> : null}
    </>
  );
}
