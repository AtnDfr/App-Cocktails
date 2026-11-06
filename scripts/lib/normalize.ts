/**
 * Normalisation PROVISOIRE des libellés d'ingrédients (anglais) vers un identifiant.
 * Sert uniquement à la sélection (étape 1b) : la vraie table d'harmonisation,
 * avec noms français, catégories et groupes de substitution, sera faite en 1e
 * et relue par l'utilisateur.
 */

export function simplify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’'`]/g, "'")
    .replace(/\(.*?\)/g, " ")
    .replace(/\*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Ingrédients basiques (CLAUDE.md §2.4). */
export const BASIQUES = new Set(["glace", "sucre", "sirop_de_sucre", "eau", "eau_gazeuse", "sel", "oeuf", "creme", "lait"]);

/** Éléments typiquement de garniture : n'entrent pas dans le calcul (CLAUDE.md §2.8). */
export const GARNITURES = new Set(["cerise_cocktail", "olive", "muscade", "cannelle_poudre"]);

// [motif sur libellé simplifié, identifiant provisoire]. Le premier motif qui correspond gagne.
const ALIASES: [RegExp, string][] = [
  // Basiques
  [/^(crushed )?ice( cubes?)?$/, "glace"],
  [/(sugar syrup|simple syrup|gomme)/, "sirop_de_sucre"],
  [/^(white |powdered |superfine |granulated |white cane |cane |raw |demerara |brown )?sugar( cubes?)?$|^sugar cube$/, "sucre"],
  [/^(plain |still |hot )?water$/, "eau"],
  [/(soda water|club soda|carbonated water|sparkling water)/, "eau_gazeuse"],
  [/^(a pinch of )?salt$/, "sel"],
  [/egg (white|yolk)|^(raw )?(whole )?egg$/, "oeuf"],
  [/^whipped cream$/, "creme_fouettee"],
  [/^(fresh |light |heavy |single |double )?cream$|half-and-half/, "creme"],
  [/^milk$/, "lait"],
  // Agrumes et fruits (à acheter)
  [/lime juice|^(fresh )?limes?( peel| wedges?| cut .*)?$|^fresh lime$/, "citron_vert"],
  [/lemon juice|^lemons?( peel| twist)?$/, "citron"],
  [/orange juice|^oranges?( peel| spiral)?$/, "orange"],
  [/(pink )?grapefruit juice/, "pamplemousse"],
  [/pineapple (juice|chunks)|^pineapple$/, "ananas"],
  [/cranberry juice/, "cranberry"],
  [/tomato juice/, "jus_de_tomate"],
  [/maraschino cherr|^cherr(y|ies)$|cocktail cherry/, "cerise_cocktail"],
  [/^(green )?olives?$/, "olive"],
  [/^(mint|mint (leaves|sprigs?)|fresh mint)$|mint (leaves|sprigs)/, "menthe"],
  [/^nutmeg$/, "muscade"],
  // Sirops et placard
  [/grenadine/, "grenadine"],
  [/orgeat/, "orgeat"],
  [/honey (syrup|mix)|^(raw )?honey$|monin honey/, "miel"],
  [/agave (nectar|syrup)/, "sirop_agave"],
  [/falernum/, "falernum"],
  [/^angostura( bitters)?$|aromatic bitters|^bitters$/, "angostura"],
  [/orange bitters/, "orange_bitters"],
  [/peychaud/, "peychaud"],
  [/worcestershire/, "worcestershire"],
  [/tabasco|hot sauce/, "tabasco"],
  // Softs
  [/^(coca-cola|cola|pepsi cola)$|fill up with cola|top with cola/, "cola"],
  [/ginger beer/, "ginger_beer"],
  [/ginger ale/, "ginger_ale"],
  [/tonic/, "tonic"],
  [/7-up|sprite|lemon-lime soda/, "limonade"],
  [/^coffee$|hot coffee|espresso/, "cafe"],
  // Vins et effervescents
  [/champagne|prosecco|sparkling wine/, "vin_effervescent"],
  [/dry white wine|^white wine$/, "vin_blanc"],
  [/^red wine/, "vin_rouge"],
  [/^port$|port wine|ruby port/, "porto"],
  // Vermouths, amers, apéritifs (produits signature non substituables)
  [/dry vermouth/, "vermouth_dry"],
  [/sweet (red )?vermouth|rosso vermouth|^vermouth$/, "vermouth_rouge"],
  [/campari/, "campari"],
  [/aperol/, "aperol"],
  [/lillet/, "lillet_blanc"],
  [/green chartreuse/, "chartreuse_verte"],
  [/yellow chartreuse/, "chartreuse_jaune"],
  [/benedictine/, "benedictine"],
  [/absinthe|pernod|wormwood/, "absinthe"],
  [/fernet/, "fernet"],
  [/drambuie/, "drambuie"],
  // Liqueurs (génériques)
  [/triple sec|cointreau|orange curacao|^curacao$/, "triple_sec"],
  [/grand marnier/, "grand_marnier"],
  [/blue curacao/, "curacao_bleu"],
  [/maraschino/, "marasquin"],
  [/coffee liqueur|kahlua|tia maria/, "liqueur_cafe"],
  [/amaretto/, "amaretto"],
  [/creme de cacao|chocolate liqueur/, "creme_de_cacao"],
  [/creme de menthe/, "creme_de_menthe"],
  [/creme de cassis/, "creme_de_cassis"],
  [/creme de mure/, "creme_de_mure"],
  [/creme de violette/, "creme_de_violette"],
  [/apricot brandy/, "liqueur_abricot"],
  [/cherry (brandy|liqueur|heering)/, "cherry_brandy"],
  [/peach (schnapps|brandy)|peachtree/, "liqueur_peche"],
  [/elderflower|st\.? germain/, "liqueur_sureau"],
  [/irish cream|baileys/, "creme_irlandaise"],
  [/galliano/, "galliano"],
  [/sambuca/, "sambuca"],
  [/frangelico/, "frangelico"],
  [/chambord|raspberry liqueur/, "liqueur_framboise"],
  [/midori|melon liqueur/, "liqueur_melon"],
  [/southern comfort/, "southern_comfort"],
  [/sloe gin/, "sloe_gin"],
  // Alcools de base (groupes provisoires)
  [/^(dry |london dry |old tom )?gin$/, "gin"],
  [/citron|limon/, "vodka_citron"],
  [/vodka|smirnoff/, "vodka"],
  [/cachaca/, "cachaca"],
  [/rhum agricole|martinique/, "rhum_agricole"],
  [/151 proof/, "rhum_151"],
  [/^(white|light|cuban|white cuban) (rum|ron)$|^rum$/, "rhum_blanc"],
  [/(dark|aged|gold|amber|jamaica|jamaican|blackstrap|demerara|anejo|spiced|goslings).*(rum|rhum)|malibu/, "rhum_ambre"],
  [/tequila/, "tequila"],
  [/mezcal/, "mezcal"],
  [/pisco/, "pisco"],
  [/^rye whiskey$/, "rye"],
  [/bourbon|wild turkey|jim beam/, "bourbon"],
  [/scotch|islay|johnnie walker|lagavulin/, "scotch"],
  [/irish whiskey/, "whiskey_irlandais"],
  [/jack daniels|tennessee whiskey/, "whiskey_tennessee"],
  [/blended whiskey|crown royal|^whiske?y$/, "whisky"],
  [/cognac/, "cognac"],
  [/apple brandy|calvados|applejack/, "calvados"],
  [/^brandy$/, "brandy"],
];

/** Identifiant provisoire d'un libellé brut ; à défaut, libellé simplifié préfixé « ? ». */
export function provisionalKey(label: string): string {
  const s = simplify(label)
    .replace(/^(fresh(ly)?( squeezed)?|chilled|freshly) /, "")
    .replace(/\b100% agave\b/, "")
    .trim();
  for (const [re, key] of ALIASES) if (re.test(s)) return key;
  return "?" + s;
}

/** Nom de cocktail normalisé pour détecter les doublons entre sources. */
export function cocktailKey(name: string): string {
  return simplify(name)
    .replace(/&/g, " and ")
    .replace(/\b(the|cocktail)\b/g, " ")
    .replace(/'n'|\bn\b/g, " and ")
    .replace(/[^a-z0-9]+/g, "");
}
