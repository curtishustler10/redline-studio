import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { FenuaLogin, type FenuaLoginError } from "@/components/portal/fenua/fenua-login";
import { FenuaShell } from "@/components/portal/fenua/fenua-shell";
import { EC, FENUA_DISPLAY } from "@/components/portal/fenua/theme";
import { FENUA_READER_THEME, PagesReader, REDLINE_READER_THEME } from "@/components/portal/pages-reader";
import { ProjectDocuments } from "@/components/portal/project-documents";
import { listComments } from "@/lib/project-comments";
import { formatStamp, pagesSection } from "@/lib/project-doc";
import { getProjectBySlug, listDocuments, type ProjectRow } from "@/lib/projects";
import { FENUA } from "@/lib/portal-brand";
import { currentProject } from "../_lib/session";
import { portalLogout } from "../actions";

export const dynamic = "force-dynamic";

const LOGIN_ERRORS: FenuaLoginError[] = ["code", "locked", "server", "expired", "logout"];

type Props = { params: { slug: string }; searchParams: { err?: string; p?: string } };

/** A partner studio's project wears that studio's name and icon, in the tab and in shared links. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await getProjectBySlug(params.slug).catch(() => null);
  if (project?.brand !== "fenua") return {};
  const title = `Espace client ${project.client_name} · ${FENUA.name}`;
  return {
    title,
    description: `Votre espace client ${FENUA.name}.`,
    icons: { icon: FENUA.icon, apple: FENUA.icon },
    openGraph: { title, description: `Votre espace client ${FENUA.name}.`, siteName: FENUA.name, images: [FENUA.icon], url: undefined },
    twitter: { card: "summary", title, description: `Votre espace client ${FENUA.name}.`, images: [FENUA.icon] },
  };
}

export default async function ProjectPage({ params, searchParams }: Props) {
  const project = await currentProject();
  if (!project || project.slug !== params.slug) {
    // A partner studio's client logs in right here, in her studio's brand: she
    // never sees the shared (Redline) form. Everyone else goes back to /portal.
    const target = await getProjectBySlug(params.slug).catch(() => null);
    if (target?.brand === "fenua") {
      const err = LOGIN_ERRORS.find((e) => e === searchParams.err) ?? null;
      return (
        <FenuaShell>
          <FenuaLogin slug={target.slug} company={target.client_name} err={err} />
        </FenuaShell>
      );
    }
    // Wrong project, expired session or regenerated code: back to the code entry.
    redirect("/portal?err=expired");
  }

  const documents = await listDocuments(project.id);
  const pageDocs = await Promise.all(
    documents.map(async (d) => {
      const section = pagesSection(d.content);
      return section ? { slug: d.slug, section, comments: await listComments(d.id) } : null;
    }),
  );
  const asked = Number(searchParams.p);
  const initialPage = (count: number) => (Number.isInteger(asked) && asked >= 1 && asked <= count ? asked : 1);

  if (project.brand === "fenua") return <FenuaProject project={project} docs={pageDocs.filter((d): d is PageDoc => d !== null)} initialPage={initialPage} />;

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
        <ProjectDocuments
          projectSlug={project.slug}
          timeZone={project.time_zone}
          documents={documents
            .filter((_, i) => pageDocs[i] === null)
            .map((d) => ({
              slug: d.slug,
              title: d.title,
              content: d.content,
              updatedAt: d.updated_at,
              updatedBy: d.updated_by,
              stamp: formatStamp(d.updated_at, project.time_zone),
            }))}
        />
      </main>
      {pageDocs.map((d) =>
        d ? (
          <section key={d.slug} id={d.slug} className="mx-auto mt-12 max-w-6xl px-4 sm:px-6">
            <PagesReader
              projectSlug={project.slug}
              studio="Redline Studio"
              timeZone={project.time_zone}
              theme={REDLINE_READER_THEME}
              doc={{ slug: d.slug, section: d.section }}
              comments={d.comments}
              initialPage={initialPage(d.section.pages.length)}
            />
          </section>
        ) : null,
      )}
    </>
  );
}

type PageDoc = { slug: string; section: NonNullable<ReturnType<typeof pagesSection>>; comments: Awaited<ReturnType<typeof listComments>> };

/** The space of a Fenua Studio client: Fenua's frame, a greeting, then each document to review. */
function FenuaProject({ project, docs, initialPage }: { project: ProjectRow; docs: PageDoc[]; initialPage: (count: number) => number }) {
  const firstName = project.contact_name?.split(" ")[0];
  return (
    <FenuaShell company={project.client_name} wide>
      <div style={{ padding: "22px 0 8px" }}>
        <h1 style={{ fontFamily: FENUA_DISPLAY, fontSize: 24, fontWeight: 700, color: EC.abysse, margin: 0, letterSpacing: "-.2px" }}>
          Bonjour {firstName ?? project.client_name}
        </h1>
        <p style={{ color: EC.muted, margin: "6px 0 0", fontSize: 14 }}>
          {docs.length
            ? "Retrouvez ici votre livret à relire : laissez vos commentaires directement sur les pages."
            : "Rien à relire pour l’instant."}
        </p>
      </div>
      {docs.map((d) => (
        <section key={d.slug} id={d.slug} style={{ marginTop: 18 }}>
          <PagesReader
            projectSlug={project.slug}
            studio={FENUA.name}
            timeZone={project.time_zone}
            theme={FENUA_READER_THEME}
            doc={{ slug: d.slug, section: d.section }}
            comments={d.comments}
            initialPage={initialPage(d.section.pages.length)}
            guide
          />
        </section>
      ))}
    </FenuaShell>
  );
}
