# Redline Studio — Funnel Site Redesign

**Date:** 2026-06-12
**Status:** Approved (design phase)
**Reference:** https://diagnostic-pem-repo.vercel.app/

## Goal

Rebuild the `redlinestudio.agency` homepage as a conversion funnel modelled on the
reference site (problem → framework → interactive simulator → case studies →
deliverables → method → pricing tiers → close). Keep Redline's colour identity but
fix the low-contrast readability problem, make the tone more professional, write all
copy in formal French (vouvoiement) with a full FR/EN toggle, and an ecommerce-style
revenue simulator.

## Decisions (locked)

- **Scope:** Full funnel port (not a restyle of existing content).
- **Branding:** Dark-forward. High contrast, modern-SaaS feel, keeps red accent + mono logo.
- **Pricing:** Two productized tiers with concrete numbers (~1 490 € / ~2 890 €).
- **Bilingual:** French default (vouvoiement), toggle flips the *entire* page to English.
  Both languages fully written. Client-side only (no URL routing).
- **Simulator:** Ecommerce-style — visitors, capture rate, conversion, basket, frequency,
  retention → monthly + annual revenue, with site-only vs ecosystem comparison.

## Placement & Safety

- Built inside existing `redline-studio-site` (Next.js App Router, Tailwind,
  framer-motion, shadcn/ui).
- New funnel becomes the homepage (`app/page.tsx`).
- Current homepage preserved at `app/classic/page.tsx` (route `/classic`) so the live
  site is never lost before the swap is approved.
- Deploy: local build + `vercel --prod` → aliases `redlinestudio.agency`.

## Branding Tokens (globals.css)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#161210` | warm near-black page background |
| `--surface` | `#1E1813` | cards / raised sections |
| `--surface-2` | `#262019` | hover / nested |
| `--ink` | `#ECE3D7` | primary cream text |
| `--muted` | `#A89A86` | secondary text |
| `--red` | `#C41F1F` | accent / primary buttons |
| `--red-hover` | `#E03030` | button hover |
| `--line` | `rgba(236,227,215,.14)` | hairline borders |

- Paper-grain overlay retained at low opacity over the dark bg.
- Mono `>redline_studio` logo unchanged (red `>red`, cream `line_studio`, red cursor block).
- Fonts: keep current stack (Syne for display per existing components, system/sans for body).

## Internationalisation

- `lib/i18n.ts` — exports a `Dict` type and a `dictionaries = { fr, en }` object holding
  **every** user-facing string keyed by section. Single source of truth.
- `components/lang-provider.tsx` — React context providing `{ lang, setLang, t }`.
  `t` is the resolved dictionary for the active language. Defaults to `fr`.
  Persists choice to `localStorage` key `redline-lang`; reads it on mount (effect, to
  avoid hydration mismatch — server always renders `fr`).
- `useLang()` hook for consumers.
- Navbar toggle: a `FR | EN` segmented pill that calls `setLang`.
- Tone: all FR copy uses vouvoiement. EN copy professional, equivalent register.

## Sections

Numbered nav `01–08` with a scroll-progress indicator (like the reference). Each section
has an `id` for anchor scrolling. All strings come from the dictionary.

1. **01 — Hero (`#bienvenue`)**
   Headline: "Un site seul ne vend pas. / Un écosystème, oui." (EN: "A website alone
   doesn't sell. / An ecosystem does.") Sub: problem + promise. CTA "Commencer le
   diagnostic →" (scrolls to simulator). Trust chips: `5 briques · 12 min · 100% personnalisé`.

2. **02 — Le diagnostic (`#diagnostic`)**
   Three numbered steps describing how Redline audits a prospect's web presence. Emoji /
   icon bullets, short copy each.

3. **03 — Les 5 briques (`#briques`)**
   Five cards = Redline's framework for a selling ecosystem:
   1. Site qui convertit  2. Capture & réservation  3. Suivi (email / WhatsApp)
   4. SEO local  5. Acquisition (publicité). Each card: title, one-line role, why it matters.

4. **04 — Simulateur CA (`#simulateur`)**
   Client component. Six `shadcn` sliders with sensible ranges/defaults:
   - Visiteurs / mois (100–50 000)
   - Taux de capture % (0–40)
   - Taux de conversion % (0–15)
   - Panier moyen € (10–500)
   - Fréquence d'achat / an (1–12)
   - Rétention % (0–80)
   Live outputs: Leads captés, Clients, **CA mensuel**, **CA annuel**.
   Comparison block: "Site seul" (❌ low numbers) vs "Écosystème Redline" (✅ uplifted),
   to dramatise the gap. Pure front-end maths, no backend.

5. **05 — Cas clients (`#cas`)**
   Three real case cards (Movaé Flow, The Beverly Hills Bali, Maya Hair). Each:
   secteur, citation/headline, *problème* (italic), brique manquante, mise en place,
   résultat, with a large metric callout.

6. **06 — Ce que vous recevez (`#livrables`)** *(adaptation of reference's AI-prompts/resources)*
   Deliverables grid: icon + label (site, moteur de réservation, configuration SEO,
   analytics, plan de soin/maintenance, etc.). Replaces the course-style "10 prompts IA"
   with done-for-you agency deliverables, same visual rhythm.

7. **07 — La méthode (`#methode`)** *(adaptation of reference's 8 training modules)*
   Redline's 8-step build process listed numerically with bold titles + descriptions:
   audit → design → développement → réservation → SEO → lancement → publicité → suivi.

8. **08 — Offres (`#offres`)**
   Two productized tier cards side by side:
   - **Site Conversion — ~1 490 €** — 5-page conversion site + booking form + Google
     Business setup. Feature checklist (✓).
   - **⚡ Écosystème complet — ~2 890 €** (recommended badge) — site + moteur de
     réservation + SEO local + suivi automatisé + acquisition. Checklist with ★ for
     exclusives.
   Both: `3× sans frais` note, CTA "Réserver un appel". Followed by a closing CTA block
   (motivational line + primary/secondary CTAs).

## Component Inventory

New / changed files:
- `app/page.tsx` — funnel composition (replaces current).
- `app/classic/page.tsx` — current homepage preserved.
- `app/globals.css` — dark-forward tokens.
- `lib/i18n.ts` — dictionaries (fr/en) + types.
- `components/lang-provider.tsx` — context + hook.
- `components/funnel/nav.tsx` — numbered nav + progress + FR/EN toggle.
- `components/funnel/hero.tsx`
- `components/funnel/diagnostic.tsx`
- `components/funnel/briques.tsx`
- `components/funnel/simulator.tsx` (client)
- `components/funnel/cases.tsx`
- `components/funnel/deliverables.tsx`
- `components/funnel/method.tsx`
- `components/funnel/offers.tsx`
- `components/funnel/closing.tsx`
- Reuse existing `components/logo.tsx`, shadcn `ui/slider`, etc.

Each section component is self-contained, reads strings via `useLang()`, and owns only
its own layout. The simulator is the only one with non-trivial state (slider values +
derived maths).

## Out of Scope (YAGNI)

- No CMS / backend / form submission wiring (CTAs link to existing contact/booking or
  `mailto`/Calendly placeholder — confirm target at build time).
- No URL-based i18n routing.
- No A/B testing, analytics events beyond what already exists.
- No changes to `/dashboard` or `/api`.

## Success Criteria

- `npx tsc --noEmit` clean, `npx eslint . --quiet` clean.
- FR↔EN toggle swaps all visible copy with no layout break, choice persists on reload.
- Simulator updates outputs live; numbers are plausible and the comparison reads clearly.
- Dark-forward palette passes a basic legibility bar (cream on near-black, red CTAs pop).
- Old homepage reachable at `/classic`.
- Deploys and serves at `redlinestudio.agency`.
