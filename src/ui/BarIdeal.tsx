import { useMemo, useState } from "react";
import { barIdeal } from "../logic/bar.ts";
import { useBar } from "./contexte.tsx";
import { lien } from "./routes.ts";
import { pluriel } from "./texte.ts";

const MAX = 40;

export function BarIdeal() {
  const { donnees, idx, bar, nomGroupe, ajouter } = useBar();
  const [n, setN] = useState(15);
  const [depuisMonBar, setDepuisMonBar] = useState(false);
  const [copie, setCopie] = useState(false);
  const r = useMemo(() => barIdeal(idx, donnees.cocktails, n, depuisMonBar ? bar : new Set()), [idx, donnees, n, depuisMonBar, bar]);
  const total = donnees.cocktails.length;
  const changerN = (v: number) => setN(Math.max(1, Math.min(MAX, v)));

  const aAcheter = r.etapes.filter((e) => !bar.has(e.groupe)).map((e) => nomGroupe(e.groupe));
  const softsAAcheter = r.softs.filter((g) => !bar.has(g)).map(nomGroupe);

  async function copierListe() {
    const texte = [
      `Liste de courses (bar idéal à ${pluriel(r.etapes.length, "bouteille")}, ${pluriel(r.faisables.length, "cocktail")}) :`,
      ...aAcheter.map((x) => `- ${x}`),
      ...(softsAAcheter.length ? ["", "Softs :", ...softsAAcheter.map((x) => `- ${x}`)] : []),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(texte);
      setCopie(true);
      setTimeout(() => setCopie(false), 2500);
    } catch {
      prompt("Copie cette liste :", texte);
    }
  }

  return (
    <section className="ideal-page">
      <header className="entete">
        <h1>Mon bar idéal</h1>
      </header>
      <p className="aide">
        La version automatique du « livre à 15 ingrédients » : on ajoute à chaque fois la bouteille qui permet le plus de nouveaux cocktails.
        Les softs ne comptent pas dans le nombre de bouteilles ; ceux qui sont nécessaires sont listés à la fin.
      </p>

      <div className="ideal-haut">
        <div className="bloc reglage">
          <span className="etiquette-reglage">Nombre de bouteilles</span>
          <div className="compteur">
            <button className="rond" onClick={() => changerN(n - 1)} disabled={n <= 1} aria-label="Une bouteille de moins">−</button>
            <span className="valeur">{n}</span>
            <button className="rond" onClick={() => changerN(n + 1)} disabled={n >= MAX} aria-label="Une bouteille de plus">+</button>
          </div>
          <input type="range" min={1} max={MAX} value={n} onChange={(e) => changerN(Number(e.target.value))} aria-label="Nombre de bouteilles" />
          <label className="interrupteur">
            <input type="checkbox" checked={depuisMonBar} onChange={(e) => setDepuisMonBar(e.target.checked)} />
            Partir de mon bar actuel {bar.size > 0 && `(${pluriel(bar.size, "ingrédient")})`}
          </label>
        </div>

        <div className="bloc resultat">
          <span className="grand-nombre">{r.faisables.length}</span>
          <span>
            cocktails possibles sur {total}
            <br />
            avec {pluriel(r.etapes.length, "bouteille")}{depuisMonBar && bar.size ? " de plus que ton bar" : ""}
          </span>
          <div className="jauge" aria-hidden><div style={{ width: `${(100 * r.faisables.length) / total}%` }} /></div>
        </div>
      </div>

      <h2>Les bouteilles, dans l'ordre d'achat</h2>
      <ol className="etapes-ideal">
        {r.etapes.map((e, i) => {
          const possede = bar.has(e.groupe);
          return (
            <li key={e.groupe} className={possede ? "etape-ideal possede" : "etape-ideal"}>
              <span className="rang">{i + 1}</span>
              <div className="etape-corps">
                <div className="etape-titre">
                  <strong>{nomGroupe(e.groupe)}</strong>
                  {possede && <span className="etiquette discrete">déjà dans ton bar</span>}
                  <span className={e.nouveaux.length ? "gain" : "gain nul"}>+{e.nouveaux.length}</span>
                  <span className="cumul" title="Total de cocktails possibles à cette étape">
                    <span className="mini-jauge"><span style={{ width: `${(100 * e.total) / Math.max(1, r.faisables.length)}%` }} /></span>
                    {e.total}
                  </span>
                </div>
                {e.nouveaux.length ? (
                  <div className="puces">
                    {e.nouveaux.map((c) => <a key={c.id} className="puce lien" href={lien.cocktail(c.id)}>{c.nom}</a>)}
                  </div>
                ) : (
                  <p className="vide">Aucun nouveau cocktail seul : elle prépare les suivants.</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {r.softs.length > 0 && (
        <div className="bloc softs">
          <h2>Softs à prévoir</h2>
          <div className="puces">{r.softs.map((g) => <span key={g} className={bar.has(g) ? "puce ok" : "puce neutre"}>{nomGroupe(g)}</span>)}</div>
        </div>
      )}

      <div className="barre-outils actions-ideal">
        <button onClick={copierListe} disabled={!aAcheter.length && !softsAAcheter.length}>{copie ? "Liste copiée ✓" : "Copier la liste de courses"}</button>
        <button className="discret" onClick={() => ajouter([...r.etapes.map((e) => e.groupe), ...r.softs])}>Cocher toute cette liste dans mon bar</button>
      </div>
    </section>
  );
}
