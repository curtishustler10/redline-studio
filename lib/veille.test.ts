import { afterEach, describe, expect, it, vi } from "vitest";

import { CHEMIN_FICHIER, cleVeilleValide, syncSchema } from "./veille";

// vi.mock est remonté avant les imports : « server-only » ne casse pas l'import hors de Next.
vi.mock("server-only", () => ({}));

const env = { ...process.env };
afterEach(() => {
  process.env = { ...env };
});

const base = {
  slug: "kalixia",
  marque: "Kalixia",
  domaine: "kalixia-jewelry.com",
  statut: "collecte",
  etapes: { checkout: { at: "14/10 10:27", fait: true, detail: "Abandon avant paiement" } },
  fiche: { pixelMeta: "1005860297140842", outilsEmail: ["Klaviyo"] },
  workflows: [{ sequence: "bienvenue", verdict: "en observation", emails: 0 }],
  journal: [{ at: "14/10 10:26", etape: "Relevé", fait: "Accueil chargé", resultat: "", captures: ["kalixia/captures/1410-1026-accueil.jpg"] }],
  emails: [],
};

describe("syncSchema", () => {
  it("accepte un lead en collecte et complète les valeurs par défaut", () => {
    const p = syncSchema.parse(base);
    expect(p.fiche.reseaux).toEqual({});
    expect(p.fiche.site.notes).toEqual([]);
    expect(p.offre).toBeNull();
    expect(p.score).toBeNull();
  });

  it("refuse un slug ou un chemin de capture hors format", () => {
    expect(syncSchema.safeParse({ ...base, slug: "../x" }).success).toBe(false);
    const journal = [{ ...base.journal[0], captures: ["../../etc/passwd.jpg"] }];
    expect(syncSchema.safeParse({ ...base, journal }).success).toBe(false);
  });

  it("refuse une offre hors catalogue et une classe inconnue", () => {
    expect(syncSchema.safeParse({ ...base, offre: { code: "Z9", titre: "x", pourquoi: "x", provisoire: true } }).success).toBe(false);
    expect(syncSchema.safeParse({ ...base, classe: "D" }).success).toBe(false);
  });
});

describe("CHEMIN_FICHIER", () => {
  it("n'accepte que <slug>/(captures|emails)/<fichier>.(jpg|png)", () => {
    expect(CHEMIN_FICHIER.test("bohomeliving/emails/20261014-0949-1a13962f3c33f89a-mobile.jpg")).toBe(true);
    expect(CHEMIN_FICHIER.test("bohomeliving/journal.md")).toBe(false);
    expect(CHEMIN_FICHIER.test("bohomeliving/captures/../x.jpg")).toBe(false);
  });
});

describe("cleVeilleValide", () => {
  it("refuse tout sans clé configurée, accepte la bonne clé seulement", () => {
    delete process.env.VEILLE_SYNC_KEY;
    expect(cleVeilleValide("n'importe")).toBe(false);
    process.env.VEILLE_SYNC_KEY = "cle-de-test";
    expect(cleVeilleValide("cle-de-test")).toBe(true);
    expect(cleVeilleValide("cle-de-tesT")).toBe(false);
    expect(cleVeilleValide(null)).toBe(false);
  });
});
