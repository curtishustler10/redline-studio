// Starting content of client project documents, written by scripts/projects.ts.
// Text is verbatim from the source document; do not reword here, edit it in the
// client's space (every save is kept) or update the source and reseed.
import type { DocContent, DocLine, DocPreview } from "./project-doc";

const lines = (prefix: string, texts: (string | Omit<DocLine, "id">)[]): DocLine[] =>
  texts.map((t, i) => ({ id: `${prefix}-${i + 1}`, ...(typeof t === "string" ? { text: t } : t) }));

const row = (text: string): Omit<DocLine, "id"> => ({ text, row: true });

/** Image file = `<id>.webp` in the private "portal" bucket, under the project slug. */
const preview = (id: string, title: string, width: number, height: number): DocPreview => ({ id, title, image: `${id}.webp`, width, height, note: "" });

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
 * Recap source: ahukini-swimwear/docs/rdv/2026-10-28-compte-rendu.md (size table from the .html next to it).
 * Email previews: ahukini-swimwear/docs/emails/{shopify-liquid,flows}/verif/*-600.jpg and
 * flow-bienvenue/export/0[1-5]-*.jpg, as 600 px WebP (upload with scripts/projects.ts images).
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
    {
      slug: "apercus-emails",
      title: "Aperçus des e-mails",
      content: {
        version: 1,
        sections: [
          {
            id: "commandes",
            kind: "previews",
            title: "Notifications de commande",
            previews: [
              preview("commande-confirmee", "Commande confirmée", 600, 2334),
              preview("precommande-france", "Précommande (France, €)", 600, 2444),
              preview("expediee", "Commande expédiée", 600, 2038),
              preview("livree", "Commande livrée", 600, 1855),
              preview("paiement-abandonne", "Paiement abandonné", 600, 1727),
              preview("annulee", "Commande annulée", 600, 1141),
              preview("paiement-refuse", "Paiement refusé", 600, 1116),
              preview("remboursement", "Remboursement", 600, 1191),
              preview("bienvenue-compte", "Bienvenue sur le compte client", 600, 2436),
            ],
          },
          {
            id: "bienvenue",
            kind: "previews",
            title: "Flow de bienvenue",
            previews: [
              preview("bienvenue-e1", "E1 · J0 · Ia ora na", 600, 2334),
              preview("bienvenue-e2", "E2 · J+2 · Le concept", 600, 2383),
              preview("bienvenue-e3", "E3 · J+4 · Les avis", 600, 2148),
              preview("bienvenue-e4", "E4 · J+7 · Les 3 styles", 600, 2524),
              preview("bienvenue-e5", "E5 · J+9 · Dernier jour", 600, 2339),
            ],
          },
          {
            id: "relances",
            kind: "previews",
            title: "Relances et après-achat",
            previews: [
              preview("panier-taille", "Panier abandonné 2 · Ta taille", 600, 1689),
              preview("panier-dernier-rappel", "Panier abandonné 3 · Dernier rappel", 600, 1564),
              preview("apres-achat-porter", "Après-achat · Comment le porter", 600, 1632),
              preview("apres-achat-completer", "Après-achat · Compléter l'ensemble", 600, 2542),
              preview("retour-stock", "Retour en stock", 600, 1373),
              preview("reconquete", "Reconquête", 600, 1436),
            ],
          },
          {
            id: "campagnes",
            kind: "previews",
            title: "Campagnes de fin d'année",
            previews: [
              preview("black-friday", "Black Friday", 600, 2652),
              preview("cyber-monday", "Cyber Monday", 600, 1303),
              preview("liquidation", "Liquidation de fin d'année", 600, 1456),
              preview("precommande-liste", "Précommande 1 · Liste d'attente", 600, 1264),
              preview("precommande-lancement", "Précommande 2 · Lancement", 600, 1288),
              preview("precommande-dernier-appel", "Précommande 3 · Dernier appel", 600, 1111),
            ],
          },
        ],
      },
    },
  ],
};

export const SEEDS: Record<string, ProjectSeed> = { ahukini: AHUKINI };
