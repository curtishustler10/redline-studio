import { NextResponse, type NextRequest } from "next/server";
import { CHEMIN_FICHIER, cleVeilleValide, deposerCapture } from "@/lib/veille";

// Dépôt d'une capture de la veille (boutique ou rendu d'email) dans le bucket privé.
//   PUT /api/veille/capture?chemin=<slug>/(captures|emails)/<fichier>.jpg   corps = l'image
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX = 4 * 1024 * 1024; // sous la limite de corps des fonctions Vercel (4,5 Mo)

export async function PUT(req: NextRequest) {
  if (!cleVeilleValide(req.headers.get("x-veille-cle"))) return NextResponse.json({ error: "clé refusée" }, { status: 401 });
  const chemin = req.nextUrl.searchParams.get("chemin") ?? "";
  if (!CHEMIN_FICHIER.test(chemin)) return NextResponse.json({ error: "chemin refusé" }, { status: 400 });
  const type = chemin.endsWith(".png") ? "image/png" : "image/jpeg";
  const contenu = await req.arrayBuffer();
  if (!contenu.byteLength || contenu.byteLength > MAX) return NextResponse.json({ error: "taille refusée" }, { status: 413 });
  await deposerCapture(chemin, contenu, type);
  return NextResponse.json({ ok: true, chemin });
}
