/** Données, index et bar partagés par tous les écrans. */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import brut from "../data/donnees.json";
import type { Cocktail, Donnees, Ingredient } from "../data/types.ts";
import { indexer, type Index } from "../logic/bar.ts";
import { ecrireBar, lireBar } from "../logic/stockage.ts";

const donnees = brut as Donnees;

type Contexte = {
  donnees: Donnees;
  idx: Index;
  ingredient: (id: string) => Ingredient | undefined;
  cocktail: (id: string) => Cocktail | undefined;
  nomGroupe: (id: string) => string;
  bar: ReadonlySet<string>;
  basculer: (groupe: string) => void;
  ajouter: (groupes: string[]) => void;
  vider: () => void;
};

const Ctx = createContext<Contexte | null>(null);

export function FournisseurBar({ children }: { children: ReactNode }) {
  const idx = useMemo(() => indexer(donnees), []);
  const [bar, setBar] = useState<ReadonlySet<string>>(() => lireBar(new Set(idx.groupes.keys())));
  useEffect(() => ecrireBar(bar), [bar]);

  const valeur = useMemo<Contexte>(() => {
    const ingredients = new Map(donnees.ingredients.map((i) => [i.id, i]));
    const cocktails = new Map(donnees.cocktails.map((c) => [c.id, c]));
    return {
      donnees,
      idx,
      ingredient: (id) => ingredients.get(id),
      cocktail: (id) => cocktails.get(id),
      nomGroupe: (id) => idx.groupes.get(id)?.nom ?? id,
      bar,
      basculer: (g) => setBar((b) => { const n = new Set(b); n.has(g) ? n.delete(g) : n.add(g); return n; }),
      ajouter: (gs) => setBar((b) => new Set([...b, ...gs])),
      vider: () => setBar(new Set()),
    };
  }, [bar, idx]);

  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>;
}

export function useBar(): Contexte {
  const c = useContext(Ctx);
  if (!c) throw new Error("useBar hors de FournisseurBar");
  return c;
}
