// Outbound transport: Resend's REST API (no SDK — one fetch is all we need).
// Returns a result instead of throwing: the caller records the outcome in
// email_log either way, and a failed mail must never break the action that
// triggered it (the RDV is already saved).
//
// Environment:
//   RESEND_API_KEY      required to send at all
//   MAIL_FROM           sender, on the domain verified in Resend
//   MAIL_REPLY_TO       real inbox that receives replies (also the .ics organizer)
//   MAIL_INTERNAL_TO    Curtis's inbox for internal notifications (no default)
//   MAIL_TEST_REDIRECT  when set, every lead-bound mail goes here instead, marked [TEST]

export type OutgoingMail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  ics?: { filename: string; content: string };
  /** Lead-bound mails honour MAIL_TEST_REDIRECT; internal mails never do. */
  audience: "lead" | "internal";
};

export type SendResult = { ok: true; id: string | null; to: string } | { ok: false; error: string };

const DEFAULT_FROM = "Curtis · Redline Studio <hello@redlinestudio.agency>";
const TEST_PREFIX = "[TEST] ";

export function mailReplyTo(): string | null {
  return process.env.MAIL_REPLY_TO?.trim() || null;
}

export function internalInbox(): string | null {
  return process.env.MAIL_INTERNAL_TO?.trim() || null;
}

/** The only place that decides where a lead-bound mail really goes. */
export function resolveRecipient(to: string, audience: OutgoingMail["audience"]): { to: string; isTest: boolean } {
  const redirect = process.env.MAIL_TEST_REDIRECT?.trim();
  if (audience === "lead" && redirect) return { to: redirect, isTest: true };
  return { to: to.trim(), isTest: false };
}

function testBanner(originalTo: string): { html: string; text: string } {
  const line = `Email de test : il n'a PAS été envoyé à ${originalTo}.`;
  return {
    html: `<div style="background:#1E1A17;color:#FBF6EE;font:14px Helvetica,Arial,sans-serif;padding:10px 16px;text-align:center">${line.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</div>`,
    text: `${line}\n────────────────────────\n\n`,
  };
}

export async function sendEmail(mail: OutgoingMail, fetchImpl: typeof fetch = fetch): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY absente : aucun email ne peut partir." };
  if (!mail.to.trim()) return { ok: false, error: "Aucun destinataire." };

  const { to, isTest } = resolveRecipient(mail.to, mail.audience);
  const banner = isTest ? testBanner(mail.to) : null;
  const html = banner ? mail.html.replace(/<body([^>]*)>/, `<body$1>${banner.html}`) : mail.html;
  const replyTo = mailReplyTo();

  const body = {
    from: process.env.MAIL_FROM?.trim() || DEFAULT_FROM,
    to: [to],
    subject: isTest ? `${TEST_PREFIX}${mail.subject}` : mail.subject,
    html,
    text: banner ? banner.text + mail.text : mail.text,
    ...(replyTo ? { reply_to: replyTo } : {}),
    ...(mail.ics
      ? {
          attachments: [
            {
              filename: mail.ics.filename,
              content: Buffer.from(mail.ics.content, "utf8").toString("base64"),
              content_type: `text/calendar; charset=utf-8; method=${/METHOD:CANCEL/.test(mail.ics.content) ? "CANCEL" : "REQUEST"}`,
            },
          ],
        }
      : {}),
  };

  try {
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
    if (!res.ok) return { ok: false, error: `Resend ${res.status} : ${json?.message ?? "erreur inconnue"}` };
    return { ok: true, id: json?.id ?? null, to };
  } catch (e) {
    return { ok: false, error: `Resend injoignable : ${(e as Error).message}` };
  }
}
