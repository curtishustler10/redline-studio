"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { track } from "@vercel/analytics";
import { useLang } from "@/components/lang-provider";
import { Fil } from "@/components/motion/fil";
import { FunnelDiagnosticQuiz } from "@/components/funnel/diagnostic-quiz";
import { START_DIAGNOSTIC_EVENT } from "@/lib/constants";

export function FunnelHero() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [pulled, setPulled] = useState(false);

  // Let the mobile sticky CTA (rendered outside the hero) launch the quiz.
  useEffect(() => {
    const start = () => {
      setOpen(true);
      document.getElementById("bienvenue")?.scrollIntoView({ behavior: "smooth" });
    };
    window.addEventListener(START_DIAGNOSTIC_EVENT, start);
    return () => window.removeEventListener(START_DIAGNOSTIC_EVENT, start);
  }, []);

  return (
    <section id="bienvenue" className="overflow-x-clip pt-32 pb-20 md:pt-40 md:pb-28">
      <div className="mx-auto max-w-4xl px-5 text-center">
        <p className="text-sm text-[var(--rl-muted)] mb-5">{t.hero.kicker}</p>
        <h1 className="font-display text-[2.3rem] leading-[1.04] sm:text-[2.75rem] tracking-[-0.01em] md:text-7xl text-balance">
          {t.hero.titleA}
          <br />
          {t.hero.titleB}
        </h1>
      </div>

      {/* The thread is the page's one accent: full-bleed, under the promise. */}
      <div className="relative mt-2 md:mt-4">
        <Fil onFirstPull={() => setPulled(true)} />
        <AnimatePresence>
          {!pulled && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 1.9 } }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              aria-hidden
              className="pointer-events-none absolute right-[7%] top-0 -rotate-6 font-hand text-2xl text-[var(--rl-thread)] md:right-[12%] md:text-3xl"
            >
              {t.hero.note} ↓
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="mx-auto max-w-4xl px-5 text-center">
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-[var(--rl-muted)] md:text-lg">{t.hero.sub}</p>
        <AnimatePresence mode="wait" initial={false}>
          {!open ? (
            <motion.div key="cta" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-9 flex flex-col items-center gap-5">
              <button
                onClick={() => {
                  track("quiz_start");
                  setOpen(true);
                }}
                className="rounded-full bg-[var(--rl-red)] px-7 py-3.5 font-semibold text-white transition-colors hover:bg-[var(--rl-red-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rl-red)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--rl-bg)]"
              >
                {t.hero.cta}
              </button>
              <ul className="flex flex-wrap justify-center gap-2.5">
                {t.hero.chips.map((c) => (
                  <li key={c} className="rounded-full border border-[var(--rl-line)] px-3 py-1.5 text-xs text-[var(--rl-muted)]">
                    {c}
                  </li>
                ))}
              </ul>
            </motion.div>
          ) : (
            <motion.div key="quiz" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-10 mx-auto max-w-2xl text-left">
              <FunnelDiagnosticQuiz autoStart />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
