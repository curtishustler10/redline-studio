import { NextResponse, type NextRequest } from "next/server";
import { cleVeilleValide, syncSchema, syncVeilleLead } from "@/lib/veille";

// Synchro d'un lead de la veille e-commerce depuis la machine de Curtis
// (redline-veille/scripts/sync.mjs). La machine fait foi : chaque appel remplace l'état du lead.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!cleVeilleValide(req.headers.get("x-veille-cle"))) return NextResponse.json({ error: "clé refusée" }, { status: 401 });
  let corps: unknown;
  try {
    corps = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON attendu" }, { status: 400 });
  }
  const p = syncSchema.safeParse(corps);
  if (!p.success) {
    // Les chemins des champs refusés suffisent à corriger le script, sans renvoyer les données.
    return NextResponse.json({ error: "données refusées", champs: p.error.issues.slice(0, 10).map((i) => `${i.path.join(".")} : ${i.message}`) }, { status: 422 });
  }
  await syncVeilleLead(p.data);
  return NextResponse.json({ ok: true, slug: p.data.slug, emails: p.data.emails.length });
}
