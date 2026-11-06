/** Empreinte courte des données de l'appli : intégrée au build, elle permet de vérifier qu'un livrable est à jour. */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

export function empreinteDonnees(chemin = "src/data/donnees.json"): string {
  return createHash("sha256").update(readFileSync(chemin)).digest("hex").slice(0, 10);
}
