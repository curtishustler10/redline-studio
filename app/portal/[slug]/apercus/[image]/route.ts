// Email preview images of a client project. They live in the private "portal"
// bucket and are only served to a valid session of that project: no public URL,
// no signed URL that could be forwarded. "no-cache" + ETag: the browser keeps a
// copy but must ask again on every display, so the session is re-checked each
// time (after a logout the cached copy is refused) and an unchanged image costs
// a 304, not a download.
import crypto from "node:crypto";
import { getDb } from "@/lib/db";
import { PREVIEW_IMAGE } from "@/lib/project-doc";
import { currentProject } from "../../../_lib/session";

export const dynamic = "force-dynamic";

const notFound = () => new Response("Introuvable", { status: 404, headers: { "Cache-Control": "no-store" } });

export async function GET(req: Request, { params }: { params: { slug: string; image: string } }): Promise<Response> {
  if (!PREVIEW_IMAGE.test(params.image)) return notFound();
  const project = await currentProject().catch(() => null);
  if (!project || project.slug !== params.slug) return new Response("Session expirée", { status: 401, headers: { "Cache-Control": "no-store" } });

  const { data, error } = await getDb().storage.from("portal").download(`${project.slug}/${params.image}`);
  if (error || !data) return notFound();
  const bytes = Buffer.from(await data.arrayBuffer());
  const etag = `"${crypto.createHash("sha256").update(bytes).digest("base64url").slice(0, 22)}"`;
  const headers = { "Cache-Control": "private, no-cache", ETag: etag, "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex" };
  if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });
  return new Response(bytes, { headers: { ...headers, "Content-Type": "image/webp" } });
}
