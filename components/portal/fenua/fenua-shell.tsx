// The frame of a client space shown in Fenua Studio's brand: fonts, header
// « FENUA STUDIO / Espace client », footer. Nothing of Redline Studio shows here.
import type { ReactNode } from "react";
import { portalLogout } from "@/app/portal/actions";
import { FENUA } from "@/lib/portal-brand";
import { fenuaBody, fenuaDisplay } from "./fonts";
import { EC, FENUA_BODY, FENUA_DISPLAY } from "./theme";

export function FenuaShell({ company, children, wide = false }: { company?: string; children: ReactNode; wide?: boolean }) {
  return (
    <div
      className={`${fenuaDisplay.variable} ${fenuaBody.variable}`}
      style={{ minHeight: "100dvh", background: "#fff", color: EC.ardoise, fontFamily: FENUA_BODY, display: "flex", flexDirection: "column" }}
    >
      <div style={{ width: "100%", maxWidth: wide ? 1108 : 960, margin: "0 auto", padding: "0 14px", flex: 1 }}>
        <header
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "18px 0 18px", borderBottom: `1px solid ${EC.line}` }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={FENUA.mark} alt="" width={40} height={32} style={{ display: "block", width: 40, height: "auto" }} />
            <div>
              <div style={{ fontFamily: FENUA_DISPLAY, fontWeight: 700, fontSize: 18, letterSpacing: ".5px", color: EC.abysse, lineHeight: 1.1 }}>FENUA STUDIO</div>
              <div style={{ color: EC.recif, fontSize: 10, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginTop: 2 }}>Espace client</div>
            </div>
          </div>
          {company ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="fenua-hide-sm" style={{ fontSize: 13, color: EC.ardoise }}>
                {company}
              </span>
              <form action={portalLogout}>
                <button
                  type="submit"
                  style={{ fontSize: 12.5, color: EC.recif, background: "none", border: `1px solid ${EC.line}`, borderRadius: 0, padding: "8px 12px", cursor: "pointer", fontFamily: "inherit" }}
                >
                  Se déconnecter
                </button>
              </form>
            </div>
          ) : null}
        </header>
        {children}
      </div>
      <footer style={{ textAlign: "center", fontSize: 11.5, color: "#93a0b0", padding: "26px 14px 30px" }}>{FENUA.footer}</footer>
      <style>{`@media (max-width: 430px) { .fenua-hide-sm { display: none; } }`}</style>
    </div>
  );
}
