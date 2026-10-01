"use client";

import { useActionState, useRef, useState } from "react";
import { publishTenderAction, type PublishState } from "@/app/entity/tenders/new/actions";
import { CATEGORIES } from "@/lib/tender-form";
import { Button, ButtonLink } from "../Button/Button";
import { ConfirmModal } from "../ConfirmModal/ConfirmModal";
import { Field } from "../Field/Field";
import { IconAlertCircle16, IconAlertTriangle20, IconCloudUpload24 } from "../icons";
import styles from "./CreateTenderForm.module.css";

const tzs = (digits: string) => {
  const n = Number(digits.replace(/[,\s]/g, ""));
  return digits && Number.isFinite(n) ? `TZS ${Math.round(n).toLocaleString("en-US")}` : "Not set";
};
const when = (value: string) => {
  if (!value) return "Not set";
  const [d, t] = value.split("T");
  const [y, m, day] = (d ?? "").split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day} ${months[Number(m) - 1] ?? ""} ${y}, ${t ?? ""}`;
};

/** H2: the form on the left, the read-only notice preview on the right, a confirmation to publish. */
export function CreateTenderForm({ reference, entity }: { reference: string; entity: string }) {
  const [state, action, pending] = useActionState<PublishState, FormData>(publishTenderAction, {});
  const form = useRef<HTMLFormElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [title, setTitle] = useState(state.values?.title ?? "");
  const [category, setCategory] = useState(state.values?.category ?? CATEGORIES[0]!);
  const [budget, setBudget] = useState(state.values?.budget ?? "");
  const [closeDate, setCloseDate] = useState(state.values?.closeDate ?? "");
  const [description, setDescription] = useState(state.values?.description ?? "");
  const [fileName, setFileName] = useState<string>("");
  // An error shows only while its field still holds the value that was submitted.
  const errors = state.errors ?? {};
  const submitted = state.values ?? {};
  const live = { title, category, budget, closeDate, description };
  const e = Object.fromEntries(
    Object.entries(errors).filter(([field]) =>
      field === "document" ? !fileName : submitted[field] === live[field as keyof typeof live],
    ),
  ) as typeof errors;

  return (
    <form ref={form} action={action} className={styles.form} noValidate>
      <div className={styles.columns}>
        <div className={styles.fields}>
          <Field label="Tender title" name="title" value={title} onChange={(ev) => setTitle(ev.target.value)} error={e.title} />
          <div className={styles.pair}>
            <Field label="Reference (assigned when published)" value={reference} disabled readOnly />
            <Field label="Procuring entity" value={entity} disabled readOnly />
          </div>
          <div className={styles.pair}>
            <Field kind="select" label="Category" name="category" value={category} onChange={(ev) => setCategory(ev.target.value)} error={e.category}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Field>
            <Field label="Budget ceiling (TZS)" name="budget" inputMode="numeric" value={budget} onChange={(ev) => setBudget(ev.target.value)} error={e.budget} />
          </div>
          <Field
            label="Closing date and time (East Africa Time)"
            name="closeDate"
            type="datetime-local"
            value={closeDate}
            onChange={(ev) => setCloseDate(ev.target.value)}
            error={e.closeDate}
          />
          <Field kind="textarea" label="Description" name="description" value={description} onChange={(ev) => setDescription(ev.target.value)} error={e.description} />
          <div className={styles.upload}>
            <span className={styles.uploadLabel} id="document-label">
              Tender document
            </span>
            <label className={styles.dropzone} data-invalid={e.document ? true : undefined}>
              <IconCloudUpload24 className={styles.uploadIcon} />
              <span>{fileName || "Choose or drop a PDF tender document"}</span>
              <input
                type="file"
                name="document"
                accept="application/pdf,.pdf"
                className={styles.fileInput}
                aria-labelledby="document-label"
                aria-describedby={e.document ? "document-error" : undefined}
                onChange={(ev) => setFileName(ev.target.files?.[0]?.name ?? "")}
              />
            </label>
            {e.document ? (
              <p id="document-error" className={styles.error}>
                {e.document}
              </p>
            ) : null}
          </div>
        </div>

        <aside className={styles.previewColumn} aria-label="Notice preview">
          <p className={styles.previewLabel}>Notice preview</p>
          <div className={styles.preview}>
            <div className={styles.previewTitle}>
              <h2>{title || "Tender title"}</h2>
              <p className={styles.mono}>Reference: {reference}</p>
            </div>
            <hr className={styles.rule} />
            <dl className={styles.grid}>
              <div>
                <dt>Procuring entity</dt>
                <dd>{entity}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{category}</dd>
              </div>
              <div>
                <dt>Budget ceiling</dt>
                <dd>{tzs(budget)}</dd>
              </div>
              <div>
                <dt>Closes</dt>
                <dd>{when(closeDate)}</dd>
              </div>
            </dl>
            <hr className={styles.rule} />
            <p className={styles.description}>{description || "The description appears here."}</p>
            <p className={styles.notice}>A fingerprint of the notice is recorded when you publish.</p>
          </div>
        </aside>
      </div>

      <hr className={styles.rule} />
      <div className={styles.footer}>
        <p className={styles.permanent}>
          <IconAlertCircle16 className={styles.permanentIcon} />
          {state.error ?? "The published record is permanent. It can be amended but not erased."}
        </p>
        <div className={styles.buttons}>
          <ButtonLink href="/" variant="text">
            Cancel
          </ButtonLink>
          <Button className={styles.publish} loading={pending} loadingLabel="Publishing tender" onClick={() => setConfirming(true)}>
            Publish tender
          </Button>
        </div>
      </div>

      {confirming ? (
        <ConfirmModal
          title="Publish this tender?"
          icon={<IconAlertTriangle20 />}
          onCancel={() => setConfirming(false)}
          actions={
            <>
              <Button variant="text" onClick={() => setConfirming(false)}>
                Go back
              </Button>
              <Button
                onClick={() => {
                  setConfirming(false);
                  form.current?.requestSubmit();
                }}
              >
                Publish tender
              </Button>
            </>
          }
        >
          <p>
            {reference}: {title || "Untitled tender"}
          </p>
          <p>The published record is permanent. It can be amended but not erased, and every change stays in its history.</p>
        </ConfirmModal>
      ) : null}
    </form>
  );
}
