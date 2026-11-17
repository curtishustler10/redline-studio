"use client";

// Access-code form of a client space in Fenua Studio's brand, at /portal/<slug>.
// Same action as the shared form; `entry` brings a failed attempt back here.

import { useFormStatus } from "react-dom";
import { portalLogin } from "@/app/portal/actions";
import { FENUA } from "@/lib/portal-brand";
import { EC, FENUA_DISPLAY } from "./theme";

export type FenuaLoginError = "code" | "locked" | "server" | "expired" | "logout";

const MESSAGES: Record<FenuaLoginError, string> = {
  code: "Ce code ne correspond pas. Vérifiez-le et réessayez.",
  locked: "Trop d’essais. Réessayez dans 15 minutes.",
  server: "Une erreur est survenue de notre côté. Réessayez dans un instant.",
  expired: "Votre session a expiré : entrez à nouveau votre code.",
  logout: "Déconnexion effectuée. À bientôt\u00a0!",
};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      style={{
        width: "100%",
        padding: "13px 16px",
        background: EC.abysse,
        color: "#fff",
        border: "none",
        borderRadius: 0,
        fontWeight: 600,
        fontSize: 15,
        fontFamily: "inherit",
        cursor: pending ? "wait" : "pointer",
        opacity: pending ? 0.6 : 1,
      }}
    >
      {pending ? "Ouverture…" : "Ouvrir mon espace"}
    </button>
  );
}

export function FenuaLogin({ slug, company, err }: { slug: string; company: string; err: FenuaLoginError | null }) {
  const info = err === "logout";
  return (
    <main style={{ display: "grid", placeItems: "center", padding: "48px 0 24px" }}>
      <section aria-labelledby="login-title" style={{ width: "100%", maxWidth: 420, border: `1px solid ${EC.line}`, borderTop: `3px solid ${EC.lagon}`, padding: "28px 24px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: EC.recif, textTransform: "uppercase", letterSpacing: "1.5px" }}>{company}</div>
        <h1 id="login-title" style={{ fontFamily: FENUA_DISPLAY, fontSize: 24, fontWeight: 700, color: EC.abysse, margin: "6px 0 0", lineHeight: 1.2 }}>
          Votre espace client
        </h1>
        <p style={{ fontSize: 14, color: EC.muted, margin: "8px 0 0", lineHeight: 1.55 }}>Entrez le code d’accès que nous vous avons transmis.</p>
        <form action={portalLogin} style={{ display: "grid", gap: 14, marginTop: 22 }}>
          <input type="hidden" name="entry" value={slug} />
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: EC.ardoise, textTransform: "uppercase", letterSpacing: "1px" }}>Code d’accès</span>
            <input
              className="fenua-code"
              name="code"
              type="text"
              required
              autoFocus
              autoComplete="current-password"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              maxLength={64}
              aria-invalid={err === "code" || undefined}
              aria-describedby={err ? "code-msg" : undefined}
              style={{ width: "100%", padding: "12px 13px", border: `1px solid ${EC.line}`, borderRadius: 0, fontSize: 16, fontWeight: 500, fontFamily: "inherit", color: EC.abysse, letterSpacing: "1px" }}
            />
          </label>
          {err ? (
            <p
              id="code-msg"
              role={info ? "status" : "alert"}
              style={{
                margin: 0,
                fontSize: 13.5,
                padding: "9px 11px",
                background: info ? EC.ecume : "#fdeaea",
                borderLeft: `3px solid ${info ? EC.recif : "#b91c1c"}`,
                color: info ? EC.ardoise : "#7f1d1d",
              }}
            >
              {MESSAGES[err]}
            </p>
          ) : null}
          <Submit />
        </form>
        <p style={{ fontSize: 13, color: EC.muted, margin: "20px 0 0", paddingTop: 16, borderTop: `1px solid ${EC.line}`, lineHeight: 1.55 }}>
          Pas de code, ou code perdu ? Écrivez-nous à{" "}
          <a href={`mailto:${FENUA.email}`} style={{ color: EC.recif, fontWeight: 600 }}>
            {FENUA.email}
          </a>
          .
        </p>
      </section>
      <style>{`.fenua-code:focus { outline: 2px solid ${EC.lagon}; outline-offset: 0; border-color: ${EC.lagon}; }`}</style>
    </main>
  );
}
