/** Normalise un texte pour la recherche : minuscules, sans accents. */
export function normaliser(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** « 1 cocktail », « 3 cocktails ». */
export function pluriel(n: number, mot: string, motPluriel = mot + "s"): string {
  return `${n} ${n > 1 ? motPluriel : mot}`;
}
