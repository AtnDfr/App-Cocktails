import { useMemo, useState } from "react";
import type { Cocktail } from "../data/types.ts";
import { alcoolsDeBase, classer, manquants, quoiAcheter } from "../logic/bar.ts";
import { useBar } from "./contexte.tsx";
import { lien } from "./routes.ts";
import { normaliser, pluriel } from "./texte.ts";

export function Cocktails() {
  const { donnees, idx, bar, nomGroupe, basculer } = useBar();
  const [recherche, setRecherche] = useState("");
  const [alcool, setAlcool] = useState("");

  const alcools = useMemo(() => {
    const s = new Set(donnees.cocktails.flatMap((c) => alcoolsDeBase(idx, c)));
    return [...s].sort((a, b) => nomGroupe(a).localeCompare(nomGroupe(b), "fr"));
  }, [donnees, idx, nomGroupe]);

  const q = normaliser(recherche);
  const filtres = donnees.cocktails
    .filter((c) => !q || normaliser(c.nom).includes(q))
    .filter((c) => !alcool || alcoolsDeBase(idx, c).includes(alcool))
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  const { faisables, aUnPres, autres } = classer(idx, filtres, bar);
  // « À 1 ingrédient près », regroupé par ingrédient à acheter : les achats qui débloquent le plus de cocktails d'abord.
  const parAchat = quoiAcheter(idx, aUnPres, bar);

  return (
    <section>
      <header className="entete">
        <h1>Cocktails</h1>
        <p className="resume">{pluriel(donnees.cocktails.length, "recette")}</p>
      </header>
      <div className="barre-outils">
        <input type="search" placeholder="Rechercher un cocktail…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
        <select value={alcool} onChange={(e) => setAlcool(e.target.value)} aria-label="Filtrer par alcool de base">
          <option value="">Tous les alcools de base</option>
          {alcools.map((g) => <option key={g} value={g}>{nomGroupe(g)}</option>)}
        </select>
      </div>
      {bar.size === 0 && <p className="aide">Ton bar est vide : commence par <a href={lien.bar}>cocher tes ingrédients</a>.</p>}
      <Liste titre="Faisables" cocktails={faisables} vide="Aucun cocktail faisable avec ce bar pour l'instant." />
      <div className="liste">
        <h2>À 1 ingrédient près <span className="compte">{aUnPres.length}</span></h2>
        {parAchat.length === 0 && <p className="vide">Aucun.</p>}
        {parAchat.map((a) => (
          <div key={a.groupe} className="lot">
            <div className="lot-entete">
              <span>Avec <strong>{nomGroupe(a.groupe)}</strong>, tu pourrais faire {pluriel(a.debloques.length, "cocktail")} de plus</span>
              <button className="discret" onClick={() => basculer(a.groupe)}>J'en ai</button>
            </div>
            {cartes(a.debloques, false)}
          </div>
        ))}
      </div>
      <Liste titre="Les autres" cocktails={autres} vide="Aucun." replie />
    </section>
  );

  function cartes(cocktails: Cocktail[], afficherManque = true) {
    return (
      <ul className="cartes">
        {cocktails.map((c) => {
          const m = afficherManque ? manquants(idx, c, bar) : [];
          return (
            <li key={c.id}>
              <a className="carte" href={lien.cocktail(c.id)}>
                <span className="titre">{c.nom}</span>
                <span className="meta">{[c.technique, c.verre].filter(Boolean).join(" · ")}</span>
                {m.length > 0 && (
                  <span className="manque">
                    <span className="manque-titre">Il manque</span>
                    <span className="puces">{m.map((g) => <span key={g} className="puce">{nomGroupe(g)}</span>)}</span>
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    );
  }

  function Liste({ titre, cocktails, vide, replie }: { titre: string; cocktails: Cocktail[]; vide: string; replie?: boolean }) {
    const contenu = cocktails.length ? cartes(cocktails) : <p className="vide">{vide}</p>;
    return replie ? (
      <details className="liste">
        <summary><h2>{titre} <span className="compte">{cocktails.length}</span></h2></summary>
        {contenu}
      </details>
    ) : (
      <div className="liste">
        <h2>{titre} <span className="compte">{cocktails.length}</span></h2>
        {contenu}
      </div>
    );
  }
}
