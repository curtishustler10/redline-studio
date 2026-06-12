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
