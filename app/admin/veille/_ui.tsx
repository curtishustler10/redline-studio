// Éléments partagés par /admin/veille : libellés, pastilles, rendu markdown des briefs.
import type { ReactNode } from "react";
import type { Etapes, VeilleLead, Workflow } from "@/lib/veille";

export const card = "rounded-2xl border border-[#E4D8C6] bg-white p-5";

export const STATUT_LABEL: Record<string, string> = {
  "j0-en-cours": "J0 en cours",
  "j0-incomplet": "J0 incomplet",
  collecte: "Collecte",
  classé: "Classé",
  bloqué: "Bloqué (anti-bot)",
  désinscrit: "Désinscrit",
  écarté: "Écarté",
};

export const CLASSE_STYLE: Record<"A" | "B" | "C", string> = {
  A: "bg-[#C8321F] text-white",
  B: "bg-[#F5B83D] text-[#1E1A17]",
  C: "bg-[#F3E9DA] text-[#6F655C]",
};

export const VERDICT_STYLE: Record<Workflow["verdict"], string> = {
  "en observation": "bg-[#F3E9DA] text-[#6F655C]",
  absente: "bg-[#C8321F] text-white",
  minimale: "bg-[#F5B83D] text-[#1E1A17]",
  correcte: "bg-[#1F8A84]/15 text-[#1F8A84]",
  solide: "bg-[#1F8A84] text-white",
};

export const SEQUENCE_LABEL: Record<string, string> = {
  bienvenue: "Bienvenue",
  checkout: "Checkout abandonné",
  panier: "Panier abandonné",
  newsletter: "Newsletter / campagnes",
  "post-achat": "Post-achat",
  transactionnel: "Transactionnel",
  autre: "Autre",
};

export const BOUTIQUE_LABEL: Record<NonNullable<VeilleLead["boutique_physique"]>, string> = {
  oui: "Magasin physique",
  showroom: "Showroom",
  non: "Pas de magasin",
};

const ETAPES: { cle: keyof Etapes; label: string }[] = [
  { cle: "inscription", label: "Inscrit" },
  { cle: "panier", label: "Panier" },
  { cle: "checkout", label: "Checkout abandonné" },
  { cle: "desinscription", label: "Désinscrit" },
];

/** Pastilles du parcours J0 → J21 : pleine si fait, pointillée sinon. */
export function Parcours({ etapes, compact = false }: { etapes: Etapes; compact?: boolean }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {ETAPES.filter((e) => !(compact && e.cle === "desinscription" && !etapes[e.cle])).map((e) => {
        const fait = etapes[e.cle]?.fait;
        return (
          <li
            key={e.cle}
            title={etapes[e.cle]?.detail ?? undefined}
            className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs ${fait ? "bg-[#1E1A17] text-[#FBF6EE]" : "border border-dashed border-[#E4D8C6] text-[#6F655C]"}`}
          >
            {fait ? "✓ " : ""}
            {e.label}
            {!compact && etapes[e.cle]?.at ? ` · ${etapes[e.cle]?.at}` : ""}
          </li>
        );
      })}
    </ul>
  );
}

/** Jours écoulés depuis J0 (date calendaire, heure de Paris). */
export function jourJ(j0: string | null): number | null {
  if (!j0) return null;
  const aujourdHui = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
  return Math.round((Date.parse(aujourdHui) - Date.parse(j0)) / 86_400_000);
}

export function dateFr(iso: string, avecHeure = true): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "numeric",
    month: "short",
    ...(avecHeure && { hour: "2-digit", minute: "2-digit" }),
  }).format(new Date(iso));
}

// ─── Markdown minimal ────────────────────────────────────────────────────────
// Les briefs viennent de l'agent de veille : titres, listes, gras, italique, liens. Rendu en
// éléments React (jamais de HTML injecté) ; tout le reste s'affiche tel quel.

function enLigne(texte: string): ReactNode[] {
  const morceaux: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|_(.+?)_|`(.+?)`|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let dernier = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texte))) {
    if (m.index > dernier) morceaux.push(texte.slice(dernier, m.index));
    const k = morceaux.length;
    if (m[1]) morceaux.push(<strong key={k}>{m[1]}</strong>);
    else if (m[2]) morceaux.push(<em key={k}>{m[2]}</em>);
    else if (m[3]) morceaux.push(<code key={k} className="rounded bg-[#F3E9DA] px-1 text-[0.9em]">{m[3]}</code>);
    else morceaux.push(<a key={k} href={m[5]} target="_blank" rel="noreferrer" className="underline decoration-[#C8321F] underline-offset-2">{m[4]}</a>);
    dernier = re.lastIndex;
  }
  if (dernier < texte.length) morceaux.push(texte.slice(dernier));
  return morceaux;
}

export function Markdown({ source }: { source: string }) {
  const blocs: ReactNode[] = [];
  let liste: string[] = [];
  let paragraphe: string[] = [];
  const vider = () => {
    if (liste.length) {
      blocs.push(<ul key={blocs.length} className="ml-5 list-disc space-y-1">{liste.map((l, i) => <li key={i}>{enLigne(l)}</li>)}</ul>);
      liste = [];
    }
    if (paragraphe.length) {
      blocs.push(<p key={blocs.length}>{enLigne(paragraphe.join(" "))}</p>);
      paragraphe = [];
    }
  };
  for (const brut of source.split("\n")) {
    const l = brut.trimEnd();
    const titre = l.match(/^(#{1,4})\s+(.*)$/);
    const puce = l.match(/^\s*(?:[-*]|\d+\.)\s+(.*)$/);
    const citation = l.match(/^>\s?(.*)$/);
    if (titre) {
      vider();
      const n = titre[1].length;
      blocs.push(
        <p key={blocs.length} className={n <= 2 ? "pt-2 text-base font-semibold" : "pt-1 font-semibold"}>
          {enLigne(titre[2])}
        </p>,
      );
    } else if (puce) {
      if (paragraphe.length) vider();
      liste.push(puce[1]);
    } else if (citation) {
      vider();
      blocs.push(<blockquote key={blocs.length} className="border-l-2 border-[#C8321F] pl-3 text-[#3A332D]">{enLigne(citation[1])}</blockquote>);
    } else if (!l.trim()) {
      vider();
    } else {
      if (liste.length) vider();
      paragraphe.push(l.trim());
    }
  }
  vider();
  return <div className="space-y-2 text-sm leading-relaxed">{blocs}</div>;
}
