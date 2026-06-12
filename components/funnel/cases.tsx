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
