import { duos, estSoft, quoiAcheter, type Achat } from "../logic/bar.ts";
import { useBar } from "./contexte.tsx";
import { lien } from "./routes.ts";
import { pluriel } from "./texte.ts";
import type { Cocktail } from "../data/types.ts";

const NB_SEULS = 6;

export function QuoiAcheter() {
  const { donnees, idx, bar, nomGroupe, basculer, ajouter } = useBar();
  const achats = quoiAcheter(idx, donnees.cocktails, bar);
  const bouteilles = achats.filter((a) => !estSoft(idx, a.groupe)).slice(0, NB_SEULS);
  const softs = achats.filter((a) => estSoft(idx, a.groupe));
  const paires = duos(idx, donnees.cocktails, bar, 8);

  const pastilles = (cs: Cocktail[]) => (
    <div className="puces">{cs.map((c) => <a key={c.id} className="puce lien" href={lien.cocktail(c.id)}>{c.nom}</a>)}</div>
  );

  if (bar.size === 0) {
    return (
      <section className="acheter-page">
        <header className="entete"><h1>Quoi acheter</h1></header>
        <p className="aide">
          Commence par <a href={lien.bar}>cocher ce que tu as dans ton bar</a> : cet écran te dira ensuite quoi acheter pour faire le plus de nouveaux cocktails.
          Pour partir de zéro, regarde plutôt <a href={lien.ideal}>le bar idéal</a>.
        </p>
      </section>
    );
  }

  return (
    <section className="acheter-page">
      <header className="entete"><h1>Quoi acheter</h1></header>
      <p className="aide">Ce qui te rapporte le plus de nouveaux cocktails, à partir de ton bar actuel.</p>

      <h2>Un seul achat</h2>
      {bouteilles.length === 0 ? (
        <p className="vide">Aucune bouteille ne débloque à elle seule un nouveau cocktail : regarde les duos ci-dessous.</p>
      ) : (
        <ol className="achats-grille">
          {bouteilles.map((a, i) => (
            <li key={a.groupe} className="bloc achat">
              <div className="achat-tete">
                <span className="rang">{i + 1}</span>
                <strong>{nomGroupe(a.groupe)}</strong>
                <span className="gain">+{a.debloques.length}</span>
              </div>
              {pastilles(a.debloques)}
              <button className="bascule" onClick={() => basculer(a.groupe)}>+ Je l'ai acheté</button>
            </li>
          ))}
        </ol>
      )}

      {softs.length > 0 && <Softs achats={softs} />}

      <h2>Les bons duos</h2>
      <p className="aide">Deux achats qui, ensemble, débloquent des cocktails qu'aucun des deux ne permet seul.</p>
      {paires.length === 0 ? (
        <p className="vide">Aucun duo à proposer avec ton bar actuel.</p>
      ) : (
        <ol className="duos">
          {paires.map((d) => (
            <li key={d.groupes.join()} className="bloc duo">
              <div className="duo-tete">
                <span className="duo-noms">
                  <strong>{nomGroupe(d.groupes[0])}</strong>
                  <span className="plus">+</span>
                  <strong>{nomGroupe(d.groupes[1])}</strong>
                </span>
                <span className="gain">+{d.ensemble.length}</span>
                <button className="bascule" onClick={() => ajouter([...d.groupes])}>+ J'ai acheté les deux</button>
              </div>
              {pastilles(d.ensemble)}
            </li>
          ))}
        </ol>
      )}
    </section>
  );

  function Softs({ achats }: { achats: Achat[] }) {
    return (
      <div className="bloc softs-achat">
        <h3>Côté softs</h3>
        <ul className="softs-liste">
          {achats.map((a) => (
            <li key={a.groupe}>
              <span><strong>{nomGroupe(a.groupe)}</strong> <span className="gain">+{a.debloques.length}</span></span>
              <span className="detail">{a.debloques.map((c, i) => <span key={c.id}>{i > 0 && ", "}<a href={lien.cocktail(c.id)}>{c.nom}</a></span>)}</span>
            </li>
          ))}
        </ul>
        <p className="vide">{pluriel(achats.length, "soft")} à un achat de nouveaux cocktails.</p>
      </div>
    );
  }
}
