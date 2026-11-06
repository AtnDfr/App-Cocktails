/**
 * Export du tableur data/cocktails.xlsx (source de vérité) vers src/data/donnees.json,
 * lu par l'application. Les colonnes « (relecture) » sont ignorées.
 * Validations bloquantes : identifiants uniques, références valides, unités, catégories.
 */
import { writeFileSync } from "node:fs";
import ExcelJS from "exceljs";
import { CATEGORIES, type Cocktail, type Donnees, type Groupe, type Ingredient } from "../src/data/types.ts";

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile("data/cocktails.xlsx");
const erreurs: string[] = [];

function rows(name: string): Record<string, string>[] {
  const ws = wb.getWorksheet(name);
  if (!ws) throw new Error(`Onglet « ${name} » introuvable`);
  const headers = (ws.getRow(1).values as unknown[]).map((v) => String(v ?? "").trim());
  const out: Record<string, string>[] = [];
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const o: Record<string, string> = {};
    headers.forEach((h, i) => { if (h) { const v = row.getCell(i).value as any; o[h] = String(v?.richText ? v.richText.map((t: any) => t.text).join("") : v?.text ?? v ?? "").trim(); } });
    if (Object.values(o).some(Boolean)) out.push({ ...o, _ligne: String(n) });
  });
  return out;
}
const ouiNon = (v: string, ctx: string) => {
  if (v === "oui") return true;
  if (v === "non" || v === "") return false;
  erreurs.push(`${ctx} : « ${v} » au lieu de oui/non`);
  return false;
};

// Ingrédients et groupes : un groupe = la ligne dont l'identifiant est égal au générique.
const ingRows = rows("Ingrédients");
const groupes: Groupe[] = [];
const ingredients: Ingredient[] = [];
const ids = new Set<string>();
for (const r of ingRows) {
  const ctx = `Ingrédients ligne ${r._ligne}`;
  const id = r["identifiant"], groupe = r["générique / groupe de substitution"];
  if (!id) { erreurs.push(`${ctx} : identifiant vide`); continue; }
  if (ids.has(id)) erreurs.push(`${ctx} : identifiant en double « ${id} »`);
  ids.add(id);
  if (!r["nom affiché"]) erreurs.push(`${ctx} : nom vide`);
  ingredients.push({ id, nom: r["nom affiché"], groupe });
  if (id === groupe) {
    const cat = r["catégorie"] as Groupe["categorie"];
    if (!CATEGORIES.includes(cat)) erreurs.push(`${ctx} : catégorie inconnue « ${cat} »`);
    groupes.push({ id, nom: r["nom affiché"], categorie: cat, basique: ouiNon(r["basique"], ctx) });
  }
}
const groupeIds = new Set(groupes.map((g) => g.id));
for (const i of ingredients) if (!groupeIds.has(i.groupe)) erreurs.push(`Ingrédient « ${i.id} » : groupe « ${i.groupe} » sans ligne générique (identifiant = groupe)`);

// Cocktails
const cocktails: Cocktail[] = [];
const cocktailIds = new Map<string, Cocktail>();
for (const r of rows("Cocktails")) {
  const ctx = `Cocktails ligne ${r._ligne}`;
  const id = r["identifiant"];
  if (!id || !r["nom"]) { erreurs.push(`${ctx} : identifiant ou nom vide`); continue; }
  if (cocktailIds.has(id)) erreurs.push(`${ctx} : identifiant en double « ${id} »`);
  const source = r["source"] as Cocktail["source"];
  if (!["IBA", "TheCocktailDB", "manuel"].includes(source)) erreurs.push(`${ctx} : source inconnue « ${source} »`);
  const etapes = r["étapes"].split("\n").map((e) => e.replace(/^\d+\.\s*/, "").trim()).filter(Boolean);
  if (!etapes.length) erreurs.push(`${ctx} : aucune étape`);
  const c: Cocktail = { id, nom: r["nom"], technique: r["technique"], verre: r["verre"], garniture: r["garniture"], etapes, source, lignes: [] };
  cocktails.push(c);
  cocktailIds.set(id, c);
}

// Lignes de recette
for (const r of rows("Lignes de recette")) {
  const ctx = `Lignes de recette ligne ${r._ligne}`;
  const c = cocktailIds.get(r["cocktail"]);
  if (!c) { erreurs.push(`${ctx} : cocktail inconnu « ${r["cocktail"]} »`); continue; }
  if (!ids.has(r["ingrédient"])) { erreurs.push(`${ctx} : ingrédient inconnu « ${r["ingrédient"]} »`); continue; }
  const unite = r["unité"], q = r["quantité"];
  let ml: number | null = null, texte: string | null = null;
  if (unite === "ml") {
    ml = Number(q.replace(",", "."));
    if (!Number.isFinite(ml) || ml <= 0) erreurs.push(`${ctx} : quantité en ml invalide « ${q} »`);
  } else if (unite === "texte") {
    texte = q;
    if (!texte) erreurs.push(`${ctx} : dose texte vide`);
  } else erreurs.push(`${ctx} : unité « ${unite} » (attendu ml ou texte)`);
  if (/V[ÉE]RIFIER/i.test(r["statut (relecture)"] ?? "")) erreurs.push(`${ctx} : ligne encore marquée à vérifier (${c.nom})`);
  c.lignes.push({ ingredient: r["ingrédient"], ml, texte, optionnel: ouiNon(r["optionnel"], ctx) });
}
const groupeOf = new Map(ingredients.map((i) => [i.id, i.groupe]));
const basique = new Map(groupes.map((g) => [g.id, g.basique]));
for (const c of cocktails) {
  if (!c.lignes.length) erreurs.push(`Cocktail « ${c.nom} » : aucune ligne de recette`);
  else if (c.lignes.every((l) => basique.get(groupeOf.get(l.ingredient)!))) erreurs.push(`Cocktail « ${c.nom} » : uniquement des ingrédients basiques`);
}

if (erreurs.length) {
  console.error(`${erreurs.length} erreur(s), export annulé :\n- ` + erreurs.join("\n- "));
  process.exit(1);
}
const donnees: Donnees = { groupes, ingredients, cocktails };
writeFileSync("src/data/donnees.json", JSON.stringify(donnees, null, 1) + "\n");
console.log(`Écrit : src/data/donnees.json — ${cocktails.length} cocktails, ${ingredients.length} ingrédients, ${groupes.length} groupes.`);
