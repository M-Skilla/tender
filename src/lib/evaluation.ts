// Evaluation criteria and arithmetic (C2), shared by the form (browser) and the save action.

export const CRITERIA: { name: string; weight: number }[] = [
  { name: "Technical competence", weight: 30 },
  { name: "Methodology", weight: 25 },
  { name: "Equipment and personnel", weight: 20 },
  { name: "Price competitiveness", weight: 15 },
  { name: "Past performance", weight: 10 },
];

export const MIN_SCORE = 1;
export const MAX_SCORE = 20;

/** The values a committee member edits: one score per criterion (null = not scored) and a comment. */
export type EvaluationValues = { scores: (number | null)[]; comment: string };

/** Weighted value of one score: 14 at 30% is 4.2 (out of the criterion's share of 20). */
export function weighted(score: number | null, weight: number): number {
  return score === null ? 0 : (score * weight) / 100;
}

/** "51 / 100" and "11.0 / 20.0" in C2's total row. */
export function totals(scores: (number | null)[]): { raw: number; rawMax: number; weightedTotal: number } {
  const raw = scores.reduce<number>((sum, s) => sum + (s ?? 0), 0);
  const weightedTotal = CRITERIA.reduce((sum, c, i) => sum + weighted(scores[i] ?? null, c.weight), 0);
  return { raw, rawMax: CRITERIA.length * MAX_SCORE, weightedTotal };
}

/** A score field's value: a whole number from 1 to 20, empty for "not scored", or invalid. */
export function parseScore(value: string): { score: number | null; valid: boolean } {
  const trimmed = value.trim();
  if (trimmed === "") return { score: null, valid: true };
  const n = Number(trimmed);
  const valid = Number.isInteger(n) && n >= MIN_SCORE && n <= MAX_SCORE;
  return { score: valid ? n : null, valid };
}

/** The fields a person sees in C3, with display values. */
export function fieldsOf(values: EvaluationValues): { label: string; value: string }[] {
  return [
    ...CRITERIA.map((c, i) => ({ label: c.name, value: values.scores[i] === null || values.scores[i] === undefined ? "Not scored" : String(values.scores[i]) })),
    { label: "Comment", value: values.comment.trim() === "" ? "No comment" : values.comment.trim() },
  ];
}

/** True when two sets of values differ in any field. */
export function sameValues(a: EvaluationValues, b: EvaluationValues): boolean {
  return a.comment.trim() === b.comment.trim() && CRITERIA.every((_, i) => (a.scores[i] ?? null) === (b.scores[i] ?? null));
}
