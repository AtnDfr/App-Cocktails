/** Sauvegarde du bar dans le navigateur (localStorage), sans jamais planter si le stockage est indisponible. */
const CLE = "app-cocktails:bar:v1";

export function lireBar(groupesConnus: ReadonlySet<string>, stockage: Pick<Storage, "getItem"> | undefined = globalThis.localStorage): Set<string> {
  try {
    const brut = stockage?.getItem(CLE);
    const liste = brut ? JSON.parse(brut) : [];
    return new Set(Array.isArray(liste) ? liste.filter((g) => typeof g === "string" && groupesConnus.has(g)) : []);
  } catch {
    return new Set();
  }
}

export function ecrireBar(bar: ReadonlySet<string>, stockage: Pick<Storage, "setItem"> | undefined = globalThis.localStorage): void {
  try {
    stockage?.setItem(CLE, JSON.stringify([...bar].sort()));
  } catch {
    /* stockage indisponible (navigation privée…) : le bar reste en mémoire */
  }
}
