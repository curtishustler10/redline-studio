"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "@/components/lang-provider";
import { FunnelDiagnosticQuiz } from "@/components/funnel/diagnostic-quiz";

export function FunnelHero() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
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
        <AnimatePresence mode="wait" initial={false}>
          {!open ? (
            <motion.div key="cta" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ delay: 0.25 }} className="mt-9 flex flex-col items-center gap-5">
              <button onClick={() => setOpen(true)}
                className="px-7 py-3.5 rounded-full bg-[var(--rl-red)] text-white font-medium hover:bg-[var(--rl-red-hover)] transition-colors">
                {t.hero.cta} →
              </button>
              <div className="flex flex-wrap justify-center gap-2.5">
                {t.hero.chips.map((c) => (
                  <span key={c} className="text-[11px] tracking-wide text-[var(--rl-muted)] border border-[var(--rl-line)] rounded-full px-3 py-1.5">
                    {c}
                  </span>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="quiz" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="mt-10 mx-auto max-w-2xl text-left">
              <FunnelDiagnosticQuiz autoStart />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
