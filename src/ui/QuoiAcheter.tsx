import { estSoft, quoiAcheter, type Achat } from "../logic/bar.ts";
import { useBar } from "./contexte.tsx";
import { lien } from "./routes.ts";
import { pluriel } from "./texte.ts";

export function QuoiAcheter() {
  const { donnees, idx, bar, nomGroupe, basculer } = useBar();
  const achats = quoiAcheter(idx, donnees.cocktails, bar);
  const bouteilles = achats.filter((a) => !estSoft(idx, a.groupe));
  const softs = achats.filter((a) => estSoft(idx, a.groupe));

  return (
    <section>
      <header className="entete">
        <h1>Quoi acheter ensuite</h1>
      </header>
      <p className="aide">Chaque achat est classé selon le nombre de nouveaux cocktails qu'il permet de faire, à lui seul, avec ton bar actuel.</p>
      <Bloc titre="Bouteilles et ingrédients" achats={bouteilles} />
      <Bloc titre="Softs" achats={softs} />
    </section>
  );

  function Bloc({ titre, achats }: { titre: string; achats: Achat[] }) {
    return (
      <div className="liste">
        <h2>{titre}</h2>
        {achats.length === 0 ? <p className="vide">Rien à proposer : coche d'abord quelques ingrédients dans <a href={lien.bar}>ton bar</a>.</p> : (
          <ol className="achats">
            {achats.slice(0, 30).map((a) => (
              <li key={a.groupe}>
                <div className="ligne-achat">
                  <strong>+ {nomGroupe(a.groupe)}</strong>
                  <span className="gain">{pluriel(a.debloques.length, "cocktail")}</span>
                  <button className="discret" onClick={() => basculer(a.groupe)}>Je l'ai acheté</button>
                </div>
                <p className="detail">
                  → {a.debloques.map((c, i) => <span key={c.id}>{i > 0 && ", "}<a href={lien.cocktail(c.id)}>{c.nom}</a></span>)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    );
  }
}
