/** Vérifie que les 239 recettes se chargent sans libellé orphelin ni dose à vérifier. */
import { allIngredients, loadHarmonisation, loadRecipes } from "./lib/recipes.ts";

const { recipes, problemes } = loadRecipes();
const h = loadHarmonisation();
const used = new Set(recipes.flatMap((r) => r.lignes.map((l) => l.ingredient)));
const inutiles = allIngredients(h).filter((i) => !used.has(i.id) && !h.groupes[i.id]).map((i) => i.id);
console.log(`${recipes.length} recettes chargées.`);
if (inutiles.length) console.log(`Ingrédients déclarés mais jamais utilisés : ${inutiles.join(", ")}`);
if (problemes.length) {
  console.log(`${problemes.length} problème(s) :\n- ` + problemes.join("\n- "));
  process.exit(1);
}
console.log("Aucun problème.");
