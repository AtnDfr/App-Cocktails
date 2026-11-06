import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, type Groupe } from "../data/types.ts";
import { classer, gainSiAjoute, plusUtilises } from "../logic/bar.ts";
import { exporterBar, importerBar } from "../logic/stockage.ts";
import { useBar } from "./contexte.tsx";
import { lien } from "./routes.ts";
import { normaliser, pluriel } from "./texte.ts";

const TITRES: Record<string, string> = {
  "alcool de base": "Alcools de base",
  liqueur: "Liqueurs, vermouths et apéritifs",
  soft: "Softs",
  frais: "Produits frais",
  placard: "Placard (sirops, bitters, épices…)",
};

export function MonBar() {
  const { donnees, idx, bar, basculer, remplacer, vider } = useBar();
  const [recherche, setRecherche] = useState("");
  const [seulementMonBar, setSeulementMonBar] = useState(false);
  const [message, setMessage] = useState<{ texte: string; id: number } | null>(null);
  const champ = useRef<HTMLInputElement>(null);
  const fichier = useRef<HTMLInputElement>(null);

  // Marques / variantes rencontrées dans les recettes, pour que la recherche « Cointreau » trouve « Triple sec ».
  const marques = useMemo(() => {
    const m = new Map<string, string>();
    for (const i of donnees.ingredients) if (i.id !== i.groupe) m.set(i.groupe, `${m.get(i.groupe) ?? ""} ${i.nom}`);
    return m;
  }, [donnees]);
  const courants = useMemo(() => plusUtilises(idx, 12), [idx]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 3500);
    return () => clearTimeout(t);
  }, [message]);

  const informer = (texte: string) => setMessage({ texte, id: Date.now() });

  /** Coche ou décoche, et dit ce que l'ajout débloque. */
  function cocher(g: Groupe) {
    if (!bar.has(g.id)) {
      const n = gainSiAjoute(idx, donnees.cocktails, bar, g.id);
      informer(n ? `${g.nom} : ${pluriel(n, "cocktail")} de plus` : `${g.nom} ajouté à ton bar`);
    }
    basculer(g.id);
  }

  const faisables = classer(idx, donnees.cocktails, bar).faisables.length;
  const q = normaliser(recherche);
  const visibles = donnees.groupes
    .filter((g) => !g.basique)
    .filter((g) => !seulementMonBar || bar.has(g.id))
    .filter((g) => !q || normaliser(g.nom + " " + (marques.get(g.id) ?? "")).includes(q))
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  const basiques = donnees.groupes.filter((g) => g.basique).map((g) => g.nom.toLowerCase());
  const afficherCourants = !q && !seulementMonBar;

  function valider(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && q && visibles.length) {
      // Entrée : coche le premier résultat et vide la recherche, pour enchaîner au clavier.
      // Priorité : nom exact, puis nom qui commence par la recherche, puis le reste ; d'abord ce qui n'est pas encore coché.
      const rang = (v: Groupe) => (normaliser(v.nom) === q ? 0 : normaliser(v.nom).startsWith(q) ? 1 : 2) + (bar.has(v.id) ? 3 : 0);
      const g = [...visibles].sort((a, b) => rang(a) - rang(b))[0];
      if (!bar.has(g.id)) cocher(g);
      else informer(`${g.nom} est déjà dans ton bar`);
      setRecherche("");
    } else if (e.key === "Escape") setRecherche("");
  }

  function sauvegarder() {
    const url = URL.createObjectURL(new Blob([exporterBar(bar)], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "mon-bar.json" });
    a.click();
    URL.revokeObjectURL(url);
  }

  async function restaurer(f: File | undefined) {
    if (!f) return;
    try {
      const nouveau = importerBar(await f.text(), new Set(idx.groupes.keys()));
      if (bar.size && !confirm(`Remplacer ton bar actuel (${pluriel(bar.size, "ingrédient")}) par la sauvegarde (${pluriel(nouveau.size, "ingrédient")}) ?`)) return;
      remplacer(nouveau);
      informer(`Bar restauré : ${pluriel(nouveau.size, "ingrédient")}`);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      if (fichier.current) fichier.current.value = "";
    }
  }

  const caseIngredient = (g: Groupe) => (
    <li key={g.id}>
      <label className={bar.has(g.id) ? "coche" : ""}>
        <input type="checkbox" checked={bar.has(g.id)} onChange={() => cocher(g)} />
        <span className="nom">{g.nom}</span>
      </label>
    </li>
  );

  return (
    <section>
      <header className="entete">
        <h1>Mon bar</h1>
        <p className="resume">
          <strong>{pluriel(bar.size, "ingrédient")}</strong> · <a href={lien.cocktails}><strong>{pluriel(faisables, "cocktail faisable", "cocktails faisables")}</strong></a>
        </p>
      </header>
      <p className="aide">
        Coche ce que tu as. Une marque compte pour son générique : n'importe quel triple sec suffit pour une recette au Cointreau.
        Toujours considérés comme disponibles : {basiques.join(", ")}.
        Astuce : tape un nom puis Entrée pour le cocher directement.
      </p>

      <div className="barre-outils outils-bar">
        <input
          ref={champ}
          type="search"
          placeholder="Rechercher un ingrédient ou une marque…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          onKeyDown={valider}
          autoFocus
        />
        <label className="interrupteur">
          <input type="checkbox" checked={seulementMonBar} onChange={(e) => setSeulementMonBar(e.target.checked)} disabled={!bar.size} />
          Seulement ce que j'ai
        </label>
        {bar.size > 0 && <button className="discret" onClick={() => confirm("Tout décocher ?") && vider()}>Tout décocher</button>}
      </div>

      {afficherCourants && (
        <div className="categorie courants">
          <h2>Les plus courants <span className="compte">utilisés dans le plus de recettes</span></h2>
          <ul className="cases">{courants.map((id) => caseIngredient(idx.groupes.get(id)!))}</ul>
        </div>
      )}

      {CATEGORIES.map((cat) => {
        const liste = visibles.filter((g) => g.categorie === cat);
        if (!liste.length) return null;
        const total = donnees.groupes.filter((g) => !g.basique && g.categorie === cat);
        const coches = total.filter((g) => bar.has(g.id)).length;
        return (
          <div key={cat} className="categorie">
            <h2>{TITRES[cat]} <span className="compte">{coches}/{total.length}</span></h2>
            <ul className="cases">{liste.map(caseIngredient)}</ul>
          </div>
        );
      })}
      {visibles.length === 0 && (
        <p className="vide">{q ? `Aucun ingrédient ne correspond à « ${recherche} ».` : "Ton bar est vide pour l'instant."}</p>
      )}

      <div className="sauvegarde">
        <h2>Sauvegarde</h2>
        <p className="aide">
          Ton bar est enregistré dans ce navigateur. Pour le garder en sécurité ou le retrouver sur un autre ordinateur, sauvegarde-le dans un fichier.
        </p>
        <div className="barre-outils">
          <button className="discret" onClick={sauvegarder} disabled={!bar.size}>Sauvegarder mon bar</button>
          <button className="discret" onClick={() => fichier.current?.click()}>Restaurer une sauvegarde…</button>
          <input ref={fichier} type="file" accept=".json,application/json" hidden onChange={(e) => restaurer(e.target.files?.[0])} />
        </div>
      </div>

      {message && <div key={message.id} className="toast" role="status">{message.texte}</div>}
    </section>
  );
}
