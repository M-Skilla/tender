"use client";

import { useActionState, useRef, useState } from "react";
import { recordAwardAction, type AwardState } from "@/app/entity/tenders/[id]/award/actions";
import type { Standing } from "@/lib/award";
import { formatTzs } from "@/lib/format";
import { Button, ButtonLink } from "../Button/Button";
import { ConfirmModal } from "../ConfirmModal/ConfirmModal";
import { Field } from "../Field/Field";
import { IconAlertTriangle16, IconAlertTriangle20, IconCheckCircle16 } from "../icons";
import { RuledTable, type RuledTableColumn } from "../RuledTable/RuledTable";
import styles from "./AwardDecisionForm.module.css";

// H4 widths: 280, 160, 160 and 160px columns plus Figma's 16px gaps, over 1280.
const COLUMNS: RuledTableColumn[] = [
  { key: "bidder", header: "Bidder", width: "23.13%" },
  { key: "technical", header: "Technical score", width: "13.75%" },
  { key: "price", header: "Price score", width: "13.75%" },
  { key: "total", header: "Total", width: "13.75%" },
  { key: "rank", header: "Rank" },
];

const ordinal = (n: number) => {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${s}`;
};
// Every score is a multiple of 0.25 (weights 30, 25, 20, 15, 10), so two decimals are exact and add up.
const pts = (n: number) => n.toFixed(2);

/** H4: the committee's ranked scores, the winner and the reason, recorded after a confirmation. */
export function AwardDecisionForm({
  tenderKey,
  version,
  reference,
  title,
  standings,
}: {
  tenderKey: string;
  version: number;
  reference: string;
  title: string;
  standings: Standing[];
}) {
  const [state, action, pending] = useActionState<AwardState, FormData>(recordAwardAction, {});
  const form = useRef<HTMLFormElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [winner, setWinner] = useState(state.winner ?? standings[0]?.bidKey ?? "");
  const [justification, setJustification] = useState(state.justification ?? "");
  const chosen = standings.find((s) => s.bidKey === winner);
  const errors = state.errors ?? {};
  const e = {
    winner: state.winner === winner ? errors.winner : undefined,
    justification: state.justification === justification.trim() ? errors.justification : undefined,
  };

  return (
    <form ref={form} action={action} className={styles.form} noValidate>
      <input type="hidden" name="tenderKey" value={tenderKey} />
      <input type="hidden" name="version" value={version} />
      <div className={styles.heading}>
        <h1 className="text-title">Award decision</h1>
        <p className={styles.subtitle}>
          Record the award for {reference}: {title}.
        </p>
      </div>

      <RuledTable
        caption="Committee scores, out of 100"
        columns={COLUMNS}
        density="compact"
        rows={standings.map((s) => ({
          id: s.bidKey,
          recommended: s.rank === 1,
          cells: {
            bidder: <span className={s.rank === 1 ? styles.strong : undefined}>{s.bidderName}</span>,
            technical: pts(s.technical),
            price: pts(s.price),
            total: <span className={s.rank === 1 ? styles.best : undefined}>{pts(s.total)}</span>,
            rank: <span className={s.rank === 1 ? styles.best : styles.muted}>{s.rank === 1 ? "1st (Recommended)" : ordinal(s.rank)}</span>,
          },
        }))}
      />

      <div className={styles.inputs}>
        <Field kind="select" label="Winning bid" name="winner" value={winner} onChange={(ev) => setWinner(ev.target.value)} error={e.winner}>
          {standings.map((s) => (
            <option key={s.bidKey} value={s.bidKey}>
              {s.bidderName} ({formatTzs(s.amount)})
            </option>
          ))}
        </Field>
        <Field
          kind="textarea"
          label="Justification"
          name="justification"
          value={justification}
          onChange={(ev) => setJustification(ev.target.value)}
          error={e.justification}
        />
      </div>

      <hr className={styles.rule} />
      <div className={styles.footer}>
        {state.error ? (
          <p className={`${styles.notice} ${styles.failed}`} role="alert">
            <IconAlertTriangle16 className={styles.noticeIcon} />
            {state.error}
          </p>
        ) : (
          <p className={styles.notice}>
            <IconCheckCircle16 className={`${styles.noticeIcon} ${styles.pine}`} />
            The award is recorded permanently and published with the tender.
          </p>
        )}
        <div className={styles.buttons}>
          <ButtonLink href="/entity" variant="text">
            Go back
          </ButtonLink>
          <Button className={styles.submit} loading={pending} loadingLabel="Recording award" onClick={() => setConfirming(true)}>
            Record award
          </Button>
        </div>
      </div>

      {confirming ? (
        <ConfirmModal
          title="Record this award?"
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
                Record award
              </Button>
            </>
          }
        >
          <p>
            {reference}: {chosen ? `${chosen.bidderName}, ${formatTzs(chosen.amount)}` : "No bid chosen"}
            {chosen && chosen.rank !== 1 ? ` (ranked ${ordinal(chosen.rank)})` : ""}
          </p>
          <p>The award and the tender&rsquo;s Awarded status are permanent. Every bidder and the public can see the award and its justification.</p>
        </ConfirmModal>
      ) : null}
    </form>
  );
}
