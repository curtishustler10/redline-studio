import { describe, it, expect } from "vitest";
import { dictionaries } from "./i18n";

// Recursively collect all dotted key paths of an object.
function keyPaths(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    keyPaths(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe("i18n dictionaries", () => {
  it("fr and en have identical key structure", () => {
    const fr = keyPaths(dictionaries.fr).sort();
    const en = keyPaths(dictionaries.en).sort();
    expect(en).toEqual(fr);
  });

  it("no string value is empty", () => {
    const allStrings = (obj: unknown): string[] =>
      obj === null || typeof obj !== "object"
        ? [String(obj)]
        : Object.values(obj as Record<string, unknown>).flatMap(allStrings);
    for (const s of [...allStrings(dictionaries.fr), ...allStrings(dictionaries.en)]) {
      expect(s.trim().length).toBeGreaterThan(0);
    }
  });
});
