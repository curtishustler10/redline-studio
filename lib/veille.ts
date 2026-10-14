// Veille e-commerce : schéma de synchro, écriture depuis la machine de veille, lecture pour
// /admin/veille. Voir supabase/migrations/0005_veille.sql.
//
// SERVER-ONLY (service-role via getDb).
import "server-only";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getDb } from "./db";

// ─── Schéma de synchro (contrat avec redline-veille/scripts/sync.mjs) ─────────

const court = (max: number) => z.string().trim().max(max);
const optionnel = (max: number) => court(max).nullish().transform((v) => v || null);

export const CHEMIN_FICHIER = /^[a-z0-9-]{1,60}\/(captures|emails)\/[A-Za-z0-9._-]{1,120}\.(jpg|png)$/;
const chemin = z.string().regex(CHEMIN_FICHIER);

const etape = z.object({ at: optionnel(40), fait: z.boolean(), detail: optionnel(1000) });

const reseau = z.object({
  url: optionnel(300),
  abonnes: optionnel(40), // tel que lu sur la page (« 12,4 k »), jamais estimé
  dernierPost: optionnel(40),
  note: optionnel(500),
});

export const ficheSchema = z.object({
  site: z
    .object({ url: optionnel(300), titre: optionnel(300), notes: z.array(court(500)).max(20).default([]) })
    .default({ notes: [] }),
  pixelMeta: optionnel(200),
  gtm: optionnel(200),
  outilsEmail: z.array(court(60)).max(15).default([]),
  boutiqueAdresse: optionnel(300),
  reseaux: z.record(z.enum(["instagram", "facebook", "tiktok", "pinterest", "youtube"]), reseau).default({}),
  publicites: optionnel(500), // ex. « 2 pubs actives, la plus ancienne depuis le 18/08/2025 »
  constats: z.array(court(600)).max(30).default([]),
});

export const workflowSchema = z.object({
  sequence: z.enum(["bienvenue", "checkout", "panier", "newsletter", "post-achat", "autre"]),
  verdict: z.enum(["en observation", "absente", "minimale", "correcte", "solide"]),
  emails: z.number().int().min(0).max(500),
  premierDelai: optionnel(100),
  notes: optionnel(1500),
});

export const offreSchema = z.object({
  code: z.string().regex(/^[ED]\d$/),
  titre: court(200),
  pourquoi: court(2000),
  option: optionnel(300),
  provisoire: z.boolean(),
});

export const emailSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{8,24}$/),
  recuAt: z.string().datetime({ offset: true }),
  objet: court(500),
  expediteur: optionnel(300),
  preEntete: optionnel(500),
  outil: optionnel(200),
  delai: optionnel(200),
  sequence: z.enum(["bienvenue", "checkout", "newsletter", "transactionnel", "autre"]).nullish().transform((v) => v ?? null),
  texte: optionnel(8000),
  mobile: chemin.nullish().transform((v) => v ?? null),
  desktop: chemin.nullish().transform((v) => v ?? null),
});

export const syncSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{1,60}$/),
  marque: court(200).min(1),
  domaine: court(200).min(1),
  plateforme: optionnel(60),
  source: optionnel(500),
  j0: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish().transform((v) => v ?? null),
  statut: court(40).min(1),
  score: z.number().int().min(0).max(100).nullish().transform((v) => v ?? null),
  classe: z.enum(["A", "B", "C"]).nullish().transform((v) => v ?? null),
  boutiquePhysique: z.enum(["oui", "showroom", "non"]).nullish().transform((v) => v ?? null),
  etapes: z.object({ inscription: etape.optional(), panier: etape.optional(), checkout: etape.optional(), desinscription: etape.optional() }),
  fiche: ficheSchema,
  workflows: z.array(workflowSchema).max(10),
  offre: offreSchema.nullish().transform((v) => v ?? null),
  briefMd: z.string().max(50000).nullish().transform((v) => v || null),
  journal: z
    .array(z.object({ at: court(40), etape: court(80), fait: court(2000), resultat: court(2000), captures: z.array(chemin).max(6) }))
    .max(300),
  emails: z.array(emailSchema).max(300),
});

export type VeilleSync = z.infer<typeof syncSchema>;
export type Fiche = z.infer<typeof ficheSchema>;
export type Workflow = z.infer<typeof workflowSchema>;
export type Offre = z.infer<typeof offreSchema>;
export type Etapes = VeilleSync["etapes"];
export type EntreeJournal = VeilleSync["journal"][number];

export type VeilleLead = {
  slug: string;
  marque: string;
  domaine: string;
  plateforme: string | null;
  source: string | null;
  j0: string | null;
  statut: string;
  score: number | null;
  classe: "A" | "B" | "C" | null;
  boutique_physique: "oui" | "showroom" | "non" | null;
  etapes: Etapes;
  fiche: Fiche;
  workflows: Workflow[];
  offre: Offre | null;
  brief_md: string | null;
  journal: EntreeJournal[];
  synced_at: string;
};

export type VeilleEmail = {
  id: string;
  slug: string;
  recu_at: string;
  objet: string;
  expediteur: string | null;
  pre_entete: string | null;
  outil: string | null;
  delai: string | null;
  sequence: string | null;
  texte: string | null;
  mobile_path: string | null;
  desktop_path: string | null;
};

const BUCKET = "veille";

/**
 * Clé de la machine de veille (en-tête x-veille-cle = VEILLE_SYNC_KEY), comparée en temps
 * constant. Sans variable configurée, tout est refusé.
 */
export function cleVeilleValide(recue: string | null): boolean {
  const attendue = process.env.VEILLE_SYNC_KEY;
  if (!attendue || !recue) return false;
  const a = Buffer.from(recue);
  const b = Buffer.from(attendue);
  return a.length === b.length && timingSafeEqual(a, b);
}

function fail(op: string, error: { message: string }): never {
  throw new Error(`${op}: ${error.message}`);
}

// ─── Écriture (synchro) ───────────────────────────────────────────────────────

/** Remplace l'état du lead par celui de la machine de veille, qui fait foi. */
export async function syncVeilleLead(p: VeilleSync): Promise<void> {
  const db = getDb();
  const { error } = await db.from("veille_leads").upsert({
    slug: p.slug,
    marque: p.marque,
    domaine: p.domaine,
    plateforme: p.plateforme,
    source: p.source,
    j0: p.j0,
    statut: p.statut,
    score: p.score,
    classe: p.classe,
    boutique_physique: p.boutiquePhysique,
    etapes: p.etapes,
    fiche: p.fiche,
    workflows: p.workflows,
    offre: p.offre,
    brief_md: p.briefMd,
    journal: p.journal,
    synced_at: new Date().toISOString(),
  });
  if (error) fail("syncVeilleLead", error);
  if (p.emails.length) {
    const { error: e2 } = await db.from("veille_emails").upsert(
      p.emails.map((m) => ({
        id: m.id,
        slug: p.slug,
        recu_at: m.recuAt,
        objet: m.objet,
        expediteur: m.expediteur,
        pre_entete: m.preEntete,
        outil: m.outil,
        delai: m.delai,
        sequence: m.sequence,
        texte: m.texte,
        mobile_path: m.mobile,
        desktop_path: m.desktop,
      })),
    );
    if (e2) fail("syncVeilleLead/emails", e2);
  }
}

/** Dépose une capture dans le bucket privé (écrase si elle existe déjà). */
export async function deposerCapture(chemin: string, contenu: ArrayBuffer, type: "image/jpeg" | "image/png"): Promise<void> {
  if (!CHEMIN_FICHIER.test(chemin)) throw new Error("deposerCapture: chemin refusé");
  const { error } = await getDb().storage.from(BUCKET).upload(chemin, contenu, { contentType: type, upsert: true });
  if (error) fail("deposerCapture", error);
}

// ─── Lecture (admin) ─────────────────────────────────────────────────────────

export async function listVeilleLeads(): Promise<(VeilleLead & { nbEmails: number })[]> {
  const db = getDb();
  const [{ data, error }, { data: emails, error: e2 }] = await Promise.all([
    db.from("veille_leads").select().order("j0", { ascending: false, nullsFirst: false }).limit(500),
    db.from("veille_emails").select("slug").limit(10000),
  ]);
  if (error) fail("listVeilleLeads", error);
  if (e2) fail("listVeilleLeads/emails", e2);
  const compte = new Map<string, number>();
  for (const e of emails ?? []) compte.set(e.slug as string, (compte.get(e.slug as string) ?? 0) + 1);
  return ((data ?? []) as VeilleLead[]).map((l) => ({ ...l, nbEmails: compte.get(l.slug) ?? 0 }));
}

export async function getVeilleLead(slug: string): Promise<{ lead: VeilleLead; emails: VeilleEmail[] } | null> {
  if (!/^[a-z0-9-]{1,60}$/.test(slug)) return null;
  const db = getDb();
  const [{ data, error }, { data: emails, error: e2 }] = await Promise.all([
    db.from("veille_leads").select().eq("slug", slug).maybeSingle(),
    db.from("veille_emails").select().eq("slug", slug).order("recu_at", { ascending: true }),
  ]);
  if (error) fail("getVeilleLead", error);
  if (e2) fail("getVeilleLead/emails", e2);
  return data ? { lead: data as VeilleLead, emails: (emails ?? []) as VeilleEmail[] } : null;
}

/** URLs signées (1 h) pour afficher les captures du bucket privé dans l'admin. */
export async function urlsSignees(chemins: string[]): Promise<Map<string, string>> {
  const uniques = [...new Set(chemins.filter((c) => CHEMIN_FICHIER.test(c)))];
  if (!uniques.length) return new Map();
  const { data, error } = await getDb().storage.from(BUCKET).createSignedUrls(uniques, 3600);
  if (error) fail("urlsSignees", error);
  const paires: [string, string][] = [];
  for (const d of data ?? []) if (d.path && d.signedUrl) paires.push([d.path, d.signedUrl]);
  return new Map(paires);
}
