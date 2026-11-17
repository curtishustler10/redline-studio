// Admin view of a page-image document: the comments grouped by page, each page
// shown small with its numbered pins, then the deleted comments (kept, greyed).
// Server component, no interaction: a pin's number matches the list beside it.
import { groupByPage, numberOnPage, plural, type DocumentComment } from "@/lib/document-comments";
import { formatStamp, pageTitle, type DocPagesSection } from "@/lib/project-doc";

const STATUS = { open: "À traiter", resolved: "Résolu" } as const;

export function PagesAdmin({
  projectSlug,
  documentSlug,
  section,
  comments,
  timeZone,
}: {
  projectSlug: string;
  documentSlug: string;
  section: DocPagesSection;
  comments: DocumentComment[];
  timeZone: string;
}) {
  const live = comments.filter((c) => !c.deleted_at);
  const deleted = comments.filter((c) => c.deleted_at);
  const numbers = numberOnPage(live);
  const groups = groupByPage(live);
  const open = live.filter((c) => c.status === "open").length;
  const img = (file: string) => `/admin/projets/${projectSlug}/pages/${file}`;

  return (
    <div>
      <p className="text-sm text-[#6F655C]">
        {section.pages.length} pages · {plural(live.length, "commentaire")}, {open} à traiter{deleted.length ? ` · ${deleted.length} supprimé${deleted.length > 1 ? "s" : ""}` : ""}
      </p>
      {groups.length === 0 && <p className="mt-4 text-[#6F655C]">Aucun commentaire pour l’instant.</p>}
      <div className="mt-4 space-y-6">
        {groups.map((g) => {
          const page = section.pages.find((p) => p.n === g.page);
          return (
            <article key={g.page} id={`${documentSlug}-p${g.page}`} className="grid gap-5 rounded-2xl border border-[#E4D8C6] bg-white p-5 sm:grid-cols-[220px_1fr]">
              <div>
                <p className="mb-2 font-semibold">
                  p.&nbsp;{g.page} · {pageTitle(section, g.page)}
                </p>
                <div className="relative w-full border border-[#E4D8C6]" style={{ aspectRatio: `${section.width} / ${section.height}` }}>
                  {page && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img(page.image)} alt={`Page ${g.page}`} className="absolute inset-0 h-full w-full" loading="lazy" />
                  )}
                  {g.comments.map((c) => (
                    <span
                      key={c.id}
                      className={`absolute grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white text-[11px] font-bold text-white shadow ${c.status === "resolved" ? "bg-[#8a969c]" : "bg-[#C8321F]"}`}
                      style={{ left: `${c.x}%`, top: `${c.y}%` }}
                    >
                      {numbers.get(c.id)}
                    </span>
                  ))}
                </div>
              </div>
              <ol className="space-y-3">
                {g.comments.map((c) => (
                  <li key={c.id} className="border-l-2 border-[#E03C2D] pl-3 text-sm">
                    <p className="text-[#6F655C]">
                      <b className="text-[#1E1A17]">n°&nbsp;{numbers.get(c.id)}</b> · {formatStamp(c.created_at, timeZone)}
                      {c.updated_at !== c.created_at && ` · modifié le ${formatStamp(c.updated_at, timeZone)}`} ·{" "}
                      <span className={c.status === "resolved" ? "text-[#1F6F6A]" : "font-semibold text-[#C8321F]"}>{STATUS[c.status]}</span>
                    </p>
                    <p className={`mt-1 whitespace-pre-line ${c.status === "resolved" ? "text-[#6F655C]" : ""}`}>{c.body}</p>
                  </li>
                ))}
              </ol>
            </article>
          );
        })}
      </div>
      {deleted.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm">Supprimés par la cliente ({deleted.length})</summary>
          <ul className="mt-3 space-y-2 text-sm text-[#6F655C]">
            {deleted.map((c) => (
              <li key={c.id} className="border-l-2 border-[#E4D8C6] pl-3">
                {c.label} · supprimé le {formatStamp(c.deleted_at!, timeZone)}
                <span className="block whitespace-pre-line line-through">{c.body}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
