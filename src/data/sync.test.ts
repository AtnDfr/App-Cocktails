/**
 * Garde-fou : l'appli doit embarquer exactement les données du tableur (source de vérité).
 * Échoue si data/cocktails.xlsx a été modifié sans relancer `npm run data`,
 * ou si livrable/bar-a-cocktails.html n'a pas été reconstruit (`npm run build:fichier`).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { empreinteDonnees } from "../../scripts/lib/empreinte.ts";
import { lireTableur } from "../../scripts/lib/export.ts";
import donnees from "./donnees.json";

describe("synchronisation des données", () => {
  it("src/data/donnees.json correspond au tableur (sinon : npm run data)", async () => {
    const { donnees: duTableur, erreurs } = await lireTableur();
    expect(erreurs).toEqual([]);
    expect(duTableur).toEqual(donnees);
  });

  it("le livrable hors ligne embarque ces données (sinon : npm run build:fichier)", () => {
    const livrable = readFileSync("livrable/bar-a-cocktails.html", "utf8");
    expect(livrable.includes(empreinteDonnees()), "empreinte des données absente du livrable").toBe(true);
  });
});
