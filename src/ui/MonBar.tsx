import { useMemo, useState } from "react";
import { CATEGORIES } from "../data/types.ts";
import { classer } from "../logic/bar.ts";
import { useBar } from "./contexte.tsx";
import { normaliser } from "./texte.ts";

const TITRES: Record<string, string> = {
  "alcool de base": "Alcools de base",
  liqueur: "Liqueurs, vermouths et apéritifs",
  soft: "Softs",
  frais: "Produits frais",
  placard: "Placard (sirops, bitters, épices…)",
};

export function MonBar() {
  const { donnees, idx, bar, basculer, vider } = useBar();
  const [recherche, setRecherche] = useState("");

  // Marques / variantes rencontrées dans les recettes, pour que la recherche « Cointreau » trouve « Triple sec ».
  const marques = useMemo(() => {
    const m = new Map<string, string>();
    for (const i of donnees.ingredients) if (i.id !== i.groupe) m.set(i.groupe, `${m.get(i.groupe) ?? ""} ${i.nom}`);
    return m;
  }, [donnees]);

  const faisables = classer(idx, donnees.cocktails, bar).faisables.length;
  const q = normaliser(recherche);
  const groupes = donnees.groupes.filter((g) => !g.basique && (!q || normaliser(g.nom + " " + (marques.get(g.id) ?? "")).includes(q)));
  const basiques = donnees.groupes.filter((g) => g.basique).map((g) => g.nom.toLowerCase());

  return (
    <section>
      <header className="entete">
        <h1>Mon bar</h1>
        <p className="resume">
          <strong>{bar.size}</strong> ingrédient{bar.size > 1 ? "s" : ""} coché{bar.size > 1 ? "s" : ""} ·{" "}
          <a href="#/cocktails"><strong>{faisables}</strong> cocktail{faisables > 1 ? "s" : ""} faisable{faisables > 1 ? "s" : ""}</a>
        </p>
      </header>
      <p className="aide">
        Coche ce que tu as. Une marque compte pour son générique : n'importe quel triple sec suffit pour une recette au Cointreau.
        Toujours considérés comme disponibles : {basiques.join(", ")}.
      </p>
      <div className="barre-outils">
        <input type="search" placeholder="Rechercher un ingrédient…" value={recherche} onChange={(e) => setRecherche(e.target.value)} autoFocus />
        {bar.size > 0 && <button className="discret" onClick={() => confirm("Tout décocher ?") && vider()}>Tout décocher</button>}
      </div>
      {CATEGORIES.map((cat) => {
        const liste = groupes.filter((g) => g.categorie === cat).sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
        if (!liste.length) return null;
        const coches = liste.filter((g) => bar.has(g.id)).length;
        return (
          <div key={cat} className="categorie">
            <h2>{TITRES[cat]} <span className="compte">{coches}/{liste.length}</span></h2>
            <ul className="cases">
              {liste.map((g) => (
                <li key={g.id}>
                  <label className={bar.has(g.id) ? "coche" : ""}>
                    <input type="checkbox" checked={bar.has(g.id)} onChange={() => basculer(g.id)} />
                    <span className="nom">{g.nom}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {groupes.length === 0 && <p className="vide">Aucun ingrédient ne correspond à « {recherche} ».</p>}
    </section>
  );
}
