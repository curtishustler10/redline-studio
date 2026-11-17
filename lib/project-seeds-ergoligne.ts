// Ergoligne (Carline Courtas), a Fenua Studio client: her prevention booklet to
// review page by page, with comments pinned on the pages. Shown in Fenua Studio's
// brand. Pages: livret-ecran.pdf (ergoligne repo, docs/livret-travail-sur-ecran-a5,
// commit 5e539bf) rendered at 220 dpi, WebP q82 (p) and 120 px thumbnails (t),
// same files as fenua-studio-site/public/espace-client/ergoligne/livret-ecran-2026-11.
// Upload: npx jiti scripts/projects.ts images ergoligne <dir of livret-ecran-*.webp>.
import type { DocPage } from "./project-doc";
import type { ProjectSeed } from "./project-seeds";

const PAGE_TITLES = [
  "couverture",
  "mode d’emploi",
  "test du poste",
  "scène 1, le bon réglage",
  "les repères de Hina",
  "scène 2",
  "scène 2, correction",
  "scène 3",
  "scène 3, correction",
  "scène 4",
  "scène 4, correction",
  "scène 5",
  "scène 5, correction",
  "les réflexes de Hina",
  "sources",
  "dos, diagnostic virtuel",
];

const pad = (n: number) => String(n).padStart(2, "0");

export const LIVRET_PAGES: DocPage[] = PAGE_TITLES.map((title, i) => ({
  n: i + 1,
  title,
  image: `livret-ecran-p${pad(i + 1)}.webp`,
  thumb: `livret-ecran-t${pad(i + 1)}.webp`,
}));

const LIVRET_TITLE = "Le jeu des erreurs avec Hina : travail sur écran";

export const ERGOLIGNE: ProjectSeed = {
  slug: "ergoligne",
  clientName: "Ergoligne",
  contactName: "Carline Courtas",
  brand: "fenua",
  title: "Livret de prévention",
  codePrefix: "ERG",
  timeZone: "Pacific/Tahiti",
  documents: [
    {
      slug: "livret-ecran-2026-11",
      title: LIVRET_TITLE,
      content: {
        version: 1,
        sections: [
          { id: "livret", kind: "pages", title: LIVRET_TITLE, summary: "Livret de prévention, 16 pages.", width: 911, height: 1284, pages: LIVRET_PAGES },
        ],
      },
    },
  ],
};
