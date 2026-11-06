/**
 * Logique du bar, en fonctions pures (sans React) : cocktails faisables, « à 1 près »,
 * quoi acheter ensuite, bar idéal à N bouteilles. Le calcul se fait sur les groupes
 * de substitution (génériques) ; les basiques sont toujours disponibles ; les lignes
 * optionnelles ne bloquent jamais (CLAUDE.md §2.4 à §2.8).
 */
import type { Cocktail, Donnees, Groupe } from "../data/types.ts";

/** Ce que possède l'utilisateur : des identifiants de groupes. */
export type Bar = ReadonlySet<string>;

export type Index = {
  groupes: Map<string, Groupe>;
  groupeDe: Map<string, string>; // ingrédient → groupe
  /** Groupes non basiques requis par chaque cocktail (lignes non optionnelles). */
  requis: Map<string, string[]>;
};

export function indexer(d: Donnees): Index {
  const groupes = new Map(d.groupes.map((g) => [g.id, g]));
  const groupeDe = new Map(d.ingredients.map((i) => [i.id, i.groupe]));
  const requis = new Map<string, string[]>();
  for (const c of d.cocktails) {
    const s = new Set<string>();
    for (const l of c.lignes) {
      if (l.optionnel) continue;
      const g = groupeDe.get(l.ingredient);
      if (g && !groupes.get(g)?.basique) s.add(g);
    }
    requis.set(c.id, [...s]);
  }
  return { groupes, groupeDe, requis };
}

/** Groupes manquants pour faire un cocktail avec ce bar. */
export function manquants(idx: Index, cocktail: Cocktail, bar: Bar): string[] {
  return (idx.requis.get(cocktail.id) ?? []).filter((g) => !bar.has(g));
}

export type Classement = { faisables: Cocktail[]; aUnPres: Cocktail[]; autres: Cocktail[] };

/** Range les cocktails en trois listes : faisables, à 1 ingrédient près, autres. */
export function classer(idx: Index, cocktails: Cocktail[], bar: Bar): Classement {
  const res: Classement = { faisables: [], aUnPres: [], autres: [] };
  for (const c of cocktails) {
    const n = manquants(idx, c, bar).length;
    (n === 0 ? res.faisables : n === 1 ? res.aUnPres : res.autres).push(c);
  }
  return res;
}

export type Achat = { groupe: string; debloques: Cocktail[] };

/**
 * « Quoi acheter ensuite » : pour chaque groupe manquant, les cocktails qu'il rend
 * faisables à lui seul. Trié du plus au moins utile ; les groupes qui ne débloquent rien sont omis.
 */
export function quoiAcheter(idx: Index, cocktails: Cocktail[], bar: Bar): Achat[] {
  const par = new Map<string, Cocktail[]>();
  for (const c of cocktails) {
    const m = manquants(idx, c, bar);
    if (m.length === 1) par.set(m[0], [...(par.get(m[0]) ?? []), c]);
  }
  return [...par]
    .map(([groupe, debloques]) => ({ groupe, debloques }))
    .sort((a, b) => b.debloques.length - a.debloques.length || nomDe(idx, a.groupe).localeCompare(nomDe(idx, b.groupe), "fr"));
}

export const estSoft = (idx: Index, g: string) => idx.groupes.get(g)?.categorie === "soft";
const nomDe = (idx: Index, g: string) => idx.groupes.get(g)?.nom ?? g;

export type EtapeBarIdeal = { groupe: string; total: number; nouveaux: Cocktail[] };
export type BarIdeal = { etapes: EtapeBarIdeal[]; softs: string[]; faisables: Cocktail[] };

/**
 * « Mon bar idéal à N bouteilles » : algorithme glouton. À chaque étape, on ajoute la
 * bouteille (hors softs) qui rend le plus de cocktails faisables. Les softs ne comptent pas
 * dans N : ils sont supposés achetés, et listés en annexe (ceux qu'utilisent les cocktails faisables).
 * À égalité, on préfère la bouteille la plus demandée par les cocktails pas encore faisables,
 * pour préparer les étapes suivantes ; puis l'ordre alphabétique (résultat déterministe).
 */
export function barIdeal(idx: Index, cocktails: Cocktail[], n: number, depart: Bar = new Set()): BarIdeal {
  const bar = new Set(depart);
  const avecSofts = (b: Set<string>) => ({ has: (g: string) => b.has(g) || estSoft(idx, g) });
  const faisablesAvec = (b: Set<string>) => cocktails.filter((c) => manquants(idx, c, avecSofts(b) as Bar).length === 0);
  const candidats = [...new Set(cocktails.flatMap((c) => idx.requis.get(c.id) ?? []))].filter((g) => !estSoft(idx, g));

  const etapes: EtapeBarIdeal[] = [];
  let actuels = faisablesAvec(bar);
  for (let k = 0; k < n; k++) {
    let meilleur: { g: string; total: number; demande: number } | null = null;
    const pasFaisables = cocktails.filter((c) => !actuels.includes(c));
    for (const g of candidats) {
      if (bar.has(g)) continue;
      bar.add(g);
      const total = faisablesAvec(bar).length;
      bar.delete(g);
      const demande = pasFaisables.filter((c) => idx.requis.get(c.id)?.includes(g)).length;
      if (
        !meilleur ||
        total > meilleur.total ||
        (total === meilleur.total && (demande > meilleur.demande || (demande === meilleur.demande && nomDe(idx, g).localeCompare(nomDe(idx, meilleur.g), "fr") < 0)))
      ) meilleur = { g, total, demande };
    }
    if (!meilleur) break;
    bar.add(meilleur.g);
    const suivants = faisablesAvec(bar);
    etapes.push({ groupe: meilleur.g, total: suivants.length, nouveaux: suivants.filter((c) => !actuels.includes(c)) });
    actuels = suivants;
  }
  const softs = [...new Set(actuels.flatMap((c) => idx.requis.get(c.id) ?? []).filter((g) => estSoft(idx, g)))].sort((a, b) => nomDe(idx, a).localeCompare(nomDe(idx, b), "fr"));
  return { etapes, softs, faisables: actuels };
}

/** Alcools de base d'un cocktail (pour le filtre de l'écran Cocktails). */
export function alcoolsDeBase(idx: Index, cocktail: Cocktail): string[] {
  return (idx.requis.get(cocktail.id) ?? []).filter((g) => idx.groupes.get(g)?.categorie === "alcool de base");
}

/** Groupes (non basiques) classés par nombre de cocktails qui les demandent, du plus au moins utilisé. */
export function plusUtilises(idx: Index, n: number): string[] {
  const compte = new Map<string, number>();
  for (const gs of idx.requis.values()) for (const g of gs) compte.set(g, (compte.get(g) ?? 0) + 1);
  return [...compte]
    .sort((a, b) => b[1] - a[1] || nomDe(idx, a[0]).localeCompare(nomDe(idx, b[0]), "fr"))
    .slice(0, n)
    .map(([g]) => g);
}

/** Nombre de cocktails qui deviennent faisables en ajoutant ce groupe au bar (0 s'il y est déjà). */
export function gainSiAjoute(idx: Index, cocktails: Cocktail[], bar: Bar, groupe: string): number {
  if (bar.has(groupe)) return 0;
  return cocktails.filter((c) => { const m = manquants(idx, c, bar); return m.length === 1 && m[0] === groupe; }).length;
}
