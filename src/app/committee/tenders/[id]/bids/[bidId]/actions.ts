"use server";

import { redirect } from "next/navigation";
import type { ConflictInfo } from "@/components/VersionConflict/VersionConflictModal";
import { NotAuthorizedError, requireActionUser } from "@/lib/auth";
import { CRITERIA, parseScore, totals, type EvaluationValues } from "@/lib/evaluation";
import { formatDateTime, formatTime } from "@/lib/format";
import type { Evaluation } from "@/lib/types";
import {
  evaluationAtVersion,
  evaluationKey,
  getEvaluation,
  saveEvaluation,
  VersionConflictError,
} from "@/services/amanadb";

export type SaveEvaluationState = {
  /** What the person submitted, so the form keeps it after an error or a conflict. */
  scores?: string[];
  comment?: string;
  errors?: (string | undefined)[];
  conflict?: ConflictInfo;
  error?: string;
};

const valuesOf = (e: Evaluation): EvaluationValues => ({ scores: e.criteria.map((c) => c.score), comment: e.comment });

/** "15:31" for today, otherwise "30 Sep 2026, 15:31". */
function when(iso: string): string {
  const today = formatDateTime(new Date().toISOString()).slice(0, 11);
  const full = formatDateTime(iso);
  return full.startsWith(today) ? formatTime(iso) : full;
}

// C2 Save: committee members only. Saves at the version the person started from; a newer
// version returns the C3 conflict instead of overwriting it.
export async function saveEvaluationAction(
  bidKey: string,
  returnTo: string,
  _prev: SaveEvaluationState,
  formData: FormData,
): Promise<SaveEvaluationState> {
  const scores = CRITERIA.map((_, i) => String(formData.get(`score-${i}`) ?? ""));
  const comment = String(formData.get("comment") ?? "");
  const baseVersion = Number(formData.get("baseVersion"));

  const parsed = scores.map(parseScore);
  const errors = parsed.map((p) => (p.valid ? undefined : `Enter a whole number from 1 to 20.`));
  if (errors.some(Boolean)) return { scores, comment, errors };

  const key = evaluationKey(bidKey);
  try {
    const user = await requireActionUser(["evaluator"]);
    const current = await getEvaluation(key);
    if (!current) return { scores, comment, error: "This evaluation no longer exists. Reload the page." };
    const values = parsed.map((p) => p.score);
    const data: Evaluation = {
      ...current.data,
      evaluatorId: user.userId,
      evaluatorName: user.name,
      criteria: CRITERIA.map((c, i) => ({ name: c.name, weight: c.weight, score: values[i] ?? null, comment: "" })),
      comment: comment.trim(),
      total: Math.round(totals(values).weightedTotal * 10) / 10,
    };
    await saveEvaluation(key, data, baseVersion);
  } catch (err) {
    if (err instanceof VersionConflictError) {
      const [latest, base] = await Promise.all([getEvaluation(key), evaluationAtVersion(key, baseVersion)]);
      if (latest && base) {
        return {
          scores,
          comment,
          conflict: {
            mine: { scores: parsed.map((p) => p.score), comment },
            base: valuesOf(base.data),
            latest: valuesOf(latest.data),
            baseVersion,
            latestVersion: latest.version,
            savedBy: latest.data.evaluatorName || "Another committee member",
            savedAt: when(latest.updatedAt),
          },
        };
      }
    }
    if (err instanceof NotAuthorizedError) return { scores, comment, error: err.message };
    return { scores, comment, error: "The evaluation could not be saved because the record service did not respond. Try again." };
  }
  redirect(`${returnTo}?saved=1`);
}
