"use client";

import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import { useLang } from "@/components/lang-provider";
import { START_DIAGNOSTIC_EVENT } from "@/lib/constants";

/**
 * Mobile-only sticky CTA. Slides up once the visitor scrolls past the hero and
 * dispatches START_DIAGNOSTIC_EVENT so the hero opens the diagnostic quiz.
 * Hidden on >=md (desktop keeps the nav CTA); auto-hides again near the top.
 */
export function StickyDiagnostic() {
  const { t } = useLang();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`md:hidden fixed inset-x-0 bottom-0 z-40 px-4 pb-4 pt-8 bg-gradient-to-t from-[#161210] via-[#161210]/90 to-transparent transition-transform duration-300 ${
        show ? "translate-y-0" : "translate-y-full pointer-events-none"
      }`}
    >
      <button
        type="button"
        onClick={() => {
          track("quiz_start", { source: "sticky" });
          window.dispatchEvent(new Event(START_DIAGNOSTIC_EVENT));
        }}
        className="w-full py-3.5 rounded-full bg-[var(--rl-red)] text-white font-medium shadow-lg shadow-black/30 hover:bg-[var(--rl-red-hover)] transition-colors"
      >
        {t.hero.cta} →
      </button>
    </div>
  );
}
