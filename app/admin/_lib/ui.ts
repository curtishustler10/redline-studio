// Labels and flash messages shared by the admin pages. Actions send short codes
// in the query string; only codes listed here are ever displayed.
import type { EmailKind, LeadStatus } from "@/lib/crm";
import { formatWhen } from "@/lib/email/templates";
import { ZONES } from "@/lib/rdv-time";

export const OWNER_ZONE = "Pacific/Tahiti";

export const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  rdv: "RDV",
  proposal: "Proposition",
  won: "Gagné",
  lost: "Perdu",
};

export const STATUS_STYLE: Record<LeadStatus, string> = {
  new: "bg-[#E03C2D] text-white",
  contacted: "bg-[#F3E9DA] text-[#1E1A17]",
  rdv: "bg-[#1E1A17] text-[#FBF6EE]",
  proposal: "bg-[#F5B83D] text-[#1E1A17]",
  won: "bg-[#1F8A84] text-white",
  lost: "bg-transparent text-[#6F655C] border border-[#E4D8C6]",
};

export const MAIL_LABEL: Record<EmailKind, string> = {
  rdv_confirmation: "Confirmation RDV",
  rdv_reminder: "Rappel veille",
  rdv_rescheduled: "Nouveau créneau",
  rdv_cancelled: "Annulation",
  rdv_no_show: "« On s'est manqués »",
  rdv_follow_up: "Suivi après RDV",
  contact_auto_reply: "Réponse auto formulaire",
  internal_rdv: "Notif interne RDV",
  internal_contact: "Notif interne contact",
};

export const OK_MESSAGES: Record<string, string> = {
  saved: "Fiche enregistrée.",
  lead_created: "Lead créé.",
  link: "Lien de réservation prêt : copie-le ci-dessous.",
  rdv_set: "RDV posé.",
  rdv_moved: "RDV décalé.",
  rdv_cancelled: "RDV annulé.",
  rdv_done: "RDV marqué comme fait. Tu peux envoyer le suivi.",
  rdv_no_show: "Absence enregistrée.",
  followup: "Suivi envoyé. Statut passé en « Proposition ».",
};

export const ERR_MESSAGES: Record<string, string> = {
  auth: "Session expirée : reconnecte-toi.",
  password: "Mot de passe incorrect.",
  locked: "Trop d'essais : réessaie dans 15 minutes.",
  invalid: "Formulaire incomplet ou invalide.",
  invalid_time: "Date ou heure invalide (ou heure sautée par le changement d'heure).",
  past: "Ce créneau est déjà passé.",
  visio_link: "Pour une visio, colle le lien (https://…).",
  followup_empty: "Le suivi a besoin d'au moins un point de récap et d'une prochaine étape.",
  already_scheduled: "Ce lead a déjà un RDV à venir : décale-le ou annule-le d'abord.",
  not_scheduled: "Ce RDV n'est plus à venir.",
  conflict: "Le RDV vient d'être modifié ailleurs : recharge la page.",
  slot_taken: "Ce créneau chevauche un autre RDV : choisis une autre heure.",
  not_found: "Introuvable.",
  server: "Erreur serveur : regarde les logs Vercel.",
};

/** "rdv_confirmation:sent,internal_rdv:failed" → readable lines. Unknown entries are dropped. */
export function parseMailSummary(raw: string | undefined): { label: string; status: "sent" | "skipped" | "failed" }[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((part) => part.split(":"))
    .filter(([kind, status]) => kind in MAIL_LABEL && ["sent", "skipped", "failed"].includes(status))
    .map(([kind, status]) => ({ label: MAIL_LABEL[kind as EmailKind], status: status as "sent" | "skipped" | "failed" }));
}

export function when(at: string | Date, tz: string): string {
  return formatWhen(new Date(at), tz, "fr").full;
}

export function shortDate(at: string): string {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: OWNER_ZONE, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(at));
}

export function zoneLabel(tz: string): string {
  return ZONES.find((z) => z.id === tz)?.label ?? tz;
}
