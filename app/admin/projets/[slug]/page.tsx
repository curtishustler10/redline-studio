import Link from "next/link";
import { notFound } from "next/navigation";
import { RecapView } from "@/components/portal/recap-view";
import { diffContent, formatStamp } from "@/lib/project-doc";
import { getProjectBySlug, listDocuments, listProjectEmails, listRevisions } from "@/lib/projects";
import { requireAdmin, restoreRevisionAction } from "../../actions";
import { ERR_MESSAGES, OK_MESSAGES, OWNER_ZONE } from "../../_lib/ui";

export const dynamic = "force-dynamic";

const WHO = { seed: "Version de départ", client: "La cliente", admin: "Toi (restauration)" } as const;
const MAIL_STATUS = { pending: "en cours", sent: "envoyé", failed: "échec" } as const;

export default async function ProjectAdminPage({ params, searchParams }: { params: { slug: string }; searchParams: { ok?: string; err?: string } }) {
  await requireAdmin();
  const project = await getProjectBySlug(params.slug);
  if (!project) notFound();
  const [documents, emails] = await Promise.all([listDocuments(project.id), listProjectEmails(project.id)]);
  const histories = await Promise.all(documents.map((d) => listRevisions(d.id)));
  const ok = searchParams.ok ? OK_MESSAGES[searchParams.ok] : null;
  const err = searchParams.err ? ERR_MESSAGES[searchParams.err] : null;
  const when = (iso: string) => formatStamp(iso, OWNER_ZONE);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <p className="text-sm text-[#6F655C]">
        <Link href="/admin/projets" className="underline decoration-[#E03C2D] underline-offset-4 hover:text-[#1E1A17]">← Projets clients</Link>
      </p>
      <h1 className="mt-2 text-3xl font-semibold">{project.client_name}</h1>
      <p className="mt-1 text-sm text-[#6F655C]">
        Espace : /portal/{project.slug} · code {project.code_prefix}-•••• posé le {when(project.code_set_at)} · heures de Tahiti
      </p>

      {ok && <p role="status" className="mt-6 rounded-xl bg-[#1F8A84]/10 px-4 py-3 text-sm text-[#1F6F6A]">{ok}</p>}
      {err && <p role="alert" className="mt-6 rounded-xl bg-[#C8321F]/10 px-4 py-3 text-sm text-[#C8321F]">{err}</p>}

      {documents.map((doc, di) => {
        const revisions = histories[di];
        return (
          <section key={doc.id} className="mt-10 grid gap-8 lg:grid-cols-[1fr_minmax(0,26rem)]">
            <div>
              <h2 className="text-xl font-semibold">{doc.title}</h2>
              <p className="mb-4 text-sm text-[#6F655C]">Version actuelle · {when(doc.updated_at)} · {WHO[doc.updated_by]}</p>
              <RecapView sections={doc.content.sections} />
            </div>

            <aside>
              <h2 className="text-xl font-semibold">Historique ({revisions.length})</h2>
              <ol className="mt-4 space-y-3">
                {revisions.map((rev, i) => {
                  const older = revisions[i + 1];
                  const changes = older ? diffContent(older.content, rev.content) : [];
                  return (
                    <li key={rev.id} className="rounded-2xl border border-[#E4D8C6] bg-white p-4 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold">
                          #{rev.id} · {WHO[rev.updated_by]}
                          {i === 0 && <span className="ml-2 rounded-full bg-[#1E1A17] px-2 py-0.5 text-[11px] text-white">actuelle</span>}
                        </p>
                        {i > 0 && (
                          <form action={restoreRevisionAction}>
                            <input type="hidden" name="projectSlug" value={project.slug} />
                            <input type="hidden" name="revisionId" value={rev.id} />
                            <input type="hidden" name="updatedAt" value={doc.updated_at} />
                            <button className="text-[13px] text-[#C8321F] underline underline-offset-4">Restaurer</button>
                          </form>
                        )}
                      </div>
                      <p className="text-[#6F655C]">{when(rev.created_at)}</p>
                      {older ? (
                        changes.length === 0 ? (
                          <p className="mt-2 text-[#6F655C]">Aucune différence avec la version précédente.</p>
                        ) : (
                          <details className="mt-2" open={i === 0}>
                            <summary className="cursor-pointer">{changes.length} modification{changes.length > 1 ? "s" : ""}</summary>
                            <ul className="mt-2 space-y-2">
                              {changes.map((c, k) => (
                                <li key={k} className="border-l-2 border-[#E03C2D] pl-3">
                                  <p className="font-medium">{c.section} · {c.label}</p>
                                  {c.before && <p className="text-[#6F655C] line-through">{c.before}</p>}
                                  {c.after && <p className="whitespace-pre-line">{c.after}</p>}
                                </li>
                              ))}
                            </ul>
                          </details>
                        )
                      ) : (
                        <p className="mt-2 text-[#6F655C]">{revisions.length >= 100 ? "Plus ancienne version affichée." : "Première version."}</p>
                      )}
                    </li>
                  );
                })}
              </ol>

              <h2 className="mt-8 text-xl font-semibold">Notifications</h2>
              {emails.length === 0 ? (
                <p className="mt-2 text-sm text-[#6F655C]">Aucune pour l&apos;instant.</p>
              ) : (
                <ul className="mt-3 space-y-1.5 text-sm">
                  {emails.map((m) => (
                    <li key={m.id}>
                      {when(m.created_at)} · {MAIL_STATUS[m.status]} → {m.recipient}
                      {m.error && <span className="block text-[#C8321F]">{m.error}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          </section>
        );
      })}
    </main>
  );
}
