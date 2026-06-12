# Redline Funnel Site Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the redlinestudio.agency homepage as a dark-forward, bilingual (FR/EN) conversion funnel with an interactive revenue simulator and two pricing tiers.

**Architecture:** Next.js 14 App Router. All user-facing copy lives in one `lib/i18n.ts` dictionary (fr/en); a `LangProvider` context exposes the active dictionary as `t` plus a `setLang` toggle persisted to localStorage. Section components are thin presentational readers of `t`. The only non-trivial logic — the simulator revenue maths — lives in a pure `lib/simulator.ts` module, unit-tested with vitest. The current homepage is preserved at `/classic`.

**Tech Stack:** Next.js 14.2, TypeScript, Tailwind, framer-motion, shadcn/ui (Slider), vitest.

**Spec:** `docs/superpowers/specs/2026-06-12-redline-funnel-redesign-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `app/globals.css` | Dark-forward design tokens |
| `app/classic/page.tsx` | Preserved current homepage |
| `app/page.tsx` | New funnel composition |
| `lib/i18n.ts` | FR/EN dictionaries + `Dict` type |
| `lib/simulator.ts` | Pure revenue maths |
| `lib/simulator.test.ts` | Simulator unit tests |
| `lib/i18n.test.ts` | FR/EN key-parity test |
| `components/lang-provider.tsx` | Lang context + `useLang()` hook |
| `components/funnel/nav.tsx` | Numbered nav + scroll progress + FR/EN toggle |
| `components/funnel/hero.tsx` | 01 Hero |
| `components/funnel/diagnostic.tsx` | 02 Le diagnostic |
| `components/funnel/briques.tsx` | 03 Les 5 briques |
| `components/funnel/simulator.tsx` | 04 Simulateur CA (client) |
| `components/funnel/cases.tsx` | 05 Cas clients |
| `components/funnel/deliverables.tsx` | 06 Ce que vous recevez |
| `components/funnel/method.tsx` | 07 La méthode |
| `components/funnel/offers.tsx` | 08 Offres + closing |
| `vitest.config.ts` | Test config |

---

## Task 0: Tooling + branding tokens + preserve classic homepage

**Files:**
- Modify: `package.json` (scripts + devDeps)
- Create: `vitest.config.ts`
- Modify: `app/globals.css`
- Create: `app/classic/page.tsx`

- [ ] **Step 1: Install vitest**

Run: `pnpm add -D vitest`
Expected: vitest added to devDependencies.

- [ ] **Step 2: Add test script**

Modify `package.json` scripts to add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Preserve current homepage at /classic**

Read current `app/page.tsx` (the Header/SideNav/Hero… composition) and copy it verbatim into a new file `app/classic/page.tsx`, renaming the default export to `ClassicHome`. Do NOT modify `app/page.tsx` yet — it is overwritten in Task 11.

- [ ] **Step 5: Replace dark-forward tokens in globals.css**

In `app/globals.css`, replace the `body` background/color and the `:root` block with dark-forward values. Set:
```css
body {
  background-color: #161210;
  color: #ECE3D7;
  position: relative;
}
```
Keep the existing `body::before` paper-grain block but change its `opacity` to `0.05`. Under `:root`, set these CSS custom properties (leave shadcn HSL vars intact, just add ours):
```css
:root {
  --rl-bg: #161210;
  --rl-surface: #1E1813;
  --rl-surface-2: #262019;
  --rl-ink: #ECE3D7;
  --rl-muted: #A89A86;
  --rl-red: #C41F1F;
  --rl-red-hover: #E03030;
  --rl-line: rgba(236,227,215,0.14);
}
```

- [ ] **Step 6: Verify build still compiles**

Run: `pnpm exec tsc --noEmit`
Expected: no errors (classic page is valid, tokens are CSS-only).

- [ ] **Step 7: Commit**

```bash
git add package.json vitest.config.ts app/globals.css app/classic/page.tsx pnpm-lock.yaml
git commit -m "chore: add vitest, dark tokens, preserve classic homepage"
```

---

## Task 1: i18n dictionaries + parity test

**Files:**
- Create: `lib/i18n.ts`
- Test: `lib/i18n.test.ts`

- [ ] **Step 1: Write the failing parity test**

Create `lib/i18n.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test`
Expected: FAIL — cannot import `./i18n` (module not found).

- [ ] **Step 3: Create the dictionary**

Create `lib/i18n.ts`. Define one `fr` object with all copy below, an `en` object mirroring it exactly, export `dictionaries = { fr, en }`, and `export type Dict = typeof dictionaries.fr;` and `export type Lang = "fr" | "en";`.

Use this exact content (FR shown; EN is the parallel translation, same keys):

```ts
export type Lang = "fr" | "en";

const fr = {
  nav: {
    items: ["Bienvenue", "Diagnostic", "Les 5 briques", "Simulateur", "Cas clients", "Ce que vous recevez", "La méthode", "Offres"],
    cta: "Réserver un appel",
  },
  hero: {
    kicker: "Studio web · conversion & écosystèmes",
    titleA: "Un site seul ne vend pas.",
    titleB: "Un écosystème, oui.",
    sub: "La plupart des sites sont de jolies brochures qui ne rapportent rien. Nous construisons l'écosystème complet — site qui convertit, réservation, suivi, SEO local, acquisition — pour transformer vos visiteurs en clients.",
    cta: "Commencer le diagnostic",
    chips: ["5 briques analysées", "12 min", "100% personnalisé"],
  },
  diagnostic: {
    title: "Le diagnostic",
    sub: "Trois étapes pour comprendre ce qui freine vos ventes en ligne.",
    steps: [
      { icon: "🎯", title: "On audite votre présence", body: "Site, réservation, avis, référencement local : on mesure chaque brique et on repère les fuites." },
      { icon: "💰", title: "On chiffre le manque à gagner", body: "Avec vos chiffres réels, on estime le chiffre d'affaires que vous laissez sur la table chaque mois." },
      { icon: "⚡", title: "On vous remet un plan clair", body: "Priorités, gains attendus, délais. Vous repartez avec une feuille de route actionnable, sans jargon." },
    ],
  },
  briques: {
    title: "Les 5 briques d'un écosystème qui vend",
    sub: "Un site n'est qu'une brique. Il en faut cinq pour transformer l'attention en revenus.",
    items: [
      { n: "01", title: "Site qui convertit", body: "Rapide, clair, orienté action. Chaque page a un objectif et le guide vers le clic." },
      { n: "02", title: "Capture & réservation", body: "Formulaire, prise de rendez-vous, devis en ligne : on ne laisse jamais repartir un visiteur intéressé." },
      { n: "03", title: "Suivi automatisé", body: "Email et WhatsApp : confirmations, rappels, relances. Le suivi qui fait revenir et acheter." },
      { n: "04", title: "SEO local", body: "Fiche Google, mots-clés de proximité, avis : on vous rend visible là où vos clients cherchent." },
      { n: "05", title: "Acquisition", body: "Publicité ciblée quand c'est pertinent, pour amorcer la pompe et accélérer les résultats." },
    ],
  },
  simulator: {
    title: "Simulateur de chiffre d'affaires",
    sub: "Réglez vos chiffres. Voyez l'écart entre un site seul et un écosystème complet.",
    inputs: {
      visitors: "Visiteurs / mois",
      capture: "Taux de capture",
      conversion: "Taux de conversion",
      basket: "Panier moyen",
      frequency: "Fréquence d'achat / an",
      retention: "Rétention",
    },
    outputs: {
      leads: "Leads captés",
      clients: "Clients",
      monthly: "CA mensuel",
      yearly: "CA annuel",
    },
    compareSite: "Site seul",
    compareEco: "Écosystème Redline",
    note: "Estimation indicative basée sur vos réglages. Les résultats réels dépendent de votre marché.",
  },
  cases: {
    title: "Cas clients",
    sub: "Des entreprises réelles, des briques manquantes comblées, des résultats.",
    items: [
      { sector: "Institut de beauté · Paris", quote: "Réservation en ligne, suivi fidélité, paiement sur place.", problem: "Tout passait par téléphone et Instagram : créneaux perdus, no-shows, aucune base client.", missing: "Capture & réservation + suivi", fix: "Plateforme de réservation multi-prestations, comptes clients, rappels automatiques.", metric: "+40%", metricLabel: "de réservations en ligne" },
      { sector: "Resort · Bali", quote: "Site de réservation bilingue, calendrier en temps réel.", problem: "Aucun moyen de réserver en ligne, demandes éparpillées sur WhatsApp.", missing: "Site qui convertit + réservation", fix: "Site bilingue EN/RU, calendrier, formulaire qualifié, automatisations.", metric: "8+", metricLabel: "demandes qualifiées dès le lancement" },
      { sector: "Marque cheveux · DTC", quote: "Diagnostic ROAS et tunnel d'achat optimisé.", problem: "Budget publicitaire brûlé, panier abandonné, ROAS sous l'objectif.", missing: "Acquisition + suivi", fix: "Tableau de bord ROAS, relances panier, merchandising salon.", metric: "3,48x", metricLabel: "ROAS au pic" },
    ],
  },
  deliverables: {
    title: "Ce que vous recevez",
    sub: "Du concret, livré clé en main.",
    items: [
      { icon: "🖥️", label: "Site sur-mesure" },
      { icon: "📅", label: "Moteur de réservation" },
      { icon: "📍", label: "Configuration SEO local" },
      { icon: "📊", label: "Tableau de bord analytics" },
      { icon: "✉️", label: "Suivi email / WhatsApp" },
      { icon: "🛡️", label: "Plan de maintenance" },
      { icon: "🎨", label: "Identité & visuels" },
      { icon: "🚀", label: "Mise en ligne & formation" },
    ],
  },
  method: {
    title: "La méthode",
    sub: "Huit étapes, de l'audit à la croissance.",
    steps: [
      { n: "01", title: "Audit", body: "On analyse votre présence et vos chiffres." },
      { n: "02", title: "Design", body: "Maquettes orientées conversion, validées avec vous." },
      { n: "03", title: "Développement", body: "Site rapide, responsive, sans dette technique." },
      { n: "04", title: "Réservation", body: "Prise de rendez-vous et capture intégrées." },
      { n: "05", title: "SEO local", body: "Fiche Google, mots-clés, structure optimisée." },
      { n: "06", title: "Lancement", body: "Mise en ligne, tests, formation à la prise en main." },
      { n: "07", title: "Acquisition", body: "Publicité ciblée pour amorcer le trafic." },
      { n: "08", title: "Suivi", body: "Mesure, ajustements, croissance continue." },
    ],
  },
  offers: {
    title: "Deux façons de démarrer",
    sub: "Un site qui convertit, ou l'écosystème complet. Vous choisissez.",
    tiers: [
      {
        name: "Site Conversion",
        price: "1 490 €",
        tagline: "Le site qui transforme vos visiteurs en demandes.",
        features: ["Site 5 pages sur-mesure", "Formulaire de capture", "Fiche Google Business", "Optimisé mobile & rapide", "Mise en ligne incluse"],
        cta: "Réserver un appel",
        recommended: false,
      },
      {
        name: "Écosystème complet",
        price: "2 890 €",
        tagline: "Les 5 briques réunies pour vendre en continu.",
        features: ["Tout le Site Conversion", "★ Moteur de réservation", "★ Suivi email / WhatsApp", "★ SEO local complet", "★ Acquisition & analytics"],
        cta: "Réserver un appel",
        recommended: true,
      },
    ],
    paymentNote: "Paiement en 3× sans frais possible.",
    badge: "Recommandé",
  },
  closing: {
    title: "Votre site travaille pour vous, ou contre vous.",
    sub: "Faites le diagnostic, voyez le manque à gagner, et décidez en connaissance de cause.",
    primary: "Commencer le diagnostic",
    secondary: "Réserver un appel",
  },
  footer: {
    rights: "Tous droits réservés.",
    tagline: "Studio web — conversion & écosystèmes.",
  },
} as const;

const en = {
  nav: {
    items: ["Welcome", "Diagnostic", "The 5 bricks", "Simulator", "Case studies", "What you get", "The method", "Offers"],
    cta: "Book a call",
  },
  hero: {
    kicker: "Web studio · conversion & ecosystems",
    titleA: "A website alone doesn't sell.",
    titleB: "An ecosystem does.",
    sub: "Most websites are pretty brochures that earn nothing. We build the full ecosystem — a converting site, booking, follow-up, local SEO, acquisition — to turn your visitors into customers.",
    cta: "Start the diagnostic",
    chips: ["5 bricks analysed", "12 min", "100% tailored"],
  },
  diagnostic: {
    title: "The diagnostic",
    sub: "Three steps to understand what's holding back your online sales.",
    steps: [
      { icon: "🎯", title: "We audit your presence", body: "Site, booking, reviews, local search: we measure every brick and find the leaks." },
      { icon: "💰", title: "We quantify the lost revenue", body: "Using your real numbers, we estimate the revenue you leave on the table every month." },
      { icon: "⚡", title: "We hand you a clear plan", body: "Priorities, expected gains, timelines. You leave with an actionable roadmap, no jargon." },
    ],
  },
  briques: {
    title: "The 5 bricks of an ecosystem that sells",
    sub: "A website is just one brick. It takes five to turn attention into revenue.",
    items: [
      { n: "01", title: "A converting site", body: "Fast, clear, action-driven. Every page has a goal and guides toward the click." },
      { n: "02", title: "Capture & booking", body: "Forms, appointments, online quotes: we never let an interested visitor walk away." },
      { n: "03", title: "Automated follow-up", body: "Email and WhatsApp: confirmations, reminders, win-backs. The follow-up that brings people back." },
      { n: "04", title: "Local SEO", body: "Google profile, local keywords, reviews: we make you visible where your customers search." },
      { n: "05", title: "Acquisition", body: "Targeted ads when it makes sense, to prime the pump and speed up results." },
    ],
  },
  simulator: {
    title: "Revenue simulator",
    sub: "Set your numbers. See the gap between a website alone and a full ecosystem.",
    inputs: {
      visitors: "Visitors / month",
      capture: "Capture rate",
      conversion: "Conversion rate",
      basket: "Average basket",
      frequency: "Purchases / year",
      retention: "Retention",
    },
    outputs: {
      leads: "Leads captured",
      clients: "Customers",
      monthly: "Monthly revenue",
      yearly: "Annual revenue",
    },
    compareSite: "Website alone",
    compareEco: "Redline ecosystem",
    note: "Indicative estimate based on your settings. Real results depend on your market.",
  },
  cases: {
    title: "Case studies",
    sub: "Real businesses, missing bricks filled, results.",
    items: [
      { sector: "Beauty salon · Paris", quote: "Online booking, loyalty tracking, pay on site.", problem: "Everything ran through phone and Instagram: lost slots, no-shows, no customer base.", missing: "Capture & booking + follow-up", fix: "Multi-service booking platform, customer accounts, automated reminders.", metric: "+40%", metricLabel: "online bookings" },
      { sector: "Resort · Bali", quote: "Bilingual booking site, real-time calendar.", problem: "No way to book online, requests scattered across WhatsApp.", missing: "Converting site + booking", fix: "EN/RU bilingual site, calendar, qualified form, automations.", metric: "8+", metricLabel: "qualified requests at launch" },
      { sector: "Hair brand · DTC", quote: "ROAS diagnostic and optimised purchase funnel.", problem: "Ad budget burned, carts abandoned, ROAS below target.", missing: "Acquisition + follow-up", fix: "ROAS dashboard, cart win-backs, salon merchandising.", metric: "3.48x", metricLabel: "peak ROAS" },
    ],
  },
  deliverables: {
    title: "What you get",
    sub: "Concrete work, delivered turnkey.",
    items: [
      { icon: "🖥️", label: "Custom website" },
      { icon: "📅", label: "Booking engine" },
      { icon: "📍", label: "Local SEO setup" },
      { icon: "📊", label: "Analytics dashboard" },
      { icon: "✉️", label: "Email / WhatsApp follow-up" },
      { icon: "🛡️", label: "Maintenance plan" },
      { icon: "🎨", label: "Branding & visuals" },
      { icon: "🚀", label: "Launch & training" },
    ],
  },
  method: {
    title: "The method",
    sub: "Eight steps, from audit to growth.",
    steps: [
      { n: "01", title: "Audit", body: "We analyse your presence and your numbers." },
      { n: "02", title: "Design", body: "Conversion-focused mockups, validated with you." },
      { n: "03", title: "Development", body: "Fast, responsive site with no technical debt." },
      { n: "04", title: "Booking", body: "Appointments and capture built in." },
      { n: "05", title: "Local SEO", body: "Google profile, keywords, optimised structure." },
      { n: "06", title: "Launch", body: "Go-live, testing, hands-on training." },
      { n: "07", title: "Acquisition", body: "Targeted ads to prime traffic." },
      { n: "08", title: "Follow-up", body: "Measure, adjust, grow continuously." },
    ],
  },
  offers: {
    title: "Two ways to start",
    sub: "A converting site, or the full ecosystem. You choose.",
    tiers: [
      {
        name: "Conversion Site",
        price: "€1,490",
        tagline: "The site that turns visitors into enquiries.",
        features: ["Custom 5-page site", "Capture form", "Google Business profile", "Mobile-optimised & fast", "Launch included"],
        cta: "Book a call",
        recommended: false,
      },
      {
        name: "Full Ecosystem",
        price: "€2,890",
        tagline: "All 5 bricks together to sell continuously.",
        features: ["Everything in Conversion Site", "★ Booking engine", "★ Email / WhatsApp follow-up", "★ Full local SEO", "★ Acquisition & analytics"],
        cta: "Book a call",
        recommended: true,
      },
    ],
    paymentNote: "3 interest-free instalments available.",
    badge: "Recommended",
  },
  closing: {
    title: "Your website works for you, or against you.",
    sub: "Run the diagnostic, see the lost revenue, and decide with eyes open.",
    primary: "Start the diagnostic",
    secondary: "Book a call",
  },
  footer: {
    rights: "All rights reserved.",
    tagline: "Web studio — conversion & ecosystems.",
  },
} as const;

export const dictionaries = { fr, en };
export type Dict = typeof fr;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test`
Expected: PASS (both tests green). If parity fails, fix the mismatched key in `en`.

- [ ] **Step 5: Commit**

```bash
git add lib/i18n.ts lib/i18n.test.ts
git commit -m "feat: bilingual dictionary with FR/EN parity test"
```

---

## Task 2: Simulator pure maths (TDD)

**Files:**
- Create: `lib/simulator.ts`
- Test: `lib/simulator.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/simulator.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/simulator.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the maths**

Create `lib/simulator.ts`:
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/simulator.test.ts`
Expected: PASS (6 tests green).

- [ ] **Step 5: Commit**

```bash
git add lib/simulator.ts lib/simulator.test.ts
git commit -m "feat: simulator revenue maths with unit tests"
```

---

## Task 3: Lang provider + hook

**Files:**
- Create: `components/lang-provider.tsx`

- [ ] **Step 1: Implement the provider**

Create `components/lang-provider.tsx`:
```tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { dictionaries, type Dict, type Lang } from "@/lib/i18n";

type LangCtx = { lang: Lang; setLang: (l: Lang) => void; t: Dict };

const Ctx = createContext<LangCtx | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  // Server always renders fr to avoid hydration mismatch; localStorage is read on mount.
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    const saved = localStorage.getItem("redline-lang");
    if (saved === "fr" || saved === "en") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("redline-lang", l);
    document.documentElement.lang = l;
  };

  return (
    <Ctx.Provider value={{ lang, setLang, t: dictionaries[lang] }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLang(): LangCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLang must be used within LangProvider");
  return v;
}
```

- [ ] **Step 2: Verify types compile**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/lang-provider.tsx
git commit -m "feat: lang provider with localStorage persistence"
```

---

## Task 4: Funnel nav (numbered + progress + FR/EN toggle)

**Files:**
- Create: `components/funnel/nav.tsx`

- [ ] **Step 1: Implement the nav**

Create `components/funnel/nav.tsx`. A fixed top bar: logo left, numbered section links centre (desktop), FR/EN pill + CTA right. A thin scroll-progress bar pinned to the very top. Section ids match Task 11.
```tsx
"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { useLang } from "@/components/lang-provider";

const IDS = ["bienvenue", "diagnostic", "briques", "simulateur", "cas", "livrables", "methode", "offres"];
const MAIL = "mailto:contact@redlinestudio.agency?subject=Diagnostic%20Redline";

export function FunnelNav() {
  const { t, lang, setLang } = useLang();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? (h.scrollTop / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="h-[3px] bg-[var(--rl-red)]" style={{ width: `${progress}%` }} />
      <div className="backdrop-blur bg-[#161210]/85 border-b border-[var(--rl-line)]">
        <div className="mx-auto max-w-6xl px-5 h-14 flex items-center justify-between gap-4">
          <Logo className="text-sm" />
          <nav className="hidden lg:flex items-center gap-5 text-[11px] tracking-wide text-[var(--rl-muted)]">
            {IDS.map((id, i) => (
              <a key={id} href={`#${id}`} className="hover:text-[var(--rl-ink)] transition-colors">
                <span className="text-[var(--rl-red)]">0{i + 1}</span> {t.nav.items[i]}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-full border border-[var(--rl-line)] overflow-hidden text-[11px]">
              {(["fr", "en"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1 uppercase transition-colors ${lang === l ? "bg-[var(--rl-red)] text-[#fff]" : "text-[var(--rl-muted)] hover:text-[var(--rl-ink)]"}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <a href={MAIL} className="hidden sm:inline-flex text-[12px] px-3.5 py-1.5 rounded-full bg-[var(--rl-ink)] text-[#161210] font-medium hover:bg-white transition-colors">
              {t.nav.cta}
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Verify types compile**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/funnel/nav.tsx
git commit -m "feat: funnel nav with numbered links, progress bar, FR/EN toggle"
```

---

## Task 5: Hero (01)

**Files:**
- Create: `components/funnel/hero.tsx`

- [ ] **Step 1: Implement**

Create `components/funnel/hero.tsx`:
```tsx
"use client";

import { motion } from "framer-motion";
import { useLang } from "@/components/lang-provider";

export function FunnelHero() {
  const { t } = useLang();
  return (
    <section id="bienvenue" className="pt-32 pb-24 md:pt-40 md:pb-32">
      <div className="mx-auto max-w-4xl px-5 text-center">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-[12px] tracking-[0.2em] uppercase text-[var(--rl-red)] mb-6">
          {t.hero.kicker}
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="font-syne text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight">
          {t.hero.titleA}<br />
          <span className="text-[var(--rl-red)]">{t.hero.titleB}</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="mt-7 text-base md:text-lg text-[var(--rl-muted)] max-w-2xl mx-auto leading-relaxed">
          {t.hero.sub}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="mt-9 flex flex-col items-center gap-5">
          <a href="#simulateur" className="px-7 py-3.5 rounded-full bg-[var(--rl-red)] text-white font-medium hover:bg-[var(--rl-red-hover)] transition-colors">
            {t.hero.cta} →
          </a>
          <div className="flex flex-wrap justify-center gap-2.5">
            {t.hero.chips.map((c) => (
              <span key={c} className="text-[11px] tracking-wide text-[var(--rl-muted)] border border-[var(--rl-line)] rounded-full px-3 py-1.5">
                {c}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/funnel/hero.tsx
git commit -m "feat: hero section"
```

---

## Task 6: Diagnostic (02)

**Files:**
- Create: `components/funnel/diagnostic.tsx`

- [ ] **Step 1: Implement**

Create `components/funnel/diagnostic.tsx`. Reusable section heading inline; three numbered step cards.
```tsx
"use client";

import { motion } from "framer-motion";
import { useLang } from "@/components/lang-provider";

export function FunnelDiagnostic() {
  const { t } = useLang();
  return (
    <section id="diagnostic" className="py-20 border-t border-[var(--rl-line)]">
      <div className="mx-auto max-w-5xl px-5">
        <h2 className="font-syne text-3xl md:text-4xl font-bold tracking-tight">{t.diagnostic.title}</h2>
        <p className="mt-3 text-[var(--rl-muted)] max-w-2xl">{t.diagnostic.sub}</p>
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {t.diagnostic.steps.map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="rounded-2xl bg-[var(--rl-surface)] border border-[var(--rl-line)] p-6">
              <div className="text-2xl">{s.icon}</div>
              <div className="mt-4 text-[11px] tracking-widest text-[var(--rl-red)]">0{i + 1}</div>
              <h3 className="mt-1 font-syne text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-[var(--rl-muted)] leading-relaxed">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/funnel/diagnostic.tsx
git commit -m "feat: diagnostic section"
```

---

## Task 7: Briques (03)

**Files:**
- Create: `components/funnel/briques.tsx`

- [ ] **Step 1: Implement**

Create `components/funnel/briques.tsx`:
```tsx
"use client";

import { motion } from "framer-motion";
import { useLang } from "@/components/lang-provider";

export function FunnelBriques() {
  const { t } = useLang();
  return (
    <section id="briques" className="py-20 border-t border-[var(--rl-line)]">
      <div className="mx-auto max-w-5xl px-5">
        <h2 className="font-syne text-3xl md:text-4xl font-bold tracking-tight">{t.briques.title}</h2>
        <p className="mt-3 text-[var(--rl-muted)] max-w-2xl">{t.briques.sub}</p>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {t.briques.items.map((b, i) => (
            <motion.div key={b.n} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="rounded-2xl bg-[var(--rl-surface)] border border-[var(--rl-line)] p-6 hover:border-[var(--rl-red)]/40 transition-colors">
              <div className="font-syne text-3xl font-bold text-[var(--rl-red)]">{b.n}</div>
              <h3 className="mt-3 font-syne text-lg font-semibold">{b.title}</h3>
              <p className="mt-2 text-sm text-[var(--rl-muted)] leading-relaxed">{b.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/funnel/briques.tsx
git commit -m "feat: 5 bricks section"
```

---

## Task 8: Simulator UI (04)

**Files:**
- Create: `components/funnel/simulator.tsx`

- [ ] **Step 1: Implement**

Create `components/funnel/simulator.tsx`. Consumes `computeComparison` from Task 2 and the shadcn `Slider`. Six sliders bound to state; live comparison of site-only vs ecosystem.
```tsx
"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { useLang } from "@/components/lang-provider";
import { computeComparison, type SimInputs } from "@/lib/simulator";

const FIELDS: { key: keyof SimInputs; min: number; max: number; step: number; suffix: string }[] = [
  { key: "visitors", min: 100, max: 50000, step: 100, suffix: "" },
  { key: "capturePct", min: 0, max: 40, step: 1, suffix: "%" },
  { key: "conversionPct", min: 0, max: 15, step: 1, suffix: "%" },
  { key: "basket", min: 10, max: 500, step: 5, suffix: "€" },
  { key: "frequency", min: 1, max: 12, step: 1, suffix: "x" },
  { key: "retentionPct", min: 0, max: 80, step: 1, suffix: "%" },
];

const LABEL_KEY: Record<keyof SimInputs, keyof ReturnType<typeof useLang>["t"]["simulator"]["inputs"]> = {
  visitors: "visitors", capturePct: "capture", conversionPct: "conversion",
  basket: "basket", frequency: "frequency", retentionPct: "retention",
};

function euro(n: number): string {
  return n.toLocaleString("fr-FR") + " €";
}

export function FunnelSimulator() {
  const { t } = useLang();
  const [inputs, setInputs] = useState<SimInputs>({
    visitors: 10000, capturePct: 10, conversionPct: 5, basket: 80, frequency: 2, retentionPct: 30,
  });
  const { siteOnly, ecosystem } = computeComparison(inputs);

  const set = (key: keyof SimInputs, v: number) => setInputs((p) => ({ ...p, [key]: v }));

  return (
    <section id="simulateur" className="py-20 border-t border-[var(--rl-line)]">
      <div className="mx-auto max-w-5xl px-5">
        <h2 className="font-syne text-3xl md:text-4xl font-bold tracking-tight">{t.simulator.title}</h2>
        <p className="mt-3 text-[var(--rl-muted)] max-w-2xl">{t.simulator.sub}</p>

        <div className="mt-12 grid lg:grid-cols-2 gap-10">
          {/* sliders */}
          <div className="space-y-7">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[var(--rl-muted)]">{t.simulator.inputs[LABEL_KEY[f.key]]}</span>
                  <span className="font-medium tabular-nums">
                    {inputs[f.key].toLocaleString("fr-FR")}{f.suffix}
                  </span>
                </div>
                <Slider value={[inputs[f.key]]} min={f.min} max={f.max} step={f.step}
                  onValueChange={([v]) => set(f.key, v)} />
              </div>
            ))}
          </div>

          {/* outputs + comparison */}
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Stat label={t.simulator.outputs.leads} value={ecosystem.leads.toLocaleString("fr-FR")} />
              <Stat label={t.simulator.outputs.clients} value={ecosystem.clients.toLocaleString("fr-FR")} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Compare title={t.simulator.compareSite} monthly={euro(siteOnly.monthly)} yearly={euro(siteOnly.yearly)}
                monthlyLabel={t.simulator.outputs.monthly} yearlyLabel={t.simulator.outputs.yearly} dim />
              <Compare title={t.simulator.compareEco} monthly={euro(ecosystem.monthly)} yearly={euro(ecosystem.yearly)}
                monthlyLabel={t.simulator.outputs.monthly} yearlyLabel={t.simulator.outputs.yearly} />
            </div>
            <p className="text-[11px] text-[var(--rl-muted)]">{t.simulator.note}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--rl-surface)] border border-[var(--rl-line)] p-4">
      <div className="text-[11px] uppercase tracking-wide text-[var(--rl-muted)]">{label}</div>
      <div className="mt-1 font-syne text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function Compare({ title, monthly, yearly, monthlyLabel, yearlyLabel, dim }: {
  title: string; monthly: string; yearly: string; monthlyLabel: string; yearlyLabel: string; dim?: boolean;
}) {
  return (
    <div className={`rounded-xl p-5 border ${dim ? "border-[var(--rl-line)] bg-transparent" : "border-[var(--rl-red)] bg-[var(--rl-red)]/10"}`}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <span>{dim ? "❌" : "✅"}</span>{title}
      </div>
      <div className="mt-3 text-[11px] uppercase tracking-wide text-[var(--rl-muted)]">{monthlyLabel}</div>
      <div className="font-syne text-2xl font-bold tabular-nums">{monthly}</div>
      <div className="mt-2 text-[11px] uppercase tracking-wide text-[var(--rl-muted)]">{yearlyLabel}</div>
      <div className="font-syne text-lg font-semibold tabular-nums">{yearly}</div>
    </div>
  );
}
```

- [ ] **Step 2: Verify types compile**

Run: `pnpm exec tsc --noEmit`
Expected: no errors. If the `LABEL_KEY` typing is awkward, simplify its type to `Record<keyof SimInputs, "visitors"|"capture"|"conversion"|"basket"|"frequency"|"retention">`.

- [ ] **Step 3: Commit**

```bash
git add components/funnel/simulator.tsx
git commit -m "feat: interactive revenue simulator"
```

---

## Task 9: Cases (05)

**Files:**
- Create: `components/funnel/cases.tsx`

- [ ] **Step 1: Implement**

Create `components/funnel/cases.tsx`:
```tsx
"use client";

import { motion } from "framer-motion";
import { useLang } from "@/components/lang-provider";

export function FunnelCases() {
  const { t } = useLang();
  return (
    <section id="cas" className="py-20 border-t border-[var(--rl-line)]">
      <div className="mx-auto max-w-5xl px-5">
        <h2 className="font-syne text-3xl md:text-4xl font-bold tracking-tight">{t.cases.title}</h2>
        <p className="mt-3 text-[var(--rl-muted)] max-w-2xl">{t.cases.sub}</p>
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {t.cases.items.map((c, i) => (
            <motion.div key={c.sector} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="rounded-2xl bg-[var(--rl-surface)] border border-[var(--rl-line)] p-6 flex flex-col">
              <div className="text-[11px] uppercase tracking-wide text-[var(--rl-red)]">{c.sector}</div>
              <p className="mt-3 font-syne text-lg font-semibold leading-snug">{c.quote}</p>
              <p className="mt-3 text-sm italic text-[var(--rl-muted)]">{c.problem}</p>
              <dl className="mt-4 space-y-2 text-sm">
                <Row k={t.briques.items[0] ? "" : ""} />
              </dl>
              <div className="mt-4 space-y-1.5 text-sm">
                <p><span className="text-[var(--rl-muted)]">→ </span>{c.missing}</p>
                <p><span className="text-[var(--rl-muted)]">→ </span>{c.fix}</p>
              </div>
              <div className="mt-auto pt-5">
                <div className="font-syne text-3xl font-bold text-[var(--rl-red)]">{c.metric}</div>
                <div className="text-xs text-[var(--rl-muted)]">{c.metricLabel}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Row({ k }: { k: string }) {
  return k ? <div>{k}</div> : null;
}
```

Note: the `Row`/`dl` scaffold is vestigial — delete the `<dl>…</dl>` block and the `Row` helper if it adds nothing; the `missing`/`fix` lines already cover it. Keep the component lint-clean (no unused vars).

- [ ] **Step 2: Verify lint**

Run: `pnpm exec eslint components/funnel/cases.tsx --quiet`
Expected: no errors (remove unused `Row` if flagged).

- [ ] **Step 3: Commit**

```bash
git add components/funnel/cases.tsx
git commit -m "feat: case studies section"
```

---

## Task 10: Deliverables (06) + Method (07)

**Files:**
- Create: `components/funnel/deliverables.tsx`
- Create: `components/funnel/method.tsx`

- [ ] **Step 1: Implement deliverables**

Create `components/funnel/deliverables.tsx`:
```tsx
"use client";

import { motion } from "framer-motion";
import { useLang } from "@/components/lang-provider";

export function FunnelDeliverables() {
  const { t } = useLang();
  return (
    <section id="livrables" className="py-20 border-t border-[var(--rl-line)]">
      <div className="mx-auto max-w-5xl px-5">
        <h2 className="font-syne text-3xl md:text-4xl font-bold tracking-tight">{t.deliverables.title}</h2>
        <p className="mt-3 text-[var(--rl-muted)] max-w-2xl">{t.deliverables.sub}</p>
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {t.deliverables.items.map((d, i) => (
            <motion.div key={d.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="rounded-xl bg-[var(--rl-surface)] border border-[var(--rl-line)] p-5 text-center">
              <div className="text-2xl">{d.icon}</div>
              <div className="mt-3 text-sm font-medium">{d.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Implement method**

Create `components/funnel/method.tsx`:
```tsx
"use client";

import { motion } from "framer-motion";
import { useLang } from "@/components/lang-provider";

export function FunnelMethod() {
  const { t } = useLang();
  return (
    <section id="methode" className="py-20 border-t border-[var(--rl-line)]">
      <div className="mx-auto max-w-5xl px-5">
        <h2 className="font-syne text-3xl md:text-4xl font-bold tracking-tight">{t.method.title}</h2>
        <p className="mt-3 text-[var(--rl-muted)] max-w-2xl">{t.method.sub}</p>
        <div className="mt-12 grid sm:grid-cols-2 gap-x-8 gap-y-6">
          {t.method.steps.map((s, i) => (
            <motion.div key={s.n} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="flex gap-4 border-b border-[var(--rl-line)] pb-5">
              <div className="font-syne text-2xl font-bold text-[var(--rl-red)] w-10 shrink-0">{s.n}</div>
              <div>
                <h3 className="font-syne text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-[var(--rl-muted)]">{s.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/funnel/deliverables.tsx components/funnel/method.tsx
git commit -m "feat: deliverables and method sections"
```

---

## Task 11: Offers + closing (08)

**Files:**
- Create: `components/funnel/offers.tsx`

- [ ] **Step 1: Implement**

Create `components/funnel/offers.tsx`. Two tier cards + closing CTA block. CTAs are mailto.
```tsx
"use client";

import { motion } from "framer-motion";
import { useLang } from "@/components/lang-provider";

const MAIL = "mailto:contact@redlinestudio.agency?subject=Diagnostic%20Redline";

export function FunnelOffers() {
  const { t } = useLang();
  return (
    <section id="offres" className="py-20 border-t border-[var(--rl-line)]">
      <div className="mx-auto max-w-5xl px-5">
        <h2 className="font-syne text-3xl md:text-4xl font-bold tracking-tight">{t.offers.title}</h2>
        <p className="mt-3 text-[var(--rl-muted)] max-w-2xl">{t.offers.sub}</p>

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {t.offers.tiers.map((tier) => (
            <motion.div key={tier.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`relative rounded-2xl p-7 border ${tier.recommended ? "border-[var(--rl-red)] bg-[var(--rl-red)]/[0.07]" : "border-[var(--rl-line)] bg-[var(--rl-surface)]"}`}>
              {tier.recommended && (
                <span className="absolute -top-3 left-7 text-[10px] uppercase tracking-widest bg-[var(--rl-red)] text-white px-2.5 py-1 rounded-full">
                  ⚡ {t.offers.badge}
                </span>
              )}
              <h3 className="font-syne text-xl font-bold">{tier.name}</h3>
              <p className="mt-1 text-sm text-[var(--rl-muted)]">{tier.tagline}</p>
              <div className="mt-5 font-syne text-4xl font-bold">{tier.price}</div>
              <ul className="mt-6 space-y-2.5 text-sm">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-[var(--rl-red)]">{f.startsWith("★") ? "★" : "✓"}</span>
                    <span>{f.replace(/^★\s*/, "")}</span>
                  </li>
                ))}
              </ul>
              <a href={MAIL} className={`mt-7 block text-center py-3 rounded-full font-medium transition-colors ${tier.recommended ? "bg-[var(--rl-red)] text-white hover:bg-[var(--rl-red-hover)]" : "bg-[var(--rl-ink)] text-[#161210] hover:bg-white"}`}>
                {tier.cta}
              </a>
            </motion.div>
          ))}
        </div>
        <p className="mt-5 text-center text-[12px] text-[var(--rl-muted)]">{t.offers.paymentNote}</p>

        {/* closing */}
        <div className="mt-20 text-center rounded-3xl bg-[var(--rl-surface)] border border-[var(--rl-line)] p-10 md:p-14">
          <h2 className="font-syne text-2xl md:text-4xl font-bold tracking-tight max-w-2xl mx-auto">{t.closing.title}</h2>
          <p className="mt-4 text-[var(--rl-muted)] max-w-xl mx-auto">{t.closing.sub}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#simulateur" className="px-6 py-3 rounded-full bg-[var(--rl-red)] text-white font-medium hover:bg-[var(--rl-red-hover)] transition-colors">{t.closing.primary} →</a>
            <a href={MAIL} className="px-6 py-3 rounded-full border border-[var(--rl-line)] hover:border-[var(--rl-ink)] transition-colors">{t.closing.secondary}</a>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/funnel/offers.tsx
git commit -m "feat: offers tiers and closing CTA"
```

---

## Task 12: Compose page, footer, swap homepage, verify, deploy

**Files:**
- Create: `components/funnel/footer.tsx`
- Modify: `app/page.tsx` (overwrite)
- Modify: `app/layout.tsx` (wrap in LangProvider if not already)

- [ ] **Step 1: Footer**

Create `components/funnel/footer.tsx`:
```tsx
"use client";

import { Logo } from "@/components/logo";
import { useLang } from "@/components/lang-provider";

export function FunnelFooter() {
  const { t } = useLang();
  return (
    <footer className="border-t border-[var(--rl-line)] py-10">
      <div className="mx-auto max-w-6xl px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo className="text-sm" />
        <p className="text-[12px] text-[var(--rl-muted)]">{t.footer.tagline}</p>
        <p className="text-[12px] text-[var(--rl-muted)]">© {new Date().getFullYear()} Redline Studio. {t.footer.rights}</p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Wrap layout in LangProvider**

In `app/layout.tsx`, import `LangProvider` and wrap `{children}` (inside `<body>`, around existing providers). Keep existing ThemeProvider if present.
```tsx
import { LangProvider } from "@/components/lang-provider";
// ...
<body className={...}>
  <LangProvider>
    {children}
  </LangProvider>
</body>
```

- [ ] **Step 3: Overwrite homepage**

Overwrite `app/page.tsx`:
```tsx
import { FunnelNav } from "@/components/funnel/nav";
import { FunnelHero } from "@/components/funnel/hero";
import { FunnelDiagnostic } from "@/components/funnel/diagnostic";
import { FunnelBriques } from "@/components/funnel/briques";
import { FunnelSimulator } from "@/components/funnel/simulator";
import { FunnelCases } from "@/components/funnel/cases";
import { FunnelDeliverables } from "@/components/funnel/deliverables";
import { FunnelMethod } from "@/components/funnel/method";
import { FunnelOffers } from "@/components/funnel/offers";
import { FunnelFooter } from "@/components/funnel/footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <FunnelNav />
      <main>
        <FunnelHero />
        <FunnelDiagnostic />
        <FunnelBriques />
        <FunnelSimulator />
        <FunnelCases />
        <FunnelDeliverables />
        <FunnelMethod />
        <FunnelOffers />
      </main>
      <FunnelFooter />
    </div>
  );
}
```

- [ ] **Step 4: Full verification**

Run: `pnpm test`
Expected: all tests PASS.

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

Run: `pnpm exec eslint . --quiet`
Expected: no errors. Fix any unused imports / vars.

Run: `pnpm build`
Expected: build succeeds; `/` and `/classic` both compile.

- [ ] **Step 5: Manual smoke (dev)**

Run: `pnpm dev`, open `http://localhost:3000`. Verify: page is dark, FR loads by default, FR/EN toggle swaps all copy, toggle persists after reload, simulator sliders update outputs live, nav anchors scroll, `/classic` still renders the old site.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx app/layout.tsx components/funnel/footer.tsx
git commit -m "feat: compose funnel homepage, preserve classic at /classic"
```

- [ ] **Step 7: Deploy**

Run: `vercel --prod`
Expected: deploys, aliases `redlinestudio.agency`. Open the URL and re-run the Step 5 smoke checks in production.

---

## Self-Review Notes

- **Spec coverage:** dark tokens (T0), classic preserved (T0), i18n FR/EN full + vouvoiement (T1), simulator ecommerce maths + comparison (T2), provider/toggle/persistence (T3), numbered nav + progress (T4), all 8 sections (T4–T11), two tiers w/ concrete prices + mailto (T11), footer/compose/deploy (T12). All spec sections mapped.
- **Naming consistency:** `computeRevenue` / `computeComparison` / `SimInputs` / `SimResult` used identically across T2 and T8. `useLang` / `dictionaries` / `Dict` / `Lang` consistent across T1, T3–T12. Section ids (`bienvenue, diagnostic, briques, simulateur, cas, livrables, methode, offres`) match between T4 nav and T5–T11 sections.
- **Known cleanup:** T9 cases.tsx contains a vestigial `Row`/`<dl>` scaffold flagged for deletion to keep lint clean — explicit instruction included.
- **Fonts:** `font-syne` is assumed available from the existing Tailwind/font config (current components use it). If not configured, the executor should fall back to `font-bold` headings — verify in T5.
