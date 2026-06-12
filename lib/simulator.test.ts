import { describe, it, expect } from "vitest";
import { computeRevenue, type SimInputs } from "./simulator";

const base: SimInputs = {
  visitors: 10000,
  capturePct: 10,
  conversionPct: 5,
  basket: 80,
  frequency: 2,
  retentionPct: 30,
};

describe("computeRevenue", () => {
  it("computes leads from visitors and capture", () => {
    expect(computeRevenue(base).leads).toBe(1000); // 10000 * 10%
  });

  it("computes clients from leads and conversion", () => {
    expect(computeRevenue(base).clients).toBe(50); // 1000 * 5%
  });

  it("monthly revenue accounts for basket, frequency and retention uplift", () => {
    // clients(50) * basket(80) * (1 + frequency-weighted retention)
    const r = computeRevenue(base);
    expect(r.monthly).toBeGreaterThan(50 * 80);
    expect(Number.isFinite(r.monthly)).toBe(true);
  });

  it("yearly is twelve months", () => {
    const r = computeRevenue(base);
    expect(r.yearly).toBe(r.monthly * 12);
  });

  it("ecosystem scenario beats site-only scenario", () => {
    const { siteOnly, ecosystem } = computeComparison(base);
    expect(ecosystem.monthly).toBeGreaterThan(siteOnly.monthly);
  });

  it("zero visitors yields zero everything", () => {
    const r = computeRevenue({ ...base, visitors: 0 });
    expect(r.leads).toBe(0);
    expect(r.clients).toBe(0);
    expect(r.monthly).toBe(0);
  });
});

import { computeComparison } from "./simulator";
