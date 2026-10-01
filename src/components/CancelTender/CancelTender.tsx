"use client";

import { useActionState, useState } from "react";
import { cancelTenderAction, type CancelState } from "@/app/entity/tenders/[id]/cancel/actions";
import { Button } from "../Button/Button";
import { ConfirmModal } from "../ConfirmModal/ConfirmModal";
import { Field } from "../Field/Field";
import { IconAlertTriangle20 } from "../icons";
import styles from "./CancelTender.module.css";

/** H5: "Cancel tender" on the procuring entity's own case file, and its destructive modal. */
export function CancelTender({ tenderKey, version, reference, title }: { tenderKey: string; version: number; reference: string; title: string }) {
  const [state, action, pending] = useActionState<CancelState, FormData>(cancelTenderAction, {});
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const fieldError = state.fieldError && state.reason === reason.trim() ? state.fieldError : undefined;

  return (
    <>
      <Button variant="secondary" size="small" onClick={() => setOpen(true)}>
        Cancel tender
      </Button>
      {open ? (
        <ConfirmModal
          title="Cancel tender"
          tone="destructive"
          icon={<IconAlertTriangle20 />}
          onCancel={() => setOpen(false)}
          actions={
            <>
              <Button variant="text" onClick={() => setOpen(false)} disabled={pending}>
                Go back
              </Button>
              <Button type="submit" form="cancel-tender" variant="destructive" loading={pending} loadingLabel="Cancelling tender">
                Cancel tender
              </Button>
            </>
          }
        >
          <form id="cancel-tender" action={action} className={styles.form} noValidate>
            <input type="hidden" name="tenderKey" value={tenderKey} />
            <input type="hidden" name="version" value={version} />
            <div className={styles.context}>
              <p className={styles.tender}>
                {reference}: {title}
              </p>
              <p>The tender and its full history stay on the public tracker with status Cancelled. This cannot be undone.</p>
            </div>
            <hr className={styles.rule} />
            <Field
              kind="textarea"
              label="Reason for cancellation"
              name="reason"
              value={reason}
              onChange={(ev) => setReason(ev.target.value)}
              placeholder="The reason, as it will appear on the public record"
              error={fieldError}
            />
            {state.error ? (
              <p className={styles.error} role="alert">
                {state.error}
              </p>
            ) : null}
          </form>
        </ConfirmModal>
      ) : null}
    </>
  );
}
