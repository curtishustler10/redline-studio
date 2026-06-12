export type SimInputs = {
  visitors: number;
  capturePct: number;    // 0–40
  conversionPct: number; // 0–15
  basket: number;        // €
  frequency: number;     // purchases / year
  retentionPct: number;  // 0–80
};

export type SimResult = {
  leads: number;
  clients: number;
  monthly: number;
  yearly: number;
};

// Monthly revenue = clients * basket, lifted by repeat purchases.
// Repeat factor folds purchase frequency and retention into a single
// monthly multiplier: a fraction `retention` of clients buy again at the
// given yearly frequency (spread across 12 months).
function repeatFactor(frequency: number, retentionPct: number): number {
  const retention = Math.max(0, Math.min(retentionPct, 100)) / 100;
  const extraPerMonth = (Math.max(0, frequency - 1) * retention) / 12;
  return 1 + extraPerMonth;
}

export function computeRevenue(i: SimInputs): SimResult {
  const leads = Math.round(i.visitors * (i.capturePct / 100));
  const clients = Math.round(leads * (i.conversionPct / 100));
  const monthly = Math.round(clients * i.basket * repeatFactor(i.frequency, i.retentionPct));
  return { leads, clients, monthly, yearly: monthly * 12 };
}

// Site-only: weak capture/conversion/retention (a brochure site).
// Ecosystem: the inputs as configured (the full Redline stack).
export function computeComparison(i: SimInputs): {
  siteOnly: SimResult;
  ecosystem: SimResult;
} {
  const ecosystem = computeRevenue(i);
  const siteOnly = computeRevenue({
    ...i,
    capturePct: i.capturePct * 0.3,
    conversionPct: i.conversionPct * 0.5,
    retentionPct: i.retentionPct * 0.25,
  });
  return { siteOnly, ecosystem };
}
