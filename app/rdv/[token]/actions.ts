"use server";

// Public self-booking. The token is the only credential, so every input is
// re-validated here: the slot must be one we would offer right now (recomputed
// server-side, never trusted from the form), and the database's no-overlap
// constraint settles any race with another booking.

import { redirect } from "next/navigation";
import {
  CrmError,
  findLeadByToken,
  getScheduledAppointment,
  listBusyRanges,
  rescheduleAppointment,
  scheduleAppointment,
  updateLead,
} from "@/lib/crm";
import { notifyRdvRescheduled, notifyRdvSet } from "@/lib/notifications";
import { isValidZone } from "@/lib/rdv-time";
import { HORIZON_DAYS, SLOT_MINUTES, availableSlots } from "@/lib/slots";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function bookSlot(formData: FormData): Promise<void> {
  const token = str(formData, "token");
  const lead = await findLeadByToken(token);
  if (!lead) redirect("/");

  const back = (params: Record<string, string>): never => redirect(`/rdv/${token}?${new URLSearchParams(params).toString()}`);
  const zone = isValidZone(str(formData, "tz")) ? str(formData, "tz") : lead.time_zone;
  const phone = str(formData, "phone").slice(0, 40);
  const slot = new Date(str(formData, "slot"));
  if (Number.isNaN(slot.getTime())) back({ err: "slot", tz: zone });
  if (phone.replace(/\D/g, "").length < 6) back({ err: "phone", tz: zone });

  const now = new Date();
  const current = await getScheduledAppointment(lead.id);
  const busy = (await listBusyRanges(now, new Date(now.getTime() + (HORIZON_DAYS + 1) * 86_400_000)))
    // The lead's own current RDV must not block moving it to a neighbouring slot.
    .filter((b) => !current || b.start.getTime() !== new Date(current.starts_at).getTime());
  if (!availableSlots(now, zone, busy).some((s) => s.getTime() === slot.getTime())) back({ err: "taken", tz: zone });

  try {
    const updated = await updateLead(lead.id, {
      phone,
      time_zone: zone,
      ...(lead.status === "new" || lead.status === "contacted" ? { status: "rdv" as const } : {}),
    });
    if (current) {
      const { appointment, previousStartsAt } = await rescheduleAppointment(current.id, slot);
      await notifyRdvRescheduled(updated, appointment, previousStartsAt);
    } else {
      const apt = await scheduleAppointment(lead.id, {
        startsAt: slot,
        durationMin: SLOT_MINUTES,
        mode: "phone",
        phone,
        timeZone: zone,
        bookedVia: "booking_link",
      });
      await notifyRdvSet(updated, apt);
    }
  } catch (e) {
    if (e instanceof CrmError && (e.code === "slot_taken" || e.code === "already_scheduled" || e.code === "conflict")) back({ err: "taken", tz: zone });
    console.error("[rdv] booking failed", e);
    back({ err: "server", tz: zone });
  }
  back({ ok: current ? "moved" : "booked" });
}
