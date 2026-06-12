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
