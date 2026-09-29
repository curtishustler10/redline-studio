// Shared email shell in the v2 "Fil rouge" brand. Table layout + inline styles
// because Gmail/Outlook strip <style> and ignore flex/grid. Web fonts do not
// load in most clients, so every font stack ends on a safe system fallback.
// Every template goes through renderEmail() so HTML and plain text never drift.

export type Lang = "fr" | "en";

export type Link = { label: string; href: string };

export type Block =
  | { kind: "p"; text: string }
  /** Key facts, e.g. date / format / lieu. A row with href renders as a link. */
  | { kind: "details"; rows: { label: string; value: string; href?: string }[] }
  /** Short red annotation — the brand's handwritten note, max ~8 words. */
  | { kind: "note"; text: string }
  /** Echo of what the lead wrote, so they see we actually read it. */
  | { kind: "quote"; text: string };

export type EmailContent = {
  lang: Lang;
  /** Inbox preview line shown after the subject. */
  preheader: string;
  title: string;
  blocks: Block[];
  cta?: Link;
  secondary?: Link;
  /** Internal mails skip the signature and the marketing footer. */
  internal?: boolean;
};

export type BrandContext = {
  /** Absolute origin, no trailing slash — images and links must be absolute in email. */
  siteUrl: string;
  whatsappHref: string;
};

export const C = {
  paper: "#FBF6EE",
  card: "#FFFFFF",
  cream: "#F3E9DA",
  ink: "#1E1A17",
  muted: "#6F655C",
  line: "#E4D8C6",
  thread: "#E03C2D",
  redText: "#C8321F",
} as const;

const SERIF = "'DM Serif Display', Georgia, 'Times New Roman', serif";
const SANS = "'Space Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif";

export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only https, mailto and tel may become links; anything else is dropped. */
export function safeHref(href: string): string | null {
  return /^(https:\/\/|mailto:|tel:)/i.test(href.trim()) ? href.trim() : null;
}

function nl2br(s: string): string {
  return esc(s).replace(/\r?\n/g, "<br>");
}

function renderBlockHtml(b: Block): string {
  switch (b.kind) {
    case "p":
      return `<p style="margin:0 0 16px;font-family:${SANS};font-size:16px;line-height:1.6;color:${C.ink}">${nl2br(b.text)}</p>`;
    case "note":
      return `<p style="margin:0 0 18px;font-family:Georgia,serif;font-style:italic;font-size:17px;line-height:1.4;color:${C.redText}">&rarr; ${esc(b.text)}</p>`;
    case "quote":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px"><tr>
<td style="width:3px;background:${C.thread};border-radius:2px"></td>
<td style="padding:4px 0 4px 14px;font-family:${SANS};font-size:15px;line-height:1.6;color:${C.muted}">${nl2br(b.text)}</td>
</tr></table>`;
    case "details": {
      const rows = b.rows
        .map((r, i) => {
          const href = r.href ? safeHref(r.href) : null;
          const value = href
            ? `<a href="${esc(href)}" style="color:${C.redText};text-decoration:underline">${esc(r.value)}</a>`
            : nl2br(r.value);
          const border = i < b.rows.length - 1 ? `border-bottom:1px solid ${C.line};` : "";
          return `<tr>
<td valign="top" style="${border}padding:12px 16px;width:34%;font-family:${SANS};font-size:13px;color:${C.muted}">${esc(r.label)}</td>
<td valign="top" style="${border}padding:12px 16px;font-family:${SANS};font-size:15px;font-weight:600;color:${C.ink}">${value}</td>
</tr>`;
        })
        .join("");
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 22px;background:${C.cream};border-radius:12px">${rows}</table>`;
    }
  }
}

function renderBlockText(b: Block): string {
  switch (b.kind) {
    case "p":
      return b.text;
    case "note":
      return `→ ${b.text}`;
    case "quote":
      return b.text
        .split(/\r?\n/)
        .map((l) => `> ${l}`)
        .join("\n");
    case "details":
      return b.rows.map((r) => `${r.label} : ${r.value}${r.href && r.href !== r.value ? ` (${r.href})` : ""}`).join("\n");
  }
}

const FOOTER = {
  fr: { role: "Sites, pubs & visibilité locale", whatsapp: "Écrire sur WhatsApp", why: "Vous recevez ce message suite à votre échange avec Redline Studio." },
  en: { role: "Websites, ads & local visibility", whatsapp: "Message on WhatsApp", why: "You are receiving this because you got in touch with Redline Studio." },
};

export function renderEmail(content: EmailContent, brand: BrandContext): { html: string; text: string } {
  const f = FOOTER[content.lang];
  const cta = content.cta && safeHref(content.cta.href) ? content.cta : undefined;
  const secondary = content.secondary && safeHref(content.secondary.href) ? content.secondary : undefined;

  const ctaHtml = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 ${secondary ? "12px" : "24px"}"><tr>
<td style="border-radius:999px;background:${C.redText}"><a href="${esc(cta.href)}" style="display:inline-block;padding:14px 26px;font-family:${SANS};font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:999px">${esc(cta.label)}</a></td>
</tr></table>`
    : "";
  const secondaryHtml = secondary
    ? `<p style="margin:0 0 24px;font-family:${SANS};font-size:14px"><a href="${esc(secondary.href)}" style="color:${C.ink};text-decoration:underline;text-decoration-color:${C.thread}">${esc(secondary.label)}</a></p>`
    : "";

  const signature = content.internal
    ? ""
    : `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:8px"><tr><td>
<p style="margin:0;font-family:${SERIF};font-size:22px;color:${C.ink}">Curtis</p>
<p style="margin:2px 0 10px;font-family:${SANS};font-size:13px;color:${C.muted}">Redline Studio · ${esc(f.role)}</p>
<div style="width:56px;height:2px;background:${C.thread};border-radius:2px;line-height:2px;font-size:0">&nbsp;</div>
<p style="margin:10px 0 0;font-family:${SANS};font-size:13px"><a href="${esc(brand.whatsappHref)}" style="color:${C.redText}">${esc(f.whatsapp)}</a></p>
</td></tr></table>`;

  const html = `<!DOCTYPE html>
<html lang="${content.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>${esc(content.title)}</title>
</head>
<body style="margin:0;padding:0;background:${C.paper}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.paper}">${esc(content.preheader)}&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper}"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
<tr><td style="padding:0 8px 20px">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="padding-right:10px"><img src="${esc(brand.siteUrl)}/email/fil.png" width="46" height="23" alt="" style="display:block;border:0"></td>
<td style="font-family:${SANS};font-size:18px;color:${C.ink}"><b>redline</b> <span style="color:${C.muted}">studio</span></td>
</tr></table>
</td></tr>
<tr><td style="background:${C.card};border:1px solid ${C.line};border-radius:16px;padding:36px 32px">
<h1 style="margin:0 0 20px;font-family:${SERIF};font-weight:400;font-size:30px;line-height:1.15;color:${C.ink}">${esc(content.title)}</h1>
${content.blocks.map(renderBlockHtml).join("\n")}
${ctaHtml}${secondaryHtml}${signature}
</td></tr>
${content.internal ? "" : `<tr><td style="padding:20px 8px 0;font-family:${SANS};font-size:12px;line-height:1.5;color:${C.muted}">${esc(f.why)}<br><a href="${esc(brand.siteUrl)}" style="color:${C.muted}">${esc(brand.siteUrl.replace(/^https:\/\//, ""))}</a></td></tr>`}
</table>
</td></tr></table>
</body>
</html>`;

  const text = [
    content.title,
    "",
    ...content.blocks.flatMap((b) => [renderBlockText(b), ""]),
    ...(cta ? [`${cta.label} : ${cta.href}`] : []),
    ...(secondary ? [`${secondary.label} : ${secondary.href}`] : []),
    ...(content.internal ? [] : ["", "Curtis", `Redline Studio · ${f.role}`, `WhatsApp : ${brand.whatsappHref}`, "", f.why]),
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { html, text: text + "\n" };
}
