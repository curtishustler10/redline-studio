import Link from "next/link";
import { listVeilleLeads } from "@/lib/veille";
import { adminLogout, requireAdmin } from "../actions";
import { BOUTIQUE_LABEL, CLASSE_STYLE, Parcours, STATUT_LABEL, card, dateFr, jourJ } from "./_ui";

export const dynamic = "force-dynamic";

const FILTRES = [
  { cle: "tous", label: "Tous" },
  { cle: "collecte", label: "En collecte" },
  { cle: "classe", label: "Classés" },
  { cle: "A", label: "Classe A" },
  { cle: "magasin", label: "Avec magasin" },
  { cle: "bloque", label: "Bloqués" },
] as const;

export default async function VeillePage({ searchParams }: { searchParams: { f?: string } }) {
  await requireAdmin();
  const tous = await listVeilleLeads();
  const f = FILTRES.some((x) => x.cle === searchParams.f) ? searchParams.f : "tous";
  const leads = tous.filter((l) => {
    if (f === "collecte") return l.statut === "collecte" || l.statut.startsWith("j0");
    if (f === "classe") return !!l.classe;
    if (f === "A") return l.classe === "A";
    if (f === "magasin") return l.boutique_physique === "oui";
    if (f === "bloque") return l.statut === "bloqué";
    return true;
  });
  const chiffres = [
    { label: "Leads suivis", valeur: tous.length },
    { label: "Checkouts abandonnés", valeur: tous.filter((l) => l.etapes.checkout?.fait).length },
    { label: "Emails reçus", valeur: tous.reduce((n, l) => n + l.nbEmails, 0) },
    { label: "Classe A", valeur: tous.filter((l) => l.classe === "A").length },
  ];
  const derniereSynchro = tous.map((l) => l.synced_at).sort().at(-1);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-[#6F655C]">
            redline studio · admin ·{" "}
            <Link href="/admin/leads" className="underline decoration-[#E03C2D] underline-offset-4 hover:text-[#1E1A17]">Leads</Link>
          </p>
          <h1 className="text-3xl font-semibold">Veille e-commerce</h1>
          <p className="mt-1 text-sm text-[#6F655C]">
            Boutiques étudiées par la boîte de veille : inscription, panier, checkout abandonné, emails reçus.
            {derniereSynchro && ` Dernière synchro : ${dateFr(derniereSynchro)} (Paris).`}
          </p>
        </div>
        <form action={adminLogout}>
          <button className="text-sm text-[#6F655C] underline decoration-[#E03C2D] underline-offset-4 hover:text-[#1E1A17]">Se déconnecter</button>
        </form>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {chiffres.map((c) => (
          <div key={c.label} className={card}>
            <p className="text-2xl font-semibold">{c.valeur}</p>
            <p className="text-sm text-[#6F655C]">{c.label}</p>
          </div>
        ))}
      </section>

      <nav aria-label="Filtrer" className="mt-8 flex flex-wrap gap-2">
        {FILTRES.map((x) => (
          <Link
            key={x.cle}
            href={x.cle === "tous" ? "/admin/veille" : `/admin/veille?f=${x.cle}`}
            aria-current={f === x.cle ? "page" : undefined}
            className={`rounded-full border px-3.5 py-1.5 text-sm ${f === x.cle ? "border-[#1E1A17] bg-[#1E1A17] text-[#FBF6EE]" : "border-[#E4D8C6] hover:border-[#1E1A17]"}`}
          >
            {x.label}
          </Link>
        ))}
      </nav>

      {/* Mobile : une carte par lead ; à partir de sm, le tableau. */}
      <ul className="mt-4 space-y-3 sm:hidden">
        {leads.length === 0 && <li className={`${card} text-center text-sm text-[#6F655C]`}>Aucun lead dans cette vue.</li>}
        {leads.map((l) => {
          const j = jourJ(l.j0);
          return (
            <li key={l.slug}>
              <Link href={`/admin/veille/${l.slug}`} className={`${card} block`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{l.marque}</p>
                    <p className="text-xs text-[#6F655C]">
                      {l.domaine}
                      {j !== null ? ` · J${j}` : ""} · {STATUT_LABEL[l.statut] ?? l.statut}
                    </p>
                  </div>
                  {l.classe && <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CLASSE_STYLE[l.classe]}`}>{l.classe} · {l.score}</span>}
                </div>
                <div className="mt-3"><Parcours etapes={l.etapes} compact /></div>
                <p className="mt-2 text-xs text-[#6F655C]">
                  {l.nbEmails} email{l.nbEmails > 1 ? "s" : ""} · {l.boutique_physique ? BOUTIQUE_LABEL[l.boutique_physique] : "boutique physique à vérifier"}
                  {l.offre ? ` · ${l.offre.code}${l.offre.provisoire ? " (provisoire)" : ""}` : ""}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-[#E4D8C6] bg-white sm:block">
        <table className="w-full text-sm">
          <thead className="bg-[#F3E9DA] text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">Boutique</th>
              <th className="px-4 py-3 font-semibold">Parcours</th>
              <th className="px-4 py-3 font-semibold">Emails</th>
              <th className="px-4 py-3 font-semibold">Statut</th>
              <th className="px-4 py-3 font-semibold">Score</th>
              <th className="px-4 py-3 font-semibold">Offre</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[#6F655C]">Aucun lead dans cette vue.</td>
              </tr>
            )}
            {leads.map((l) => {
              const j = jourJ(l.j0);
              return (
                <tr key={l.slug} className="border-t border-[#E4D8C6] align-top hover:bg-[#FBF6EE]">
                  <td className="px-4 py-3">
                    <Link href={`/admin/veille/${l.slug}`} className="font-medium hover:underline">{l.marque}</Link>
                    <p className="text-xs text-[#6F655C]">
                      {l.domaine}
                      {l.plateforme ? ` · ${l.plateforme}` : ""}
                    </p>
                    <p className="mt-1 text-xs">
                      {l.boutique_physique ? BOUTIQUE_LABEL[l.boutique_physique] : <span className="text-[#6F655C]">Boutique physique : à vérifier</span>}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Parcours etapes={l.etapes} compact />
                    {j !== null && <p className="mt-1 text-xs text-[#6F655C]">J{j}{j < 7 ? ` · analyse à J7` : ""}</p>}
                  </td>
                  <td className="px-4 py-3">{l.nbEmails}</td>
                  <td className="px-4 py-3">{STATUT_LABEL[l.statut] ?? l.statut}</td>
                  <td className="px-4 py-3">
                    {l.classe ? (
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CLASSE_STYLE[l.classe]}`}>
                        {l.classe} · {l.score}
                      </span>
                    ) : (
                      <span className="text-xs text-[#6F655C]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {l.offre ? `${l.offre.code} · ${l.offre.titre}${l.offre.provisoire ? " (provisoire)" : ""}` : <span className="text-[#6F655C]">après J7</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
