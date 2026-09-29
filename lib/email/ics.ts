// RFC 5545 calendar invite for an appointment. Attached to confirmation,
// reschedule and cancellation mails so the slot lands in the lead's calendar
// (Gmail, Apple Mail and Outlook all honour METHOD:REQUEST / METHOD:CANCEL).

export type IcsInput = {
  /** Stable per appointment: a reschedule or cancel must reuse it to update the same event. */
  uid: string;
  /** Bump on every change to the same appointment (0 on creation). */
  sequence: number;
  method: "REQUEST" | "CANCEL";
  start: Date;
  durationMin: number;
  summary: string;
  description?: string;
  location?: string;
  organizer: { name: string; email: string };
  attendee: { name: string; email: string };
  /** Injected for deterministic tests. */
  now?: Date;
};

const PRODID = "-//Redline Studio//RDV//FR";

function utcStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Params (CN=...) are quoted rather than escaped. Quotes are not allowed inside. */
function quoteParam(s: string): string {
  return `"${s.replace(/"/g, "'")}"`;
}

// Lines longer than 75 octets must be folded (CRLF + one space). Counts UTF-8
// bytes, never splitting a multi-byte character.
function fold(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  for (const ch of line) {
    const size = enc.encode(ch).length;
    const limit = parts.length === 0 ? 75 : 74; // continuation lines lose one octet to the leading space
    if (bytes + size > limit) {
      parts.push(current);
      current = "";
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

export function buildIcs(input: IcsInput): string {
  const end = new Date(input.start.getTime() + input.durationMin * 60_000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODID}`,
    "CALSCALE:GREGORIAN",
    `METHOD:${input.method}`,
    "BEGIN:VEVENT",
    `UID:${input.uid}`,
    `SEQUENCE:${input.sequence}`,
    `DTSTAMP:${utcStamp(input.now ?? new Date())}`,
    `DTSTART:${utcStamp(input.start)}`,
    `DTEND:${utcStamp(end)}`,
    `SUMMARY:${escapeText(input.summary)}`,
    ...(input.description ? [`DESCRIPTION:${escapeText(input.description)}`] : []),
    ...(input.location ? [`LOCATION:${escapeText(input.location)}`] : []),
    `ORGANIZER;CN=${quoteParam(input.organizer.name)}:mailto:${input.organizer.email}`,
    `ATTENDEE;CN=${quoteParam(input.attendee.name)};ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:${input.attendee.email}`,
    `STATUS:${input.method === "CANCEL" ? "CANCELLED" : "CONFIRMED"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
