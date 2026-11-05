import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// base « ./ » : l'appli fonctionne sur GitHub Pages.
// Mode « fichier » (npm run build:fichier) : tout est intégré dans un seul index.html,
// qui s'ouvre d'un double-clic, sans serveur ni connexion.
export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: mode === "fichier" ? [react(), viteSingleFile()] : [react()],
  build: mode === "fichier" ? { outDir: "dist-fichier" } : {},
}));
