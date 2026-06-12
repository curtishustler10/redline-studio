// Diagnostic quiz scoring. Pure logic — copy lives in i18n, scores live here.
// Each question maps 1:1 to one of the 5 bricks; each option carries a score.

export const BRICK_KEYS = ["site", "capture", "followup", "seo", "acquisition"] as const;
export type BrickKey = (typeof BRICK_KEYS)[number];

// Question order → brick it scores. Index i in selections corresponds to QUESTION_BRICKS[i].
export const QUESTION_BRICKS: readonly BrickKey[] = BRICK_KEYS;

// Every question has 3 options, best → worst.
export const OPTION_SCORES = [2, 1, 0] as const;
export const MAX_SCORE = OPTION_SCORES[0];
export const QUESTION_COUNT = QUESTION_BRICKS.length;

export type BrickScore = { key: BrickKey; score: number; pct: number; zone: Zone };
export type Zone = "red" | "warn" | "ok";

function zoneFor(score: number): Zone {
  if (score <= 0) return "red";
  if (score === 1) return "warn";
  return "ok";
}

export type DiagnosticResult = {
  bricks: BrickScore[];
  weakest: BrickKey;
  totalPct: number;
};

/**
 * Score a completed quiz. `selections[i]` is the chosen option index (0..2) for
 * question i. Missing/invalid answers count as worst (score 0). The weakest
 * brick is the lowest score; ties resolve to the earliest brick (most foundational).
 */
export function scoreDiagnostic(selections: number[]): DiagnosticResult {
  const bricks: BrickScore[] = QUESTION_BRICKS.map((key, i) => {
    const sel = selections[i];
    const score = sel != null && OPTION_SCORES[sel] != null ? OPTION_SCORES[sel] : 0;
    return { key, score, pct: Math.round((score / MAX_SCORE) * 100), zone: zoneFor(score) };
  });

  let weakest = bricks[0];
  for (const b of bricks) if (b.score < weakest.score) weakest = b;

  const total = bricks.reduce((s, b) => s + b.score, 0);
  const totalPct = Math.round((total / (MAX_SCORE * QUESTION_COUNT)) * 100);

  return { bricks, weakest: weakest.key, totalPct };
}
