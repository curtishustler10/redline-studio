"use client";

import { useLang } from "@/components/lang-provider";
import { WHATSAPP_HREF } from "@/lib/constants";

export function FunnelOffers() {
  const { t } = useLang();
  return (
    <section id="offres" className="py-20 border-t border-[var(--rl-line)]">
      <div className="mx-auto max-w-5xl px-5">
        {/* closing — pricing is intentionally not shown; every project is scoped 1:1 */}
        <div id="closing" className="text-center rounded-3xl bg-[var(--rl-surface)] border border-[var(--rl-line)] p-10 md:p-14">
          <h3 className="font-syne text-2xl md:text-4xl font-bold tracking-tight max-w-2xl mx-auto">{t.closing.title}</h3>
          <p className="mt-4 text-[var(--rl-muted)] max-w-xl mx-auto">{t.closing.sub}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#diagnostic" className="px-6 py-3 rounded-full bg-[var(--rl-red)] text-white font-medium hover:bg-[var(--rl-red-hover)] transition-colors">{t.closing.primary} →</a>
            <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="px-6 py-3 rounded-full border border-[var(--rl-line)] hover:border-[var(--rl-ink)] transition-colors">{t.closing.secondary}</a>
          </div>
        </div>
      </div>
    </section>
  );
}
