"use client";

import { Logo } from "@/components/logo";
import { useLang } from "@/components/lang-provider";

export function FunnelFooter() {
  const { t } = useLang();
  return (
    <footer className="border-t border-[var(--rl-line)] py-10">
      <div className="mx-auto max-w-6xl px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo className="text-sm" />
        <p className="text-[12px] text-[var(--rl-muted)]">{t.footer.tagline}</p>
        <p className="text-[12px] text-[var(--rl-muted)]">© {new Date().getFullYear()} Redline Studio. {t.footer.rights}</p>
      </div>
    </footer>
  );
}
