import { manquants } from "../logic/bar.ts";
import { useBar } from "./contexte.tsx";
import { lien } from "./routes.ts";

const SOURCES: Record<string, string> = { IBA: "Recette officielle IBA", TheCocktailDB: "TheCocktailDB", manuel: "Recette perso" };

/** « Cointreau (triple sec) » → { principal: "Cointreau", precision: "triple sec" }. */
function decouper(nom: string): { principal: string; precision?: string } {
  const m = nom.match(/^(.*?)\s*\(([^()]*)\)$/);
  return m ? { principal: m[1], precision: m[2] } : { principal: nom };
}

export function FicheCocktail({ id }: { id: string }) {
  const { cocktail, ingredient, idx, bar, basculer, ajouter, nomGroupe } = useBar();
  const c = cocktail(id);
  if (!c) return <section><h1>Cocktail introuvable</h1><p><a href={lien.cocktails}>Retour aux cocktails</a></p></section>;
  const m = manquants(idx, c, bar);

  return (
    <article className="fiche">
      <a className="retour" href={lien.cocktails} onClick={(e) => { if (history.length > 1) { e.preventDefault(); history.back(); } }}>← Retour</a>

      <header className="fiche-entete">
        <h1>{c.nom}</h1>
        <ul className="pastilles">
          {c.technique && <li>{c.technique}</li>}
          {c.verre && <li>{c.verre}</li>}
          <li className="discrete">{SOURCES[c.source] ?? c.source}</li>
        </ul>
      </header>

      <div className={m.length ? "bandeau manque" : "bandeau ok"}>
        {m.length === 0 ? (
          <span><strong>Tu as tout ce qu'il faut.</strong> Ce cocktail est faisable avec ton bar.</span>
        ) : (
          <>
            <span>Il te manque <strong>{m.map(nomGroupe).join(", ")}</strong>.</span>
            <button className="discret" onClick={() => ajouter(m)}>{m.length > 1 ? "J'ai tout ça" : "J'en ai"}</button>
          </>
        )}
      </div>

      <div className="fiche-corps">
        <section className="bloc">
          <h2>Ingrédients</h2>
          <ul className="lignes">
            {c.lignes.map((l, i) => {
              const nom = decouper(ingredient(l.ingredient)?.nom ?? l.ingredient);
              const g = idx.groupeDe.get(l.ingredient)!;
              const basique = idx.groupes.get(g)?.basique;
              const present = basique || bar.has(g);
              const etat = present ? "present" : l.optionnel ? "facultatif" : "absent";
              return (
                <li key={i} className={`ligne ${etat}`}>
                  <span className="dose">{l.ml !== null ? <>{l.ml}<small> ml</small></> : l.texte}</span>
                  <span className="ingredient">
                    <span className="principal">{nom.principal}</span>
                    {nom.precision && <span className="precision">{nom.precision}</span>}
                    {l.optionnel && <span className="etiquette discrete">facultatif</span>}
                  </span>
                  <span className="etat">
                    {basique ? (
                      <span className="note" title="Toujours considéré comme disponible">toujours dispo</span>
                    ) : (
                      <button
                        className={present ? "bascule oui" : "bascule"}
                        onClick={() => basculer(g)}
                        title={present ? "Retirer de mon bar" : "Ajouter à mon bar"}
                      >
                        {present ? "✓ J'en ai" : "+ J'en ai"}
                      </button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="bloc">
          <h2>Préparation</h2>
          <ol className="etapes">{c.etapes.map((e, i) => <li key={i}>{e}</li>)}</ol>
          {c.garniture && (
            <div className="garniture">
              <h3>Garniture</h3>
              <p>{c.garniture}</p>
            </div>
          )}
        </section>
      </div>
    </article>
  );
}
