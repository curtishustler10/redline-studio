import { NextResponse } from "next/server";
import { sendDueReminders } from "@/lib/notifications";

// Vercel Cron (vercel.json) calls this once a day with `Authorization: Bearer $CRON_SECRET`.
// Idempotent: every reminder is deduplicated in email_log, so a manual re-run is harmless.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET absente" }, { status: 500 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const deliveries = await sendDueReminders();
  const count = (s: string) => deliveries.filter((d) => d.status === s).length;
  return NextResponse.json({ due: deliveries.length, sent: count("sent"), skipped: count("skipped"), failed: count("failed") });
}
