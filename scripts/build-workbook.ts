/**
 * Étape 1f : produit data/cocktails.xlsx (onglets Cocktails, Ingrédients, Lignes de recette),
 * source de vérité éditable relue par l'utilisateur, à partir des imports bruts, des corrections,
 * de l'harmonisation et des traductions. Les colonnes marquées « (relecture) » ne sont pas exportées.
 * Refuse d'écraser data/cocktails.xlsx (qui peut contenir des corrections manuelles) sans --force.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import ExcelJS from "exceljs";
import { allIngredients, categorieOf, loadHarmonisation, loadRecipes } from "./lib/recipes.ts";

const OUT = "data/cocktails.xlsx";
if (existsSync(OUT) && !process.argv.includes("--force")) {
  console.error(`${OUT} existe déjà et fait foi (relecture manuelle). Relancer avec --force pour le régénérer.`);
  process.exit(1);
}

const readJson = (p: string) => JSON.parse(readFileSync(p, "utf8"));
const h = loadHarmonisation();
const { recipes, problemes } = loadRecipes();
const trad: Record<string, any> = Object.assign({}, ...readdirSync("data/traductions").filter((f) => f.endsWith(".json") && f !== "doses-texte.json").map((f) => readJson(`data/traductions/${f}`)));
const dosesTexte: Record<string, string> = readJson("data/traductions/doses-texte.json");
const remarques: Record<string, string> = readJson("data/remarques-relecture.json");
const ingredients = allIngredients(h);
const byId = new Map(ingredients.map((i) => [i.id, i]));
const manques: string[] = [];

const wb = new ExcelJS.Workbook();
const style = (ws: ExcelJS.Worksheet) => {
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.eachRow((r) => (r.alignment = { vertical: "top", wrapText: true }));
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } };
};

// --- Cocktails --------------------------------------------------------------
const wc = wb.addWorksheet("Cocktails");
wc.columns = [
  { header: "identifiant", key: "id", width: 24 },
  { header: "nom", key: "nom", width: 26 },
  { header: "technique", key: "technique", width: 11 },
  { header: "verre", key: "verre", width: 20 },
  { header: "garniture", key: "garniture", width: 30 },
  { header: "étapes", key: "etapes", width: 70 },
  { header: "source", key: "source", width: 13 },
  { header: "lien source (relecture)", key: "url", width: 30 },
  { header: "texte d'origine (relecture)", key: "origine", width: 60 },
  { header: "à vérifier (relecture)", key: "remarque", width: 40 },
];
for (const r of recipes) {
  const t = trad[r.nom];
  if (!t) manques.push(`traduction manquante : ${r.nom}`);
  const doublons = r.lignes.map((l) => l.ingredient).filter((x, i, a) => x && a.indexOf(x) !== i);
  const notes = [remarques[r.nom], doublons.length ? `Ingrédient présent deux fois dans la source (jus + tranche ?) : ${[...new Set(doublons)].join(", ")}.` : ""].filter(Boolean);
  wc.addRow({
    id: r.id, nom: r.nom, technique: t?.technique ?? "", verre: t?.verre ?? "", garniture: t?.garniture ?? "",
    etapes: (t?.etapes ?? []).map((e: string, i: number) => `${i + 1}. ${e}`).join("\n"),
    source: r.source, url: r.url,
    origine: [r.verreEn && `Verre : ${r.verreEn}`, ...r.methodeEn, r.garnitureEn && `Garniture : ${r.garnitureEn}`].filter(Boolean).join("\n"),
    remarque: notes.join("\n"),
  });
}

// --- Ingrédients ------------------------------------------------------------
const usage = new Map<string, Set<string>>();
const libellesOf = new Map<string, Set<string>>();
for (const r of recipes) for (const l of r.lignes) if (l.ingredient) {
  usage.set(l.ingredient, (usage.get(l.ingredient) ?? new Set()).add(r.nom));
  libellesOf.set(l.ingredient, (libellesOf.get(l.ingredient) ?? new Set()).add(l.libelle));
}
const usageGroupe = new Map<string, Set<string>>();
for (const [id, s] of usage) { const g = byId.get(id)!.groupe; usageGroupe.set(g, new Set([...(usageGroupe.get(g) ?? []), ...s])); }
const wi = wb.addWorksheet("Ingrédients");
wi.columns = [
  { header: "identifiant", key: "id", width: 26 },
  { header: "nom affiché", key: "nom", width: 40 },
  { header: "générique / groupe de substitution", key: "groupe", width: 22 },
  { header: "catégorie", key: "categorie", width: 14 },
  { header: "basique", key: "basique", width: 8 },
  { header: "nb cocktails (ingrédient) (relecture)", key: "nb", width: 10 },
  { header: "nb cocktails (groupe) (relecture)", key: "nbg", width: 10 },
  { header: "libellés d'origine (relecture)", key: "libelles", width: 40 },
];
const catOrder = ["alcool de base", "liqueur", "soft", "frais", "placard"];
const ingUsed = ingredients.filter((i) => usage.has(i.id) || h.groupes[i.id]);
ingUsed.sort((a, b) => catOrder.indexOf(categorieOf(h, a.id)) - catOrder.indexOf(categorieOf(h, b.id)) || a.groupe.localeCompare(b.groupe) || (a.id === a.groupe ? -1 : b.id === b.groupe ? 1 : a.nom.localeCompare(b.nom)));
for (const i of ingUsed) {
  const g = h.groupes[i.groupe];
  wi.addRow({ id: i.id, nom: i.nom, groupe: i.groupe, categorie: g.categorie, basique: g.basique ? "oui" : "non", nb: usage.get(i.id)?.size ?? 0, nbg: usageGroupe.get(i.groupe)?.size ?? 0, libelles: [...(libellesOf.get(i.id) ?? [])].join(" | ") });
}

// --- Lignes de recette ------------------------------------------------------
const wl = wb.addWorksheet("Lignes de recette");
wl.columns = [
  { header: "cocktail", key: "cocktail", width: 24 },
  { header: "ingrédient", key: "ingredient", width: 24 },
  { header: "quantité", key: "quantite", width: 22 },
  { header: "unité", key: "unite", width: 7 },
  { header: "optionnel", key: "optionnel", width: 9 },
  { header: "nom du cocktail (relecture)", key: "nomc", width: 24 },
  { header: "nom de l'ingrédient (relecture)", key: "nomi", width: 34 },
  { header: "ligne d'origine (relecture)", key: "brut", width: 40 },
  { header: "statut (relecture)", key: "statut", width: 30 },
];
for (const r of recipes) for (const l of r.lignes) {
  const optionnel = /optional|facultati/i.test(l.brut);
  let quantite: string | number = "", unite = "texte", statut = "ok";
  if (l.dose.kind === "ml") { quantite = l.dose.ml; unite = "ml"; }
  else if (l.dose.kind === "texte") {
    const fr = dosesTexte[l.dose.raw];
    if (fr === undefined) { manques.push(`dose texte sans traduction : « ${l.dose.raw} » (${r.nom})`); quantite = l.dose.raw; statut = "à traduire"; }
    else quantite = fr;
  } else { quantite = l.dose.raw; statut = `À VÉRIFIER : ${l.dose.raison}`; }
  wl.addRow({ cocktail: r.id, ingredient: l.ingredient ?? "", quantite, unite, optionnel: optionnel ? "oui" : "non", nomc: r.nom, nomi: l.ingredient ? byId.get(l.ingredient)!.nom : "", brut: l.brut, statut });
}

for (const ws of [wc, wi, wl]) style(ws);
for (const ws of [wc, wl]) ws.eachRow((row, n) => { if (n > 1 && /V[ÉE]RIFIER|à traduire/.test(String(row.getCell(ws === wl ? 9 : 10).value ?? ""))) row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF2CC" } }; });
wc.eachRow((row, n) => { if (n > 1 && row.getCell(10).value) row.getCell(10).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF2CC" } }; });

await wb.xlsx.writeFile(OUT);
console.log(`Écrit : ${OUT} — ${recipes.length} cocktails, ${ingUsed.length} ingrédients, ${recipes.reduce((n, r) => n + r.lignes.length, 0)} lignes.`);
const all = [...problemes, ...manques];
if (all.length) console.log(`${all.length} point(s) à vérifier :\n- ` + all.join("\n- "));
