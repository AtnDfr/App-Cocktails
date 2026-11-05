/**
 * Chargement des 239 recettes validées, à partir des imports bruts figés :
 * application des corrections (data/corrections.json), conversion des doses,
 * rattachement de chaque ligne à un ingrédient harmonisé (data/harmonisation.json).
 * Aucune donnée n'est inventée : une ligne non rattachée est signalée, jamais devinée.
 */
import { readFileSync } from "node:fs";
import { parseDose, splitIbaLine, type Dose } from "./dose.ts";
import { simplify } from "./normalize.ts";

const readJson = (p: string) => JSON.parse(readFileSync(p, "utf8"));

export type Groupe = { nom: string; categorie: string; basique?: boolean };
export type Ingredient = { id: string; nom: string; groupe: string };
export type Harmonisation = {
  groupes: Record<string, Groupe>;
  ingredients: Record<string, { nom: string; groupe: string }>;
  libelles: Record<string, string | { garniture: string }>;
  par_cocktail: Record<string, string>;
};

export type RecipeLine = {
  brut: string; // ligne d'origine (dose + ingrédient), pour la relecture
  libelle: string; // ingrédient d'origine
  ingredient: string | null; // identifiant harmonisé (null si non rattaché)
  dose: Dose;
};
export type Recipe = {
  id: string;
  nom: string;
  source: "IBA" | "TheCocktailDB";
  url: string;
  lignes: RecipeLine[];
  garnituresDeLignes: string[]; // lignes TheCocktailDB qui sont des garnitures (CLAUDE.md §2.8)
  methodeEn: string[];
  garnitureEn: string;
  verreEn: string;
  instructionsFrSource: string; // traduction fournie par TheCocktailDB (brouillon, à relire)
};

export function slug(name: string): string {
  return simplify(name).replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function loadHarmonisation(): Harmonisation {
  return readJson("data/harmonisation.json");
}

/** Tous les ingrédients affichables : les génériques (un par groupe) et les marques / variantes. */
export function allIngredients(h: Harmonisation): Ingredient[] {
  return [
    ...Object.entries(h.groupes).map(([id, g]) => ({ id, nom: g.nom, groupe: id })),
    ...Object.entries(h.ingredients).map(([id, i]) => ({ id, nom: i.nom, groupe: i.groupe })),
  ];
}

export function loadRecipes(): { recipes: Recipe[]; problemes: string[] } {
  const h = loadHarmonisation();
  const corr = readJson("data/corrections.json");
  const sel = readJson("data/selection-validee.json");
  const iba = readJson("data/raw/iba.json").cocktails;
  const tcdb = readJson("data/raw/thecocktaildb.json").drinks;
  const known = new Set(allIngredients(h).map((i) => i.id));
  const problemes: string[] = [];

  const resolve = (cocktail: string, libelle: string): string | { garniture: string } | null => {
    const s = simplify(libelle);
    const hit = h.par_cocktail[`${cocktail}|${s}`] ?? h.libelles[s];
    if (!hit) problemes.push(`${cocktail} : libellé non rattaché « ${libelle} » (clé « ${s} »)`);
    else if (typeof hit === "string" && !known.has(hit)) problemes.push(`${cocktail} : ingrédient inconnu « ${hit} »`);
    return hit ?? null;
  };

  const recipes: Recipe[] = [];

  for (const name of sel.iba as string[]) {
    const c = iba.find((x: any) => x.name === name);
    const fixes = corr.iba_lignes[name] ?? {};
    const dosesTexte = corr.doses_texte[name] ?? {};
    const raws = (c.ingredients as string[]).flatMap((l) => fixes[l]?.remplacer_par ?? [l]);
    const lignes: RecipeLine[] = [];
    for (const brut of raws) {
      const { measure, ingredient } = splitIbaLine(brut);
      const hit = resolve(name, ingredient);
      const forced = Object.entries(dosesTexte).find(([k]) => k !== "_motif" && measure === k);
      const dose: Dose = forced ? { kind: "texte", raw: forced[1] as string } : parseDose(measure);
      if (hit === "glace") continue;
      lignes.push({ brut, libelle: ingredient, ingredient: typeof hit === "string" ? hit : null, dose });
    }
    recipes.push({
      id: slug(name), nom: name, source: "IBA", url: c.url, lignes, garnituresDeLignes: [],
      methodeEn: c.method, garnitureEn: c.garnish.join(" "), verreEn: "", instructionsFrSource: "",
    });
  }

  for (const { idDrink } of sel.thecocktaildb as { idDrink: string }[]) {
    const d = tcdb.find((x: any) => x.idDrink === idDrink);
    const name = d.strDrink.trim();
    const lignes: RecipeLine[] = [];
    const garn: string[] = [];
    for (let i = 1; i <= 15; i++) {
      const libelle = (d[`strIngredient${i}`] ?? "").trim();
      if (!libelle) continue;
      const measure = (d[`strMeasure${i}`] ?? "").trim();
      const hit = resolve(name, libelle);
      if (hit === "glace") continue;
      if (hit && typeof hit === "object") { garn.push(hit.garniture); continue; }
      let dose = parseDose(measure);
      if (dose.kind === "a_verifier" && dose.raison === "nombre sans unité" && hit === "menthe") dose = { kind: "texte", raw: measure };
      if (!measure) dose = { kind: "texte", raw: "" };
      lignes.push({ brut: `${measure} ${libelle}`.trim(), libelle, ingredient: hit, dose });
    }
    recipes.push({
      id: slug(name), nom: name, source: "TheCocktailDB", url: `https://www.thecocktaildb.com/drink/${idDrink}`,
      lignes, garnituresDeLignes: garn, methodeEn: [d.strInstructions.trim()], garnitureEn: "",
      verreEn: d.strGlass ?? "", instructionsFrSource: (d.strInstructionsFR ?? "").trim(),
    });
  }

  const ids = new Map<string, number>();
  for (const r of recipes) ids.set(r.id, (ids.get(r.id) ?? 0) + 1);
  for (const [id, n] of ids) if (n > 1) problemes.push(`identifiant en double : ${id}`);
  for (const r of recipes) for (const l of r.lignes) if (l.dose.kind === "a_verifier") problemes.push(`${r.nom} : dose à vérifier « ${l.brut} » (${l.dose.raison})`);
  return { recipes, problemes };
}
