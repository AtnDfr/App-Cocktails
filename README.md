# Mon bar à cocktails

Application web, entièrement en français, pour savoir quels cocktails on peut faire avec ce qu'on a, et quoi acheter ensuite pour en débloquer le plus.
Elle contient 238 recettes : la liste officielle IBA et une sélection relue de TheCocktailDB. Toutes les doses sont en ml.

## Utiliser l'application

- **Sans rien installer** : ouvrir `livrable/bar-a-cocktails.html` (double-clic). Tout est dans ce seul fichier, qui marche sans connexion.
- **En ligne** : https://atndfr.github.io/App-Cocktails/ (la version hors ligne y est aussi téléchargeable, lien en bas de page)

Le bar coché est enregistré dans le navigateur, sur cet ordinateur.

Les écrans :
1. **Mon bar** : cocher ce qu'on possède. Une marque compte pour son générique : n'importe quel triple sec suffit pour une recette au Cointreau.
2. **Cocktails** : ceux qu'on peut faire, ceux à un ingrédient près, et les autres. On peut chercher par nom et filtrer par alcool de base.
3. **Fiche cocktail** : doses en ml, préparation, verre, garniture. Les ingrédients manquants sont surlignés.
4. **Quoi acheter** : les achats qui débloquent le plus de nouveaux cocktails, avec la liste des cocktails débloqués.
5. **Bar idéal** : les N bouteilles qui permettent le plus de cocktails (hors softs), et les softs à prévoir.

## Développement

```bash
npm install
npm run dev            # appli en local
npm test               # tests (logique, conversion des doses, stockage)
npm run build          # build pour GitHub Pages (dist/)
npm run build:fichier  # build en un seul fichier (dist-fichier/index.html)
```

Pour mettre à jour les données :
1. Modifier `data/cocktails.xlsx`, qui fait foi.
2. Lancer `npm run data` pour régénérer `src/data/donnees.json`. Le script vérifie les données et refuse l'export en cas d'erreur.
3. Lancer `npm run build:fichier`, qui met à jour `livrable/bar-a-cocktails.html`.
4. Lancer `npm test` : un test vérifie que l'appli et le livrable embarquent bien les données du tableur. La publication est bloquée tant qu'il échoue.

L'historique de constitution de la base (imports bruts, sélection, harmonisation, traductions) et toutes les décisions sont décrits dans `CLAUDE.md`.

## Publication sur GitHub Pages

À faire une seule fois : dans le dépôt, **Settings → Pages → Source : « GitHub Actions »**. Le workflow `.github/workflows/pages.yml` publie ensuite l'appli à chaque push sur `main`.
