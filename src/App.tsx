import { BarIdeal } from "./ui/BarIdeal.tsx";
import { Cocktails } from "./ui/Cocktails.tsx";
import { FicheCocktail } from "./ui/FicheCocktail.tsx";
import { MonBar } from "./ui/MonBar.tsx";
import { QuoiAcheter } from "./ui/QuoiAcheter.tsx";
import { useBar } from "./ui/contexte.tsx";
import { lien, useRoute } from "./ui/routes.ts";

const ONGLETS = [
  { ecran: "bar", href: lien.bar, label: "Mon bar" },
  { ecran: "cocktails", href: lien.cocktails, label: "Cocktails" },
  { ecran: "acheter", href: lien.acheter, label: "Quoi acheter" },
  { ecran: "ideal", href: lien.ideal, label: "Bar idéal" },
] as const;

export function App() {
  const route = useRoute();
  const { donnees } = useBar();
  const actif = route.ecran === "cocktail" ? "cocktails" : route.ecran;
  return (
    <>
      <nav className="nav">
        <a className="marque" href={lien.bar}>🍸 Mon bar à cocktails</a>
        <ul>
          {ONGLETS.map((o) => <li key={o.ecran}><a href={o.href} aria-current={actif === o.ecran ? "page" : undefined}>{o.label}</a></li>)}
        </ul>
      </nav>
      <main>
        {route.ecran === "bar" && <MonBar />}
        {route.ecran === "cocktails" && <Cocktails />}
        {route.ecran === "cocktail" && <FicheCocktail id={route.id} />}
        {route.ecran === "acheter" && <QuoiAcheter />}
        {route.ecran === "ideal" && <BarIdeal />}
      </main>
      <footer className="pied">
        {donnees.cocktails.length} recettes (IBA et TheCocktailDB) · données {__EMPREINTE_DONNEES__}
        {location.protocol !== "file:" && <> · <a href="bar-a-cocktails.html" download>Télécharger la version hors ligne</a></>}
      </footer>
    </>
  );
}
