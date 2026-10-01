"use client";

import { useState } from "react";
import { revealBidAction, type RevealResult } from "@/app/bidder/open/actions";
import { formatDateTime, formatTzs } from "@/lib/format";
import { Button, ButtonLink } from "../Button/Button";
import { FingerprintChip } from "../FingerprintChip/FingerprintChip";
import { IconAlertTriangle16, IconCloudUpload24 } from "../icons";
import { Stepper } from "../Stepper/Stepper";
import { VerificationBanner } from "../VerificationMark/VerificationMark";
import styles from "./OpenBidFlow.module.css";

type Receipt = {
  tender: string;
  tenderTitle: string;
  bidKey: string;
  bidReference: string;
  amount: number;
  docHash: string;
  docName: string;
  salt: string;
  commitment: string;
  submittedAt: string;
};

function isReceipt(value: unknown): value is Receipt {
  const r = value as Receipt;
  return Boolean(r && typeof r.bidKey === "string" && typeof r.amount === "number" && typeof r.salt === "string" && typeof r.commitment === "string");
}

/** B5: load the receipt and the sealed document, confirm, then see whether the bid matches. */
export function OpenBidFlow() {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [document, setDocument] = useState<File | null>(null);
  const [error, setError] = useState<string>();
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Extract<RevealResult, { ok: true }> | null>(null);

  async function loadReceipt(file: File | undefined) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!isReceipt(parsed)) throw new Error();
      setReceipt(parsed);
      setError(undefined);
    } catch {
      setReceipt(null);
      setError("This file is not a bid receipt. Load the receipt you downloaded when you sealed the bid.");
    }
  }

  async function reveal() {
    if (!receipt || !document) return;
    setPending(true);
    setError(undefined);
    const form = new FormData();
    form.set("bidKey", receipt.bidKey);
    form.set("amount", String(receipt.amount));
    form.set("salt", receipt.salt);
    form.set("document", document);
    const outcome = await revealBidAction(form);
    setPending(false);
    if (!outcome.ok) {
      setError(outcome.error);
      return;
    }
    setResult(outcome);
    setStep(2);
  }

  if (result && receipt) {
    return (
      <div className={styles.flow}>
        <h1 className="text-title">Open your bid</h1>
        {result.verified ? (
          <VerificationBanner result="matches">Your bid matches. The sealed fingerprint matches the bid you submitted.</VerificationBanner>
        ) : (
          <VerificationBanner result="does-not-match">
            Your bid does not match. The amount, document or code you revealed does not recompute to the fingerprint sealed at
            submission. Contact the procuring entity.
          </VerificationBanner>
        )}
        <section className={styles.sheet} aria-labelledby="result-title">
          <h2 id="result-title" className={styles.sheetTitle}>
            Verification result
          </h2>
          <dl className={styles.rows}>
            <div>
              <dt>Tender</dt>
              <dd>{result.tenderTitle}</dd>
            </div>
            <div>
              <dt>Your bid</dt>
              <dd className={styles.strong}>{formatTzs(result.amount)}</dd>
            </div>
            <div>
              <dt>Fingerprint at submission</dt>
              <dd>
                <FingerprintChip value={result.sealed} />
              </dd>
            </div>
            <div>
              <dt>Recomputed fingerprint</dt>
              <dd>
                <FingerprintChip value={result.recomputed} tone={result.verified ? "default" : "mismatch"} />
              </dd>
            </div>
          </dl>
        </section>
        <div>
          <ButtonLink href="/bidder/bids" variant="secondary" className={styles.wide}>
            Return to my bids
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.flow}>
      <h1 className="text-title">Open your bid</h1>
      <Stepper label="Open your bid" steps={["Load receipt", "Confirm", "Result"]} current={step} />
      <section className={styles.sheet} aria-labelledby="open-title">
        <h2 id="open-title" className={styles.sheetTitle}>
          {step === 0 ? "Load your receipt" : "Confirm your bid"}
        </h2>
        {step === 0 ? (
          <>
            <label className={styles.dropzone}>
              <IconCloudUpload24 className={styles.icon} />
              <span>{receipt ? `Receipt ${receipt.bidReference} loaded` : "Choose or drop the receipt file (receipt-BID-….json)"}</span>
              <input type="file" accept="application/json,.json" className={styles.fileInput} aria-label="Receipt file" onChange={(e) => loadReceipt(e.target.files?.[0])} />
            </label>
            <label className={styles.dropzone}>
              <IconCloudUpload24 className={styles.icon} />
              <span>{document ? document.name : `Choose or drop the bid document you sealed${receipt ? ` (${receipt.docName})` : ""}`}</span>
              <input type="file" className={styles.fileInput} aria-label="Bid document" onChange={(e) => setDocument(e.target.files?.[0] ?? null)} />
            </label>
          </>
        ) : (
          <dl className={styles.rows}>
            <div>
              <dt>Tender</dt>
              <dd>
                {receipt?.tenderTitle} ({receipt?.tender})
              </dd>
            </div>
            <div>
              <dt>Bid reference</dt>
              <dd>{receipt?.bidReference}</dd>
            </div>
            <div>
              <dt>Your bid</dt>
              <dd className={styles.strong}>{receipt ? formatTzs(receipt.amount) : ""}</dd>
            </div>
            <div>
              <dt>Sealed</dt>
              <dd>{receipt ? formatDateTime(receipt.submittedAt) : ""}</dd>
            </div>
            <div>
              <dt>Bid document</dt>
              <dd>{document?.name}</dd>
            </div>
          </dl>
        )}
        {error ? (
          <p className={styles.error} role="alert">
            <IconAlertTriangle16 /> {error}
          </p>
        ) : null}
      </section>
      <div className={styles.actions}>
        {step === 0 ? (
          <>
            <ButtonLink href="/bidder/bids" variant="secondary" className={styles.wide}>
              Cancel
            </ButtonLink>
            <Button className={styles.wide} disabled={!receipt || !document} onClick={() => setStep(1)}>
              Continue
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" className={styles.wide} onClick={() => setStep(0)} disabled={pending}>
              Back
            </Button>
            <Button className={styles.wide} onClick={reveal} loading={pending} loadingLabel="Opening bid">
              Open my bid
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
