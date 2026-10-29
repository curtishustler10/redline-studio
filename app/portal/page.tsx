import { redirect } from "next/navigation";
import { currentProject } from "./_lib/session";
import { PortalLogin, type LoginError } from "./login-form";

export const dynamic = "force-dynamic";

const ERRORS: LoginError[] = ["code", "locked", "server", "expired", "logout"];

export default async function PortalPage({ searchParams }: { searchParams: { err?: string } }) {
  // Already in: straight to the project.
  const project = await currentProject().catch(() => null);
  if (project) redirect(`/portal/${project.slug}`);
  const err = ERRORS.find((e) => e === searchParams.err) ?? null;
  return <PortalLogin err={err} />;
}
