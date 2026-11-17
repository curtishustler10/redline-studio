"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useFormState, useFormStatus } from "react-dom";
import { removeComment, saveComment, setCommentStatus, type CommentResult } from "@/app/portal/comment-actions";
import { COMMENT_MAX, numberOnPage, plural, sortComments, type DocumentComment } from "@/lib/document-comments";
import { pageTitle, type DocPagesSection } from "@/lib/project-doc";
import { EC as FENUA, FENUA_DISPLAY } from "./fenua/theme";
import { ReaderGuide } from "./reader-guide";

/**
 * Colours and fonts of the reader. The Fenua theme is the default (Ergoligne,
 * first user); a Redline project passes its own. Corners stay square in both.
 */
export type ReaderTheme = {
  /** Titles, pins, primary buttons. */
  ink: string;
  /** Selection ring, new-comment pin, active tab. */
  accent: string;
  /** Text on the new-comment pin. */
  onAccent: string;
  /** Links and secondary buttons. */
  link: string;
  /** Selected list item, inactive tab. */
  soft: string;
  text: string;
  muted: string;
  line: string;
  display: string;
};

/** What the reader needs to know about the document and who reads it. */
export type ReaderDocument = { slug: string; section: DocPagesSection };

type Draft = { page: number; x: number; y: number };

export const FENUA_READER_THEME: ReaderTheme = {
  ink: FENUA.abysse,
  accent: FENUA.lagon,
  onAccent: FENUA.abysse,
  link: FENUA.recif,
  soft: FENUA.ecume,
  text: FENUA.ardoise,
  muted: FENUA.muted,
  line: FENUA.line,
  display: FENUA_DISPLAY,
};

export const REDLINE_READER_THEME: ReaderTheme = {
  ink: "#1E1A17",
  accent: "#E03C2D",
  onAccent: "#fff",
  link: "#C8321F",
  soft: "#F3E9DA",
  text: "#1E1A17",
  muted: "#6F655C",
  line: "rgba(30, 26, 23, 0.12)",
  display: "var(--font-display)",
};

// Theme and time zone of the reader, for every part of it.
const Ctx = createContext<{ theme: ReaderTheme; timeZone: string }>({ theme: FENUA_READER_THEME, timeZone: "Pacific/Tahiti" });
const useTheme = () => useContext(Ctx).theme;

// --- styles ------------------------------------------------------------------

const field = (EC: ReaderTheme): CSSProperties => ({
  width: "100%",
  padding: "9px 11px",
  border: `1px solid ${EC.line}`,
  fontSize: 14,
  fontFamily: "inherit",
  color: EC.text,
  background: "#fff",
  resize: "vertical",
  lineHeight: 1.5,
  borderRadius: 0,
});
const primary = (EC: ReaderTheme): CSSProperties => ({
  padding: "9px 14px",
  background: EC.ink,
  color: "#fff",
  border: "none",
  fontWeight: 600,
  fontSize: 13,
  borderRadius: 0,
  fontFamily: "inherit",
});
const ghost = (EC: ReaderTheme): CSSProperties => ({
  padding: "8px 11px",
  background: "#fff",
  color: EC.link,
  border: `1px solid ${EC.line}`,
  fontWeight: 600,
  fontSize: 12.5,
  cursor: "pointer",
  borderRadius: 0,
  fontFamily: "inherit",
});
const navButton = (EC: ReaderTheme): CSSProperties => ({ ...ghost(EC), padding: "10px 14px", fontSize: 13.5, minWidth: 44 });

// Mise en page responsive : les styles en ligne ne savent pas faire de media query.
const css = (EC: ReaderTheme) => `
.lv-main { display: grid; gap: 18px; grid-template-columns: minmax(0, 1fr); }
.lv-side { background: #fff; border: 1px solid ${EC.line}; }
@media (min-width: 900px) {
  .lv-main { grid-template-columns: minmax(0, 1fr) 320px; align-items: start; }
  .lv-side { position: sticky; top: 16px; max-height: calc(100dvh - 32px); overflow: auto; }
}
.lv-thumbs::-webkit-scrollbar { height: 6px; }
.lv-thumbs::-webkit-scrollbar-thumb { background: ${EC.line}; }
@media (max-width: 430px) { .lv-hide-sm { display: none; } }
.lv-page { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
`;

// --- petits composants ------------------------------------------------------

/** Bouton d'envoi qui montre que l'enregistrement est parti (2 à 4 s depuis Tahiti). */
function Submit({ children, pending, style }: { children: ReactNode; pending: string; style?: CSSProperties }) {
  const EC = useTheme();
  const { pending: busy } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={busy}
      aria-busy={busy}
      style={{ ...primary(EC), ...style, opacity: busy ? 0.55 : 1, cursor: busy ? "wait" : "pointer" }}
    >
      {busy ? pending : children}
    </button>
  );
}

function ErrorLine({ state }: { state: CommentResult }) {
  if (!state || state.ok) return null;
  return (
    <div role="alert" style={{ background: "#fdeaea", borderLeft: "3px solid #b91c1c", padding: "8px 10px", fontSize: 12.5, color: "#7f1d1d" }}>
      {state.error}
    </div>
  );
}

/**
 * Appelle `onOk` une fois par réponse réussie d'une server action. Le drapeau évite
 * de rappeler `onOk` à chaque rendu tant que l'état reste « réussi ».
 */
function useOnSuccess(state: CommentResult, onOk: (id: number | undefined) => void) {
  const handled = useRef<CommentResult>(null);
  const cb = useRef(onOk);
  cb.current = onOk;
  useEffect(() => {
    if (state?.ok && handled.current !== state) {
      handled.current = state;
      cb.current(state.id);
    }
  }, [state]);
}

function Pin({
  n,
  x,
  y,
  tone,
  label,
  onClick,
}: {
  n: ReactNode;
  x: number;
  y: number;
  tone: "open" | "resolved" | "selected" | "draft";
  label: string;
  onClick?: () => void;
}) {
  const EC = useTheme();
  const bg = tone === "resolved" ? "#8a969c" : tone === "draft" ? EC.accent : EC.ink;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
        width: 30,
        height: 30,
        borderRadius: "50%",
        background: bg,
        color: tone === "draft" ? EC.onAccent : "#fff",
        border: "2px solid #fff",
        boxShadow:
          tone === "selected" || tone === "draft"
            ? `0 0 0 3px ${EC.accent}, 0 3px 10px rgba(6,36,59,.35)`
            : "0 3px 10px rgba(6,36,59,.35)",
        fontSize: 13,
        fontWeight: 800,
        lineHeight: 1,
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        padding: 0,
        zIndex: tone === "selected" || tone === "draft" ? 3 : 2,
      }}
    >
      {n}
    </button>
  );
}

/**
 * Bulle accrochée au point touché. Elle reste dans la largeur de la page (bornée à
 * 8 px des bords) et passe au-dessus du point quand il est dans le bas de la page.
 */
function Bubble({ x, y, children, label }: { x: number; y: number; children: ReactNode; label: string }) {
  const EC = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);
  const width = "min(300px, calc(100% - 16px))";
  const below = y < 58;
  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={label}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        zIndex: 5,
        width,
        left: `clamp(8px, calc(${x}% - 150px), calc(100% - ${width} - 8px))`,
        ...(below ? { top: `calc(${y}% + 22px)` } : { bottom: `calc(${100 - y}% + 22px)` }),
        background: "#fff",
        border: `1px solid ${EC.line}`,
        borderTop: `3px solid ${EC.accent}`,
        boxShadow: "0 14px 40px rgba(6,36,59,.28)",
        padding: 12,
        display: "grid",
        gap: 8,
        cursor: "default",
      }}
    >
      {children}
    </div>
  );
}

const CloseButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Fermer"
    style={{ background: "none", border: "none", fontSize: 20, lineHeight: 1, color: "#8a969c", cursor: "pointer", padding: "0 2px" }}
  >
    ×
  </button>
);

// --- bulles : nouveau commentaire, commentaire existant -----------------------

function DraftBox({
  doc,
  draft,
  onCancel,
  onSaved,
  onDirty,
}: {
  doc: ReaderDocument;
  draft: Draft;
  onCancel: () => void;
  onSaved: () => void;
  onDirty: (dirty: boolean) => void;
}) {
  const EC = useTheme();
  const [state, action] = useFormState(saveComment, null);
  useOnSuccess(state, onSaved);
  return (
    <Bubble x={draft.x} y={draft.y} label="Nouveau commentaire">
      <form action={action} style={{ display: "grid", gap: 8 }}>
        <input type="hidden" name="document" value={doc.slug} />
        <input type="hidden" name="page" value={draft.page} />
        <input type="hidden" name="x" value={draft.x} />
        <input type="hidden" name="y" value={draft.y} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <b style={{ fontSize: 13, color: EC.ink }}>Votre commentaire à cet endroit</b>
          <CloseButton onClick={onCancel} />
        </div>
        <textarea
          name="body"
          required
          autoFocus
          rows={3}
          maxLength={COMMENT_MAX}
          placeholder="Ce qui doit changer, ou ce qui vous plaît"
          aria-label="Votre commentaire"
          onChange={(e) => onDirty(e.currentTarget.value.trim() !== "")}
          style={field(EC)}
        />
        <ErrorLine state={state} />
        <div style={{ display: "flex", gap: 8 }}>
          <Submit pending="Enregistrement…">Enregistrer</Submit>
          <button type="button" onClick={onCancel} style={ghost(EC)}>
            Annuler
          </button>
        </div>
      </form>
    </Bubble>
  );
}

const when = (iso: string, timeZone: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    timeZone,
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

function CommentBox({
  doc,
  comment,
  num,
  studio,
  onClose,
  onNotice,
}: {
  doc: ReaderDocument;
  studio: string;
  comment: DocumentComment;
  num: number;
  onClose: () => void;
  onNotice: (text: string) => void;
}) {
  const EC = useTheme();
  const { timeZone } = useContext(Ctx);
  const [mode, setMode] = useState<"view" | "edit" | "delete">("view");
  const [saveState, save] = useFormState(saveComment, null);
  const [statusState, status] = useFormState(setCommentStatus, null);
  const [deleteState, remove] = useFormState(removeComment, null);
  useOnSuccess(saveState, () => {
    setMode("view");
    onNotice("Commentaire modifié.");
  });
  // L'état visé est noté à l'envoi : à la réponse, les props portent déjà le nouvel état.
  const statusTarget = useRef<"open" | "resolved">("resolved");
  useOnSuccess(statusState, () =>
    onNotice(statusTarget.current === "resolved" ? "Commentaire marqué comme résolu." : "Commentaire rouvert."),
  );
  // Pas de rappel de succès pour la suppression : la réponse arrive avec la liste à
  // jour, cette bulle est déjà démontée. Le lecteur constate la disparition (plus bas).

  const resolved = comment.status === "resolved";
  const own = comment.author === "client";
  const hidden = (
    <>
      <input type="hidden" name="document" value={doc.slug} />
      <input type="hidden" name="comment_id" value={comment.id} />
    </>
  );

  return (
    <Bubble x={comment.x} y={comment.y} label={`Commentaire ${num}`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, color: EC.muted }}>
          <b style={{ color: EC.ink }}>n°&nbsp;{num}</b> · {own ? when(comment.created_at, timeZone) : studio}
          {resolved ? (
            <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, padding: "2px 6px", background: "#e8f7ec", color: "#166534" }}>
              Résolu
            </span>
          ) : null}
        </span>
        <CloseButton onClick={onClose} />
      </div>

      {mode === "edit" ? (
        <form action={save} style={{ display: "grid", gap: 8 }}>
          {hidden}
          <textarea name="body" required autoFocus rows={4} maxLength={COMMENT_MAX} defaultValue={comment.body} aria-label="Votre commentaire" style={field(EC)} />
          <ErrorLine state={saveState} />
          <div style={{ display: "flex", gap: 8 }}>
            <Submit pending="Enregistrement…">Enregistrer</Submit>
            <button type="button" onClick={() => setMode("view")} style={ghost(EC)}>
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <p style={{ margin: 0, fontSize: 14, color: resolved ? EC.muted : EC.text, whiteSpace: "pre-line", lineHeight: 1.5, maxHeight: 180, overflow: "auto" }}>
          {comment.body}
        </p>
      )}

      {mode === "delete" ? (
        // Confirmation dans la bulle, sans window.confirm : lisible et utilisable au doigt.
        <form action={remove} style={{ display: "grid", gap: 8, background: "#fdeaea", padding: 10 }}>
          {hidden}
          <b style={{ fontSize: 13, color: "#7f1d1d" }}>Supprimer ce commentaire&nbsp;?</b>
          <ErrorLine state={deleteState} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" autoFocus onClick={() => setMode("view")} style={ghost(EC)}>
              Annuler
            </button>
            <Submit pending="Suppression…" style={{ background: "#b91c1c" }}>
              Oui, supprimer
            </Submit>
          </div>
        </form>
      ) : null}

      {own && mode === "view" ? (
        <>
          <ErrorLine state={statusState} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <form action={status} onSubmit={() => (statusTarget.current = resolved ? "open" : "resolved")}>
              {hidden}
              <input type="hidden" name="status" value={resolved ? "open" : "resolved"} />
              <Submit pending="…" style={resolved ? { ...ghost(EC) } : { background: "#1a8f3c" }}>
                {resolved ? "Rouvrir" : "✓ Résolu"}
              </Submit>
            </form>
            <button type="button" onClick={() => setMode("edit")} style={ghost(EC)}>
              Modifier
            </button>
            <button type="button" onClick={() => setMode("delete")} style={{ ...ghost(EC), color: "#8a969c" }}>
              Supprimer
            </button>
          </div>
        </>
      ) : null}
    </Bubble>
  );
}

// --- lecteur ----------------------------------------------------------------

export function PagesReader(props: {
  projectSlug: string;
  /** Who reads the comments: « Fenua Studio », « Redline Studio ». */
  studio: string;
  timeZone: string;
  theme: ReaderTheme;
  doc: ReaderDocument;
  comments: DocumentComment[];
  initialPage: number;
  /** Play the first-visit guide (and offer « Revoir le guide »). */
  guide?: boolean;
}) {
  return (
    <Ctx.Provider value={{ theme: props.theme, timeZone: props.timeZone }}>
      <Reader {...props} />
    </Ctx.Provider>
  );
}

/**
 * The guide is marked as seen in this browser, per project. No cookie or column:
 * a project's space has one reader, and seeing it again on a new device does no harm.
 */
const guideKey = (projectSlug: string) => `portal-guide:${projectSlug}:v1`;

function Reader({
  projectSlug,
  studio,
  doc,
  comments,
  initialPage,
  guide = false,
}: {
  projectSlug: string;
  studio: string;
  doc: ReaderDocument;
  comments: DocumentComment[];
  initialPage: number;
  guide?: boolean;
}) {
  const EC = useTheme();
  const [guideOpen, setGuideOpen] = useState(false);
  const replayRef = useRef<HTMLButtonElement>(null);

  // First visit (or ?guide=1): the guide starts by itself once the page is drawn.
  useEffect(() => {
    if (!guide) return;
    const forced = new URLSearchParams(window.location.search).get("guide") === "1";
    let seen = false;
    try {
      seen = window.localStorage.getItem(guideKey(projectSlug)) === "1";
    } catch {
      // Storage blocked (private mode): show it, it costs one tap to skip.
    }
    if (!forced && seen) return;
    const t = window.setTimeout(() => setGuideOpen(true), 700);
    return () => window.clearTimeout(t);
  }, [guide, projectSlug]);

  function openGuide() {
    setDraft(null);
    setSelected(null);
    draftDirty.current = false;
    setGuideOpen(true);
  }

  function closeGuide() {
    setGuideOpen(false);
    try {
      window.localStorage.setItem(guideKey(projectSlug), "1");
    } catch {
      // Not stored: it will play again next time, nothing else.
    }
    const url = new URL(window.location.href);
    if (url.searchParams.has("guide")) {
      url.searchParams.delete("guide");
      window.history.replaceState(null, "", url);
    }
    replayRef.current?.focus({ preventScroll: true });
  }
  const section = doc.section;
  const total = section.pages.length;
  // Page images live in the private bucket, served only to this project's session.
  const src = (file: string) => `/portal/${projectSlug}/apercus/${file}`;
  const pageAt = (n: number) => section.pages.find((p) => p.n === n);
  const [broken, setBroken] = useState<number | null>(null);
  const [page, setPage] = useState(initialPage);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [tab, setTab] = useState<"page" | "all">("page");
  const [notice, setNotice] = useState<string | null>(null);
  const draftDirty = useRef(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(() => sortComments(comments), [comments]);
  const numbers = useMemo(() => numberOnPage(comments), [comments]);
  const onPage = sorted.filter((c) => c.page === page);
  const openCount = comments.filter((c) => c.status === "open").length;
  const openByPage = useMemo(() => {
    const m = new Map<number, number>();
    for (const c of comments) if (c.status === "open") m.set(c.page, (m.get(c.page) ?? 0) + 1);
    return m;
  }, [comments]);
  // Un commentaire supprimé disparaît des props : sa bulle se referme d'elle-même.
  const selectedComment = comments.find((c) => c.id === selected && c.page === page) ?? null;

  // Le commentaire ouvert a disparu de la liste : c'est qu'il vient d'être supprimé.
  useEffect(() => {
    if (selected !== null && !comments.some((c) => c.id === selected)) {
      setSelected(null);
      setNotice("Commentaire supprimé.");
    }
  }, [comments, selected]);

  function closeBoxes() {
    setDraft(null);
    setSelected(null);
    draftDirty.current = false;
  }

  function goTo(n: number, select: number | null = null) {
    if (n < 1 || n > total) return;
    setPage(n);
    setDraft(null);
    draftDirty.current = false;
    setSelected(select);
  }

  // Flèches du clavier : page précédente / suivante, sauf pendant la saisie.
  // Échap referme la bulle ouverte.
  const goRef = useRef(goTo);
  goRef.current = goTo;
  const pageNow = useRef(page);
  pageNow.current = page;
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT" || t.tagName === "SELECT" || t.isContentEditable);
      if (e.key === "Escape") {
        setDraft(null);
        setSelected(null);
        draftDirty.current = false;
        return;
      }
      if (typing || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowLeft") goRef.current(pageNow.current - 1);
      if (e.key === "ArrowRight") goRef.current(pageNow.current + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // L'adresse suit la page : un rechargement ou un lien partagé rouvre la même page.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("p", String(page));
    window.history.replaceState(null, "", url);
  }, [page]);

  // Les pages voisines se chargent d'avance : tourner la page ne fait pas attendre.
  useEffect(() => {
    for (const n of [page - 1, page + 1]) {
      const p = pageAt(n);
      if (p) new Image().src = src(p.image);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // La vignette de la page courante reste visible dans le bandeau, sans faire
  // défiler la fenêtre (scrollIntoView l'aurait fait sur téléphone).
  useEffect(() => {
    const strip = stripRef.current;
    const thumb = strip?.querySelector<HTMLElement>(`[data-page="${page}"]`);
    if (strip && thumb) {
      strip.scrollTo({ left: thumb.offsetLeft - strip.clientWidth / 2 + thumb.clientWidth / 2, behavior: "smooth" });
    }
  }, [page]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(t);
  }, [notice]);

  function onPageClick(e: MouseEvent<HTMLDivElement>) {
    // Une bulle ouverte se referme au premier toucher à côté ; une bulle vide se
    // déplace simplement au nouvel endroit.
    if (selected !== null || (draft && draftDirty.current)) {
      closeBoxes();
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * 10000) / 100;
    const y = Math.round(((e.clientY - r.top) / r.height) * 10000) / 100;
    setDraft({ page, x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) });
  }

  function openFromList(c: DocumentComment) {
    goTo(c.page, c.id);
    pageRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  const listItem = (c: DocumentComment, showPage: boolean) => {
    const n = numbers.get(c.id) ?? 0;
    const active = c.id === selected;
    const resolved = c.status === "resolved";
    return (
      <li key={c.id} style={{ listStyle: "none" }}>
        <button
          type="button"
          onClick={() => openFromList(c)}
          aria-current={active ? "true" : undefined}
          style={{
            display: "grid",
            gridTemplateColumns: "26px 1fr",
            gap: 10,
            width: "100%",
            textAlign: "left",
            padding: "11px 14px",
            background: active ? EC.soft : "#fff",
            border: "none",
            borderTop: `1px solid ${EC.line}`,
            borderLeft: `3px solid ${active ? EC.accent : "transparent"}`,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: resolved ? "#8a969c" : EC.ink,
              color: "#fff",
              fontSize: 12,
              fontWeight: 800,
              display: "grid",
              placeItems: "center",
            }}
          >
            {n}
          </span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 11.5, color: EC.muted, marginBottom: 2 }}>
              {showPage ? <b style={{ color: EC.ink }}>{c.label || `p. ${c.page}`}</b> : null}
              {showPage ? " · " : ""}
              {resolved ? <span style={{ color: "#166534", fontWeight: 700 }}>✓ Résolu</span> : "À traiter"}
            </span>
            <span
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                fontSize: 13.5,
                color: resolved ? "#8a969c" : EC.text,
                lineHeight: 1.45,
                whiteSpace: "pre-line",
              }}
            >
              {c.body}
            </span>
          </span>
        </button>
      </li>
    );
  };

  const tabButton = (key: "page" | "all", text: string) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      aria-pressed={tab === key}
      style={{
        flex: 1,
        padding: "10px 8px",
        fontSize: 12.5,
        fontWeight: 700,
        fontFamily: "inherit",
        background: tab === key ? "#fff" : EC.soft,
        color: tab === key ? EC.ink : EC.muted,
        border: "none",
        borderBottom: `2px solid ${tab === key ? EC.accent : "transparent"}`,
        cursor: "pointer",
      }}
    >
      {text}
    </button>
  );

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 0 24px" }}>
      <style>{css(EC)}</style>

      {/* Confirmation d'action, fixée en bas de l'écran : visible où que l'on soit dans la page. */}
      {notice ? (
        <div
          role="status"
          style={{
            position: "fixed",
            left: "50%",
            bottom: 16,
            transform: "translateX(-50%)",
            zIndex: 20,
            width: "max-content",
            maxWidth: "calc(100% - 28px)",
            background: "#e8f7ec",
            borderLeft: "3px solid #1a8f3c",
            boxShadow: "0 8px 24px rgba(6,36,59,.18)",
            padding: "11px 14px",
            fontSize: 13.5,
            fontWeight: 600,
            color: "#166534",
          }}
        >
          ✓ {notice}
        </div>
      ) : null}

      <header style={{ padding: "4px 0 14px", borderBottom: `1px solid ${EC.line}`, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: EC.link, textTransform: "uppercase", letterSpacing: "1.5px" }}>
          Votre livret à valider
        </div>
        <h1 style={{ fontFamily: EC.display, fontSize: 21, fontWeight: 800, color: EC.ink, margin: "4px 0 0", lineHeight: 1.25 }}>
          {section.title}
        </h1>
        <p style={{ fontSize: 13.5, color: EC.muted, margin: "6px 0 0" }}>
          Touchez ou cliquez sur la page, à l’endroit exact, pour y laisser un commentaire. {studio} les reçoit au fur et à mesure.
        </p>
        {guide ? (
          <button
            ref={replayRef}
            type="button"
            onClick={openGuide}
            style={{ marginTop: 8, padding: "6px 0", background: "none", border: "none", color: EC.link, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 4 }}
          >
            Revoir le guide
          </button>
        ) : null}
      </header>
      {guideOpen ? <ReaderGuide theme={EC} onClose={closeGuide} /> : null}

      <div className="lv-main">
        <div style={{ minWidth: 0 }}>
          {/* Navigation */}
          <nav aria-label="Pages du livret" data-guide="nav" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
            <button type="button" onClick={() => goTo(page - 1)} disabled={page <= 1} aria-label="Page précédente" style={{ ...navButton(EC), opacity: page <= 1 ? 0.4 : 1, cursor: page <= 1 ? "default" : "pointer" }}>
              ← <span className="lv-hide-sm">Précédente</span>
            </button>
            <div style={{ textAlign: "center", minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: EC.ink }} aria-live="polite">
                Page {page} sur {total}
              </div>
              <div style={{ fontSize: 12.5, color: EC.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pageTitle(section, page)}</div>
            </div>
            <button type="button" onClick={() => goTo(page + 1)} disabled={page >= total} aria-label="Page suivante" data-guide="next" style={{ ...navButton(EC), opacity: page >= total ? 0.4 : 1, cursor: page >= total ? "default" : "pointer" }}>
              <span className="lv-hide-sm">Suivante</span> →
            </button>
          </nav>

          {/* Page */}
          <div
            ref={pageRef}
            style={{
              width: `min(100%, max(300px, calc((100dvh - 300px) * ${section.width} / ${section.height})))`,
              margin: "0 auto",
              scrollMarginTop: 12,
            }}
          >
            <div
              className="lv-page"
              onClick={onPageClick}
              data-testid="livret-page"
              data-guide="page"
              style={{
                position: "relative",
                aspectRatio: `${section.width} / ${section.height}`,
                background: "#fff",
                boxShadow: "0 6px 24px rgba(6,36,59,.14)",
                cursor: "crosshair",
                userSelect: "none",
              }}
            >
              {/* Image figée déjà dimensionnée (2× l'affichage) : next/image n'apporterait qu'un aller-retour. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={page}
                src={src(pageAt(page)?.image ?? "")}
                alt={`Page ${page} du livret\u00a0: ${pageTitle(section, page)}`}
                width={section.width}
                height={section.height}
                draggable={false}
                onLoad={() => setBroken((b) => (b === page ? null : b))}
                onError={() => setBroken(page)}
                style={{ display: "block", width: "100%", height: "100%", pointerEvents: "none" }}
              />
              {broken === page ? (
                <p role="alert" style={{ position: "absolute", inset: "auto 12px 12px", margin: 0, background: "#fdeaea", borderLeft: "3px solid #b91c1c", padding: "9px 11px", fontSize: 13, color: "#7f1d1d" }}>
                  La page n’a pas pu s’afficher. Votre session a peut-être expiré : rechargez la page.
                </p>
              ) : null}
              {onPage.map((c) => (
                <Pin
                  key={c.id}
                  n={numbers.get(c.id)}
                  x={c.x}
                  y={c.y}
                  tone={c.id === selected ? "selected" : c.status === "resolved" ? "resolved" : "open"}
                  label={`Commentaire ${numbers.get(c.id)}${c.status === "resolved" ? ", résolu" : ""}`}
                  onClick={() => {
                    setDraft(null);
                    draftDirty.current = false;
                    setSelected(c.id === selected ? null : c.id);
                  }}
                />
              ))}
              {draft && draft.page === page ? <Pin n="+" x={draft.x} y={draft.y} tone="draft" label="Nouveau commentaire ici" /> : null}
              {draft && draft.page === page ? (
                <DraftBox
                  key={`${draft.x}-${draft.y}`}
                  doc={doc}
                  draft={draft}
                  onCancel={closeBoxes}
                  onDirty={(d) => (draftDirty.current = d)}
                  onSaved={() => {
                    closeBoxes();
                    setNotice(`Commentaire enregistré sur la page ${page}.`);
                  }}
                />
              ) : null}
              {selectedComment ? (
                <CommentBox
                  key={selectedComment.id}
                  doc={doc}
                  comment={selectedComment}
                  num={numbers.get(selectedComment.id) ?? 0}
                  studio={studio}
                  onClose={() => setSelected(null)}
                  onNotice={setNotice}
                />
              ) : null}
            </div>
          </div>


          {/* Vignettes */}
          <div
            ref={stripRef}
            className="lv-thumbs"
            data-guide="thumbs"
            style={{ display: "flex", gap: 8, overflowX: "auto", padding: "14px 2px 8px", marginTop: 6, scrollbarWidth: "thin" }}
          >
            {section.pages.map((p) => {
              const current = p.n === page;
              const open = openByPage.get(p.n) ?? 0;
              return (
                <button
                  key={p.n}
                  type="button"
                  data-page={p.n}
                  onClick={() => goTo(p.n)}
                  aria-label={`Page ${p.n}, ${p.title}${open ? `, ${plural(open, "commentaire")} à traiter` : ""}`}
                  aria-current={current ? "page" : undefined}
                  style={{
                    position: "relative",
                    flex: "0 0 auto",
                    width: 58,
                    padding: 0,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src(p.thumb)}
                    alt=""
                    width={58}
                    height={Math.round((58 * section.height) / section.width)}
                    loading="lazy"
                    style={{
                      display: "block",
                      width: 58,
                      height: "auto",
                      outline: current ? `3px solid ${EC.accent}` : `1px solid ${EC.line}`,
                      outlineOffset: current ? 0 : -1,
                      opacity: current ? 1 : 0.85,
                    }}
                  />
                  <span style={{ display: "block", fontSize: 11.5, fontWeight: current ? 800 : 600, color: current ? EC.ink : EC.muted, marginTop: 4 }}>
                    {p.n}
                  </span>
                  {open ? (
                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        top: -6,
                        right: -4,
                        minWidth: 19,
                        height: 19,
                        padding: "0 4px",
                        borderRadius: 10,
                        background: EC.ink,
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 800,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      {open}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Liste des commentaires : colonne à droite sur ordinateur, sous la page sur téléphone */}
        <aside className="lv-side" aria-label="Vos commentaires" data-guide="list">
          <div style={{ padding: "14px 14px 10px" }}>
            <div style={{ fontFamily: EC.display, fontSize: 16, fontWeight: 700, color: EC.ink }}>Vos commentaires</div>
            <div style={{ fontSize: 12.5, color: EC.muted, marginTop: 2 }}>
              {comments.length === 0
                ? "Aucun pour l’instant."
                : `${plural(comments.length, "commentaire")} sur le livret, ${openCount === 0 ? "tous résolus" : `${openCount} à traiter`}.`}
            </div>
          </div>
          <div data-guide="tabs" style={{ display: "flex", borderTop: `1px solid ${EC.line}` }}>
            {tabButton("page", `Page ${page} (${onPage.length})`)}
            {tabButton("all", `Tout le livret (${comments.length})`)}
          </div>
          {tab === "page" ? (
            onPage.length ? (
              <ul style={{ margin: 0, padding: 0 }}>{onPage.map((c) => listItem(c, false))}</ul>
            ) : (
              <p style={{ fontSize: 13, color: EC.muted, margin: 0, padding: "14px", borderTop: `1px solid ${EC.line}`, lineHeight: 1.5 }}>
                Rien sur cette page. Touchez l’endroit concerné sur la page pour ajouter un commentaire.
              </p>
            )
          ) : sorted.length ? (
            <ul style={{ margin: 0, padding: 0 }}>{sorted.map((c) => listItem(c, true))}</ul>
          ) : (
            <p style={{ fontSize: 13, color: EC.muted, margin: 0, padding: "14px", borderTop: `1px solid ${EC.line}` }}>
              Aucun commentaire pour l’instant.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
