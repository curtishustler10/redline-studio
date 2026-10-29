"use client";

// One editable document of the client's space. A recap reads like the printed
// document; "Modifier" turns a section into plain fields (title + one field per
// line), and answers to the points à confirmer are always open. A previews
// document shows each proposed email (tap for full size) with a note field.
// One "Enregistrer" sends the whole document with the updated_at it was loaded
// from; the server refuses it if someone saved in between.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { saveDocumentAction, type SaveResponse } from "@/app/portal/actions";
import { formatStamp, isPreviewsDocument, newLineId, type DocContent, type DocLine, type DocPreview, type DocSection, type UpdatedBy } from "@/lib/project-doc";
import { LinesView, ProposalBadge, SectionHeading } from "./recap-view";

type Props = {
  projectSlug: string;
  timeZone: string;
  document: { slug: string; title: string; content: DocContent; updatedAt: string; updatedBy: UpdatedBy };
  /** Server-formatted, so the first render matches the HTML exactly. */
  initialStamp: string;
  /** Only the visible document shows its save bar (one fixed bar on screen). */
  active?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
};

type Status =
  { kind: "idle" } | { kind: "saving" } | { kind: "saved"; changed: number } | { kind: "error"; error: Exclude<SaveResponse, { ok: true }>["error"] };

const WHO: Record<UpdatedBy, string> = { client: "par toi", admin: "par Redline Studio", seed: "version de départ" };

const field =
  "w-full rounded-lg border border-[var(--rl-line)] bg-white px-3 py-2 text-[16px] leading-relaxed outline-none transition-colors focus:border-[var(--rl-red)] focus-visible:ring-2 focus-visible:ring-[#C8321F]/20";

const ERRORS: Record<Exclude<SaveResponse, { ok: true }>["error"], string> = {
  conflict:
    "Ce document a été enregistré ailleurs entre-temps (un autre onglet ou une autre personne). Pour ne rien écraser, rien n'a été enregistré. Copie tes changements, puis recharge la page.",
  invalid: "Ces modifications n'ont pas pu être enregistrées : un texte est peut-être trop long. Raccourcis-le et réessaie.",
  auth: "Ta session a expiré. Copie tes changements, puis reconnecte-toi avec ton code.",
  server: "Une erreur est survenue de notre côté. Réessaie dans un instant : tes changements sont toujours là.",
};

function AutoTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  // Grows with its text, and re-measures when its width changes (rotation, resize).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight + 2}px`;
    };
    fit();
    let width = el.clientWidth;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth === width) return;
      width = el.clientWidth;
      fit();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [props.value]);
  return <textarea ref={ref} rows={1} {...props} className={`${field} resize-none overflow-hidden ${props.className ?? ""}`} />;
}

/** Full-size view of one preview: the images are tall, so it scrolls as a page of its own. */
function PreviewViewer({ preview, src, onClose }: { preview: DocPreview; src: string; onClose: () => void }) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={preview.title} className="fixed inset-0 z-50 overflow-y-auto bg-[#1E1A17]/90" onClick={onClose}>
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-[#1E1A17] px-4 py-3 text-[#FBF6EE]">
        <p className="min-w-0 truncate text-sm font-medium">{preview.title}</p>
        <button ref={close} type="button" onClick={onClose} className="shrink-0 rounded-full bg-[#FBF6EE] px-4 py-1.5 text-sm font-semibold text-[#1E1A17]">
          Fermer
        </button>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- private, session-checked route: next/image would cache it publicly */}
      <img
        src={src}
        alt={`Aperçu de l'e-mail « ${preview.title} »`}
        width={preview.width}
        height={preview.height}
        className="mx-auto my-4 block h-auto w-full max-w-[600px] bg-white sm:my-8 sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export function RecapEditor({ projectSlug, timeZone, document: doc, initialStamp, active = true, onDirtyChange }: Props) {
  const [saved, setSaved] = useState<DocContent>(doc.content);
  const [draft, setDraft] = useState<DocContent>(doc.content);
  const [base, setBase] = useState({ updatedAt: doc.updatedAt, updatedBy: doc.updatedBy, stamp: initialStamp });
  const [editing, setEditing] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);
  const previews = isPreviewsDocument(doc.content);
  const [viewing, setViewing] = useState<DocPreview | null>(null);
  const closeViewer = useCallback(() => setViewing(null), []);
  const imageSrc = (p: DocPreview) => `/portal/${projectSlug}/apercus/${p.image}`;

  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function update(sectionId: string, fn: (s: DocSection) => DocSection) {
    setDraft((d) => ({ ...d, sections: d.sections.map((s) => (s.id === sectionId ? fn(s) : s)) }));
    if (status.kind === "saved" || status.kind === "error") setStatus({ kind: "idle" });
  }

  function setLine(sectionId: string, lineId: string, patch: Partial<DocLine> | null) {
    update(sectionId, (s) =>
      s.kind !== "list"
        ? s
        : { ...s, lines: patch === null ? s.lines.filter((l) => l.id !== lineId) : s.lines.map((l) => (l.id === lineId ? { ...l, ...patch } : l)) },
    );
  }

  function toggle(id: string) {
    setEditing((e) => {
      const next = new Set(e);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    setStatus({ kind: "saving" });
    let r: SaveResponse;
    try {
      r = await saveDocumentAction({ projectSlug, documentSlug: doc.slug, baseUpdatedAt: base.updatedAt, content: draft });
    } catch {
      r = { ok: false, error: "server" };
    }
    if (!r.ok) {
      setStatus({ kind: "error", error: r.error });
      return;
    }
    // What is on screen is what was saved (the server only trims and drops emptied lines).
    const clean: DocContent = {
      ...draft,
      sections: draft.sections.map((s) => (s.kind === "list" ? { ...s, lines: s.lines.filter((l) => l.text.trim()) } : s)),
    };
    setDraft(clean);
    setSaved(clean);
    if (r.changed > 0) setBase({ updatedAt: r.updatedAt, updatedBy: "client", stamp: formatStamp(r.updatedAt, timeZone) });
    setEditing(new Set());
    setStatus({ kind: "saved", changed: r.changed });
  }

  function discard() {
    setDraft(saved);
    setEditing(new Set());
    setStatus({ kind: "idle" });
  }

  return (
    <article className="pb-32">
      <header>
        <p className="text-[12px] uppercase tracking-[0.14em] text-[var(--rl-muted)]">{previews ? "Propositions" : "Compte rendu"}</p>
        <h1 className="mt-2 font-display text-[2.1rem] leading-[1.08] text-[var(--rl-thread)] sm:text-5xl">{doc.title}</h1>
        <p className="mt-3 text-sm text-[var(--rl-muted)]">
          Dernière modification : <span className="text-[var(--rl-ink)]">{base.stamp}</span>, {WHO[base.updatedBy]}
        </p>
        {previews ? (
          <p className="mt-5 rounded-2xl border border-[#C8321F]/30 bg-[var(--rl-surface-2)] px-4 py-3.5 leading-relaxed">
            <strong className="font-semibold">Ce sont des propositions : aucun de ces e-mails n&apos;est en ligne pour l&apos;instant.</strong> Touche un aperçu
            pour le voir en entier, puis note dessous ce que tu veux changer ou ton avis.
          </p>
        ) : (
          <p className="mt-5 font-hand text-[1.45rem] leading-snug text-[var(--rl-red)]">
            Corrige ce qui ne va pas, réponds aux points à confirmer, puis enregistre.
          </p>
        )}
      </header>

      <div className="mt-8 space-y-5">
        {draft.sections.map((s, i) => {
          const open = editing.has(s.id);
          return (
            <section key={s.id} aria-labelledby={`h-${s.id}`} className="rounded-2xl border border-[var(--rl-line)] bg-[var(--rl-surface)] p-5 sm:p-7">
              <div className="flex items-start justify-between gap-3">
                <div id={`h-${s.id}`} className="min-w-0 flex-1">
                  {open ? (
                    <label className="block">
                      <span className="mb-1 block text-[11px] uppercase tracking-wide text-[var(--rl-muted)]">Titre de la partie {i + 1}</span>
                      <input className={field} value={s.title} maxLength={200} onChange={(e) => update(s.id, (x) => ({ ...x, title: e.target.value }))} />
                    </label>
                  ) : (
                    <SectionHeading n={i + 1} title={s.title} />
                  )}
                </div>
                {s.kind !== "previews" && (
                  <button
                    type="button"
                    onClick={() => toggle(s.id)}
                    aria-expanded={open}
                    className="shrink-0 rounded-full border border-[var(--rl-line)] px-3.5 py-1.5 text-[13px] font-medium hover:border-[var(--rl-ink)] transition-colors"
                  >
                    {open ? "Terminer" : "Modifier"}
                    <span className="sr-only"> : {s.title}</span>
                  </button>
                )}
              </div>

              <div className="mt-4">
                {s.kind === "list" ? (
                  open ? (
                    <div className="space-y-2.5">
                      {s.lines.map((l, j) => (
                        <div key={l.id} className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <AutoTextarea
                              aria-label={`Ligne ${j + 1}${l.row ? " (tableau, colonnes séparées par |)" : ""}`}
                              value={l.text}
                              maxLength={1000}
                              onChange={(e) => setLine(s.id, l.id, { text: e.target.value })}
                              className={l.row ? "font-medium tabular-nums" : ""}
                            />
                            {l.badge === "proposition" && <ProposalBadge />}
                          </div>
                          <button
                            type="button"
                            onClick={() => setLine(s.id, l.id, null)}
                            className="mt-1.5 shrink-0 rounded-full px-2.5 py-1 text-[13px] text-[var(--rl-muted)] hover:bg-[var(--rl-surface-2)] hover:text-[var(--rl-red)]"
                          >
                            Retirer<span className="sr-only"> la ligne {j + 1}</span>
                          </button>
                        </div>
                      ))}
                      {s.lines.some((l) => l.row) && <p className="text-[12px] text-[var(--rl-muted)]">Lignes de tableau : sépare les colonnes par « | ».</p>}
                      <button
                        type="button"
                        onClick={() => update(s.id, (x) => (x.kind === "list" ? { ...x, lines: [...x.lines, { id: newLineId(), text: "" }] } : x))}
                        className="text-sm font-medium text-[var(--rl-red)] underline decoration-[var(--rl-thread)] underline-offset-4"
                      >
                        + Ajouter une ligne
                      </button>
                    </div>
                  ) : (
                    <LinesView lines={s.lines} />
                  )
                ) : s.kind === "previews" ? (
                  <ul className="grid gap-x-5 gap-y-8 sm:grid-cols-2">
                    {s.previews.map((p) => (
                      <li key={p.id} className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setViewing(p)}
                          className="group relative block w-full overflow-hidden rounded-xl border border-[var(--rl-line)] bg-white text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rl-red)]"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element -- private, session-checked route */}
                          <img
                            src={imageSrc(p)}
                            alt=""
                            width={p.width}
                            height={p.height}
                            loading="lazy"
                            decoding="async"
                            className="block h-[22rem] w-full object-cover object-top"
                          />
                          <span
                            aria-hidden
                            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent"
                          />
                          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#1E1A17] px-4 py-1.5 text-[13px] font-semibold text-[#FBF6EE] group-hover:bg-[var(--rl-red)]">
                            Voir en entier<span className="sr-only"> : {p.title}</span>
                          </span>
                        </button>
                        <p className="mt-3 font-semibold leading-snug">{p.title}</p>
                        <label className="mt-2 block">
                          <span className="mb-1 block font-hand text-lg leading-none text-[var(--rl-red)]">Ta note</span>
                          <AutoTextarea
                            value={p.note}
                            maxLength={4000}
                            placeholder="Ce qu'il faut changer, ou ton avis…"
                            onChange={(e) =>
                              update(s.id, (x) =>
                                x.kind === "previews" ? { ...x, previews: x.previews.map((y) => (y.id === p.id ? { ...y, note: e.target.value } : y)) } : x,
                              )
                            }
                            className="min-h-[4.5rem] bg-[var(--rl-bg)]"
                          />
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ol className="space-y-6">
                    {s.questions.map((q, j) => (
                      <li key={q.id}>
                        {open ? (
                          <AutoTextarea
                            aria-label={`Point ${j + 1}`}
                            value={q.text}
                            maxLength={1000}
                            onChange={(e) =>
                              update(s.id, (x) =>
                                x.kind === "questions" ? { ...x, questions: x.questions.map((y) => (y.id === q.id ? { ...y, text: e.target.value } : y)) } : x,
                              )
                            }
                          />
                        ) : (
                          <p className="leading-relaxed">
                            <span className="mr-2 font-display text-lg text-[var(--rl-thread)]">{j + 1}.</span>
                            {q.text}
                          </p>
                        )}
                        <label className="mt-2.5 block">
                          <span className="mb-1 block font-hand text-lg leading-none text-[var(--rl-red)]">Ta réponse</span>
                          <AutoTextarea
                            value={q.answer}
                            maxLength={4000}
                            placeholder="Écris ta réponse ici…"
                            onChange={(e) =>
                              update(s.id, (x) =>
                                x.kind === "questions"
                                  ? { ...x, questions: x.questions.map((y) => (y.id === q.id ? { ...y, answer: e.target.value } : y)) }
                                  : x,
                              )
                            }
                            className="min-h-[4.5rem] bg-[var(--rl-bg)]"
                          />
                        </label>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {viewing && <PreviewViewer preview={viewing} src={imageSrc(viewing)} onClose={closeViewer} />}

      {active && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--rl-line)] bg-[#FBF6EE]/95 backdrop-blur">
          <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div aria-live="polite" className="min-h-[1.25rem] text-sm">
              {status.kind === "error" ? (
                <p role="alert" className="text-[var(--rl-red)]">
                  {ERRORS[status.error]}{" "}
                  {status.error === "conflict" && (
                    <button type="button" onClick={() => window.location.reload()} className="font-semibold underline underline-offset-4">
                      Recharger
                    </button>
                  )}
                  {status.error === "auth" && (
                    <a href="/portal" className="font-semibold underline underline-offset-4">
                      Me reconnecter
                    </a>
                  )}
                </p>
              ) : status.kind === "saved" ? (
                <p className="font-medium text-[var(--rl-lagoon)]">
                  {status.changed > 0 ? `C'est enregistré (${base.stamp}). Curtis est prévenu.` : "Rien n'a changé depuis le dernier enregistrement."}
                </p>
              ) : dirty ? (
                <p className="text-[var(--rl-ink)]">
                  Modifications non enregistrées.{" "}
                  <button type="button" onClick={discard} className="text-[var(--rl-muted)] underline underline-offset-4 hover:text-[var(--rl-ink)]">
                    Annuler
                  </button>
                </p>
              ) : (
                <p className="text-[var(--rl-muted)]">Tout est enregistré.</p>
              )}
            </div>
            <button
              type="button"
              onClick={save}
              disabled={!dirty || status.kind === "saving"}
              className="w-full shrink-0 rounded-full bg-[var(--rl-red)] px-7 py-3 font-semibold text-white transition-colors hover:bg-[var(--rl-red-hover)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--rl-red)]"
            >
              {status.kind === "saving" ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
