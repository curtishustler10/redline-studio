// Client projects ("Mon projet") from the command line. Reads SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY from the environment, or from .env.local.
//
//   npx jiti scripts/projects.ts seed <slug>    create the project from lib/project-seeds.ts and print its code;
//                                               on an existing project, only add the seed documents it lacks
//   npx jiti scripts/projects.ts code <slug> [password]
//                                               new access code (old one stops working, sessions close), print it;
//                                               with a password, that exact password becomes the code
//   npx jiti scripts/projects.ts reset <slug>   put the seed content back, as a new revision (history kept)
//   npx jiti scripts/projects.ts images <slug> <dir>
//                                               upload every <id>.webp of <dir> to the private "portal" bucket,
//                                               as <slug>/<id>.webp (replaces files of the same name)
//
// A code is printed once and never stored: copy it, then give it to the client.
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { generateCode, hashCode, MIN_PASSWORD_LENGTH, normalizePassword } from "../lib/portal-auth";
import { PREVIEW_IMAGE } from "../lib/project-doc";
import { SEEDS, type ProjectSeed } from "../lib/project-seeds";

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
  const existing = check("lookup", await client.from("client_projects").select("id").eq("slug", slug).maybeSingle()) as { id: number } | null;
  if (existing) {
    // The code is left alone: use "code" for a new one, "reset" for the seed content.
    await addDocuments(client, existing.id, s, true);
    return;
  }

  const code = generateCode(s.codePrefix);
  const project = check(
    "insert project",
    await client
      .from("client_projects")
      .insert({ slug: s.slug, client_name: s.clientName, title: s.title, code_prefix: s.codePrefix, access_code_hash: await hashCode(code), time_zone: s.timeZone })
      .select("id")
      .single(),
  ) as { id: number };

  await addDocuments(client, project.id, s, false);
  printCode(slug, code);
}

/** Inserts the seed documents the project does not have yet, each with its first revision. */
async function addDocuments(client: ReturnType<typeof db>, projectId: number, s: ProjectSeed, report: boolean): Promise<void> {
  const have = new Set(
    ((check("list documents", await client.from("project_documents").select("slug").eq("project_id", projectId)) ?? []) as { slug: string }[]).map((d) => d.slug),
  );
  for (const d of s.documents) {
    if (have.has(d.slug)) {
      if (report) console.log(`${d.slug}: already there, left unchanged`);
      continue;
    }
    const doc = check(
      "insert document",
      await client.from("project_documents").insert({ project_id: projectId, slug: d.slug, title: d.title, content: d.content, updated_by: "seed" }).select("id").single(),
    ) as { id: number };
    check("insert revision", await client.from("project_document_revisions").insert({ document_id: doc.id, content: d.content, updated_by: "seed" }));
    if (report) console.log(`${d.slug}: added`);
  }
}

async function images(slug: string, dir: string): Promise<void> {
  const files = fs.readdirSync(dir).filter((f) => PREVIEW_IMAGE.test(f));
  if (files.length === 0) throw new Error(`No <id>.webp file in ${dir}.`);
  const bucket = db().storage.from("portal");
  for (const f of files) {
    check(`upload ${f}`, await bucket.upload(`${slug}/${f}`, fs.readFileSync(path.join(dir, f)), { contentType: "image/webp", upsert: true }));
  }
  console.log(`${files.length} image(s) uploaded to portal/${slug}/`);
}

async function newCode(slug: string, chosen?: string): Promise<void> {
  const client = db();
  const project = check("lookup", await client.from("client_projects").select("id, code_prefix").eq("slug", slug).maybeSingle()) as { id: number; code_prefix: string } | null;
  if (!project) throw new Error(`No project "${slug}".`);
  let code = generateCode(project.code_prefix);
  if (chosen !== undefined) {
    const pw = normalizePassword(chosen);
    if (!pw) throw new Error(`A chosen password needs ${MIN_PASSWORD_LENGTH} to 64 characters.`);
    code = pw;
  }
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
  const [cmd, slug, extra] = process.argv.slice(2);
  if (!slug || !["seed", "code", "reset", "images"].includes(cmd) || (cmd === "images" && !extra)) {
    console.error("Usage: npx jiti scripts/projects.ts <seed|code|reset> <slug> | code <slug> [password] | images <slug> <dir>");
    process.exit(1);
  }
  loadEnv();
  if (cmd === "seed") await seed(slug);
  else if (cmd === "code") await newCode(slug, extra);
  else if (cmd === "images") await images(slug, extra);
  else await reset(slug);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
