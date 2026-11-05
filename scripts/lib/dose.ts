/**
 * Conversion des doses en millilitres, selon les règles de CLAUDE.md §2.1 :
 *   1 oz = 30 ml · 1 cl = 10 ml · 1 trait (dash) ≈ 1 ml · 1 cuillère de bar = 5 ml
 *   Valeur non entière → multiple de 5 ml supérieur (traits et cuillères non arrondis).
 * Toute dose non reconnue est marquée « à vérifier » : on ne devine jamais.
 *
 * Unités hors cadrage, ajoutées sous réserve de validation (signalées dans le rapport) :
 *   cuillère à café (tsp) = 5 ml · cuillère à soupe (tbsp) = 15 ml.
 */

export type Dose =
  | { kind: "ml"; ml: number; raw: string; note?: string }
  | { kind: "texte"; raw: string }
  | { kind: "a_verifier"; raw: string; raison: string; proposition_ml?: number };

/** Unités convertibles : facteur en ml, et si la valeur doit être arrondie au multiple de 5. */
const UNITS: { re: RegExp; ml: number; round5: boolean; horsCadrage?: boolean }[] = [
  { re: /^(ml|millilit(er|re)s?)\b/i, ml: 1, round5: true },
  { re: /^cl\b/i, ml: 10, round5: true },
  { re: /^dl\b/i, ml: 100, round5: true },
  { re: /^(oz|ounces?)\b\.?/i, ml: 30, round5: true },
  { re: /^(dash(es)?|traits?)\b/i, ml: 1, round5: false },
  { re: /^(bar ?spoons?|barspoons?|cuill[eè]res? de bar)\b/i, ml: 5, round5: false },
  { re: /^(tsp|teaspoons?)\b\.?/i, ml: 5, round5: false, horsCadrage: true },
  { re: /^(tbsp|tblsp|tablespoons?)\b\.?/i, ml: 15, round5: false, horsCadrage: true },
];

/** Unités de comptage : la dose reste en texte (« 10 feuilles de basilic »). */
export const COUNT_WORDS = /^(pcs?|pieces?|drops?|leaves|leaf|sprigs?|slices?|wedges?|cubes?|chunks?|quarters?|wheels?|twists?|thin|sliced)\b/i;

const UNICODE_FRACTIONS: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": 0.125 };

/** Lit un nombre en tête : « 2 », « 1.5 », « 1,5 », « 3/4 », « 1 1/2 », « 1½ ». */
export function readNumber(s: string): { value: number; rest: string } | null {
  const t = s.trimStart();
  let m = t.match(/^(\d+)\s+(\d+)\/(\d+)(?!\d)/); // 1 1/2
  if (m) return { value: +m[1] + +m[2] / +m[3], rest: t.slice(m[0].length) };
  m = t.match(/^(\d+)?\s*([½¼¾⅓⅔⅛])/); // 1½ ou ½
  if (m) return { value: (m[1] ? +m[1] : 0) + UNICODE_FRACTIONS[m[2]], rest: t.slice(m[0].length) };
  m = t.match(/^(\d+)\/(\d+)(?!\d)/); // 3/4
  if (m) return { value: +m[1] / +m[2], rest: t.slice(m[0].length) };
  m = t.match(/^(\d+(?:[.,]\d+)?)/);
  if (m) return { value: parseFloat(m[1].replace(",", ".")), rest: t.slice(m[0].length) };
  return null;
}

/** Arrondi au multiple de 5 supérieur pour les valeurs non entières. */
export function roundMl(v: number): number {
  const r = Math.round(v * 1000) / 1000; // neutralise les erreurs flottantes (3 × 1/3…)
  return Number.isInteger(r) ? r : Math.ceil(r / 5) * 5;
}

/**
 * Convertit une dose brute (sans le nom de l'ingrédient), ex. « 1 1/2 oz », « 2 dashes », « Top up ».
 * - nombre + unité convertible → ml
 * - nombre + unité non convertible (cl ok ; shot, part, cup… non) → à vérifier
 * - plage (« 1-2 oz ») → à vérifier
 * - pas de nombre (« Top », « Splash », « Few dashes ») ou unité de comptage (feuilles, tranche…) → texte
 */
export function parseDose(raw: string): Dose {
  const src = raw.trim();
  if (!src) return { kind: "texte", raw: src };

  const n = readNumber(src);
  if (!n) {
    // « Dash of… », « A dash » : un trait = 1 ml (règle du cadrage).
    if (/^(a\s+)?dash\b/i.test(src)) return { kind: "ml", ml: 1, raw: src };
    return { kind: "texte", raw: src };
  }

  let rest = n.rest.trimStart();
  const range = rest.match(/^(?:-|–|to\b|or\b|\/)\s*\d+(?:[.,]\d+)?\s*/i);
  if (range) {
    // « 1-2 oz » : plage sur une dose en ml → à vérifier ; « 3 to 4 pcs » : comptage → texte.
    const after = rest.slice(range[0].length);
    if (UNITS.some((u) => u.re.test(after))) return { kind: "a_verifier", raw: src, raison: "plage de valeurs" };
    return { kind: "texte", raw: src };
  }
  if (COUNT_WORDS.test(rest)) return { kind: "texte", raw: src };

  for (const u of UNITS) {
    const um = rest.match(u.re);
    if (!um) continue;
    rest = rest.slice(um[0].length).trim();
    const exact = n.value * u.ml;
    const ml = u.round5 ? roundMl(exact) : exact;
    if (!Number.isInteger(ml)) {
      return { kind: "a_verifier", raw: src, raison: "fraction de trait ou de cuillère", proposition_ml: Math.ceil(ml) };
    }
    const note = u.horsCadrage ? "unité hors cadrage (cuillère à café/soupe)" : undefined;
    return note ? { kind: "ml", ml, raw: src, note } : { kind: "ml", ml, raw: src };
  }

  if (/^(shots?|jiggers?|parts?|cups?|pints?|qt|quarts?|gal|gallons?|l|liters?|litres?|fifths?|bottles?|glass|gr|g|kg|lb)\b/i.test(rest)) {
    return { kind: "a_verifier", raw: src, raison: "unité non convertible selon le cadrage" };
  }
  if (rest === "") {
    // Nombre seul : petit nombre = comptage (« 2 » citrons verts, « 1 » œuf) ;
    // grand nombre = unité manquante (« 90 » jus d'ananas), à vérifier.
    if (n.value >= 5) return { kind: "a_verifier", raw: src, raison: "nombre sans unité" };
    return { kind: "texte", raw: src };
  }
  // Nombre + unité de comptage (feuilles, tranche, zeste, morceau, gouttes…) : texte.
  return { kind: "texte", raw: src };
}

/**
 * Sépare une ligne IBA « 30 ml Gin » en dose + ingrédient.
 * Seules les doses de forme « nombre + unité convertible » sont détachées ; le reste
 * (« A splash of Soda Water », « 6 pcs Mint Sprigs ») est renvoyé entier pour l'harmonisation.
 */
export function splitIbaLine(line: string): { measure: string; ingredient: string } {
  const src = line.replace(/\s+/g, " ").trim();
  const n = readNumber(src);
  if (n) {
    // Nombre collé à « ml » (« 60ml Gin ») : readNumber laisse « ml Gin ».
    const rest = n.rest.trimStart();
    for (const u of UNITS) {
      const um = rest.match(u.re);
      if (um) {
        const measure = src.slice(0, src.length - rest.length + um[0].length).trim();
        const ingredient = rest.slice(um[0].length).replace(/^\s*of\s+/i, "").trim();
        return { measure, ingredient };
      }
    }
    // Comptage ou plage (« 6 pcs Mint Sprigs », « 3 to 4 pcs Pineapple Chunks », « 1 Sugar Cube ») :
    // la ligne entière sert de dose texte.
    const range = rest.match(/^(?:-|–|to\b|or\b|\/)\s*\d+\s*/i);
    const afterRange = range ? rest.slice(range[0].length) : rest;
    if (range || COUNT_WORDS.test(afterRange) || n.value < 5) {
      return { measure: src, ingredient: stripCount(afterRange) };
    }
    // Grand nombre directement suivi de l'ingrédient (« 90 Fresh Pineapple Juice ») : unité absente.
    return { measure: src.slice(0, src.length - rest.length).trim(), ingredient: rest };
  }
  // Pas de nombre (« A splash of Soda Water », « Top with Cola ») : dose texte = ligne entière.
  return { measure: src, ingredient: stripLead(src) };
}

const LEAD = /^(a\s+|few\s+)?(splash|dash(es)?|drops?|pinch|top(\s+up)?|fill(\s+up)?)(\s+(with|of))?\s+/i;
function stripLead(s: string): string {
  return s.replace(LEAD, "").trim();
}
function stripCount(s: string): string {
  let t = s.trim();
  for (let i = 0; i < 3 && COUNT_WORDS.test(t); i++) t = t.replace(COUNT_WORDS, "").replace(/^\s*(of\s+)?/i, "").trim();
  return t;
}
