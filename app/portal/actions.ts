"use server";

// Client space actions. Server actions are public endpoints: each one re-reads
// the session cookie and checks it against the project it acts on.

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isLockedOut } from "@/lib/admin-auth";
import { PORTAL_COOKIE, PORTAL_PATH, PORTAL_SESSION_MS, codeStamp, signPortalSession } from "@/lib/portal-auth";
import { clearPortalFailures, findProjectByCode, recentPortalFailures, recordPortalFailure, saveClientDocument } from "@/lib/projects";
import { currentProject } from "./_lib/session";

function clientIp(): string {
  return (headers().get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
}

export async function portalLogin(formData: FormData): Promise<void> {
  const ip = clientIp();
  // redirect() throws, so it is only ever called outside the try block.
  let outcome: { slug: string } | { err: "server" | "locked" | "code" };
  try {
    const failures = await recentPortalFailures(ip);
    if (failures === null) outcome = { err: "server" };
    else if (isLockedOut(failures)) outcome = { err: "locked" };
    else {
      const project = await findProjectByCode(String(formData.get("code") ?? ""));
      if (!project) {
        await recordPortalFailure(ip);
        outcome = { err: "code" };
      } else {
        await clearPortalFailures(ip);
        cookies().set(PORTAL_COOKIE, signPortalSession(project.id, codeStamp(project.access_code_hash)), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: PORTAL_PATH,
          maxAge: PORTAL_SESSION_MS / 1000,
        });
        outcome = { slug: project.slug };
      }
    }
  } catch (e) {
    console.error("[portal] login", e);
    outcome = { err: "server" };
  }
  redirect("slug" in outcome ? `/portal/${outcome.slug}` : `/portal?err=${outcome.err}`);
}

export async function portalLogout(): Promise<void> {
  cookies().delete({ name: PORTAL_COOKIE, path: PORTAL_PATH });
  redirect("/portal?err=logout");
}

export type SaveResponse =
  | { ok: true; updatedAt: string; changed: number }
  | { ok: false; error: "auth" | "conflict" | "invalid" | "server" };

export async function saveDocumentAction(input: { projectSlug: string; documentSlug: string; baseUpdatedAt: string; content: unknown }): Promise<SaveResponse> {
  try {
    const project = await currentProject();
    if (!project || project.slug !== input?.projectSlug) return { ok: false, error: "auth" };
    const r = await saveClientDocument({
      project,
      documentSlug: String(input.documentSlug),
      baseUpdatedAt: String(input.baseUpdatedAt),
      content: input.content,
    });
    if (!r.ok) return { ok: false, error: r.error === "conflict" ? "conflict" : r.error === "not_found" ? "server" : "invalid" };
    revalidatePath(`/portal/${project.slug}`);
    revalidatePath(`/admin/projets/${project.slug}`);
    return { ok: true, updatedAt: r.updatedAt, changed: r.changes.length };
  } catch (e) {
    console.error("[portal] save", e);
    return { ok: false, error: "server" };
  }
}
