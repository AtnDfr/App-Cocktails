/**
 * Export du tableur data/cocktails.xlsx (source de vérité) vers src/data/donnees.json, lu par l'application.
 * Validations bloquantes : identifiants uniques, références valides, unités, catégories.
 */
import { writeFileSync } from "node:fs";
import { lireTableur } from "./lib/export.ts";

const { donnees, erreurs } = await lireTableur();
if (erreurs.length) {
  console.error(`${erreurs.length} erreur(s), export annulé :\n- ` + erreurs.join("\n- "));
  process.exit(1);
}
writeFileSync("src/data/donnees.json", JSON.stringify(donnees, null, 1) + "\n");
console.log(`Écrit : src/data/donnees.json — ${donnees.cocktails.length} cocktails, ${donnees.ingredients.length} ingrédients, ${donnees.groupes.length} groupes.`);
