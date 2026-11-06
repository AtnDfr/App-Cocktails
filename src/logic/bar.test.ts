import { describe, expect, it } from "vitest";
import type { Cocktail, Donnees } from "../data/types.ts";
import { alcoolsDeBase, barIdeal, classer, gainSiAjoute, indexer, manquants, plusUtilises, quoiAcheter } from "./bar.ts";
import vraiesDonnees from "../data/donnees.json";

const ligne = (ingredient: string, optionnel = false) => ({ ingredient, ml: 30, texte: null, optionnel });
const cocktail = (id: string, ...ingredients: (string | [string, true])[]): Cocktail => ({
  id, nom: id, technique: "", verre: "", garniture: "", etapes: ["."], source: "manuel",
  lignes: ingredients.map((i) => (Array.isArray(i) ? ligne(i[0], true) : ligne(i))),
});

const d: Donnees = {
  groupes: [
    { id: "gin", nom: "Gin", categorie: "alcool de base", basique: false },
    { id: "triple_sec", nom: "Triple sec", categorie: "liqueur", basique: false },
    { id: "campari", nom: "Campari", categorie: "liqueur", basique: false },
    { id: "vermouth_rouge", nom: "Vermouth rouge", categorie: "liqueur", basique: false },
    { id: "citron", nom: "Citron", categorie: "frais", basique: false },
    { id: "tonic", nom: "Tonic", categorie: "soft", basique: false },
    { id: "sucre", nom: "Sucre", categorie: "placard", basique: true },
    { id: "whiskey_americain", nom: "Whiskey américain", categorie: "alcool de base", basique: false },
  ],
  ingredients: [
    { id: "gin", nom: "Gin", groupe: "gin" },
    { id: "triple_sec", nom: "Triple sec", groupe: "triple_sec" },
    { id: "cointreau", nom: "Cointreau (triple sec)", groupe: "triple_sec" },
    { id: "campari", nom: "Campari", groupe: "campari" },
    { id: "vermouth_rouge", nom: "Vermouth rouge", groupe: "vermouth_rouge" },
    { id: "citron", nom: "Citron", groupe: "citron" },
    { id: "tonic", nom: "Tonic", groupe: "tonic" },
    { id: "sucre", nom: "Sucre", groupe: "sucre" },
    { id: "bourbon", nom: "Bourbon (whiskey américain)", groupe: "whiskey_americain" },
    { id: "rye", nom: "Rye (whiskey américain)", groupe: "whiskey_americain" },
  ],
  cocktails: [
    cocktail("negroni", "gin", "campari", "vermouth_rouge"),
    cocktail("white_lady", "gin", "cointreau", "citron", "sucre"),
    cocktail("gin_tonic", "gin", "tonic", ["citron", true]),
    cocktail("boulevardier", "bourbon", "campari", "vermouth_rouge"),
    cocktail("manhattan", "rye", "vermouth_rouge"),
  ],
};
const idx = indexer(d);
const byId = (id: string) => d.cocktails.find((c) => c.id === id)!;
const ids = (cs: Cocktail[]) => cs.map((c) => c.id).sort();

describe("manquants", () => {
  it("raisonne sur le groupe : du triple sec suffit pour du Cointreau", () => {
    expect(manquants(idx, byId("white_lady"), new Set(["gin", "triple_sec", "citron"]))).toEqual([]);
  });
  it("les basiques ne manquent jamais", () => {
    expect(manquants(idx, byId("white_lady"), new Set(["gin", "triple_sec"]))).toEqual(["citron"]);
  });
  it("une ligne optionnelle ne bloque pas", () => {
    expect(manquants(idx, byId("gin_tonic"), new Set(["gin", "tonic"]))).toEqual([]);
  });
  it("un soft non coché bloque", () => {
    expect(manquants(idx, byId("gin_tonic"), new Set(["gin"]))).toEqual(["tonic"]);
  });
  it("n'importe quel whiskey américain fait un Manhattan au rye", () => {
    expect(manquants(idx, byId("manhattan"), new Set(["whiskey_americain", "vermouth_rouge"]))).toEqual([]);
  });
});

describe("classer", () => {
  it("trois listes : faisables, à 1 près, autres", () => {
    const r = classer(idx, d.cocktails, new Set(["gin", "vermouth_rouge"]));
    expect(ids(r.faisables)).toEqual([]);
    expect(ids(r.aUnPres)).toEqual(["gin_tonic", "manhattan", "negroni"]);
    expect(ids(r.autres)).toEqual(["boulevardier", "white_lady"]);
  });
  it("bar vide : rien de faisable", () => {
    expect(classer(idx, d.cocktails, new Set()).faisables).toEqual([]);
  });
});

describe("quoiAcheter", () => {
  it("classe les groupes par nombre de cocktails débloqués, avec le détail", () => {
    const r = quoiAcheter(idx, d.cocktails, new Set(["gin", "vermouth_rouge", "whiskey_americain"]));
    expect(r[0]).toMatchObject({ groupe: "campari" });
    expect(ids(r[0].debloques)).toEqual(["boulevardier", "negroni"]);
    expect(r.map((a) => a.groupe)).toEqual(["campari", "tonic"]);
  });
  it("ne propose pas ce qui ne débloque rien seul", () => {
    expect(quoiAcheter(idx, d.cocktails, new Set()).map((a) => a.groupe)).toEqual([]);
  });
});

describe("barIdeal", () => {
  it("glouton, softs hors du compte N et listés en annexe", () => {
    const r = barIdeal(idx, d.cocktails, 3);
    // gin seul rend le Gin Tonic faisable (tonic supposé acheté) ; puis vermouth et Campari → Negroni.
    expect(r.etapes.map((e) => e.groupe)).toEqual(["gin", "vermouth_rouge", "campari"]);
    expect(r.etapes.map((e) => e.total)).toEqual([1, 1, 2]);
    expect(ids(r.faisables)).toEqual(["gin_tonic", "negroni"]);
    expect(r.softs).toEqual(["tonic"]);
  });
  it("ne propose jamais un soft comme bouteille", () => {
    const r = barIdeal(idx, d.cocktails, 10);
    expect(r.etapes.some((e) => idx.groupes.get(e.groupe)!.categorie === "soft")).toBe(false);
    expect(r.faisables.length).toBe(5);
  });
  it("peut partir du bar existant", () => {
    const r = barIdeal(idx, d.cocktails, 1, new Set(["gin", "vermouth_rouge"]));
    expect(r.etapes[0].groupe).toBe("campari");
  });
});

describe("plusUtilises", () => {
  it("classe les groupes non basiques par nombre de cocktails", () => {
    // gin : 3, vermouth rouge : 3, campari : 2 ; le sucre (basique) n'apparaît jamais
    expect(plusUtilises(idx, 3)).toEqual(["gin", "vermouth_rouge", "campari"]);
    expect(plusUtilises(idx, 50)).not.toContain("sucre");
  });
});

describe("gainSiAjoute", () => {
  it("compte les cocktails débloqués par un ajout", () => {
    expect(gainSiAjoute(idx, d.cocktails, new Set(["gin", "vermouth_rouge", "whiskey_americain"]), "campari")).toBe(2);
    expect(gainSiAjoute(idx, d.cocktails, new Set(["gin"]), "campari")).toBe(0);
    expect(gainSiAjoute(idx, d.cocktails, new Set(["campari"]), "campari")).toBe(0);
  });
});

describe("alcoolsDeBase", () => {
  it("liste les alcools de base d'un cocktail", () => {
    expect(alcoolsDeBase(idx, byId("boulevardier"))).toEqual(["whiskey_americain"]);
  });
});

describe("vraies données", () => {
  const vd = vraiesDonnees as Donnees;
  const vi = indexer(vd);
  it("chaque cocktail requiert au moins un ingrédient non basique", () => {
    for (const c of vd.cocktails) expect(vi.requis.get(c.id)!.length, c.nom).toBeGreaterThan(0);
  });
  it("un bar idéal à 15 bouteilles fait plusieurs dizaines de cocktails", () => {
    expect(barIdeal(vi, vd.cocktails, 15).faisables.length).toBeGreaterThan(50);
  });
});
