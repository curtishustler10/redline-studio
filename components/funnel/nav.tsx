"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { useLang } from "@/components/lang-provider";

const IDS = ["bienvenue", "diagnostic", "briques", "simulateur", "cas", "livrables", "methode", "offres"];
const MAIL = "mailto:contact@redlinestudio.agency?subject=Diagnostic%20Redline";

export function FunnelNav() {
  const { t, lang, setLang } = useLang();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? (h.scrollTop / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="h-[3px] bg-[var(--rl-red)]" style={{ width: `${progress}%` }} />
      <div className="backdrop-blur bg-[#161210]/85 border-b border-[var(--rl-line)]">
        <div className="mx-auto max-w-6xl px-5 h-14 flex items-center justify-between gap-4">
          <Logo className="text-sm" />
          <nav className="hidden lg:flex items-center gap-5 text-[11px] tracking-wide text-[var(--rl-muted)]">
            {IDS.map((id, i) => (
              <a key={id} href={`#${id}`} className="hover:text-[var(--rl-ink)] transition-colors">
                <span className="text-[var(--rl-red)]">0{i + 1}</span> {t.nav.items[i]}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-full border border-[var(--rl-line)] overflow-hidden text-[11px]">
              {(["fr", "en"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1 uppercase transition-colors ${lang === l ? "bg-[var(--rl-red)] text-[#fff]" : "text-[var(--rl-muted)] hover:text-[var(--rl-ink)]"}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <a href={MAIL} className="hidden sm:inline-flex text-[12px] px-3.5 py-1.5 rounded-full bg-[var(--rl-ink)] text-[#161210] font-medium hover:bg-white transition-colors">
              {t.nav.cta}
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
