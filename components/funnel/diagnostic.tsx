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
