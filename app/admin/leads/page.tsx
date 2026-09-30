import Link from "next/link";
import { DEFAULT_LEAD_ZONE, listLeads, listScheduledAppointments, type LeadStatus } from "@/lib/crm";
import { ZONES } from "@/lib/rdv-time";
import { adminLogout, createLeadAction, requireAdmin } from "../actions";
import { ERR_MESSAGES, OWNER_ZONE, STATUS_LABEL, STATUS_STYLE, shortDate, when } from "../_lib/ui";

export const dynamic = "force-dynamic";

const FILTERS: (LeadStatus | "all")[] = ["all", "new", "contacted", "rdv", "proposal", "won", "lost"];

const input = "w-full rounded-xl border border-[#E4D8C6] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8321F]";

export default async function LeadsPage({ searchParams }: { searchParams: { status?: string; err?: string } }) {
  await requireAdmin();
  const status = FILTERS.includes(searchParams.status as LeadStatus) && searchParams.status !== "all" ? (searchParams.status as LeadStatus) : undefined;
  const [leads, upcoming] = await Promise.all([listLeads({ status }), listScheduledAppointments()]);
  const nextRdv = new Map(upcoming.map((a) => [a.lead_id, a]));
  const err = searchParams.err ? ERR_MESSAGES[searchParams.err] : null;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-[#6F655C]">redline studio · admin</p>
          <h1 className="text-3xl font-semibold">Leads</h1>
        </div>
        <form action={adminLogout}>
          <button className="text-sm text-[#6F655C] underline decoration-[#E03C2D] underline-offset-4 hover:text-[#1E1A17]">Se déconnecter</button>
        </form>
      </header>

      {err && <p role="alert" className="mt-6 rounded-xl bg-[#C8321F]/10 px-4 py-3 text-sm text-[#C8321F]">{err}</p>}

      {upcoming.length > 0 && (
        <section className="mt-8 rounded-2xl bg-[#1E1A17] p-5 text-[#FBF6EE]">
          <h2 className="font-semibold">Prochains RDV</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {upcoming.slice(0, 5).map((a) => {
              const lead = leads.find((l) => l.id === a.lead_id);
              return (
                <li key={a.id}>
                  <Link href={`/admin/leads/${a.lead_id}#rdv`} className="hover:underline">
                    {when(a.starts_at, OWNER_ZONE)} · {lead ? lead.company || lead.name : `lead #${a.lead_id}`}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <nav aria-label="Filtrer par statut" className="mt-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = (f === "all" && !status) || f === status;
          return (
            <Link
              key={f}
              href={f === "all" ? "/admin/leads" : `/admin/leads?status=${f}`}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-3.5 py-1.5 text-sm border ${active ? "bg-[#1E1A17] text-[#FBF6EE] border-[#1E1A17]" : "border-[#E4D8C6] hover:border-[#1E1A17]"}`}
            >
              {f === "all" ? "Tous" : STATUS_LABEL[f]}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-[#E4D8C6] bg-white">
        <table className="w-full text-sm">
          <thead className="bg-[#F3E9DA] text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">Lead</th>
              <th className="px-4 py-3 font-semibold">Statut</th>
              <th className="px-4 py-3 font-semibold">Prochain RDV</th>
              <th className="px-4 py-3 font-semibold">Source</th>
              <th className="px-4 py-3 font-semibold">Arrivé</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[#6F655C]">
                  Aucun lead ici. Les demandes du formulaire du site arriveront dans cette liste ; tu peux aussi en ajouter un à la main ci-dessous.
                </td>
              </tr>
            )}
            {leads.map((l) => {
              const rdv = nextRdv.get(l.id);
              return (
                <tr key={l.id} className="border-t border-[#E4D8C6] hover:bg-[#FBF6EE]">
                  <td className="px-4 py-3">
                    <Link href={`/admin/leads/${l.id}`} className="font-semibold hover:underline">
                      {l.company || l.name}
                    </Link>
                    <div className="text-[#6F655C]">{l.company ? `${l.name} · ${l.email}` : l.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[l.status]}`}>{STATUS_LABEL[l.status]}</span>
                  </td>
                  <td className="px-4 py-3 text-[#6F655C]">{rdv ? shortDate(rdv.starts_at) : "—"}</td>
                  <td className="px-4 py-3 text-[#6F655C]">{l.source}</td>
                  <td className="px-4 py-3 text-[#6F655C]">{shortDate(l.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <details className="mt-8 rounded-2xl border border-[#E4D8C6] bg-white p-5">
        <summary className="cursor-pointer font-semibold">Ajouter un lead à la main</summary>
        <form action={createLeadAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Nom<input name="name" required className={input} /></label>
          <label className="text-sm">Email<input name="email" type="email" required className={input} /></label>
          <label className="text-sm">Téléphone<input name="phone" className={input} /></label>
          <label className="text-sm">Entreprise<input name="company" className={input} /></label>
          <label className="text-sm">Besoin<input name="service" className={input} /></label>
          <label className="text-sm">
            Fuseau du lead
            <select name="timeZone" defaultValue={DEFAULT_LEAD_ZONE} className={input}>
              {ZONES.map((z) => <option key={z.id} value={z.id}>{z.label}</option>)}
            </select>
          </label>
          <label className="text-sm">
            Langue
            <select name="lang" defaultValue="fr" className={input}>
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </label>
          <div className="flex items-end">
            <button className="rounded-full bg-[#C8321F] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#B32A1F]">Créer le lead</button>
          </div>
        </form>
      </details>
    </main>
  );
}
