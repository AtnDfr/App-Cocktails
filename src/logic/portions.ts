/**
 * Doses pour plusieurs personnes et tirage au hasard, en fonctions pures.
 * Règle : on ne multiplie que ce qui est chiffré. Les doses en ml sont multipliées ; une dose texte
 * qui commence par un nombre (« 6 branches ») reçoit « × n » ; les autres (« compléter ») restent telles quelles.
 * Rien n'est inventé (CLAUDE.md §2.3).
 */
import type { LigneRecette } from "../data/types.ts";

export const PORTIONS = [1, 2, 4, 6, 8] as const;

export function doseAffichee(l: Pick<LigneRecette, "ml" | "texte">, personnes: number): string {
  if (l.ml !== null) return `${l.ml * personnes} ml`;
  const t = l.texte ?? "";
  if (personnes > 1 && /^[\d½¼¾⅓⅔]/.test(t)) return `${t} × ${personnes}`;
  return t;
}

/** Choisit un élément au hasard, en évitant `sauf` quand c'est possible. `alea` ∈ [0, 1[ (injectable pour les tests). */
export function auHasard<T>(liste: readonly T[], sauf?: T, alea: () => number = Math.random): T | undefined {
  const choix = liste.length > 1 && sauf !== undefined ? liste.filter((x) => x !== sauf) : liste;
  if (!choix.length) return undefined;
  return choix[Math.floor(alea() * choix.length)];
}
