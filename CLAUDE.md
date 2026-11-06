# CLAUDE.md — App Cocktails

Guide de référence pour toutes les sessions de travail sur ce projet. Les décisions ci-dessous ont été validées par l'utilisateur : **ne pas les remettre en cause sans le signaler explicitement**. Pour tout point non couvert, **poser la question à l'utilisateur au lieu de décider à sa place**.

---

## 1. Le projet

Application de cocktails, cadeau d'anniversaire pour le père de l'utilisateur.

**Le problème** : dans les livres de cocktails classiques, chaque recette demande un petit ingrédient spécifique utilisé dans une seule recette. Il faudrait des dizaines d'ingrédients pour exploiter le livre. Son souhait initial : un livre basé sur une quinzaine d'ingrédients (hors softs) permettant de faire un maximum de cocktails.

**L'idée** : une application où il indique les ingrédients qu'il possède, qui lui montre les cocktails qu'il peut faire, et qui lui dit quoi acheter en priorité pour débloquer le plus de cocktails.

---

## 2. Décisions validées

### 2.1 Langue et unités
- Tout est en français : ingrédients, étapes, garnitures, verres, interface.
- Les noms des cocktails gardent leur nom d'origine (Negroni, Old Fashioned, Mojito…).
- Toutes les doses en millilitres, jamais en oz.
- Règles de conversion fixes :
  - 1 oz = 30 ml (arrondi bar standard)
  - 1 cl = 10 ml
  - 1 trait (dash) ≈ 1 ml
  - 1 cuillère de bar = 5 ml
- **Arrondi** : après conversion, toute valeur non entière est arrondie **au multiple de 5 ml supérieur** (ex. ¾ oz = 22,5 ml → 25 ml). Les traits (1 ml) et cuillères de bar (5 ml) ne sont pas arrondis.
- Compléments validés : **1 shot = 30 ml**, **1 cuillère à café = 5 ml**, **1 cuillère à soupe = 15 ml**, avec le même arrondi au multiple de 5 supérieur pour les fractions (½ c. à café → 5 ml).
- L'arrondi au multiple de 5 supérieur s'applique **aussi aux doses IBA déjà en ml** (22,5 → 25 ; 7,5 → 10 ; 52,5 → 55).
- Les recettes exprimées en **« parts »** (proportions) sont **exclues** : les convertir obligerait à inventer un volume. Un classique concerné (ex. Kir Royale) pourra être ajouté à la main avec une recette fournie par l'utilisateur.
- Les doses non chiffrables restent en texte : « compléter avec… », « quelques feuilles », « un zeste », etc.

### 2.2 Volume et périmètre
- Cible : 200 à 250 cocktails, propres et vérifiés, plutôt que 600 approximatifs.
- Tous les styles de cocktails, sans filtre selon ses goûts.
- Pas de doublons ni de variantes quasi identiques.

### 2.3 Sources des recettes
- Base de référence : la liste officielle **IBA** (International Bartenders Association, environ 90 cocktails).
- Complément : une sélection dans **TheCocktailDB** (base et API gratuites, qualité inégale, donc à nettoyer).
- Éventuellement, plus tard, des recettes ajoutées à la main.
- Import **UNE SEULE FOIS**, puis relecture dans un tableur. L'application ne dépend d'aucune API en direct.
- **Ne jamais inventer de recette ni de dose.** Une IA peut servir à traduire et harmoniser, mais tout est relu par l'utilisateur.

### 2.4 Ingrédients basiques (toujours considérés comme disponibles, jamais à cocher)
- glace, sucre, sirop de sucre, eau, eau gazeuse, sel, **œufs / blanc d'œuf, crème, lait**.
- ATTENTION : les citrons, citrons verts, agrumes et fruits en général **NE SONT PAS** basiques. Ce sont des ingrédients à acheter, qu'il coche dans son bar s'il en a.
- La **menthe n'est pas basique** : ingrédient « frais », à cocher.
- L'**Angostura et les bitters** ne sont pas basiques : produits signature, non substituables, à acheter (catégorie « placard »).
- La **glace** n'apparaît pas comme ligne de recette : elle est mentionnée uniquement dans les étapes de préparation.

### 2.5 Équivalences (substitutions)
- Oui pour les génériques interchangeables : Cointreau ≈ triple sec, n'importe quel bourbon pour « bourbon », etc.
- Non pour les produits signature non remplaçables : Chartreuse, Campari, Lillet, Angostura, etc.
- Chaque ingrédient appartient à un **groupe de substitution**. Le calcul des cocktails faisables se fait sur ce groupe (le générique).

### 2.6 Marques
- On affiche la marque ET le générique : la marque d'abord, le générique entre parenthèses.
  Exemples : « Cointreau (triple sec) », « Monkey Shoulder (whisky) ».
- Le calcul se fait sur le générique : s'il possède n'importe quel triple sec, un cocktail qui demande du Cointreau est faisable.

### 2.7 Softs
- Les softs (tonic, ginger beer, cola, jus d'orange, jus de cranberry…) sont **à acheter et à cocher** comme les autres ingrédients : un cocktail qui demande du tonic n'est faisable que si le tonic est coché.
- Seule différence : ils sont **hors du compte N** du « bar idéal à N bouteilles » (on propose N bouteilles hors softs, plus la liste des softs nécessaires en annexe). Dans « Quoi acheter », les softs sont présentés à part.

### 2.8 Garnitures
- Les garnitures (zeste, cerise, olive, tranche d'agrume…) sont **du texte uniquement** sur la fiche cocktail. Elles n'entrent jamais dans le calcul « faisable ».

### 2.9 Plateforme
- Usage sur ordinateur, dans le navigateur.
- Application web simple, sans serveur ni compte utilisateur.
- Son bar (les ingrédients cochés) est sauvegardé localement sur son ordinateur.
- Mise en ligne : **GitHub Pages, active depuis le 2026-11-05** → https://atndfr.github.io/App-Cocktails/ ; et fichier local `livrable/bar-a-cocktails.html`.

---

## 3. Modèle de données

Tableur `.xlsx` à 3 onglets, versionné dans le dépôt = **source de vérité éditable**, exporté en JSON pour l'appli par un script.

- **Onglet Cocktails** : identifiant, nom, technique (shaker, au verre, mélangé, blender…), verre, garniture, étapes, source (IBA / TheCocktailDB / manuel).
- **Onglet Ingrédients** : identifiant, nom affiché (marque + générique entre parenthèses le cas échéant), générique / groupe de substitution, catégorie (alcool de base, liqueur, soft, frais, placard), basique oui/non.
- **Onglet Lignes de recette** : cocktail, ingrédient, quantité, unité (ml ou texte), optionnel oui/non.

### POINT CRITIQUE : l'harmonisation des ingrédients
« Lime juice », « jus de citron vert frais » et « citron vert » doivent devenir **UN SEUL** ingrédient. C'est la clé pour que l'appli réponde au problème du père. Sans ça, on retombe sur des dizaines d'ingrédients utilisés une seule fois.

---

## 4. Fonctionnalités de l'application

1. **Écran « Mon bar »** : cocher les ingrédients possédés, rangés par catégorie, avec une recherche.
2. **Écran « Cocktails »** : trois listes (faisables, à 1 ingrédient près, autres), avec un filtre par alcool de base et une recherche par nom.
3. **Fiche cocktail** : ingrédients en ml, étapes, verre, garniture, ingrédients manquants mis en évidence.
4. **« Quoi acheter ensuite »** : classement des ingrédients qui débloquent le plus de nouveaux cocktails, avec le détail (ex. « + Campari → Negroni, Americano, Boulevardier… »).
5. **Bonus « Mon bar idéal à N bouteilles »** : calcul glouton (on ajoute à chaque fois l'ingrédient qui débloque le plus de cocktails) qui propose les N ingrédients maximisant le nombre de cocktails faisables. C'est la version automatique de son « livre à 15 ingrédients ».
6. *Facultatif, plus tard* : ajout de recettes personnelles.

---

## 5. Plan en 3 étapes

**Étape 1 – Constituer la base (le gros du travail)**
- a. Récupérer les recettes brutes (IBA, puis sélection TheCocktailDB jusqu'à 200-250).
- b. Convertir en ml selon les règles ci-dessus.
- c. Traduire en français.
- d. Harmoniser les ingrédients, attribuer catégories, groupes de substitution et statut basique.
- e. Produire le tableur pour la relecture humaine, puis l'export JSON.

**Étape 2 – L'application** (écrans et fonctionnalités ci-dessus).

**Étape 3 – Finitions et mise en ligne.**

---

## 6. Principes de développement

- La logique (calcul des cocktails faisables, « à 1 près », « quoi acheter », « bar idéal ») est **séparée de l'interface**, en **fonctions pures**, et **testée**.
- **Aucune donnée de cocktail codée en dur** dans l'interface : tout vient des fichiers de données.
- Solution simple et lisible.
- Choix technique à proposer et à faire valider avant de coder (l'utilisateur a l'habitude de React + TypeScript + Vite).

---

## 7. Choix technique — VALIDÉ

- **Appli** : React + TypeScript + Vite, navigation par hash (compatible GitHub Pages et fichier local).
- **Logique** : `src/logic/` en TypeScript pur, sans React ; tests **Vitest**.
- **Persistance** : `localStorage` (identifiants des ingrédients cochés).
- **Données** : `data/cocktails.xlsx` (source de vérité) → script Node `scripts/export-json.ts` (avec validations) → `src/data/*.json`. Imports bruts figés dans `data/raw/`.
- **Build** : statique Vite (`base: './'`).

---

## 8. Étape 1 — FAITE : constitution de la base (2026-11-05)

### Résultat
- **238 cocktails** = 102 IBA + 136 TheCocktailDB, dans `data/cocktails.xlsx`, **qui fait foi**.
- Liste figée dans `data/selection-validee.json` : la proposition « garder » a été validée (239), puis l'Empellón Cocina's Fat-Washed Mezcal a été retiré (voir plus bas).

### Fichiers, dans l'ordre de la chaîne
- `data/raw/iba.json` (102) et `data/raw/thecocktaildb.json` (441) : imports bruts **figés**, faits une seule fois. `npm run fetch:iba` / `fetch:cocktaildb` refusent d'écraser sans `--force`.
- `npm run select` → `data/work/` : classeur et rapport de sélection, proposition de tri (`proposition-selection.json`). Historique de l'étape 1b, plus utilisé ensuite.
- `scripts/lib/dose.ts` : conversion des doses (testée). Toute dose non reconnue → « à vérifier ».
- `data/corrections.json` : corrections des sources (coquilles, unités manquantes, méthode du Dry Martini non importée), chacune avec son motif.
- `data/harmonisation.json` : groupes de substitution, ingrédients marque / variante, rattachement de chaque libellé brut. `npm run check` vérifie qu'aucun libellé n'est orphelin.
- `data/traductions/*.json` : traductions IA (étapes, verre, technique, garniture ; doses texte dans `doses-texte.json`). Points relevés : `data/remarques-relecture.json`.
- `npm run build:xlsx` → `data/cocktails.xlsx` (3 onglets du modèle + colonnes « (relecture) » non exportées). **Ne plus le régénérer** : il fait foi et peut contenir des corrections à la main. Le script refuse d'écraser sans `--force`.
- `npm run data` → `src/data/donnees.json`, lu par l'appli (validations bloquantes).

### Décisions prises pendant l'étape 1 (validées ou déléguées par l'utilisateur)
- Doses IBA : IBA Tiki « 90 » et « 30 » = ml ; Tuxedo ½ et ¼ de cuillère de bar gardés **en texte**.
- Groupes de substitution :
  - **whiskey américain** = bourbon, rye, Tennessee, blended, y compris Crown Royal (canadien) ; **scotch** à part ; **irlandais** à part ;
  - **rhum blanc** / **rhum ambré** (vieux, brun, jamaïcain, agricole, 151) ;
  - **brandy** = cognac et brandy (calvados à part) ;
  - **triple sec** = Cointreau, triple sec, curaçao orange **et Grand Marnier**.
- Jus : citron et citron vert (jus ou fruit) = **frais** ; jus d'orange, d'ananas, de pamplemousse, de cranberry = **softs** (§2.7) ; orange ou ananas en morceaux = **frais**.
- Lignes TheCocktailDB de type zeste / cerise / olive / muscade = **garnitures** (texte), conformément au §2.8.
- Catégories : vermouths / apéritifs / amers → « liqueur » ; vins, effervescents, porto, xérès, bière → « alcool de base ».
- Relecture déléguée (2026-11-05 : « je te fais confiance, fais tout sans me demander confirmation ») :
  - **B-52 conservé** (c'est un shot) : doses en fractions du verre, gardées en texte (« ⅓ du verre ») ;
  - Quarter Deck : « 1 1/2 » de rhum lu comme 1 1/2 oz = 45 ml ;
  - **Empellón Cocina's Fat-Washed Mezcal retiré** (irréalisable à la maison).

## 9. Étapes 2 et 3 — FAITES (2026-11-05)

- Logique pure : `src/logic/bar.ts` (faisables, à 1 près, quoi acheter, bar idéal glouton, softs hors du compte N) et `src/logic/stockage.ts` (localStorage) ; tests Vitest.
- Écrans dans `src/ui/` (Mon bar, Cocktails, Fiche, Quoi acheter, Bar idéal) ; navigation par hash (`src/ui/routes.ts`).
- Le bar stocke des **groupes** (génériques) : on coche « Triple sec », pas « Cointreau ».
- Livraison :
  - en ligne sur GitHub Pages, https://atndfr.github.io/App-Cocktails/, publié par `.github/workflows/pages.yml` à chaque push sur `main` ;
  - fichier unique hors ligne : `livrable/bar-a-cocktails.html` (`npm run build:fichier`), aussi téléchargeable sur le site (lien en pied de page, reconstruit à chaque publication).
- Pull request [atndfr/app-cocktails#1](https://github.com/AtnDfr/App-Cocktails/pull/1) fusionnée dans `main` le 2026-11-06.

## 10. Modifier les données ensuite

1. Corriger `data/cocktails.xlsx` (jamais `src/data/donnees.json` à la main).
2. `npm run data`, puis `npm run build:fichier` (qui met aussi à jour `livrable/bar-a-cocktails.html`).
3. `npm test` : un test vérifie que `donnees.json` correspond bien au tableur et que le livrable embarque ces données. Il échoue si l'une des deux étapes a été oubliée, et bloque alors la publication.

## 11. Règles pour les sessions futures

- Lire ce fichier en début de session.
- Ne jamais remettre en cause une décision ci-dessus sans le signaler.
- Pour tout point non couvert : poser la question à l'utilisateur.
- Ne jamais inventer de recette ni de dose : toute dose non reconnue est marquée « à vérifier ».
- Mettre à jour ce fichier quand une nouvelle décision est validée.
- **Fusion des pull requests** (autorisation de l'utilisateur, 2026-11-06) : Claude fusionne lui-même ses pull requests vers `main` une fois les tests passés, sans attendre de feu vert, puis vérifie que le site en ligne est à jour. Chaque changement passe quand même par une pull request (traçabilité, retour arrière possible).
