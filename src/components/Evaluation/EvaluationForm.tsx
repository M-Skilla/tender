"use client";

import { useActionState, useMemo, useState } from "react";
import { CRITERIA, parseScore, totals, weighted } from "@/lib/evaluation";
import { Button } from "../Button/Button";
import { Field } from "../Field/Field";
import { VersionConflictModal, type ConflictInfo } from "../VersionConflict/VersionConflictModal";
import styles from "./EvaluationForm.module.css";

type State = { scores?: string[]; comment?: string; errors?: (string | undefined)[]; conflict?: ConflictInfo; error?: string };

/**
 * C2 scoring sheet with its running total and sticky footer. `action` is the bound server
 * action; it returns field errors, a general error, or a C3 conflict.
 */
export function EvaluationForm({
  action,
  version,
  initialScores,
  initialComment,
}: {
  action: (prev: State, formData: FormData) => Promise<State>;
  version: number;
  initialScores: (number | null)[];
  initialComment: string;
}) {
  const initial = useMemo(() => initialScores.map((s) => (s === null ? "" : String(s))), [initialScores]);
  const [state, formAction, pending] = useActionState(action, {});
  const [scores, setScores] = useState<string[]>(initial);
  const [comment, setComment] = useState(initialComment);
  const [dismissed, setDismissed] = useState<ConflictInfo | undefined>();

  const parsed = scores.map(parseScore);
  const { raw, rawMax, weightedTotal } = totals(parsed.map((p) => p.score));
  const dirty = comment !== initialComment || scores.some((s, i) => s.trim() !== initial[i]);
  const conflict = state.conflict && state.conflict !== dismissed ? state.conflict : undefined;

  return (
    <form action={formAction} className={styles.form} noValidate>
      <input type="hidden" name="baseVersion" value={version} />
      <div className={styles.sheet}>
        <h2 className={styles.sheetTitle}>Evaluation and scoring</h2>
        <table className={styles.table}>
          <caption className="visually-hidden">Scores by criterion</caption>
          <thead>
            <tr>
              <th scope="col">Criterion</th>
              <th scope="col" className={styles.number}>Weight</th>
              <th scope="col" className={styles.number}>Score (1 to 20)</th>
              <th scope="col" className={styles.number}>Weighted</th>
            </tr>
          </thead>
          <tbody>
            {CRITERIA.map((criterion, i) => {
              const error = state.errors?.[i] && scores[i] === state.scores?.[i] ? state.errors[i] : undefined;
              const id = `score-${i}`;
              return (
                <tr key={criterion.name}>
                  <th scope="row">
                    <span className={styles.criterion}>
                      <label htmlFor={id}>{criterion.name}</label>
                      {error ? (
                        <span id={`${id}-error`} className={styles.error}>
                          {error}
                        </span>
                      ) : null}
                    </span>
                  </th>
                  <td className={`${styles.number} ${styles.muted}`}>{criterion.weight}%</td>
                  <td className={styles.number}>
                    <input
                      id={id}
                      name={id}
                      inputMode="numeric"
                      className={styles.score}
                      value={scores[i]}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? `${id}-error` : undefined}
                      onChange={(e) => setScores((current) => current.map((s, j) => (j === i ? e.target.value : s)))}
                    />
                  </td>
                  <td className={`${styles.number} ${styles.mono}`}>{weighted(parsed[i]!.score, criterion.weight).toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Running total</th>
              <td className={`${styles.number} ${styles.muted}`}>100%</td>
              <td className={styles.number}>
                {raw} / {rawMax}
              </td>
              <td className={`${styles.number} ${styles.total}`}>{weightedTotal.toFixed(1)} / 20.0</td>
            </tr>
          </tfoot>
        </table>
        <div className={styles.comment}>
          <Field kind="textarea" label="Comment" name="comment" value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
      </div>

      <div className={styles.footer}>
        <p className={styles.status} data-dirty={dirty || undefined} role="status">
          <span className={styles.dot} aria-hidden="true" />
          {state.error ?? (dirty ? "Unsaved changes" : "All changes saved")}
        </p>
        <div className={styles.buttons}>
          <Button
            variant="secondary"
            disabled={!dirty || pending}
            onClick={() => {
              setScores(initial);
              setComment(initialComment);
            }}
          >
            Revert changes
          </Button>
          <Button type="submit" loading={pending} loadingLabel="Saving evaluation">
            Save evaluation
          </Button>
        </div>
      </div>

      {conflict ? (
        <VersionConflictModal
          conflict={conflict}
          onCancel={() => setDismissed(conflict)}
          onLoadLatest={() => window.location.assign(window.location.pathname)}
        />
      ) : null}
    </form>
  );
}
