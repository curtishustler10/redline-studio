"use client";

import { track } from "@vercel/analytics";
import { Check, ShieldCheck } from "lucide-react";
import { useLang } from "@/components/lang-provider";
import { BOOKING_HREF, START_DIAGNOSTIC_EVENT } from "@/lib/constants";

// The three e-commerce offers the prospection sells (STRATEGIE §2), then the free
// audit and the closing CTA. No prices: one price is quoted on the call, for the
// offer that fits the case (STRATEGIE §2, « un seul prix »).
export function FunnelOffers() {
  const { t } = useLang();
  const o = t.offers;
  return (
    <section id="offres" className="py-20 md:py-28 border-t border-[var(--rl-line)]">
      <div className="mx-auto max-w-6xl px-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--rl-red)]">{o.kicker}</p>
        <h2 className="mt-3 max-w-3xl font-syne text-3xl md:text-[2.75rem] font-bold leading-[1.08] tracking-tight">{o.title}</h2>
        <p className="mt-4 text-[var(--rl-muted)] max-w-2xl md:text-lg">{o.sub}</p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {o.tiers.map((tier) => (
            <div key={tier.name}
              className={`relative flex flex-col rounded-2xl border p-7 ${tier.featured ? "border-[var(--rl-red)] bg-[var(--rl-surface)] shadow-[0_30px_60px_-40px_rgba(200,50,31,0.5)]" : "border-[var(--rl-line)] bg-[var(--rl-surface)]"}`}>
              {tier.featured ? (
                <span className="absolute -top-3 left-7 rounded-full bg-[var(--rl-red)] px-3 py-1 text-[11px] font-medium text-white">{o.badge}</span>
              ) : null}
              <h3 className="font-syne text-xl font-bold">{tier.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--rl-muted)]">{tier.tagline}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--rl-red)]" aria-hidden />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-6 space-y-1.5 text-[12px] text-[var(--rl-muted)]">
                <p>{o.delay}</p>
                {tier.guarantee ? (
                  <p className="inline-flex items-center gap-1.5 font-medium text-[var(--rl-lagoon)]">
                    <ShieldCheck className="h-4 w-4" aria-hidden /> {o.guaranteeLabel}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 flex gap-2 rounded-2xl bg-[var(--rl-surface-2)] p-5 text-sm leading-relaxed">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--rl-lagoon)]" aria-hidden />
          <span><span className="font-medium">{o.guaranteeLabel} : </span>{o.guarantee}</span>
        </p>
        <p className="mt-4 text-sm text-[var(--rl-muted)]">
          {o.more}{" "}
          <a href="#briques" className="font-medium text-[var(--rl-red)] hover:underline underline-offset-4">{o.moreLink} →</a>
        </p>

        {/* closing: the free audit, then one booking CTA */}
        <div id="closing" className="mt-16 text-center rounded-3xl bg-[var(--rl-ink)] text-[var(--rl-bg)] p-10 md:p-14">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--rl-thread)]">{t.audit.title}</p>
          <h3 className="mt-4 font-syne text-2xl md:text-4xl font-bold tracking-tight max-w-2xl mx-auto">{t.closing.title}</h3>
          <p className="mt-4 opacity-80 max-w-2xl mx-auto leading-relaxed">{t.audit.body}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {t.audit.chips.map((c) => (
              <span key={c} className="rounded-full border border-white/20 px-3 py-1 text-[12px]">{c}</span>
            ))}
          </div>
          <p className="mt-6 opacity-80 max-w-xl mx-auto text-sm">{t.closing.sub}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href={BOOKING_HREF} onClick={() => track("booking_start", { source: "closing" })}
              className="px-6 py-3 rounded-full bg-[var(--rl-red)] text-white font-medium hover:bg-[var(--rl-red-hover)] transition-colors">
              {t.closing.primary} →
            </a>
            <button
              type="button"
              onClick={() => {
                track("quiz_start", { source: "closing" });
                window.dispatchEvent(new Event(START_DIAGNOSTIC_EVENT));
              }}
              className="px-6 py-3 rounded-full border border-white/25 hover:border-white transition-colors"
            >
              {t.closing.secondary}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
