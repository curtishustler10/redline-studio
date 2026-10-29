// Starting content of client project documents, written by scripts/projects.ts.
// Text is verbatim from the source document; do not reword here, edit it in the
// client's space (every save is kept) or update the source and reseed.
import type { DocContent, DocLine } from "./project-doc";

const lines = (prefix: string, texts: (string | Omit<DocLine, "id">)[]): DocLine[] =>
  texts.map((t, i) => ({ id: `${prefix}-${i + 1}`, ...(typeof t === "string" ? { text: t } : t) }));

const row = (text: string): Omit<DocLine, "id"> => ({ text, row: true });

export type ProjectSeed = {
  slug: string;
  clientName: string;
  title: string;
  codePrefix: string;
  timeZone: string;
  documents: { slug: string; title: string; content: DocContent }[];
};

/**
 * Ahukini Swimwear, meeting of 2026-10-28.
 * Source: ahukini-swimwear/docs/rdv/2026-10-28-compte-rendu.md (size table from the .html next to it).
 */
export const AHUKINI: ProjectSeed = {
  slug: "ahukini",
  clientName: "Ahukini Swimwear",
  title: "Ahukini Swimwear × Redline Studio",
  codePrefix: "AHK",
  timeZone: "Pacific/Tahiti",
  documents: [
    {
      slug: "compte-rendu-2026-10-28",
      title: "Compte rendu du rendez-vous du 28 octobre 2026",
      content: {
        version: 1,
        sections: [
          {
            id: "production",
            kind: "list",
            title: "Production et coûts",
            lines: lines("production", [
              "45 jours de production pour un réassort ou une nouvelle collection.",
              "Coût fournisseur livré entrepôt : 5 000 F par pièce (haut, bas ou jupe).",
              "Ensemble de 3 pièces : 15 000 F de coût, soit 2 500 F de marge à 17 500 F, avant publicité, frais de paiement et emballage.",
            ]),
          },
          {
            id: "collection",
            kind: "list",
            title: "Nouvelle collection (fin 2026)",
            lines: lines("collection", [
              "Coloris bleu, rouge, bordeaux ; 50 ensembles par coloris (150 au total).",
              "Tailles prévues par coloris : 15 S, 15 M, 10 L, 5 XL (ajout à confirmer), 5 XXL = 50.",
              row("Taille | Par coloris | Total"),
              row("S | 15 | 45"),
              row("M | 15 | 45"),
              row("L | 10 | 30"),
              row("XL · ajout à confirmer | 5 | 15"),
              row("XXL | 5 | 15"),
              row("Total | 50 | 150"),
              "Prix de l'ensemble : 17 500 XPF (repositionnement prix).",
              "Améliorations produit : jupes plus légères, système d'ouverture, meilleur maintien de la poitrine, robe maillot de bain.",
              "Précommande, vente en ligne vers le 14 décembre.",
            ]),
          },
          {
            id: "anciennes",
            kind: "list",
            title: "Anciennes collections",
            lines: lines("anciennes", [
              "Réassort en janvier / février.",
              "D'ici là, liquidation de fin d'année à −15 / −20 % et Black Friday / Cyber Monday à −50 %, sur les anciennes collections uniquement (dates à reconfirmer).",
              "Publicité.",
            ]),
          },
          {
            id: "objectifs",
            kind: "list",
            title: "Objectifs fin 2026 / 2027",
            lines: lines("objectifs", [
              "Développer le marché France.",
              "Repositionner le prix (17 500 F l'ensemble sur la nouvelle collection).",
            ]),
          },
          {
            id: "site",
            kind: "list",
            title: "Site",
            lines: lines("site", [
              "Revendeurs à ajouter : Pearl Resort Tahiti, Les Alizés (centre Vaima, Tahiti).",
              "Revendeur à retirer : Baz'Art Fenua (Raiatea).",
              "Mettre les revendeurs partenaires en avant sur l'accueil, juste sous le héros.",
              "Flows d'e-mails marketing + branding des notifications (audit en cours, 2026-10-28).",
            ]),
          },
          {
            id: "collaboration",
            kind: "list",
            title: "Collaboration Ahukini × Redline Studio",
            lines: lines("collaboration", [
              "Commission sur les ventes en ligne uniquement.",
              "Barème évoqué, ventes par semaine : 5 ventes → 10 %, 20 ventes → 15 %. À confirmer avec Laureline.",
              {
                text: "Variante proposée, à paliers de ventes mensuelles (plus réaliste : ~3 commandes par mois aujourd'hui, 33 sur 12 mois) : 1 à 9 ventes → 8 %, 10 à 24 → 10 %, 25 et plus → 15 %. Chiffres de travail, à valider par Redline Studio.",
                badge: "proposition",
              },
            ]),
          },
          {
            id: "points",
            kind: "questions",
            title: "Points à confirmer",
            questions: [
              "Marge à 5 000 F par pièce : le même coût vaut-il pour les anciennes collections ? Si oui, un ensemble à 11 800 F est déjà sous son coût.",
              "Liquidation et Black Friday (anciennes collections) : dates à reconfirmer.",
              "Budget publicité de la liquidation : montant et durée.",
              "Budget publicité de la précommande : montant et durée.",
              "Répartition des tailles de la nouvelle collection, à confirmer. Ce qu'on a pour l'instant, par coloris : 15 S · 15 M · 10 L · 5 XL · 5 XXL = 50. Demande des ventes en ligne : S 26 · M 30 · L 12 · XL 22 · 2XL 11 %.",
              "Barème de commission : hebdomadaire ou mensuel ; montant HT ou TTC.",
            ].map((text, i) => ({ id: `point-${i + 1}`, text, answer: "" })),
          },
        ],
      },
    },
  ],
};

export const SEEDS: Record<string, ProjectSeed> = { ahukini: AHUKINI };
