/** Types des données de l'application, produites par scripts/export-json.ts depuis data/cocktails.xlsx. */

export const CATEGORIES = ["alcool de base", "liqueur", "soft", "frais", "placard"] as const;
export type Categorie = (typeof CATEGORIES)[number];

/** Générique / groupe de substitution : c'est sur lui que se fait le calcul. */
export type Groupe = { id: string; nom: string; categorie: Categorie; basique: boolean };

/** Ingrédient tel qu'affiché dans une recette (marque ou variante), rattaché à un groupe. */
export type Ingredient = { id: string; nom: string; groupe: string };

export type LigneRecette = {
  ingredient: string;
  /** Dose en ml, ou null si la dose est en texte. */
  ml: number | null;
  /** Dose en texte (« compléter », « 2 feuilles »…), ou null si la dose est en ml. */
  texte: string | null;
  optionnel: boolean;
};

export type Cocktail = {
  id: string;
  nom: string;
  technique: string;
  verre: string;
  garniture: string;
  etapes: string[];
  source: "IBA" | "TheCocktailDB" | "manuel";
  lignes: LigneRecette[];
};

export type Donnees = { groupes: Groupe[]; ingredients: Ingredient[]; cocktails: Cocktail[] };
