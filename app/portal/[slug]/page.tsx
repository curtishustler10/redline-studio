import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { RecapEditor } from "@/components/portal/recap-editor";
import { formatStamp } from "@/lib/project-doc";
import { listDocuments } from "@/lib/projects";
import { currentProject } from "../_lib/session";
import { portalLogout } from "../actions";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const project = await currentProject();
  // Wrong project, expired session or regenerated code: back to the code entry.
  if (!project || project.slug !== params.slug) redirect("/portal?err=expired");
  const documents = await listDocuments(project.id);

  return (
    <>
      <header className="border-b border-[var(--rl-line)] bg-[var(--rl-bg)]">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo className="text-sm" />
          <form action={portalLogout}>
            <button className="text-[13px] text-[var(--rl-muted)] underline decoration-[var(--rl-thread)] underline-offset-4 hover:text-[var(--rl-ink)]">Se déconnecter</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pt-8 sm:px-6 sm:pt-12">
        <p className="text-sm font-medium">
          Mon projet · <span className="text-[var(--rl-muted)]">{project.title}</span>
        </p>
        <div className="mt-6 space-y-16">
          {documents.length === 0 && <p className="text-[var(--rl-muted)]">Rien à afficher pour l&apos;instant.</p>}
          {documents.map((d) => (
            <RecapEditor
              key={d.id}
              projectSlug={project.slug}
              timeZone={project.time_zone}
              document={{ slug: d.slug, title: d.title, content: d.content, updatedAt: d.updated_at, updatedBy: d.updated_by }}
              initialStamp={formatStamp(d.updated_at, project.time_zone)}
            />
          ))}
        </div>
      </main>
    </>
  );
}
