"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { useLang } from "@/components/lang-provider";

export default function PortalPage() {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Design only — auth is not wired yet.
  const onSubmit = (e: React.FormEvent) => e.preventDefault();

  return (
    <main className="min-h-screen bg-[#161210] text-[var(--rl-ink)] flex flex-col items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo className="text-base" />
        </div>

        <div className="rounded-2xl border border-[var(--rl-line)] bg-[var(--rl-surface)] p-7">
          <h1 className="font-syne text-2xl font-bold text-center">{t.portal.title}</h1>
          <p className="mt-2 text-sm text-[var(--rl-muted)] text-center">{t.portal.subtitle}</p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="email" className="block text-[11px] uppercase tracking-wide text-[var(--rl-muted)] mb-1.5">
                {t.portal.email}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-[#161210] border border-[var(--rl-line)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--rl-red)] transition-colors"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-[11px] uppercase tracking-wide text-[var(--rl-muted)]">
                  {t.portal.password}
                </label>
                <button type="button" className="text-[11px] text-[var(--rl-muted)] hover:text-[var(--rl-ink)] transition-colors">
                  {t.portal.forgot}
                </button>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-[#161210] border border-[var(--rl-line)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--rl-red)] transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-[var(--rl-red)] text-white font-medium hover:bg-[var(--rl-red-hover)] transition-colors"
            >
              {t.portal.submit}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[var(--rl-line)] text-center">
            <p className="text-sm font-medium">{t.portal.noAccountQ}</p>
            <p className="mt-1 text-sm text-[var(--rl-muted)]">{t.portal.noAccountA}</p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-[12px] text-[var(--rl-muted)] hover:text-[var(--rl-ink)] transition-colors">
            {t.portal.back}
          </Link>
        </div>
      </div>
    </main>
  );
}
