"use client";

import { useState } from "react";
import { sealBidAction } from "@/app/bidder/tenders/[id]/bid/actions";
import { bidCommitment, sha256Hex } from "@/lib/commitment";
import { formatDateTime, formatTzs } from "@/lib/format";
import { Button, ButtonLink } from "../Button/Button";
import { Field } from "../Field/Field";
import { FingerprintChip } from "../FingerprintChip/FingerprintChip";
import { IconAlertTriangle16, IconCloudUpload24, IconLock14 } from "../icons";
import { RecordFields } from "../RecordFields/RecordFields";
import { StatusLabel } from "../StatusLabel/StatusLabel";
import { Stepper } from "../Stepper/Stepper";
import styles from "./SubmitBidFlow.module.css";

type Doc = { name: string; hash: string };
export type Receipt = {
  tender: string;
  tenderTitle: string;
  tenderKey: string;
  bidKey: string;
  bidReference: string;
  amount: number;
  docHash: string;
  docName: string;
  salt: string;
  commitment: string;
  submittedAt: string;
};

const STEPS = ["Bid details", "Review", "Seal and submit"];

function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * B3 and B4. The amount, the document and the salt stay in this browser: the document is hashed
 * here, the commitment is computed here, and only the commitment is sent (spec section 5.3).
 */
export function SubmitBidFlow({
  tenderKey,
  reference,
  title,
  closes,
}: {
  tenderKey: string;
  reference: string;
  title: string;
  closes: string;
}) {
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState("");
  const [doc, setDoc] = useState<Doc | null>(null);
  const [hashing, setHashing] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string; document?: string }>({});
  const [sealing, setSealing] = useState(false);
  const [sealError, setSealError] = useState<string>();
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const value = Number(amount.replace(/[,\s]/g, ""));

  async function chooseFile(file: File | undefined) {
    if (!file) return;
    setHashing(true);
    const hash = await sha256Hex(new Uint8Array(await file.arrayBuffer()));
    setDoc({ name: file.name, hash });
    setErrors((e) => ({ ...e, document: undefined }));
    setHashing(false);
  }

  function toReview() {
    const next: typeof errors = {};
    if (!amount || !Number.isInteger(value) || value <= 0) next.amount = "Enter your bid amount in shillings, digits only.";
    if (!doc) next.document = "Choose the bid document. It stays on this device until you open your bid.";
    setErrors(next);
    if (!next.amount && !next.document) setStep(1);
  }

  async function seal() {
    if (!doc) return;
    setSealing(true);
    setSealError(undefined);
    const salt = randomSalt();
    const commitment = await bidCommitment({ amount: value, docHash: doc.hash, salt });
    const result = await sealBidAction(tenderKey, commitment);
    setSealing(false);
    if (!result.ok) {
      setSealError(result.error);
      return;
    }
    setReceipt({
      tender: reference,
      tenderTitle: title,
      tenderKey,
      bidKey: result.bidKey,
      bidReference: result.reference,
      amount: value,
      docHash: doc.hash,
      docName: doc.name,
      salt,
      commitment,
      submittedAt: result.submittedAt,
    });
  }

  if (receipt) return <BidReceipt receipt={receipt} />;


  return (
    <div className={styles.flow}>
      <div className={`${styles.context} mobile-band`}>
        <p className={styles.contextLine}>Submit a bid for {reference}</p>
        <h1 className={styles.contextTitle}>{title}</h1>
      </div>
      <Stepper label="Submit bid" steps={STEPS} shortSteps={["Details", "Review", "Seal"]} current={step} />
      <p className={styles.notice}>
        <IconLock14 className={styles.noticeIcon} />
        Only a fingerprint of your bid is stored until the closing time. Your bid details remain sealed.
      </p>

      {step === 0 ? (
        <section className={styles.sheet} aria-labelledby="details-title">
          <h2 id="details-title" className={styles.sheetTitle}>
            Bid details
          </h2>
          <Field
            label="Bid amount (TZS)"
            name="amount"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={errors.amount}
          />
          <div className={styles.upload}>
            <span className={styles.uploadLabel} id="bid-document">
              Bid document
            </span>
            <label className={styles.dropzone} data-invalid={errors.document ? true : undefined}>
              <IconCloudUpload24 className={styles.uploadIcon} />
              <span>{hashing ? "Computing the document fingerprint" : doc ? doc.name : "Choose or drop your bid document"}</span>
              <input
                type="file"
                className={styles.fileInput}
                aria-labelledby="bid-document"
                onChange={(e) => chooseFile(e.target.files?.[0])}
              />
            </label>
            {doc ? (
              <p className={styles.docLine}>
                Document fingerprint <FingerprintChip value={doc.hash} />
              </p>
            ) : null}
            <p className={styles.muted}>The document stays on this device. You upload it when you open your bid after the closing time.</p>
            {errors.document ? <p className={styles.error}>{errors.document}</p> : null}
          </div>
          <div className={styles.actions}>
            <ButtonLink href={`/tenders/${tenderKey}`} variant="secondary" className={styles.wide}>
              Cancel
            </ButtonLink>
            <Button className={styles.wide} onClick={toReview} disabled={hashing}>
              Continue to review
            </Button>
          </div>
        </section>
      ) : (
        <section className={styles.sheet} aria-labelledby="review-title">
          <h2 id="review-title" className={styles.sheetTitle}>
            {step === 1 ? "Bid summary review" : "Seal and submit"}
          </h2>
          <RecordFields
            fields={[
              { label: "Tender", value: `${title} (${reference})` },
              { label: "Bid amount", value: <strong>{formatTzs(value)}</strong> },
              { label: "Bid document", value: doc?.name ?? "" },
              { label: "Document fingerprint", value: doc ? <FingerprintChip value={doc.hash} /> : "" },
              { label: "Closes", value: closes },
            ]}
          />
          {step === 2 ? (
            <p className={styles.muted}>
              Sealing combines your amount, your document fingerprint and a random code into one fingerprint. Only that
              fingerprint is sent. Your receipt holds the rest; keep it to open your bid.
            </p>
          ) : null}
          {sealError ? (
            <p className={styles.error} role="alert">
              <IconAlertTriangle16 /> {sealError}
            </p>
          ) : null}
          <div className={styles.actions}>
            <Button variant="secondary" className={styles.wide} onClick={() => setStep(step - 1)} disabled={sealing}>
              Back
            </Button>
            {step === 1 ? (
              <Button className={styles.wide} onClick={() => setStep(2)}>
                Continue to seal
              </Button>
            ) : (
              <Button className={styles.wide} onClick={seal} loading={sealing} loadingLabel="Sealing bid">
                Seal and submit
              </Button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

/** B4: the receipt after sealing, with the file the bidder keeps to open the bid (B5). */
export function BidReceipt({ receipt }: { receipt: Receipt }) {
  function download() {
    const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${receipt.bidReference}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className={styles.receipt} aria-labelledby="receipt-title">
      <div className={styles.receiptHeader}>
        <h1 id="receipt-title" className="text-title">
          Bid submitted
        </h1>
        <p className={styles.muted}>Your sealed bid has been recorded.</p>
      </div>
      <hr className={styles.rule} />
      <dl className={styles.receiptRows}>
        <div>
          <dt>Tender</dt>
          <dd>{receipt.tenderTitle}</dd>
        </div>
        <div>
          <dt>Bid reference</dt>
          <dd>{receipt.bidReference}</dd>
        </div>
        <div>
          <dt>Fingerprint</dt>
          <dd>
            <FingerprintChip value={receipt.commitment} />
          </dd>
        </div>
        <div>
          <dt>Submitted</dt>
          <dd>{formatDateTime(receipt.submittedAt)}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <StatusLabel status="sealed" />
          </dd>
        </div>
      </dl>
      <hr className={styles.rule} />
      <div className={styles.receiptFooter}>
        <p className={styles.keep}>Keep this receipt. You need it to open your bid.</p>
        <Button variant="secondary" size="small" className={styles.download} onClick={download}>
          Download receipt
        </Button>
      </div>
    </section>
  );
}
