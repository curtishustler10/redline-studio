// Email preview images of a client project. They live in the private "portal"
// bucket and are only served to a valid session of that project: no public URL,
// no signed URL that could be forwarded. The browser may keep its own copy for
// an hour (private: never stored by a shared cache).
import { getDb } from "@/lib/db";
import { PREVIEW_IMAGE } from "@/lib/project-doc";
import { currentProject } from "../../../_lib/session";

export const dynamic = "force-dynamic";

const notFound = () => new Response("Introuvable", { status: 404, headers: { "Cache-Control": "no-store" } });

export async function GET(_req: Request, { params }: { params: { slug: string; image: string } }): Promise<Response> {
  if (!PREVIEW_IMAGE.test(params.image)) return notFound();
  const project = await currentProject().catch(() => null);
  if (!project || project.slug !== params.slug) return new Response("Session expirée", { status: 401, headers: { "Cache-Control": "no-store" } });

  const { data, error } = await getDb().storage.from("portal").download(`${project.slug}/${params.image}`);
  if (error || !data) return notFound();
  return new Response(data, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
    },
  });
}
