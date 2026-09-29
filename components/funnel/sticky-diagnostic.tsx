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
    const onScroll = () => {
      const pastHero = window.scrollY > window.innerHeight * 0.8;
      // Hide again once the final "Votre site travaille…" CTA is on screen —
      // no point offering the diagnostic on top of the closing CTA.
      const closing = document.getElementById("closing");
      const closingInView = closing ? closing.getBoundingClientRect().top < window.innerHeight : false;
      setShow(pastHero && !closingInView);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`md:hidden fixed inset-x-0 bottom-0 z-40 px-4 pb-4 pt-8 bg-gradient-to-t from-[#FBF6EE] via-[#FBF6EE]/90 to-transparent transition-transform duration-300 ${
        show ? "translate-y-0" : "translate-y-full pointer-events-none"
      }`}
    >
      <button
        type="button"
        onClick={() => {
          track("quiz_start", { source: "sticky" });
          window.dispatchEvent(new Event(START_DIAGNOSTIC_EVENT));
        }}
        className="w-full py-3.5 rounded-full bg-[var(--rl-red)] text-white font-medium shadow-lg shadow-[#1E1A17]/20 hover:bg-[var(--rl-red-hover)] transition-colors"
      >
        {t.hero.cta} →
      </button>
    </div>
  );
}
