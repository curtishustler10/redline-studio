/**
 * Long-form case studies, one page each at /realisations/<slug>.
 *
 * Every fact comes from the verified Fenua Studio case studies
 * (fenua-studio-site/lib/cases.ts and lib/case-stories.ts, captures of
 * 2026-10-14 at 1440 px or 390 px ×2), rewritten in the Redline voice. Honesty
 * rule: no figure appears here unless it was measured. French only: the pages
 * are written for the French market. The short card copy stays in lib/i18n.ts
 * under `cases`, keyed to these pages by `slug`.
 */

export type Shot = { src: string; alt: string; width: number; height: number };

export type Feature = {
  title: string;
  /** What the screen does, in two or three short sentences. */
  what: string;
  /** Why it was built that way. One line. */
  why: string;
  /** Zero to two screens. */
  shots: Shot[];
};

export type CaseStudy = {
  slug: string;
  name: string;
  sector: string;
  /** The result, as a title. Also the page's <title>. */
  headline: string;
  summary: string;
  problem: string;
  solution: string;
  beforeAfter?: {
    title: string;
    intro: string;
    before: { label: string; caption: string; shot: Shot };
    after: { label: string; caption: string; shot: Shot };
    /** What the comparison does not show, said out loud. */
    note?: string;
  };
  features: Feature[];
  outcomes: { value: string; label: string }[];
  method: { label: string; value: string }[];
  liveUrl: string;
};

const D = { width: 1440, height: 900 };
const M = { width: 780, height: 1688 };

export const caseStudies: CaseStudy[] = [
  {
    slug: "ahukini",
    name: "Ahukini Swimwear",
    sector: "Maillots de bain transformables · Shopify sur-mesure",
    headline: "Une boutique construite autour d'un geste",
    summary:
      "Boutique Shopify sur-mesure pour une marque de maillots transformables : la jupe se clipse sur le maillot, et le voilà robe.",
    problem:
      "Le concept se comprend en le voyant, pas en le lisant. L'ancienne boutique ne le montrait pas, affichait trois grilles de livraison contradictoires, et laissait la cliente acheter un ensemble de trois pièces qui n'ont pas forcément la même taille sans rien vérifier avec elle.",
    solution:
      "Un thème Shopify conçu autour de la transformation, de l'accueil au panier. Chaque écran répond à une hésitation précise : qu'est-ce que c'est, est-ce que ça existe dans ma taille, est-ce que je me trompe de taille, combien coûte la livraison.",
    features: [
      {
        title: "Le concept avant le texte",
        what: "« Choisis ce que tu dévoiles. » La même tenue à la plage et en ville, et un interrupteur Maillot / Robe dès l'accueil.",
        why: "Une jupe qui se clipse sur un maillot se comprend en le voyant, pas en le lisant.",
        shots: [
          { src: "/realisations/ahukini/accueil-bureau.webp", alt: "Accueil Ahukini sur ordinateur : la même tenue en maillot et en robe, avec l'interrupteur Maillot / Robe", ...D },
          { src: "/realisations/ahukini/accueil-robe.webp", alt: "Accueil Ahukini sur téléphone, interrupteur sur Robe : la tenue en ville", ...M },
        ],
      },
      {
        title: "Trois styles plutôt qu'un catalogue",
        what: "Les harmonieuses, les audacieuses, les nomades. Les noms des collections viennent ensuite.",
        why: "La cliente choisit d'abord une allure, pas une référence.",
        shots: [
          { src: "/realisations/ahukini/collections-bureau.webp", alt: "Étapes de la transformation puis trois cartes de style : les harmonieuses, les audacieuses, les nomades", ...D },
        ],
      },
      {
        title: "Une boutique qui filtre par taille",
        what: "Les pièces se filtrent par type, par collection et par taille. Une pièce épuisée le dit sur sa carte.",
        why: "Trouver ce qui existe dans sa taille sans ouvrir chaque fiche.",
        shots: [
          { src: "/realisations/ahukini/boutique-bureau.webp", alt: "Section Nos ensembles : filtres par type, collection et taille, et grille de produits", ...D },
        ],
      },
      {
        title: "L'ensemble, pièce par pièce",
        what: "Une taille pour le haut, une pour le bas. Puis le récapitulatif « Tu achètes l'ensemble complet » : haut, bas et jupe, chacun avec sa taille, chacun vendu aussi seul.",
        why: "Trois pièces qui n'ont pas forcément la même taille : le récapitulatif évite l'erreur avant le panier, donc le retour après.",
        shots: [
          { src: "/realisations/ahukini/fiche-bureau.webp", alt: "Fiche d'un ensemble sur ordinateur : taille du bas, coloris, taille du haut", ...D },
          { src: "/realisations/ahukini/ensemble.webp", alt: "Récapitulatif Tu achètes l'ensemble complet : haut, bas et jupe, chacun avec sa taille", ...M },
        ],
      },
      {
        title: "Le guide des tailles et le bouton d'achat à portée",
        what: "Le guide s'ouvre en fenêtre sans quitter la fiche. Sur téléphone, une barre d'achat reste en bas de l'écran.",
        why: "La cliente vérifie sa taille et achète sans perdre sa place dans la page.",
        shots: [
          { src: "/realisations/ahukini/guide.webp", alt: "Guide des tailles ouvert en fenêtre sur la fiche produit, sur téléphone", ...M },
          { src: "/realisations/ahukini/barre-achat.webp", alt: "Vidéo du concept et barre Ajouter au panier collante en bas de l'écran", ...M },
        ],
      },
      {
        title: "Une seule règle de livraison, au bon moment",
        what: "Le tiroir panier affiche ce qui manque pour la livraison offerte. La marque règle le seuil elle-même, dans l'éditeur du thème, sans toucher au code.",
        why: "Trois grilles contradictoires deviennent une seule jauge, affichée quand la cliente décide.",
        shots: [
          { src: "/realisations/ahukini/tiroir-bureau.webp", alt: "Tiroir panier ouvert avec la jauge de livraison offerte", ...D },
        ],
      },
    ],
    outcomes: [
      { value: "La cliente trouve sa pièce en deux gestes", label: "Interrupteur Maillot / Robe dès l'accueil, trois styles, filtre par taille." },
      { value: "Un ensemble acheté sans se tromper de taille", label: "Une taille par pièce, récapitulatif avant le panier, guide des tailles en fenêtre." },
      { value: "Une seule règle de livraison, réglée par la marque", label: "Jauge de livraison offerte dans le tiroir panier, seuil modifiable sans code." },
      { value: "Une marque crédible, preuves à l'appui", label: "Note de 5,0/5 sur 18 avis vérifiés, lue en direct depuis Judge.me." },
    ],
    method: [
      { label: "Méthode", value: "Thème repris section par section sur une base Shopify propre, l'ancien thème jamais modifié pendant le chantier." },
      { label: "Avis et fidélité", value: "Note Judge.me lue en direct ; la bulle de fidélité Smile.io ne couvre jamais un bouton d'achat." },
      { label: "Vérification", value: "Chaque écran relu sur téléphone (390 px) et sur ordinateur (1440 px)." },
    ],
    liveUrl: "https://ahukini-swimwear.com/",
  },
  {
    slug: "mayas-hair",
    name: "Maya's Hair Products",
    sector: "Soins capillaires · e-commerce",
    headline: "ROAS 5,6x dès le premier mois",
    summary:
      "Boutique Shopify et campagnes Meta pour une marque de soins capillaires : un thème sur-mesure, puis une publicité pilotée sur les nouvelles clientes.",
    problem:
      "De bons produits sur un thème générique qui ne racontait rien, et du trafic acheté sans savoir si la publicité rapportait. La palette ne correspondait pas au logo, et rien ne guidait une visiteuse de son problème capillaire vers le bon produit.",
    solution:
      "Un thème Shopify sur-mesure aux couleurs du logo, construit pour qu'une visiteuse parte de son problème et arrive au bon produit. Puis le compte Meta repris et piloté sur le ROAS des nouvelles clientes, le seul chiffre qui dit si l'acquisition paie.",
    beforeAfter: {
      title: "L'accueil, avant et après",
      intro: "Le premier écran d'une boutique doit dire à qui elle s'adresse. Celui-ci ne disait rien.",
      before: {
        label: "Mars 2026",
        caption: "Thème Shopify par défaut : « Welcome to our store », « Browse our latest products! », aucune promesse.",
        shot: { src: "/realisations/mayas-hair/avant-accueil-bureau.webp", alt: "Ancien accueil de Maya's Hair Products : bandeau Welcome to our store et titre Browse our latest products", ...D },
      },
      after: {
        label: "Aujourd'hui",
        caption: "« Your Hair, Finally Understood. » La promesse, deux boutons, puis une barre de réassurance. Couleurs tirées du logo.",
        shot: { src: "/realisations/mayas-hair/accueil-bureau.webp", alt: "Nouvel accueil de Maya's Hair Products : titre Your Hair, Finally Understood et bouton Shop best sellers", ...D },
      },
    },
    features: [
      {
        title: "Acheter par problème capillaire",
        what: "Quatre entrées : repousse des bords, hydratation, cuir chevelu, tous types de cheveux. Chacune mène aux produits qui y répondent.",
        why: "La visiteuse part de son problème, pas d'un menu de produits.",
        shots: [
          { src: "/realisations/mayas-hair/problematiques-bureau.webp", alt: "Section Shop by Concern : quatre problèmes capillaires en onglets et les trois produits qui y répondent", width: 1440, height: 856 },
        ],
      },
      {
        title: "La routine en kit",
        what: "Huile de croissance, huile de romarin et beurre capillaire réunis, avec le prix du kit à côté du prix des trois produits séparés.",
        why: "Le kit répond à « par quoi je commence ? », montre l'économie et fait monter le panier.",
        shots: [
          { src: "/realisations/mayas-hair/routine-bureau.webp", alt: "Section The Growth Ritual kit : les trois produits de la routine, le prix du kit et le prix séparé", width: 1440, height: 626 },
        ],
      },
      {
        title: "Une fiche produit qui garde le bouton d'achat",
        what: "Prix barré avec le pourcentage d'économie, avis, et sur téléphone une barre d'achat qui reste en bas de l'écran et suit le format choisi.",
        why: "Sur téléphone la fiche est longue. Le bouton d'achat ne disparaît jamais.",
        shots: [
          { src: "/realisations/mayas-hair/fiche.webp", alt: "Fiche de l'huile Herbal Hair Growth sur téléphone, barre d'achat collante en bas de l'écran", ...M },
        ],
      },
      {
        title: "Un panier sans rien à déchiffrer",
        what: "Le panier n'affiche que la variante choisie, sans le libellé publicitaire qui s'y glissait. Shop Pay et Google Pay sont visibles tout de suite.",
        why: "Au moment de payer, la cliente relit sa commande, pas un slogan.",
        shots: [
          { src: "/realisations/mayas-hair/panier.webp", alt: "Panier de Maya's Hair Products sur téléphone, avec les boutons Shop Pay et Google Pay", ...M },
        ],
      },
      {
        title: "La publicité pilotée sur les nouvelles clientes",
        what: "Compte Meta repris, campagnes réorganisées par audience, et décisions prises sur le ROAS des nouvelles clientes.",
        why: "Le ROAS global mélange les clientes qui reviennent : il ne dit pas si l'acquisition paie.",
        shots: [],
      },
    ],
    outcomes: [
      { value: "Une publicité qui rapporte : ROAS 5,6x dès le premier mois", label: "Campagnes Meta reprises et pilotées sur les nouvelles clientes." },
      { value: "Des visiteuses guidées vers le bon produit", label: "Achat par problème capillaire et routine en kit, dès la page d'accueil." },
      { value: "Des achats sur téléphone sans friction", label: "Bouton d'achat toujours visible, panier lisible, paiement express." },
      { value: "Une boutique qui ressemble enfin à la marque", label: "Thème sur-mesure aux couleurs du logo, en ligne depuis mai 2026." },
    ],
    method: [
      { label: "Mise en ligne", value: "Chaque changement passe d'abord par un thème de test, puis par la boutique en ligne." },
      { label: "Outils", value: "Shopify, sections sur-mesure, Meta Ads." },
    ],
    liveUrl: "https://mayahairproducts.com/",
  },
  {
    slug: "movae-flow",
    name: "Movaé Flow",
    sector: "Institut de beauté · application sur-mesure",
    headline: "Réservation, caisse et fidélité dans un seul outil",
    summary:
      "Application complète de réservation en ligne, d'encaissement et de fidélité pour un institut de beauté, en production depuis juin 2026.",
    problem:
      "Une cinquantaine de soins répartis en sept catégories, aux durées et aux temps de préparation différents, et aucun outil pour les réserver. Les rendez-vous se prenaient à la main, l'encaissement et les cures se suivaient à part, et rien ne faisait revenir les clientes.",
    solution:
      "Un parcours de réservation en quatre étapes, adossé à un back-office complet : agenda, encaissement, remises, cures suivies séance par séance, caisse avec clôture automatique et export comptable, fidélité dans Apple et Google Wallet. Tout part de la réservation : rien n'est ressaisi.",
    features: [
      {
        title: "Les soins, comme sur une carte",
        what: "L'accueil ouvre sur les soins populaires, puis sur sept catégories. Chaque soin affiche sa durée et son prix. La cliente peut en cumuler plusieurs dans le même rendez-vous.",
        why: "La cliente sait ce qu'elle paiera et combien de temps elle restera avant de choisir une date.",
        shots: [
          { src: "/realisations/movae-flow/accueil.webp", alt: "Accueil de Movaé Flow sur téléphone, avec l'accès au diagnostic de peau", ...M },
        ],
      },
      {
        title: "Un complément proposé au bon moment",
        what: "Une fois le soin choisi, l'outil propose une Parenthèse relaxante de 20 minutes. Elle s'ajoute en un toucher, ou se refuse d'un « Non merci ».",
        why: "La proposition arrive quand la cliente a déjà décidé, et elle ne bloque jamais la suite.",
        shots: [
          { src: "/realisations/movae-flow/complement.webp", alt: "Récapitulatif du soin choisi et proposition d'une Parenthèse relaxante de 20 minutes", ...M },
        ],
      },
      {
        title: "Seuls les créneaux qui tiennent",
        what: "Le calendrier grise les jours de fermeture et ne propose que les heures où le soin tient en entier, pauses et préparation comprises. Deux clientes ne peuvent pas prendre le même créneau.",
        why: "Plus de rendez-vous intenable à rappeler pour le décaler.",
        shots: [
          { src: "/realisations/movae-flow/creneau.webp", alt: "Choix de la date : jours fermés grisés, un seul créneau proposé pour un soin d'1 h 15", ...M },
        ],
      },
      {
        title: "Le diagnostic de peau",
        what: "Sept questions, une par écran. À la fin, un soin recommandé avec sa durée et son prix, et deux compléments conseillés, réservables sans revenir en arrière.",
        why: "Il s'adresse à la cliente qui veut un soin sans savoir lequel demander, et qui sinon repart sans réserver.",
        shots: [
          { src: "/realisations/movae-flow/diagnostic.webp", alt: "Première question du diagnostic de peau : quel est votre type de peau", ...M },
          { src: "/realisations/movae-flow/diagnostic-resultat.webp", alt: "Résultat du diagnostic : soin recommandé, deux compléments conseillés et le bouton Réserver ce soin", ...M },
        ],
      },
      {
        title: "Les cartes cadeaux, payées en ligne",
        what: "On offre un soin précis ou un montant. Le paiement passe par Stripe, et la carte part par email avec son code, juste après le paiement.",
        why: "L'institut vend des cadeaux même quand il est fermé.",
        shots: [
          { src: "/realisations/movae-flow/offrir.webp", alt: "Page Offrir un soin : choix d'un soin ou d'un montant pour une carte cadeau", ...M },
        ],
      },
      {
        title: "L'espace cliente et la fidélité",
        what: "Points de fidélité, rendez-vous à venir, annulation en ligne et reçus imprimables. La carte de fidélité s'ajoute à Apple Wallet et Google Wallet.",
        why: "La cliente gère ses rendez-vous seule, et ses points la font revenir.",
        shots: [
          { src: "/realisations/movae-flow/compte.webp", alt: "Espace cliente de démonstration, données fictives : points de fidélité et rendez-vous à venir", ...M },
        ],
      },
    ],
    outcomes: [
      { value: "Des rendez-vous pris même quand l'institut est fermé", label: "Réservation en ligne 24 h/24, créneaux calculés sur la durée réelle de chaque soin." },
      { value: "Plus de double réservation ni de créneau intenable", label: "Pauses et préparation comptées ; deux clientes ne peuvent pas prendre le même créneau." },
      { value: "Moins de ressaisie pour la caisse et la comptabilité", label: "Encaissement repris de la réservation, clôture automatique et export comptable." },
      { value: "Des clientes qui reviennent, des cadeaux vendus en ligne", label: "Fidélité dans Apple et Google Wallet, cartes cadeaux payées en ligne et envoyées par email." },
    ],
    method: [
      { label: "Propriété", value: "Hébergement, base de données et domaine sont au nom de l'institut." },
      { label: "Fiabilité", value: "Calculs sensibles (points, parts encaissables, remboursements) isolés et couverts par des tests." },
      { label: "Pourquoi le back-office n'est pas montré", value: "Il contient les données réelles des clientes." },
    ],
    liveUrl: "https://movaeflow.com/",
  },
  {
    slug: "mystic-essence",
    name: "Mystic Essence",
    sector: "Soins & bijoux artisanaux · e-commerce",
    headline: "Boutique refondue après un audit de conversion en 10 points",
    summary:
      "Audit de conversion, thème Shopify retravaillé et publicité recadrée pour une marque de soins et de bijoux artisanaux.",
    problem:
      "Des produits qui se vendent par l'histoire et la matière, sur un thème standard. Le parcours d'achat perdait des visiteurs à des endroits précis, et le budget publicitaire partait en trafic froid avant que la boutique soit prête à vendre.",
    solution:
      "D'abord un audit de conversion sur ordinateur et téléphone : dix correctifs classés par impact, du visuel produit au paiement. Puis le thème retravaillé pour la marque. Côté publicité, une recommandation assumée : du contenu et du reciblage, plutôt que de payer du trafic froid tant que la page ne transforme pas.",
    beforeAfter: {
      title: "La fiche produit, avant et après",
      intro: "La même huile, à quatre mois d'écart.",
      before: {
        label: "Avril 2026, pendant l'audit",
        caption: "Faute de frappe dans le bandeau (« HYPOALLERGEINC »), mention « My store » au-dessus du titre, frais de livraison « calculés au paiement ».",
        shot: { src: "/realisations/mystic-essence/avant-fiche-bureau.webp", alt: "Ancienne fiche Skin Nourishing Oil : bandeau avec une faute de frappe, fenêtre d'inscription ouverte sur la photo", width: 1425, height: 890 },
      },
      after: {
        label: "Aujourd'hui",
        caption: "Catégorie du produit, trois repères (100 % botanique, sans parabènes, fait main), stock affiché et moyens de paiement sous les boutons.",
        shot: { src: "/realisations/mystic-essence/fiche-bureau.webp", alt: "Nouvelle fiche Skin Nourishing Body Oil : trois repères, stock, parfum et moyens de paiement sous les boutons", ...D },
      },
      note: "La fenêtre d'inscription à la newsletter s'ouvre toujours au chargement. Elle est masquée sur la capture d'après, pour qu'on lise la page.",
    },
    features: [
      {
        title: "Un premier écran qui montre la collection",
        what: "Une grande image, le nom de la collection et un seul bouton.",
        why: "Avant, une photo sombre et un bouton presque invisible ne disaient pas quoi acheter.",
        shots: [
          { src: "/realisations/mystic-essence/accueil-bureau.webp", alt: "Accueil de Mystic Essence sur ordinateur : Vibrant Earth Collection et bouton Shop now", ...D },
          { src: "/realisations/mystic-essence/accueil.webp", alt: "Accueil de Mystic Essence sur téléphone", ...M },
        ],
      },
      {
        title: "Entrer par l'intention",
        what: "Quatre portes d'entrée en images, sous quatre engagements : livraison, intention, ingrédients naturels, origine locale.",
        why: "Ces produits se choisissent par l'intention et la matière, pas dans un catalogue rangé par ordre alphabétique.",
        shots: [
          { src: "/realisations/mystic-essence/intentions-bureau.webp", alt: "Section Shop by intention : quatre collections en images sous quatre engagements de la marque", ...D },
        ],
      },
      {
        title: "La livraison offerte, visible au panier",
        what: "Une jauge indique ce qui manque pour la livraison offerte. Les moyens de paiement sont affichés sous le bouton.",
        why: "Le seuil n'était écrit que dans le bandeau. Il se voit maintenant au moment de décider.",
        shots: [
          { src: "/realisations/mystic-essence/panier-bureau.webp", alt: "Panier de Mystic Essence : jauge vers la livraison offerte et moyens de paiement", ...D },
        ],
      },
      {
        title: "L'histoire de la marque en images",
        what: "Une mosaïque de photos et de vidéos sous le récit de la fondatrice.",
        why: "La matière et le geste convainquent mieux qu'un long texte.",
        shots: [
          { src: "/realisations/mystic-essence/notre-monde-bureau.webp", alt: "Page Our story de Mystic Essence : mosaïque de photos de produits et de bijoux portés", ...D },
        ],
      },
      {
        title: "Un budget publicitaire recadré",
        what: "Avec un petit budget mensuel, nous avons déconseillé l'acquisition de nouveaux visiteurs. À la place : du reciblage, et l'effort mis sur le contenu.",
        why: "À ce budget, Meta n'obtient jamais assez de commandes pour apprendre à qui montrer la publicité.",
        shots: [],
      },
    ],
    outcomes: [
      { value: "Une boutique qui inspire confiance dès la fiche produit", label: "Repères produit, stock et moyens de paiement sous le bouton ; fautes du bandeau corrigées." },
      { value: "Un panier qui pousse jusqu'à la livraison offerte", label: "Jauge vers le seuil et moyens de paiement visibles au moment de payer." },
      { value: "Un budget publicitaire qui ne part pas en pure perte", label: "Audit en 10 points d'abord, puis reciblage et contenu plutôt qu'acquisition froide." },
    ],
    method: [
      { label: "Point de départ", value: "Un audit de conversion sur ordinateur et téléphone, dix correctifs classés par impact." },
      { label: "Mise en ligne", value: "Thème en ligne depuis le 30 juillet 2026, chaque envoi relu sur la boutique." },
    ],
    liveUrl: "https://mysticessence.com.au/",
  },
];

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((c) => c.slug === slug);
}
