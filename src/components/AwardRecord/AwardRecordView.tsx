import type { ReactNode } from "react";
import { ButtonLink } from "../Button/Button";
import { FingerprintChip } from "../FingerprintChip/FingerprintChip";
import { RecordFields } from "../RecordFields/RecordFields";
import { StatusLabel } from "../StatusLabel/StatusLabel";
import { Toast } from "../Toast/Toast";
import { VerificationMark, type VerificationResult } from "../VerificationMark/VerificationMark";
import { PrintButton } from "./PrintButton";
import styles from "./AwardRecordView.module.css";

export type AwardRecordData = {
  tenderKey: string;
  reference: string;
  title: string;
  winner: string;
  amount: string;
  decidedBy: string;
  decidedAt: string;
  result: VerificationResult;
  fingerprint: string;
  justification: string;
};

/** P4: a tender's award as a public document, with its fingerprint and whether it still matches. */
export function AwardRecordView({ header, award, toast }: { header: ReactNode; award: AwardRecordData; toast?: string }) {
  return (
    <>
      {header}
      <main className={styles.page}>
        <div className={styles.headerRow}>
          <div className={styles.heading}>
            <h1 className="text-title">Award record</h1>
            <p className={styles.subtitle}>The procuring entity&rsquo;s award decision, as recorded.</p>
          </div>
          <StatusLabel status="awarded" />
        </div>
        <article className={styles.sheet} aria-labelledby="award-title">
          <h2 id="award-title" className="text-section">
            {award.title}
          </h2>
          <hr className={styles.rule} />
          <RecordFields
            variant="document"
            fields={[
              { label: "Tender reference", value: <span className={styles.reference}>{award.reference}</span> },
              { label: "Winning bidder", value: <span className={styles.strong}>{award.winner}</span> },
              { label: "Award amount", value: <span className={styles.amount}>{award.amount}</span> },
              { label: "Decided by", value: award.decidedBy },
              { label: "Decision time", value: award.decidedAt },
              { label: "Verification", value: <VerificationMark result={award.result} /> },
              { label: "Record fingerprint", value: <FingerprintChip value={award.fingerprint} tone={award.result === "matches" ? "default" : "mismatch"} /> },
              { label: "Justification", value: <span className={styles.prose}>{award.justification}</span> },
            ]}
          />
        </article>
        <div className={styles.buttons}>
          <ButtonLink href={`/tenders/${award.tenderKey}`} variant="text">
            View case file
          </ButtonLink>
          <PrintButton />
          <ButtonLink href={`/check?fingerprint=${award.fingerprint}`} className={styles.primary}>
            Check this fingerprint
          </ButtonLink>
        </div>
      </main>
      {toast ? <Toast>{toast}</Toast> : null}
    </>
  );
}
