import { NextResponse } from "next/server";
import { createLead, type LeadSource } from "@/lib/crm";
import { notifyContact } from "@/lib/notifications";
import { isValidZone } from "@/lib/rdv-time";

// Public entry point for every site form (chat widget, diagnostic quiz).
// Write-only: leads are read through /admin, never through this route.
// Persist first, then notify — a mail failure must not lose the lead or fail
// the visitor's submission (it shows up on the lead file instead).

const SOURCES: LeadSource[] = ["form", "chat", "diagnostic"];
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function text(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  // Honeypot: real visitors never see this field; bots fill everything. Pretend success.
  if (text(body.website, 200)) return NextResponse.json({ ok: true }, { status: 201 });

  const name = text(body.name, 200);
  const email = text(body.email, 320).toLowerCase();
  if (!name || !EMAIL.test(email)) {
    return NextResponse.json({ error: "Nom et email valides requis" }, { status: 400 });
  }

  const source = SOURCES.includes(body.source as LeadSource) ? (body.source as LeadSource) : "form";
  const langHint = text(body.lang, 5) || request.headers.get("accept-language") || "";
  const tz = text(body.timeZone, 64);
  const service = text(body.service, 200);
  const message = text(body.message, 5000);

  let lead;
  try {
    lead = await createLead({
      name,
      email,
      phone: text(body.phone, 40) || undefined,
      lang: langHint.toLowerCase().startsWith("en") ? "en" : "fr",
      timeZone: isValidZone(tz) ? tz : undefined,
      source,
      service: service || undefined,
      message: message || undefined,
    });
  } catch (e) {
    // Last-resort trace so a lead is recoverable from Vercel logs if the database is down.
    console.error("[LEAD] not saved", JSON.stringify({ name, email, source, service, message }), (e as Error).message);
    return NextResponse.json({ error: "Enregistrement impossible, réessayez" }, { status: 500 });
  }

  await notifyContact(lead, { service: service || undefined, message: message || undefined });

  return NextResponse.json({ ok: true }, { status: 201 });
}
