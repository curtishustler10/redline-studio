import Link from "next/link";
import { notFound } from "next/navigation";
import { getVeilleLead, urlsSignees, type VeilleEmail } from "@/lib/veille";
import { requireAdmin } from "../../actions";
import { BOUTIQUE_LABEL, CLASSE_STYLE, Markdown, Parcours, SEQUENCE_LABEL, STATUT_LABEL, VERDICT_STYLE, card, dateFr, jourJ } from "../_ui";

export const dynamic = "force-dynamic";

const RESEAU_LABEL: Record<string, string> = { instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", pinterest: "Pinterest", youtube: "YouTube" };

function Ligne({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-3 border-t border-[#F3E9DA] py-2 text-sm first:border-t-0">
      <dt className="text-[#6F655C]">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

const nonObserve = <span className="text-[#6F655C]">non observé</span>;

export default async function VeilleLeadPage({ params }: { params: { slug: string } }) {
  await requireAdmin();
  const res = await getVeilleLead(params.slug);
  if (!res) notFound();
  const { lead, emails } = res;
  const urls = await urlsSignees([
    ...lead.journal.flatMap((j) => j.captures),
    ...emails.flatMap((e) => [e.mobile_path, e.desktop_path].filter((x): x is string => !!x)),
  ]);
  const { fiche } = lead;
  const j = jourJ(lead.j0);
  const reseaux = Object.entries(fiche.reseaux);
  const parSequence = new Map<string, VeilleEmail[]>();
  for (const e of emails) parSequence.set(e.sequence ?? "autre", [...(parSequence.get(e.sequence ?? "autre") ?? []), e]);
  const capturesParcours = lead.journal.filter((x) => x.captures.length && /relevé|newsletter|panier|checkout|désinscription/i.test(x.etape));

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <p className="text-sm text-[#6F655C]">
        <Link href="/admin/veille" className="underline decoration-[#E03C2D] underline-offset-4 hover:text-[#1E1A17]">← Veille</Link>
      </p>
      <header className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{lead.marque}</h1>
          <p className="mt-1 text-sm text-[#6F655C]">
            <a href={`https://${lead.domaine}`} target="_blank" rel="noreferrer" className="underline underline-offset-4">{lead.domaine}</a>
            {lead.plateforme ? ` · ${lead.plateforme}` : ""} · {STATUT_LABEL[lead.statut] ?? lead.statut}
            {j !== null ? ` · J${j}` : ""}
          </p>
          <div className="mt-3"><Parcours etapes={lead.etapes} /></div>
        </div>
        {lead.classe ? (
          <div className={`rounded-2xl px-5 py-3 text-center ${CLASSE_STYLE[lead.classe]}`}>
            <p className="text-3xl font-semibold">{lead.classe}</p>
            <p className="text-sm">{lead.score}/100</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#E4D8C6] px-5 py-3 text-center text-sm text-[#6F655C]">
            Pas encore classé
            <br />
            {j !== null && j < 7 ? `analyse à J7 (dans ${7 - j} j)` : "analyse à faire"}
          </div>
        )}
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          {/* 1. Brief du lead */}
          <section className={card}>
            <h2 className="text-lg font-semibold">Brief du lead</h2>
            <dl className="mt-3">
              <Ligne label="Site">
                {fiche.site.url ? <a href={fiche.site.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">{fiche.site.url}</a> : lead.domaine}
                {fiche.site.notes.length > 0 && <ul className="mt-1 ml-4 list-disc text-[#3A332D]">{fiche.site.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
              </Ligne>
              <Ligne label="Boutique physique">
                {lead.boutique_physique ? BOUTIQUE_LABEL[lead.boutique_physique] : <span className="text-[#6F655C]">à vérifier</span>}
                {fiche.boutiqueAdresse && <span className="text-[#6F655C]"> · {fiche.boutiqueAdresse}</span>}
              </Ligne>
              <Ligne label="Pixel Meta">{fiche.pixelMeta ?? nonObserve}</Ligne>
              <Ligne label="Google Tag Manager">{fiche.gtm ?? nonObserve}</Ligne>
              <Ligne label="Outils email">{fiche.outilsEmail.length ? fiche.outilsEmail.join(", ") : nonObserve}</Ligne>
              <Ligne label="Publicités">{fiche.publicites ?? nonObserve}</Ligne>
              <Ligne label="Réseaux sociaux">
                {reseaux.length === 0 ? (
                  <span className="text-[#6F655C]">pas encore relevés</span>
                ) : (
                  <ul className="space-y-1">
                    {reseaux.map(([nom, r]) => (
                      <li key={nom}>
                        <span className="font-medium">{RESEAU_LABEL[nom] ?? nom}</span>
                        {r.abonnes ? ` · ${r.abonnes} abonnés` : ""}
                        {r.dernierPost ? ` · dernier post ${r.dernierPost}` : ""}
                        {r.url && <> · <a href={r.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">voir</a></>}
                        {r.note && <p className="text-[#6F655C]">{r.note}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </Ligne>
              <Ligne label="Source">{lead.source ?? "—"}</Ligne>
            </dl>
            {fiche.constats.length > 0 && (
              <>
                <h3 className="mt-4 font-semibold">Constats</h3>
                <ul className="mt-2 ml-5 list-disc space-y-1 text-sm">{fiche.constats.map((c, i) => <li key={i}>{c}</li>)}</ul>
              </>
            )}
          </section>

          {/* 2. Workflows identifiés */}
          <section className={card}>
            <h2 className="text-lg font-semibold">Workflows identifiés</h2>
            {lead.workflows.length === 0 ? (
              <p className="mt-2 text-sm text-[#6F655C]">Rien d&apos;identifié pour l&apos;instant.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {lead.workflows.map((w) => (
                  <li key={w.sequence} className="rounded-xl border border-[#F3E9DA] p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{SEQUENCE_LABEL[w.sequence] ?? w.sequence}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs ${VERDICT_STYLE[w.verdict]}`}>{w.verdict}</span>
                      <span className="text-xs text-[#6F655C]">
                        {w.emails} email{w.emails > 1 ? "s" : ""}
                        {w.premierDelai ? ` · 1er ${w.premierDelai}` : ""}
                      </span>
                    </div>
                    {w.notes && <p className="mt-1 text-sm text-[#3A332D]">{w.notes}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 3. Emails et campagnes reçus */}
          <section className={card}>
            <h2 className="text-lg font-semibold">Emails et campagnes reçus ({emails.length})</h2>
            {emails.length === 0 && <p className="mt-2 text-sm text-[#6F655C]">Aucun email reçu pour l&apos;instant.</p>}
            {[...parSequence.entries()].map(([seq, liste]) => (
              <div key={seq} className="mt-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[#6F655C]">{SEQUENCE_LABEL[seq] ?? seq}</h3>
                <ul className="mt-2 space-y-4">
                  {liste.map((e) => {
                    const mobile = e.mobile_path ? urls.get(e.mobile_path) : undefined;
                    const desktop = e.desktop_path ? urls.get(e.desktop_path) : undefined;
                    return (
                      <li key={e.id} className="grid gap-3 sm:grid-cols-[7rem_1fr]">
                        {mobile ? (
                          <a href={mobile} target="_blank" rel="noreferrer" className="block h-40 overflow-hidden rounded-lg border border-[#E4D8C6]">
                            {/* eslint-disable-next-line @next/next/no-img-element -- URL signée temporaire du bucket privé */}
                            <img src={mobile} alt={`Rendu mobile : ${e.objet}`} className="w-full" />
                          </a>
                        ) : (
                          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-[#E4D8C6] text-xs text-[#6F655C]">texte seul</div>
                        )}
                        <div className="text-sm">
                          <p className="font-medium">{e.objet}</p>
                          {e.pre_entete && <p className="text-[#6F655C]">{e.pre_entete}</p>}
                          <p className="mt-1 text-xs text-[#6F655C]">
                            {dateFr(e.recu_at)} · {e.delai ?? "délai non calculé"} · {e.outil ?? "outil non identifié"}
                            {e.expediteur ? ` · ${e.expediteur}` : ""}
                          </p>
                          <p className="mt-1 text-xs">
                            {mobile && <a href={mobile} target="_blank" rel="noreferrer" className="underline underline-offset-2">mobile</a>}
                            {desktop && <> · <a href={desktop} target="_blank" rel="noreferrer" className="underline underline-offset-2">desktop</a></>}
                          </p>
                          {e.texte && (
                            <details className="mt-1">
                              <summary className="cursor-pointer text-xs text-[#6F655C]">texte de l&apos;email</summary>
                              <p className="mt-1 whitespace-pre-wrap text-xs text-[#3A332D]">{e.texte}</p>
                            </details>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </section>
        </div>

        <div className="space-y-6">
          {/* 4. Offre adaptée */}
          <section className="rounded-2xl bg-[#1E1A17] p-5 text-[#FBF6EE]">
            <h2 className="text-lg font-semibold">Offre adaptée</h2>
            {lead.offre ? (
              <>
                <p className="mt-2 text-xl font-semibold">
                  {lead.offre.code} · {lead.offre.titre}
                </p>
                {lead.offre.provisoire && <p className="mt-1 text-xs uppercase tracking-wide text-[#F5B83D]">provisoire : confirmée à l&apos;analyse J7</p>}
                <p className="mt-3 text-sm leading-relaxed">{lead.offre.pourquoi}</p>
                {lead.offre.option && <p className="mt-2 text-sm text-[#E4D8C6]">Option : {lead.offre.option}</p>}
              </>
            ) : (
              <p className="mt-2 text-sm text-[#E4D8C6]">Choisie à l&apos;analyse J7, à partir des emails réellement reçus.</p>
            )}
          </section>

          {/* 5. Brief de contact */}
          <section className={card}>
            <h2 className="text-lg font-semibold">Brief de contact</h2>
            {lead.brief_md ? <div className="mt-3"><Markdown source={lead.brief_md} /></div> : <p className="mt-2 text-sm text-[#6F655C]">Écrit à l&apos;analyse J7.</p>}
          </section>

          {/* 6. Parcours en captures */}
          {capturesParcours.length > 0 && (
            <section className={card}>
              <h2 className="text-lg font-semibold">Parcours en captures</h2>
              <ul className="mt-3 grid grid-cols-3 gap-2">
                {capturesParcours.flatMap((x) =>
                  x.captures.map((c) => {
                    const u = urls.get(c);
                    return u ? (
                      <li key={c}>
                        <a href={u} target="_blank" rel="noreferrer" className="block h-32 overflow-hidden rounded-lg border border-[#E4D8C6]" title={`${x.at} · ${x.etape}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element -- URL signée temporaire du bucket privé */}
                          <img src={u} alt={`${x.etape} (${x.at})`} className="w-full" />
                        </a>
                        <p className="mt-1 truncate text-xs text-[#6F655C]">{x.at} · {x.etape}</p>
                      </li>
                    ) : null;
                  }),
                )}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* 7. Journal */}
      <section className={`${card} mt-6`}>
        <h2 className="text-lg font-semibold">Journal (heure de Paris)</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[#6F655C]">
              <tr>
                <th className="py-2 pr-3 font-medium">Date</th>
                <th className="py-2 pr-3 font-medium">Étape</th>
                <th className="py-2 pr-3 font-medium">Fait</th>
                <th className="py-2 font-medium">Résultat</th>
              </tr>
            </thead>
            <tbody>
              {lead.journal.map((x, i) => (
                <tr key={i} className="border-t border-[#F3E9DA] align-top">
                  <td className="whitespace-nowrap py-2 pr-3">{x.at}</td>
                  <td className="py-2 pr-3">{x.etape}</td>
                  <td className="py-2 pr-3">{x.fait}</td>
                  <td className="py-2">{x.resultat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="mt-4 text-xs text-[#6F655C]">Synchronisé le {dateFr(lead.synced_at)} (Paris) depuis la machine de veille.</p>
    </main>
  );
}
