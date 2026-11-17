"use client";

// First-visit guide of the page reader: four short steps played on the real
// reader (spotlight + coach mark), with a fake layer for the demo (hand, ripple,
// pin, comment box, list item). Purely visual: no form, no server action, no
// request. Nothing here can create a comment or send an email.
//
// The reader marks its parts with data-guide="nav | next | thumbs | page | list | tabs";
// the guide measures them and draws on top, in fixed (viewport) coordinates.
// Motion is transform and opacity only; with prefers-reduced-motion the
// highlights stay static and nothing moves.

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Pointer } from "lucide-react";

export type GuideTheme = { ink: string; accent: string; onAccent: string; link: string; soft: string; text: string; muted: string; line: string; display: string };

type Rect = { top: number; left: number; width: number; height: number };
type StepId = "browse" | "tap" | "write" | "list";

const STEPS: { id: StepId; title: string; text: (wide: boolean) => string }[] = [
  {
    id: "browse",
    title: "Feuilletez le livret",
    text: () => "Passez d’une page à l’autre avec les flèches, ou touchez une vignette.",
  },
  {
    id: "tap",
    title: "Touchez l’endroit à commenter",
    text: () => "Touchez la page exactement là où vous avez une remarque. Une épingle numérotée s’y pose.",
  },
  {
    id: "write",
    title: "Écrivez votre remarque, puis Enregistrer",
    text: () => "Une bulle s’ouvre : écrivez, puis touchez « Enregistrer ». Nous la recevons aussitôt.",
  },
  {
    id: "list",
    title: "Retrouvez vos remarques ici",
    text: (wide) =>
      `Toutes vos remarques sont listées ${wide ? "à côté de la page" : "sous la page"}. Touchez-en une pour la modifier ou la marquer comme résolue.`,
  },
];

const SAMPLE = "Ici, l’écran me semble trop haut.";
const TAP_AT = { x: 0.55, y: 0.4 };
const MARGIN = 12;
const WIDE = 900;

const el = (name: string) => document.querySelector<HTMLElement>(`[data-guide="${name}"]`);
const rectOf = (e: HTMLElement | null): Rect | null => {
  if (!e) return null;
  const r = e.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
};
const union = (rs: (Rect | null)[]): Rect | null => {
  const xs = rs.filter((r): r is Rect => !!r);
  if (!xs.length) return null;
  const top = Math.min(...xs.map((r) => r.top));
  const left = Math.min(...xs.map((r) => r.left));
  const bottom = Math.max(...xs.map((r) => r.top + r.height));
  const right = Math.max(...xs.map((r) => r.left + r.width));
  return { top, left, width: right - left, height: bottom - top };
};
const pad = (r: Rect, p: number): Rect => ({ top: r.top - p, left: r.left - p, width: r.width + 2 * p, height: r.height + 2 * p });

/** What the spotlight shows for a step. */
function holeFor(step: StepId, wide: boolean): Rect | null {
  if (step === "browse") return union(wide ? [rectOf(el("nav")), rectOf(el("page")), rectOf(el("thumbs"))] : [rectOf(el("nav")), rectOf(el("page"))]);
  if (step === "tap" || step === "write") return rectOf(el("page"));
  return rectOf(el("list"));
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
    const on = () => setReduced(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return reduced;
}

export function ReaderGuide({ theme: T, onClose }: { theme: GuideTheme; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [layout, setLayout] = useState<{ hole: Rect; page: Rect | null; next: Rect | null; thumbs: Rect | null; tabs: Rect | null; vw: number; vh: number } | null>(null);
  const [cardSize, setCardSize] = useState({ w: 360, h: 220 });
  const cardRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();
  const step = STEPS[index];
  const last = index === STEPS.length - 1;
  const [wide, setWide] = useState(true);

  // The page does not scroll under the guide; the guide scrolls it to each step itself.
  useEffect(() => {
    const html = document.documentElement;
    const before = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = before;
    };
  }, []);

  const measure = useCallback(() => {
    const isWide = window.innerWidth >= WIDE;
    setWide(isWide);
    const hole = holeFor(step.id, isWide);
    if (!hole) return;
    setLayout({
      hole: pad(hole, 6),
      page: rectOf(el("page")),
      next: rectOf(el("next")),
      thumbs: rectOf(el("thumbs")),
      tabs: rectOf(el("tabs")),
      vw: window.innerWidth,
      vh: window.innerHeight,
    });
  }, [step.id]);

  // Bring the step's part of the reader into view: its top near the top of the
  // screen when it fits with the coach mark, centred otherwise. Then measure.
  useLayoutEffect(() => {
    const isWide = window.innerWidth >= WIDE;
    const hole = holeFor(step.id, isWide);
    if (hole) {
      const vh = window.innerHeight;
      const fitsWithCard = hole.height + cardSize.h + 3 * MARGIN + 12 <= vh;
      const target = fitsWithCard || isWide ? hole.top - MARGIN - 6 : hole.top + hole.height / 2 - vh / 2;
      window.scrollTo({ top: Math.max(0, window.scrollY + target), behavior: "instant" as ScrollBehavior });
    }
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    window.addEventListener("resize", on);
    window.addEventListener("scroll", on, true);
    // Images finishing to load move things: one more measure shortly after.
    const t = window.setTimeout(on, 400);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
      window.removeEventListener("resize", on);
      window.removeEventListener("scroll", on, true);
    };
  }, [measure]);

  useLayoutEffect(() => {
    const c = cardRef.current;
    if (!c) return;
    const ro = new ResizeObserver(() => setCardSize({ w: c.offsetWidth, h: c.offsetHeight }));
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  // Focus goes to the main button of each step (read by screen readers with the live text).
  useEffect(() => {
    primaryRef.current?.focus({ preventScroll: true });
  }, [index]);

  const next = useCallback(() => (last ? onClose() : setIndex((i) => i + 1)), [last, onClose]);

  // Esc skips; the reader's own keys (arrows, Esc) never reach it while the guide is open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        onClose();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.stopImmediatePropagation();
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  function trap(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab") return;
    const items = Array.from(cardRef.current?.querySelectorAll<HTMLElement>("button") ?? []);
    if (!items.length) return;
    const first = items[0];
    const lastItem = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      lastItem.focus();
    } else if (!e.shiftKey && document.activeElement === lastItem) {
      e.preventDefault();
      first.focus();
    }
  }

  // ─── Geometry ──────────────────────────────────────────────────────────────

  const hole = layout?.hole;
  const vw = layout?.vw ?? 1280;
  const vh = layout?.vh ?? 800;
  // The tap point, kept on the visible part of the page.
  const tap = (() => {
    const p = layout?.page;
    if (!p) return null;
    const x = p.left + p.width * TAP_AT.x;
    const y = Math.min(Math.max(p.top + p.height * TAP_AT.y, Math.max(p.top, 0) + 60), Math.min(p.top + p.height, vh) - 60);
    return { x, y };
  })();

  // The coach mark goes where it does not cover what it explains: below, above,
  // right or left of the spotlight; failing that, docked at the screen edge
  // farthest from the point being shown.
  const card = (() => {
    const w = Math.min(360, vw - 2 * MARGIN);
    const h = cardSize.h;
    if (!hole) return { left: (vw - w) / 2, top: vh - h - MARGIN, w };
    const clampX = (x: number) => Math.min(Math.max(x, MARGIN), vw - w - MARGIN);
    const clampY = (y: number) => Math.min(Math.max(y, MARGIN), vh - h - MARGIN);
    const below = vh - (hole.top + hole.height) - MARGIN;
    const above = hole.top - MARGIN;
    const right = vw - (hole.left + hole.width) - MARGIN;
    const left = hole.left - MARGIN;
    const sides = [
      right >= w + MARGIN ? { left: hole.left + hole.width + MARGIN, top: clampY(hole.top), w } : null,
      left >= w + MARGIN ? { left: hole.left - w - MARGIN, top: clampY(hole.top), w } : null,
    ];
    const stacked = [
      below >= h + MARGIN ? { left: clampX(hole.left + hole.width / 2 - w / 2), top: hole.top + hole.height + MARGIN, w } : null,
      above >= h + MARGIN ? { left: clampX(hole.left + hole.width / 2 - w / 2), top: hole.top - h - MARGIN, w } : null,
    ];
    // Beside the spotlight on a computer (nothing else gets covered), under or over it on a phone.
    const found = (wide ? [...sides, ...stacked] : [...stacked, ...sides]).find((c) => c !== null);
    if (found) return found;
    const focusY = step.id === "tap" || step.id === "write" ? (tap?.y ?? vh / 2) : hole.top + hole.height / 2;
    return { left: (vw - w) / 2, top: focusY < vh / 2 ? vh - h - MARGIN : MARGIN, w };
  })();

  const motion = !reduced;
  const fixed = (r: Rect, extra: CSSProperties = {}): CSSProperties => ({ position: "fixed", top: r.top, left: r.left, width: r.width, height: r.height, ...extra });

  return (
    <div className="gd-root" data-testid="reader-guide">
      <style>{css(T)}</style>

      {/* Click shield + dim layer with the spotlight hole. The hole is a 100 × 100 box
          moved and scaled by transform, so it glides from step to step. */}
      <div style={{ position: "fixed", inset: 0, zIndex: 60 }} aria-hidden="true" />
      {hole ? (
        <div
          aria-hidden="true"
          className="gd-hole"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: 100,
            height: 100,
            zIndex: 61,
            transformOrigin: "0 0",
            transform: `translate3d(${hole.left}px, ${hole.top}px, 0) scale(${hole.width / 100}, ${hole.height / 100})`,
            boxShadow: "0 0 0 9999px rgba(6, 36, 59, 0.66)",
            pointerEvents: "none",
          }}
        />
      ) : null}

      {/* Demo layer: never real elements, never a form. */}
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 62, pointerEvents: "none" }} key={`demo-${index}`}>
        {step.id === "browse" && layout ? (
          <>
            {layout.next ? <div className={motion ? "gd-ring gd-pulse" : "gd-ring"} style={fixed(pad(layout.next, 4))} /> : null}
            {layout.thumbs && layout.thumbs.top < vh && layout.thumbs.top + layout.thumbs.height > 0 ? (
              <div className={motion ? "gd-ring gd-pulse gd-delay" : "gd-ring"} style={fixed(pad(layout.thumbs, 2))} />
            ) : null}
            {motion && layout.page ? (
              <div style={fixed(layout.page, { perspective: 1600 })}>
                <div className="gd-sheet" />
              </div>
            ) : null}
          </>
        ) : null}

        {(step.id === "tap" || step.id === "write") && tap ? (
          <>
            {step.id === "tap" && motion ? <div className="gd-ripple" style={{ position: "fixed", left: tap.x - 30, top: tap.y - 30 }} /> : null}
            <div className={step.id === "tap" && motion ? "gd-pin gd-pin-drop" : "gd-pin"} style={{ position: "fixed", left: tap.x - 15, top: tap.y - 15 }}>
              1
            </div>
            {step.id === "tap" ? (
              <div className={motion ? "gd-hand gd-hand-move" : "gd-hand"} style={{ position: "fixed", left: tap.x - 15, top: tap.y - 3 }}>
                <Pointer size={44} strokeWidth={1.6} fill="#fff" color={T.ink} />
              </div>
            ) : null}
            {step.id === "write" && layout?.page ? <DemoBubble theme={T} at={tap} page={layout.page} motion={motion} /> : null}
          </>
        ) : null}

        {step.id === "list" && layout && hole ? <DemoListItem theme={T} hole={hole} tabs={layout.tabs} motion={motion} /> : null}
      </div>

      {/* Coach mark */}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gd-title"
        aria-describedby="gd-text"
        onKeyDown={trap}
        className="gd-card"
        style={{ position: "fixed", zIndex: 63, top: card.top, left: card.left, width: card.w }}
      >
        <div key={`step-${index}`} className={motion ? "gd-in" : undefined}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: T.link }}>
            Guide · {index + 1}/{STEPS.length}
          </span>
          <span style={{ display: "flex", gap: 5 }} aria-hidden="true">
            {STEPS.map((s, i) => (
              <span key={s.id} style={{ width: 18, height: 3, background: i <= index ? T.accent : T.line }} />
            ))}
          </span>
        </div>
        <h2 id="gd-title" style={{ fontFamily: T.display, fontSize: 19, fontWeight: 700, color: T.ink, margin: "10px 0 0", lineHeight: 1.25 }}>
          {step.title}
        </h2>
        <p id="gd-text" style={{ fontSize: 14, color: T.text, margin: "6px 0 0", lineHeight: 1.55 }}>
          {step.text(wide)}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 16 }}>
          {last ? (
            <span />
          ) : (
            <button type="button" onClick={onClose} className="gd-btn gd-ghost">
              Passer
            </button>
          )}
          <button ref={primaryRef} type="button" onClick={next} className="gd-btn gd-primary">
            {last ? "C’est parti" : "Suivant"}
          </button>
        </div>
        </div>
      </div>

      {/* Read out on each step, for screen readers. */}
      <p aria-live="polite" style={{ position: "fixed", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", margin: -1 }}>
        {`Étape ${index + 1} sur ${STEPS.length} : ${step.title}. ${step.text(wide)}`}
      </p>
    </div>
  );
}

/** Step 3: the comment box opens at the pin, the sample types itself, Enregistrer is pressed. */
function DemoBubble({ theme: T, at, page, motion }: { theme: GuideTheme; at: { x: number; y: number }; page: Rect; motion: boolean }) {
  const [typed, setTyped] = useState(motion ? "" : SAMPLE);
  const [phase, setPhase] = useState<"typing" | "pressed" | "saved">(motion ? "typing" : "pressed");
  useEffect(() => {
    if (!motion) return;
    let i = 0;
    let timer = 0;
    const start = window.setTimeout(function tick() {
      i += 1;
      setTyped(SAMPLE.slice(0, i));
      if (i < SAMPLE.length) timer = window.setTimeout(tick, 42);
      else timer = window.setTimeout(() => {
        setPhase("pressed");
        timer = window.setTimeout(() => setPhase("saved"), 650);
      }, 450);
    }, 650);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(timer);
    };
  }, [motion]);

  const w = Math.min(260, page.width - 16);
  const left = Math.min(Math.max(at.x - w / 2, page.left + 8), page.left + page.width - w - 8);
  const below = at.y + 22 + 150 < Math.min(page.top + page.height, window.innerHeight);
  return (
    <>
      <div
        className={motion ? "gd-bubble gd-in" : "gd-bubble"}
        style={{ position: "fixed", left, width: w, ...(below ? { top: at.y + 22 } : { top: at.y - 22 - 150 }), borderTop: `3px solid ${T.accent}` }}
      >
        <b style={{ fontSize: 12.5, color: T.ink }}>Votre commentaire à cet endroit</b>
        <div style={{ border: `1px solid ${T.line}`, padding: "8px 10px", fontSize: 13.5, color: T.text, minHeight: 44, marginTop: 8 }}>
          {typed}
          {motion && phase === "typing" ? <span className="gd-caret" /> : null}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <span className={phase === "pressed" && motion ? "gd-fake-btn gd-press" : "gd-fake-btn"} style={{ background: T.ink, color: "#fff" }}>
            {phase === "saved" ? "✓ Enregistré" : "Enregistrer"}
          </span>
          <span className="gd-fake-btn" style={{ border: `1px solid ${T.line}`, color: T.link, background: "#fff" }}>
            Annuler
          </span>
        </div>
      </div>
    </>
  );
}

/** Step 4: a sample item in the list, with its two actions highlighted. */
function DemoListItem({ theme: T, hole, tabs, motion }: { theme: GuideTheme; hole: Rect; tabs: Rect | null; motion: boolean }) {
  const top = tabs ? tabs.top + tabs.height : hole.top + hole.height / 2;
  return (
    <div className={motion ? "gd-in" : undefined} style={{ position: "fixed", left: hole.left + 6, width: hole.width - 12, top, background: T.soft, borderLeft: `3px solid ${T.accent}`, padding: "11px 14px", display: "grid", gridTemplateColumns: "26px 1fr", gap: 10 }}>
      <span style={{ width: 24, height: 24, borderRadius: "50%", background: T.ink, color: "#fff", fontSize: 12, fontWeight: 800, display: "grid", placeItems: "center" }}>1</span>
      <span>
        <span style={{ display: "block", fontSize: 11.5, color: T.muted }}>
          <b style={{ color: T.ink }}>p.&nbsp;1, couverture</b> · À traiter
        </span>
        <span style={{ display: "block", fontSize: 13.5, color: T.text, marginTop: 2 }}>{SAMPLE}</span>
        <span style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <span className={motion ? "gd-fake-btn gd-glow" : "gd-fake-btn gd-glow-static"} style={{ background: "#1a8f3c", color: "#fff" }}>
            ✓ Résolu
          </span>
          <span className={motion ? "gd-fake-btn gd-glow gd-delay" : "gd-fake-btn gd-glow-static"} style={{ border: `1px solid ${T.line}`, color: T.link, background: "#fff" }}>
            Modifier
          </span>
        </span>
      </span>
    </div>
  );
}

const css = (T: GuideTheme) => `
.gd-root { font-family: inherit; }
.gd-hole { transition: transform 520ms cubic-bezier(.22,.8,.24,1); animation: gd-fade 320ms ease-out both; }
@keyframes gd-fade { from { opacity: 0; } to { opacity: 1; } }
.gd-card { background: #fff; border-top: 3px solid ${T.accent}; box-shadow: 0 24px 60px rgba(6,36,59,.35); padding: 16px 18px 16px; color: ${T.text}; }
.gd-in { animation: gd-in 360ms cubic-bezier(.22,.8,.24,1) both; }
@keyframes gd-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.gd-btn { font-family: inherit; font-size: 14px; font-weight: 600; border-radius: 0; cursor: pointer; min-height: 44px; padding: 10px 16px; }
.gd-primary { background: ${T.ink}; color: #fff; border: none; }
.gd-ghost { background: #fff; color: ${T.muted}; border: 1px solid ${T.line}; }
.gd-btn:focus-visible { outline: 2px solid ${T.accent}; outline-offset: 2px; }
.gd-ring { border: 2px solid ${T.accent}; box-shadow: 0 0 0 4px rgba(22,192,201,.25); }
.gd-pulse { animation: gd-pulse 1.8s ease-out infinite; }
.gd-delay { animation-delay: .6s; }
@keyframes gd-pulse { 0% { opacity: .35; transform: scale(.98); } 35% { opacity: 1; transform: scale(1); } 100% { opacity: .35; transform: scale(1.02); } }
.gd-sheet { position: absolute; inset: 0; transform-origin: left center; background: linear-gradient(90deg, rgba(255,255,255,.96), rgba(242,247,247,.98) 70%, rgba(200,214,218,.95)); box-shadow: -8px 0 24px rgba(6,36,59,.18); opacity: 0; animation: gd-turn 2.8s cubic-bezier(.45,.05,.3,1) infinite; animation-delay: .5s; }
@keyframes gd-turn { 0% { opacity: 0; transform: rotateY(0deg); } 12% { opacity: 1; transform: rotateY(-8deg); } 55% { opacity: 1; transform: rotateY(-172deg); } 68%, 100% { opacity: 0; transform: rotateY(-180deg); } }
.gd-hand { width: 44px; height: 44px; filter: drop-shadow(0 6px 10px rgba(6,36,59,.35)); }
.gd-hand-move { animation: gd-hand 3.4s cubic-bezier(.4,0,.2,1) infinite; }
@keyframes gd-hand { 0% { opacity: 0; transform: translate(110px, 150px); } 10% { opacity: 1; } 38% { transform: translate(0, 0) scale(1); } 44% { transform: translate(0, 0) scale(.84); } 50% { transform: translate(0, 0) scale(1); } 82% { opacity: 1; transform: translate(0, 0); } 94%, 100% { opacity: 0; transform: translate(30px, 40px); } }
.gd-ripple { width: 60px; height: 60px; border-radius: 50%; border: 2px solid ${T.accent}; opacity: 0; animation: gd-ripple 3.4s ease-out infinite; }
@keyframes gd-ripple { 0%, 42% { opacity: 0; transform: scale(.2); } 45% { opacity: .9; transform: scale(.3); } 72%, 100% { opacity: 0; transform: scale(1.6); } }
.gd-pin { width: 30px; height: 30px; border-radius: 50%; background: ${T.ink}; color: #fff; border: 2px solid #fff; box-shadow: 0 0 0 3px ${T.accent}, 0 3px 10px rgba(6,36,59,.35); font-size: 13px; font-weight: 800; display: grid; place-items: center; }
.gd-pin-drop { opacity: 0; animation: gd-pin 3.4s cubic-bezier(.3,1.4,.5,1) infinite; }
@keyframes gd-pin { 0%, 46% { opacity: 0; transform: translateY(-18px) scale(.6); } 56% { opacity: 1; transform: translateY(0) scale(1.08); } 62% { transform: scale(1); } 86% { opacity: 1; } 96%, 100% { opacity: 0; } }
.gd-bubble { background: #fff; border: 1px solid ${T.line}; box-shadow: 0 14px 40px rgba(6,36,59,.28); padding: 12px; }
.gd-caret { display: inline-block; width: 1.5px; height: 1em; background: ${T.ink}; vertical-align: -2px; margin-left: 1px; animation: gd-blink 1s steps(1) infinite; }
@keyframes gd-blink { 50% { opacity: 0; } }
.gd-fake-btn { display: inline-block; padding: 8px 12px; font-size: 12.5px; font-weight: 600; }
.gd-press { animation: gd-press 420ms ease-out; }
@keyframes gd-press { 50% { transform: scale(.93); opacity: .85; } }
.gd-glow { box-shadow: 0 0 0 3px ${T.accent}; animation: gd-glow 1.8s ease-out infinite; }
.gd-glow-static { box-shadow: 0 0 0 3px ${T.accent}; }
@keyframes gd-glow { 0%, 100% { transform: scale(1); } 40% { transform: scale(1.07); } }
@media (prefers-reduced-motion: reduce) {
  .gd-hole { transition: none; animation: none; }
  .gd-in, .gd-pulse, .gd-sheet, .gd-hand-move, .gd-ripple, .gd-pin-drop, .gd-caret, .gd-press, .gd-glow { animation: none !important; }
  .gd-pin-drop { opacity: 1; }
}
`;
