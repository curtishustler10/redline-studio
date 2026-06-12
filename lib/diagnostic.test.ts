import { describe, it, expect } from "vitest";
import { scoreDiagnostic, BRICK_KEYS, QUESTION_COUNT } from "./diagnostic";

describe("scoreDiagnostic", () => {
  it("all-best answers score 100% with no red zone", () => {
    const r = scoreDiagnostic(Array(QUESTION_COUNT).fill(0));
    expect(r.totalPct).toBe(100);
    expect(r.bricks.every((b) => b.zone === "ok")).toBe(true);
  });

  it("all-worst answers score 0% and every brick is red", () => {
    const r = scoreDiagnostic(Array(QUESTION_COUNT).fill(2));
    expect(r.totalPct).toBe(0);
    expect(r.bricks.every((b) => b.zone === "red")).toBe(true);
  });

  it("identifies the single weakest brick", () => {
    // best everywhere except the 3rd question (followup) worst
    const sel = [0, 0, 2, 0, 0];
    const r = scoreDiagnostic(sel);
    expect(r.weakest).toBe("followup");
    expect(r.bricks.find((b) => b.key === "followup")!.zone).toBe("red");
  });

  it("ties resolve to the earliest (most foundational) brick", () => {
    // questions 1 and 2 (site, capture) both worst
    const r = scoreDiagnostic([2, 2, 0, 0, 0]);
    expect(r.weakest).toBe("site");
  });

  it("missing answers count as worst", () => {
    const r = scoreDiagnostic([]);
    expect(r.totalPct).toBe(0);
    expect(r.bricks).toHaveLength(BRICK_KEYS.length);
  });

  it("midpoint answers map to the warn zone at 50%", () => {
    const r = scoreDiagnostic(Array(QUESTION_COUNT).fill(1));
    expect(r.totalPct).toBe(50);
    expect(r.bricks.every((b) => b.zone === "warn" && b.pct === 50)).toBe(true);
  });
});
