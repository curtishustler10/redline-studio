// Page images of a client document, for Curtis in the admin (the client's route,
// /portal/<slug>/apercus, only serves her own session). Same private bucket, same
// headers: re-checked on every display, never public.
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdmin } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { PREVIEW_IMAGE } from "@/lib/project-doc";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { slug: string; image: string } }): Promise<Response> {
  if (!verifyAdmin(cookies().get(ADMIN_COOKIE)?.value)) return new Response("Session expirée", { status: 401, headers: { "Cache-Control": "no-store" } });
  if (!/^[a-z0-9-]{1,60}$/.test(params.slug) || !PREVIEW_IMAGE.test(params.image)) return new Response("Introuvable", { status: 404 });
  const { data, error } = await getDb().storage.from("portal").download(`${params.slug}/${params.image}`);
  if (error || !data) return new Response("Introuvable", { status: 404, headers: { "Cache-Control": "no-store" } });
  const bytes = Buffer.from(await data.arrayBuffer());
  const etag = `"${crypto.createHash("sha256").update(bytes).digest("base64url").slice(0, 22)}"`;
  const headers = { "Cache-Control": "private, no-cache", ETag: etag, "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex" };
  if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });
  return new Response(bytes, { headers: { ...headers, "Content-Type": "image/webp" } });
}
