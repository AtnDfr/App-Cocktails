import { manquants } from "../logic/bar.ts";
import { useBar } from "./contexte.tsx";
import { lien } from "./routes.ts";

export function FicheCocktail({ id }: { id: string }) {
  const { cocktail, ingredient, idx, bar, basculer, nomGroupe } = useBar();
  const c = cocktail(id);
  if (!c) return <section><h1>Cocktail introuvable</h1><p><a href={lien.cocktails}>Retour aux cocktails</a></p></section>;
  const m = manquants(idx, c, bar);

  return (
    <section className="fiche">
      <p><a href={lien.cocktails} onClick={(e) => { if (history.length > 1) { e.preventDefault(); history.back(); } }}>← Retour</a></p>
      <header className="entete">
        <h1>{c.nom}</h1>
        <p className={m.length ? "statut manque" : "statut ok"}>
          {m.length === 0 ? "Faisable avec ton bar" : `Il te manque : ${m.map(nomGroupe).join(", ")}`}
        </p>
      </header>
      <dl className="infos">
        {c.verre && <><dt>Verre</dt><dd>{c.verre}</dd></>}
        {c.technique && <><dt>Technique</dt><dd>{c.technique}</dd></>}
        <dt>Source</dt><dd>{c.source}</dd>
      </dl>

      <h2>Ingrédients</h2>
      <table className="ingredients">
        <tbody>
          {c.lignes.map((l, i) => {
            const ing = ingredient(l.ingredient);
            const g = idx.groupeDe.get(l.ingredient)!;
            const groupe = idx.groupes.get(g);
            const absent = !groupe?.basique && !bar.has(g);
            return (
              <tr key={i} className={absent && !l.optionnel ? "absent" : ""}>
                <td className="dose">{l.ml !== null ? `${l.ml} ml` : l.texte}</td>
                <td>
                  {ing?.nom ?? l.ingredient}
                  {l.optionnel && <span className="etiquette">facultatif</span>}
                  {groupe?.basique && <span className="etiquette discrete">basique</span>}
                </td>
                <td className="action">
                  {!groupe?.basique && (
                    <button className="discret" onClick={() => basculer(g)} title={bar.has(g) ? "Retirer de mon bar" : "Ajouter à mon bar"}>
                      {bar.has(g) ? "✓ dans mon bar" : "+ j'en ai"}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h2>Préparation</h2>
      <ol className="etapes">{c.etapes.map((e, i) => <li key={i}>{e}</li>)}</ol>

      {c.garniture && <><h2>Garniture</h2><p>{c.garniture}</p></>}
    </section>
  );
}
