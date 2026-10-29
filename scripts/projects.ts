// Client projects ("Mon projet") from the command line. Reads SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY from the environment, or from .env.local.
//
//   npx jiti scripts/projects.ts seed <slug>    create the project from lib/project-seeds.ts, print its code
//   npx jiti scripts/projects.ts code <slug>    new access code (old one stops working, sessions close), print it
//   npx jiti scripts/projects.ts reset <slug>   put the seed content back, as a new revision (history kept)
//
// A code is printed once and never stored: copy it, then give it to the client.
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { generateCode, hashCode } from "../lib/portal-auth";
import { SEEDS } from "../lib/project-seeds";

function loadEnv(): void {
  const file = path.join(__dirname, "..", ".env.local");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && fs.existsSync(file)) process.loadEnvFile(file);
  for (const name of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
    if (!process.env[name]) throw new Error(`${name} is required.`);
  }
}

function db() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
}

function check<T>(op: string, r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new Error(`${op}: ${r.error.message}`);
  return r.data;
}

function printCode(slug: string, code: string): void {
  console.log(`\n  Projet : ${slug}\n  Code   : ${code}\n  Lien   : https://redlinestudio.agency/portal\n\n  Ce code n'est affiché qu'une fois et n'est pas enregistré.\n`);
}

async function seed(slug: string): Promise<void> {
  const s = SEEDS[slug];
  if (!s) throw new Error(`No seed for "${slug}". Known: ${Object.keys(SEEDS).join(", ")}`);
  const client = db();
  const existing = check("lookup", await client.from("client_projects").select("id").eq("slug", slug).maybeSingle());
  if (existing) throw new Error(`Project "${slug}" already exists. Use "code" for a new code or "reset" for the seed content.`);

  const code = generateCode(s.codePrefix);
  const project = check(
    "insert project",
    await client
      .from("client_projects")
      .insert({ slug: s.slug, client_name: s.clientName, title: s.title, code_prefix: s.codePrefix, access_code_hash: await hashCode(code), time_zone: s.timeZone })
      .select("id")
      .single(),
  ) as { id: number };

  for (const d of s.documents) {
    const doc = check(
      "insert document",
      await client.from("project_documents").insert({ project_id: project.id, slug: d.slug, title: d.title, content: d.content, updated_by: "seed" }).select("id").single(),
    ) as { id: number };
    check("insert revision", await client.from("project_document_revisions").insert({ document_id: doc.id, content: d.content, updated_by: "seed" }));
  }
  printCode(slug, code);
}

async function newCode(slug: string): Promise<void> {
  const client = db();
  const project = check("lookup", await client.from("client_projects").select("id, code_prefix").eq("slug", slug).maybeSingle()) as { id: number; code_prefix: string } | null;
  if (!project) throw new Error(`No project "${slug}".`);
  const code = generateCode(project.code_prefix);
  check("update", await client.from("client_projects").update({ access_code_hash: await hashCode(code), code_set_at: new Date().toISOString() }).eq("id", project.id));
  printCode(slug, code);
}

async function reset(slug: string): Promise<void> {
  const s = SEEDS[slug];
  if (!s) throw new Error(`No seed for "${slug}".`);
  const client = db();
  const project = check("lookup", await client.from("client_projects").select("id").eq("slug", slug).maybeSingle()) as { id: number } | null;
  if (!project) throw new Error(`No project "${slug}".`);
  for (const d of s.documents) {
    const doc = check("lookup document", await client.from("project_documents").select("id, updated_at").eq("project_id", project.id).eq("slug", d.slug).maybeSingle()) as {
      id: number;
      updated_at: string;
    } | null;
    if (!doc) throw new Error(`No document "${d.slug}".`);
    const rows = check(
      "save",
      await client.rpc("save_project_document", { p_document_id: doc.id, p_expected_updated_at: doc.updated_at, p_content: d.content, p_updated_by: "admin" }),
    ) as { status: string; revision_id: number | null }[];
    console.log(`${d.slug}: ${rows[0]?.status}${rows[0]?.revision_id ? ` (revision #${rows[0].revision_id})` : ""}`);
  }
}

async function main(): Promise<void> {
  const [cmd, slug] = process.argv.slice(2);
  if (!slug || !["seed", "code", "reset"].includes(cmd)) {
    console.error("Usage: npx jiti scripts/projects.ts <seed|code|reset> <slug>");
    process.exit(1);
  }
  loadEnv();
  if (cmd === "seed") await seed(slug);
  else if (cmd === "code") await newCode(slug);
  else await reset(slug);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
