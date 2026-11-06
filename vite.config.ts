import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { empreinteDonnees } from "./scripts/lib/empreinte.ts";

// base « ./ » : l'appli fonctionne sur GitHub Pages.
// Mode « fichier » (npm run build:fichier) : tout est intégré dans un seul index.html,
// qui s'ouvre d'un double-clic, sans serveur ni connexion.
// __EMPREINTE_DONNEES__ : empreinte de src/data/donnees.json, affichée en pied de page et
// vérifiée par src/data/sync.test.ts pour s'assurer que le livrable embarque les données actuelles.
export default defineConfig(({ mode }) => ({
  base: "./",
  define: { __EMPREINTE_DONNEES__: JSON.stringify(empreinteDonnees()) },
  plugins: mode === "fichier" ? [react(), viteSingleFile()] : [react()],
  build: mode === "fichier" ? { outDir: "dist-fichier" } : {},
}));
