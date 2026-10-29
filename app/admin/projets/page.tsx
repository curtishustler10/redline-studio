import Link from "next/link";
import { formatStamp } from "@/lib/project-doc";
import { listDocuments, listProjects } from "@/lib/projects";
import { adminLogout, requireAdmin } from "../actions";
import { OWNER_ZONE } from "../_lib/ui";

export const dynamic = "force-dynamic";

const WHO = { seed: "version de départ", client: "par la cliente", admin: "par toi (restauration)" } as const;

export default async function ProjectsPage() {
  await requireAdmin();
  const projects = await listProjects();
  const docs = await Promise.all(projects.map((p) => listDocuments(p.id)));

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-[#6F655C]">
            redline studio · admin ·{" "}
            <Link href="/admin/leads" className="underline decoration-[#E03C2D] underline-offset-4 hover:text-[#1E1A17]">Leads</Link>
          </p>
          <h1 className="text-3xl font-semibold">Projets clients</h1>
        </div>
        <form action={adminLogout}>
          <button className="text-sm text-[#6F655C] underline decoration-[#E03C2D] underline-offset-4 hover:text-[#1E1A17]">Se déconnecter</button>
        </form>
      </header>

      <p className="mt-4 max-w-2xl text-sm text-[#6F655C]">
        Chaque client ouvre son espace sur /portal avec son code. Un nouveau code : <code className="rounded bg-[#F3E9DA] px-1.5">npx jiti scripts/projects.ts code &lt;slug&gt;</code> (l&apos;ancien cesse de marcher, les sessions ouvertes sont fermées).
      </p>

      {projects.length === 0 ? (
        <p className="mt-8 text-[#6F655C]">Aucun projet.</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {projects.map((p, i) => (
            <li key={p.id}>
              <Link href={`/admin/projets/${p.slug}`} className="block rounded-2xl border border-[#E4D8C6] bg-white p-5 hover:border-[#1E1A17]">
                <p className="font-semibold">{p.client_name}</p>
                <p className="text-sm text-[#6F655C]">
                  /portal/{p.slug} · code {p.code_prefix}-•••• (posé le {formatStamp(p.code_set_at, OWNER_ZONE)})
                </p>
                {docs[i].map((d) => (
                  <p key={d.id} className="mt-2 text-sm">
                    {d.title} · modifié le {formatStamp(d.updated_at, OWNER_ZONE)}, {WHO[d.updated_by]}
                  </p>
                ))}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
