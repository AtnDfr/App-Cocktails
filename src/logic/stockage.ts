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

/** Contenu du fichier de sauvegarde du bar (« Sauvegarder mon bar »). */
export function exporterBar(bar: ReadonlySet<string>, date = new Date()): string {
  return JSON.stringify({ app: "bar-a-cocktails", version: 1, date: date.toISOString(), bar: [...bar].sort() }, null, 2);
}

/** Lit un fichier de sauvegarde ; ignore les groupes inconnus. Lève une erreur lisible si le fichier n'est pas valide. */
export function importerBar(texte: string, groupesConnus: ReadonlySet<string>): Set<string> {
  let o: unknown;
  try { o = JSON.parse(texte); } catch { throw new Error("Ce fichier n'est pas une sauvegarde de bar."); }
  const liste = (o as { app?: string; bar?: unknown })?.bar;
  if ((o as { app?: string })?.app !== "bar-a-cocktails" || !Array.isArray(liste)) throw new Error("Ce fichier n'est pas une sauvegarde de bar.");
  return new Set(liste.filter((g): g is string => typeof g === "string" && groupesConnus.has(g)));
}
