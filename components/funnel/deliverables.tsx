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
