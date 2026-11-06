import { useMemo, useState } from "react";
import { barIdeal } from "../logic/bar.ts";
import { useBar } from "./contexte.tsx";
import { lien } from "./routes.ts";
import { pluriel } from "./texte.ts";

export function BarIdeal() {
  const { donnees, idx, bar, nomGroupe, ajouter } = useBar();
  const [n, setN] = useState(15);
  const [depuisMonBar, setDepuisMonBar] = useState(false);
  const r = useMemo(() => barIdeal(idx, donnees.cocktails, n, depuisMonBar ? bar : new Set()), [idx, donnees, n, depuisMonBar, bar]);

  return (
    <section>
      <header className="entete">
        <h1>Mon bar idéal</h1>
        <p className="resume"><strong>{r.faisables.length}</strong> cocktails avec {pluriel(r.etapes.length, "bouteille")}{depuisMonBar && bar.size ? " de plus" : ""}</p>
      </header>
      <p className="aide">
        La version automatique du « livre à 15 ingrédients » : on ajoute à chaque fois la bouteille qui permet le plus de nouveaux cocktails.
        Les softs ne comptent pas dans le nombre de bouteilles ; ceux qui sont nécessaires sont listés à la fin.
      </p>
      <div className="barre-outils">
        <label>Nombre de bouteilles : <input type="number" min={1} max={60} value={n} onChange={(e) => setN(Math.max(1, Math.min(60, Number(e.target.value) || 1)))} /></label>
        <input type="range" min={1} max={40} value={Math.min(n, 40)} onChange={(e) => setN(Number(e.target.value))} aria-label="Nombre de bouteilles" />
        <label><input type="checkbox" checked={depuisMonBar} onChange={(e) => setDepuisMonBar(e.target.checked)} /> Partir de mon bar actuel</label>
      </div>

      <table className="ideal">
        <thead><tr><th>#</th><th>Bouteille</th><th>Total</th><th>Nouveaux cocktails</th></tr></thead>
        <tbody>
          {r.etapes.map((e, i) => (
            <tr key={e.groupe} className={bar.has(e.groupe) ? "possede" : ""}>
              <td>{i + 1}</td>
              <td><strong>{nomGroupe(e.groupe)}</strong>{bar.has(e.groupe) && <span className="etiquette discrete">déjà dans mon bar</span>}</td>
              <td className="nombre">{e.total}</td>
              <td className="detail">{e.nouveaux.length ? e.nouveaux.map((c, j) => <span key={c.id}>{j > 0 && ", "}<a href={lien.cocktail(c.id)}>{c.nom}</a></span>) : <span className="vide">aucun pour l'instant, prépare la suite</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {r.softs.length > 0 && (
        <>
          <h2>Softs à prévoir</h2>
          <p>{r.softs.map(nomGroupe).join(", ")}</p>
        </>
      )}
      <p><button onClick={() => ajouter([...r.etapes.map((e) => e.groupe), ...r.softs])}>Cocher toute cette liste dans mon bar</button></p>
    </section>
  );
}
