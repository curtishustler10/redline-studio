// Reads the portal cookie and resolves the project it opens. SERVER-ONLY.
import "server-only";
import { cookies } from "next/headers";
import { PORTAL_COOKIE, readPortalSession } from "@/lib/portal-auth";
import { projectForSession, type ProjectRow } from "@/lib/projects";

export async function currentProject(): Promise<ProjectRow | null> {
  return projectForSession(readPortalSession(cookies().get(PORTAL_COOKIE)?.value));
}
