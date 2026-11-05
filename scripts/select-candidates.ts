/**
 * Étape 1b : prépare la sélection TheCocktailDB à soumettre à l'utilisateur.
 *  - parse et convertit les doses (IBA + TheCocktailDB) ;
 *  - écarte doublons IBA, sans alcool, doses manquantes / à vérifier, quasi-variantes ;
 *  - classe les candidats par réutilisation des ingrédients du socle IBA.
 * Sorties : data/work/iba-doses.csv, data/work/rapport-selection.md
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import ExcelJS from "exceljs";
import { parseDose, splitIbaLine, type Dose } from "./lib/dose.ts";
import { BASIQUES, GARNITURES, cocktailKey, provisionalKey } from "./lib/normalize.ts";

type Line = { rawIngredient: string; rawMeasure: string; key: string; dose: Dose };
type Drink = { source: "IBA" | "TheCocktailDB"; id: string; name: string; lines: Line[] };

const iba = JSON.parse(readFileSync("data/raw/iba.json", "utf8"));
const tcdb = JSON.parse(readFileSync("data/raw/thecocktaildb.json", "utf8"));
mkdirSync("data/work", { recursive: true });

const counts = (d: Drink) => [...new Set(d.lines.map((l) => l.key))].filter((k) => !BASIQUES.has(k) && !GARNITURES.has(k));

// --- IBA --------------------------------------------------------------------
const ibaDrinks: Drink[] = iba.cocktails.map((c: any) => ({
  source: "IBA",
  id: c.url,
  name: c.name,
  lines: c.ingredients.map((raw: string) => {
    const { measure, ingredient } = splitIbaLine(raw);
    return { rawIngredient: ingredient, rawMeasure: measure, key: provisionalKey(ingredient), dose: parseDose(measure) };
  }),
}));
const ibaKeys = new Set(ibaDrinks.map((d) => cocktailKey(d.name)));
const socle = new Set(ibaDrinks.flatMap(counts));

// --- TheCocktailDB ----------------------------------------------------------
/** Noms TheCocktailDB qui désignent un cocktail IBA sous une autre graphie. */
const ALIAS_IBA: Record<string, string> = {
  "Ramos Gin Fizz": "Ramos Fizz",
  "Martinez 2": "Martinez",
  "Lemon Drop": "Lemon Drop Martini",
  "Long Island Tea": "Long Island Iced Tea",
  "Cuba Libra": "Cuba Libre",
};
/** Softs qui servent à « compléter » un verre : une dose absente est acceptable. */
const ALLONGEMENTS = new Set(["cola", "ginger_ale", "ginger_beer", "tonic", "limonade", "eau_gazeuse", "orange", "cranberry"]);
/** Noms proches d'un cocktail IBA : gardés, mais à arbitrer par l'utilisateur. */
const nomProche = (name: string) => {
  const k = cocktailKey(name);
  return ibaDrinks.find((d) => { const i = cocktailKey(d.name); return k !== i && k.length > 4 && (i.includes(k) || k.includes(i)); })?.name;
};

type Verdict = { drink: Drink; raw: any; exclu?: string; nouveaux: string[]; ingr: string[]; note: string; jumeau?: string };
const verdicts: Verdict[] = [];
for (const raw of tcdb.drinks) {
  const lines: Line[] = [];
  for (let i = 1; i <= 15; i++) {
    const ing = (raw[`strIngredient${i}`] ?? "").trim();
    if (!ing) continue;
    const measure = (raw[`strMeasure${i}`] ?? "").trim();
    const key = provisionalKey(ing);
    if (key === "glace") continue; // la glace n'est pas une ligne de recette (CLAUDE.md §2.4)
    let dose = parseDose(measure);
    // « 6 » feuilles de menthe : comptage, pas une dose liquide sans unité.
    if (dose.kind === "a_verifier" && dose.raison === "nombre sans unité" && key === "menthe") dose = { kind: "texte", raw: measure };
    lines.push({ rawIngredient: ing, rawMeasure: measure, key, dose });
  }
  const drink: Drink = { source: "TheCocktailDB", id: raw.idDrink, name: raw.strDrink.trim(), lines };
  const ingr = counts(drink);
  const nouveaux = ingr.filter((k) => !socle.has(k));
  let exclu: string | undefined;
  if (raw.strAlcoholic !== "Alcoholic") exclu = "sans alcool / alcool optionnel";
  else if (ibaKeys.has(cocktailKey(drink.name)) || ALIAS_IBA[drink.name]) exclu = "déjà dans la liste IBA";
  else {
    const aVerif = lines.filter((l) => l.dose.kind === "a_verifier");
    // Sans dose : acceptable pour un basique, une garniture ou un soft d'allongement (« compléter avec »).
    const manquante = lines.filter((l) => !l.rawMeasure && !BASIQUES.has(l.key) && !GARNITURES.has(l.key) && !ALLONGEMENTS.has(l.key));
    if (aVerif.length) exclu = "dose à vérifier : " + aVerif.map((l) => `${l.rawMeasure} ${l.rawIngredient} (${(l.dose as any).raison})`).join(" ; ");
    else if (manquante.length) exclu = "dose manquante : " + manquante.map((l) => l.rawIngredient).join(", ");
    else if (ingr.length < 2) exclu = "un seul ingrédient non basique";
  }
  const proche = nomProche(drink.name);
  verdicts.push({ drink, raw, exclu, nouveaux, ingr, note: [raw.strIBA ? `ancien IBA (${raw.strIBA})` : "", proche ? `nom proche de ${proche} (IBA)` : ""].filter(Boolean).join(" ; ") });
}

// Quasi-variantes : même ensemble d'ingrédients non basiques qu'un cocktail déjà retenu.
const signature = (keys: string[]) => [...keys].sort().join("+");
const seen = new Map<string, string>(ibaDrinks.map((d) => [signature(counts(d)), `${d.name} (IBA)`]));
const candidats = verdicts.filter((v) => !v.exclu);
// Ordre : moins d'ingrédients nouveaux d'abord, puis plus d'ingrédients du socle.
candidats.sort((a, b) => a.nouveaux.length - b.nouveaux.length || b.ingr.length - a.ingr.length || a.drink.name.localeCompare(b.drink.name));
for (const v of candidats) {
  const sig = signature(v.ingr);
  const twin = seen.get(sig);
  // Même ensemble d'ingrédients (les basiques comme la crème ou l'œuf ne comptent pas) :
  // pas forcément le même cocktail (White Russian / Black Russian), donc à arbitrer, pas exclu.
  if (twin) v.jumeau = twin;
  else seen.set(sig, v.drink.name);
}

// --- Proposition de tri (data/work/proposition-selection.json) ---------------
const prop = JSON.parse(readFileSync("data/work/proposition-selection.json", "utf8"));
const propOf = new Map<string, { decision: string; motif: string }>();
for (const [decision, groups] of [["écarter", prop.ecarter], ["à arbitrer", prop.arbitrer]] as const)
  for (const [motif, names] of Object.entries(groups as Record<string, string[]>)) for (const n of names) propOf.set(n, { decision, motif });
const knownNames = new Set(verdicts.filter((v) => !v.exclu).map((v) => v.drink.name));
for (const n of propOf.keys()) if (!knownNames.has(n)) console.warn(`⚠ proposition : « ${n} » n'est pas un candidat`);
const proposition = (v: Verdict) =>
  propOf.get(v.drink.name) ?? (v.jumeau ? { decision: "à arbitrer", motif: `mêmes ingrédients que ${v.jumeau}` } : { decision: "garder", motif: "" });

// --- Sorties ---------------------------------------------------------------
const csv = (rows: (string | number)[][]) =>
  rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n") + "\n";
const fmtDose = (d: Dose) => (d.kind === "ml" ? `${d.ml} ml` : d.kind === "texte" ? `texte: ${d.raw}` : `À VÉRIFIER: ${d.raw} (${d.raison})`);

writeFileSync(
  "data/work/iba-doses.csv",
  csv([
    ["cocktail", "ligne d'origine (ingrédient)", "dose d'origine", "dose convertie", "id provisoire", "note"],
    ...ibaDrinks.flatMap((d) =>
      d.lines.map((l) => [d.name, l.rawIngredient, l.rawMeasure, fmtDose(l.dose), l.key, ""]),
    ),
  ]),
);

const retenus = verdicts.filter((v) => !v.exclu);
writeFileSync(
  "data/work/candidats.csv",
  csv([
    ["idDrink", "nom", "statut", "raison d'exclusion", "remarque", "nb ingrédients nouveaux", "ingrédients nouveaux", "ingrédients (provisoires)", "catégorie TCDB", "verre"],
    ...[...retenus, ...verdicts.filter((v) => v.exclu)].map((v) => [
      v.drink.id,
      v.drink.name,
      v.exclu ? "exclu" : "candidat",
      v.exclu ?? "",
      v.note,
      v.nouveaux.length,
      v.nouveaux.join(", "),
      v.ingr.join(", "),
      v.raw.strCategory ?? "",
      v.raw.strGlass ?? "",
    ]),
  ]),
);

// Classeur de relecture : un onglet par statut, colonne « Ta décision » à remplir.
const wb = new ExcelJS.Workbook();
const recette = (d: Drink) => d.lines.map((l) => `${l.rawMeasure ? l.rawMeasure + " " : ""}${l.rawIngredient} → ${fmtDose(l.dose)}`).join("\n");
const ws = wb.addWorksheet("Candidats");
ws.columns = [
  { header: "Nom", key: "nom", width: 30 },
  { header: "Proposition", key: "prop", width: 12 },
  { header: "Motif", key: "motif", width: 34 },
  { header: "Ta décision (garder / écarter)", key: "decision", width: 18 },
  { header: "Remarque", key: "note", width: 28 },
  { header: "Nb ingrédients nouveaux", key: "nb", width: 10 },
  { header: "Ingrédients nouveaux", key: "nouveaux", width: 30 },
  { header: "Recette d'origine → dose convertie", key: "recette", width: 70 },
  { header: "Catégorie TheCocktailDB", key: "cat", width: 18 },
  { header: "idDrink", key: "id", width: 9 },
];
const ordre = { garder: 0, "à arbitrer": 1, "écarter": 2 } as Record<string, number>;
for (const v of [...retenus].sort((a, b) => ordre[proposition(a).decision] - ordre[proposition(b).decision] || a.nouveaux.length - b.nouveaux.length)) {
  const p = proposition(v);
  ws.addRow({ nom: v.drink.name, prop: p.decision, motif: p.motif, decision: "", note: v.note, nb: v.nouveaux.length, nouveaux: v.nouveaux.join(", "), recette: recette(v.drink), cat: v.raw.strCategory ?? "", id: v.drink.id });
}
const wx = wb.addWorksheet("Exclus automatiquement");
wx.columns = [
  { header: "Nom", key: "nom", width: 30 },
  { header: "Raison", key: "raison", width: 80 },
  { header: "Recette d'origine", key: "recette", width: 70 },
  { header: "idDrink", key: "id", width: 9 },
];
for (const v of verdicts.filter((v) => v.exclu)) wx.addRow({ nom: v.drink.name, raison: v.exclu, recette: recette(v.drink), id: v.drink.id });
for (const sheet of [ws, wx]) {
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.eachRow((r) => (r.alignment = { vertical: "top", wrapText: true }));
}
await wb.xlsx.writeFile("data/work/selection-candidats.xlsx");

// Rapport
const reasons = new Map<string, number>();
for (const v of verdicts) if (v.exclu) {
  const r = v.exclu.split(" :")[0].replace(/ de .*$/, "");
  reasons.set(r, (reasons.get(r) ?? 0) + 1);
}
const ibaAVerif = ibaDrinks.flatMap((d) => d.lines.filter((l) => l.dose.kind === "a_verifier").map((l) => `${d.name} : « ${l.rawMeasure} ${l.rawIngredient} » (${(l.dose as any).raison})`));
const inconnus = new Map<string, number>();
for (const d of [...ibaDrinks, ...retenus.map((v) => v.drink)]) for (const l of d.lines) if (l.key.startsWith("?")) inconnus.set(l.key, (inconnus.get(l.key) ?? 0) + 1);
const byNew = new Map<number, Verdict[]>();
for (const v of retenus) byNew.set(v.nouveaux.length, [...(byNew.get(v.nouveaux.length) ?? []), v]);

const md = [
  "# Rapport de sélection (étape 1b)",
  "",
  `- IBA : ${ibaDrinks.length} cocktails, socle de ${socle.size} ingrédients non basiques (identifiants provisoires).`,
  `- TheCocktailDB : ${verdicts.length} cocktails, ${retenus.length} candidats après filtres.`,
  "",
  "## Exclusions TheCocktailDB",
  ...[...reasons].map(([r, n]) => `- ${r} : ${n}`),
  "",
  "## Proposition de tri",
  ...["garder", "à arbitrer", "écarter"].map((d) => `- ${d} : ${retenus.filter((v) => proposition(v).decision === d).length}`),
  `- Total si « garder » seul : ${ibaDrinks.length} IBA + ${retenus.filter((v) => proposition(v).decision === "garder").length} = ${ibaDrinks.length + retenus.filter((v) => proposition(v).decision === "garder").length}`,
  "",
  "## Candidats par nombre d'ingrédients nouveaux (hors socle IBA)",
  ...[...byNew].sort((a, b) => a[0] - b[0]).map(([n, vs]) => `- ${n} nouveau(x) : ${vs.length} — ${vs.map((v) => v.drink.name + (n ? ` [${v.nouveaux.join(", ")}]` : "")).join(" · ")}`),
  "",
  "## IBA : doses à vérifier",
  ...ibaAVerif.map((s) => `- ${s}`),
  "",
  "## Libellés non reconnus par la normalisation provisoire",
  ...[...inconnus].sort((a, b) => b[1] - a[1]).map(([k, n]) => `- ${k.slice(1)} (${n})`),
  "",
].join("\n");
writeFileSync("data/work/rapport-selection.md", md);
console.log(md.split("\n").slice(0, 12).join("\n"));
