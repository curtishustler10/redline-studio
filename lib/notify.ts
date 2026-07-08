import type { Lead } from "./leads"

// Minimal HTML escaping — lead fields are user input and land in an email body.
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/**
 * Deliver a captured lead to a human. Two layers, both serverless-safe:
 *  1. A structured `[LEAD]` log line — ALWAYS emitted, so a lead is recoverable
 *     from Vercel logs even when no email provider is configured yet.
 *  2. An email via Resend — sent only when RESEND_API_KEY + LEAD_NOTIFY_TO exist.
 *
 * Never throws: notification failure must not break the visitor's submission.
 */
export async function notifyLead(lead: Lead): Promise<void> {
  console.log("[LEAD]", JSON.stringify(lead))

  const key = process.env.RESEND_API_KEY
  const to = process.env.LEAD_NOTIFY_TO
  if (!key || !to) return

  const from = process.env.LEAD_FROM ?? "Redline Leads <onboarding@resend.dev>"
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: to.split(",").map((s) => s.trim()).filter(Boolean),
        reply_to: lead.email,
        subject: `🔴 Nouveau lead — ${lead.name} (${lead.service || "Redline"})`,
        html: `<div style="font-family:system-ui,sans-serif;line-height:1.5">
          <h2 style="margin:0 0 12px">Nouveau lead Redline</h2>
          <p><b>Nom&nbsp;:</b> ${esc(lead.name)}<br/>
          <b>Email&nbsp;:</b> <a href="mailto:${esc(lead.email)}">${esc(lead.email)}</a><br/>
          <b>Service&nbsp;:</b> ${esc(lead.service) || "—"}<br/>
          <b>Reçu&nbsp;:</b> ${esc(lead.createdAt)}</p>
          <p><b>Message&nbsp;:</b><br/>${esc(lead.message).replace(/\n/g, "<br/>") || "—"}</p>
        </div>`,
      }),
    })
    if (!res.ok) {
      console.error("[LEAD] resend failed", res.status, await res.text().catch(() => ""))
    }
  } catch (e) {
    console.error("[LEAD] resend error", (e as Error).message)
  }
}
