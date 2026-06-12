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
