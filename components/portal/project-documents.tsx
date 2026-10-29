"use client";

// The documents of one project, one tab each. Every editor stays mounted so
// unsaved changes survive a tab switch; only the visible one shows its save bar.
// "#apercus" (or any document slug) in the URL opens that tab.

import { useCallback, useEffect, useState } from "react";
import { isPreviewsDocument, type DocContent, type UpdatedBy } from "@/lib/project-doc";
import { RecapEditor } from "./recap-editor";

export type ProjectDocument = { slug: string; title: string; content: DocContent; updatedAt: string; updatedBy: UpdatedBy; stamp: string };

function tabLabel(d: ProjectDocument): string {
  return isPreviewsDocument(d.content) ? "Aperçus des e-mails" : "Compte rendu";
}

function slugFromHash(docs: ProjectDocument[]): string | null {
  const h = window.location.hash.slice(1);
  if (!h) return null;
  if (h === "apercus") return docs.find((d) => isPreviewsDocument(d.content))?.slug ?? null;
  return docs.find((d) => d.slug === h)?.slug ?? null;
}

export function ProjectDocuments({ projectSlug, timeZone, documents }: { projectSlug: string; timeZone: string; documents: ProjectDocument[] }) {
  const [active, setActive] = useState(documents[0]?.slug ?? "");
  const [dirty, setDirty] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fromHash = () => {
      const slug = slugFromHash(documents);
      if (slug) setActive(slug);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [documents]);

  const onDirty = useCallback((slug: string, value: boolean) => setDirty((d) => (d[slug] === value ? d : { ...d, [slug]: value })), []);

  function select(slug: string) {
    setActive(slug);
    const d = documents.find((x) => x.slug === slug);
    history.replaceState(null, "", d && isPreviewsDocument(d.content) ? "#apercus" : window.location.pathname);
    window.scrollTo({ top: 0 });
  }

  return (
    <>
      {documents.length > 1 && (
        <div role="tablist" aria-label="Documents du projet" className="mt-5 flex gap-1.5 overflow-x-auto rounded-full border border-[var(--rl-line)] bg-[var(--rl-surface)] p-1">
          {documents.map((d) => {
            const on = d.slug === active;
            return (
              <button
                key={d.slug}
                id={`tab-${d.slug}`}
                role="tab"
                type="button"
                aria-selected={on}
                aria-controls={`panel-${d.slug}`}
                onClick={() => select(d.slug)}
                className={`flex-1 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${on ? "bg-[#1E1A17] text-[#FBF6EE]" : "text-[var(--rl-muted)] hover:text-[var(--rl-ink)]"}`}
              >
                {tabLabel(d)}
                {dirty[d.slug] && (
                  <span aria-label=" (non enregistré)" className="ml-1.5 inline-block h-2 w-2 rounded-full bg-[var(--rl-thread)] align-middle" />
                )}
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-8">
        {documents.length === 0 && <p className="text-[var(--rl-muted)]">Rien à afficher pour l&apos;instant.</p>}
        {documents.map((d) => (
          <div key={d.slug} id={`panel-${d.slug}`} role={documents.length > 1 ? "tabpanel" : undefined} aria-labelledby={documents.length > 1 ? `tab-${d.slug}` : undefined} hidden={d.slug !== active}>
            <RecapEditor
              projectSlug={projectSlug}
              timeZone={timeZone}
              document={{ slug: d.slug, title: d.title, content: d.content, updatedAt: d.updatedAt, updatedBy: d.updatedBy }}
              initialStamp={d.stamp}
              active={d.slug === active}
              onDirtyChange={(v) => onDirty(d.slug, v)}
            />
          </div>
        ))}
      </div>
    </>
  );
}
