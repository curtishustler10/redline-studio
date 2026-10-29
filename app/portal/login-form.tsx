"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Logo } from "@/components/logo";
import { useLang } from "@/components/lang-provider";
import { portalLogin } from "./actions";

export type LoginError = "code" | "locked" | "server" | "expired" | "logout";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-2.5 rounded-full bg-[var(--rl-red)] text-white font-medium hover:bg-[var(--rl-red-hover)] disabled:opacity-60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--rl-red)]"
    >
      {pending ? "…" : label}
    </button>
  );
}

export function PortalLogin({ err }: { err: LoginError | null }) {
  const { t } = useLang();
  const info = err === "logout";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo className="text-base" />
        </div>

        <div className="rounded-2xl border border-[var(--rl-line)] bg-[var(--rl-surface)] p-7">
          <h1 className="font-display text-3xl text-center">{t.portal.title}</h1>
          <p className="mt-2 text-sm text-[var(--rl-muted)] text-center">{t.portal.subtitle}</p>

          <form action={portalLogin} className="mt-7 space-y-4">
            <div>
              <label htmlFor="code" className="block text-[11px] uppercase tracking-wide text-[var(--rl-muted)] mb-1.5">
                {t.portal.code}
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                autoFocus
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={64}
                aria-invalid={err === "code" || undefined}
                aria-describedby={err ? "code-msg" : undefined}
                className="w-full rounded-lg bg-white border border-[var(--rl-line)] px-3.5 py-2.5 text-base font-medium outline-none focus:border-[var(--rl-red)] transition-colors"
              />
            </div>
            {err && (
              <p id="code-msg" role={info ? "status" : "alert"} className={`text-sm ${info ? "text-[var(--rl-muted)]" : "text-[var(--rl-red)]"}`}>
                {t.portal.errors[err]}
              </p>
            )}
            <Submit label={t.portal.submit} />
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
