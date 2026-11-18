import { classer, manquants } from "../logic/bar.ts";
import { auHasard, doseAffichee, PORTIONS } from "../logic/portions.ts";
import { useBar } from "./contexte.tsx";
import { lien } from "./routes.ts";

const SOURCES: Record<string, string> = { IBA: "Recette officielle IBA", TheCocktailDB: "TheCocktailDB", manuel: "Recette perso" };

/** « Cointreau (triple sec) » → { principal: "Cointreau", precision: "triple sec" }. */
function decouper(nom: string): { principal: string; precision?: string } {
  const m = nom.match(/^(.*?)\s*\(([^()]*)\)$/);
  return m ? { principal: m[1], precision: m[2] } : { principal: nom };
}

export function FicheCocktail({ id, surprise = false }: { id: string; surprise?: boolean }) {
  const { donnees, cocktail, ingredient, idx, bar, basculer, ajouter, nomGroupe, personnes, setPersonnes } = useBar();
  const c = cocktail(id);
  if (!c) return <section><h1>Cocktail introuvable</h1><p><a href={lien.cocktails}>Retour aux cocktails</a></p></section>;
  const m = manquants(idx, c, bar);

  function unAutre() {
    const suivant = auHasard(classer(idx, donnees.cocktails, bar).faisables, c);
    if (suivant) location.hash = lien.surprise(suivant.id);
  }

  return (
    <article className="fiche">
      <div className="fiche-nav">
        <a className="retour" href={lien.cocktails} onClick={(e) => { if (!surprise && history.length > 1) { e.preventDefault(); history.back(); } }}>← {surprise ? "Cocktails" : "Retour"}</a>
        {surprise && <button className="discret" onClick={unAutre}>🎲 Un autre</button>}
      </div>

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
          <div className="bloc-tete">
            <h2>Ingrédients</h2>
            <div className="portions" role="group" aria-label="Nombre de personnes">
              {PORTIONS.map((p) => (
                <button key={p} className={p === personnes ? "actif" : ""} onClick={() => setPersonnes(p)} aria-pressed={p === personnes}>
                  {p === 1 ? "1 pers." : `×${p}`}
                </button>
              ))}
            </div>
          </div>
          {personnes > 1 && <p className="note-portions">Doses pour {personnes} personnes. Si tout ne tient pas dans le shaker ou le verre, prépare en plusieurs fois.</p>}
          <ul className="lignes">
            {c.lignes.map((l, i) => {
              const nom = decouper(ingredient(l.ingredient)?.nom ?? l.ingredient);
              const g = idx.groupeDe.get(l.ingredient)!;
              const basique = idx.groupes.get(g)?.basique;
              const present = basique || bar.has(g);
              const etat = present ? "present" : l.optionnel ? "facultatif" : "absent";
              return (
                <li key={i} className={`ligne ${etat}`}>
                  <span className="dose">{l.ml !== null ? <>{l.ml * personnes}<small> ml</small></> : doseAffichee(l, personnes)}</span>
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
