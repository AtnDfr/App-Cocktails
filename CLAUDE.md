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
- Mise en ligne envisagée gratuitement (par ex. GitHub Pages), ou fichier local. **À confirmer plus tard.**

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

## 8. Avancement de l'étape 1 et organisation des fichiers

- `data/raw/iba.json` (102 cocktails) et `data/raw/thecocktaildb.json` (441) : imports bruts **figés**, faits une seule fois. Les scripts `npm run fetch:iba` / `fetch:cocktaildb` refusent d'écraser sans `--force`.
- `scripts/lib/dose.ts` : conversion des doses (testée, `npm test`). Toute dose non reconnue → « à vérifier ».
- `scripts/lib/normalize.ts` : identifiants d'ingrédients **provisoires** pour la sélection ; la vraie harmonisation se fait en 1e.
- `npm run select` → `data/work/selection-candidats.xlsx` (relecture de la sélection TheCocktailDB), `data/work/rapport-selection.md`, `data/work/iba-doses.csv`. La proposition de tri est dans `data/work/proposition-selection.json`.

## 9. Règles pour les sessions futures

- Lire ce fichier en début de session.
- Ne jamais remettre en cause une décision ci-dessus sans le signaler.
- Pour tout point non couvert : poser la question à l'utilisateur.
- Ne jamais inventer de recette ni de dose : toute dose non reconnue est marquée « à vérifier ».
- Mettre à jour ce fichier quand une nouvelle décision est validée.
