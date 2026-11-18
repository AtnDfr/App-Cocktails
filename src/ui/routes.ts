/** Navigation par hash (#/bar, #/cocktails, #/cocktail/negroni…), compatible fichier local et GitHub Pages. */
import { useEffect, useState } from "react";

export type Route =
  | { ecran: "bar" }
  | { ecran: "cocktails" }
  | { ecran: "cocktail"; id: string; surprise: boolean }
  | { ecran: "acheter" }
  | { ecran: "ideal" };

export function lireRoute(hash: string): Route {
  const [chemin, requete = ""] = hash.replace(/^#/, "").split("?");
  const [, ecran, id] = chemin.split("/");
  if (ecran === "cocktail" && id) return { ecran: "cocktail", id: decodeURIComponent(id), surprise: requete.split("&").includes("surprise") };
  if (ecran === "cocktails" || ecran === "acheter" || ecran === "ideal") return { ecran };
  return { ecran: "bar" };
}

export const lien = {
  bar: "#/bar",
  cocktails: "#/cocktails",
  cocktail: (id: string) => `#/cocktail/${encodeURIComponent(id)}`,
  /** Fiche ouverte par « Surprends-moi » : affiche le bouton « Un autre ». */
  surprise: (id: string) => `#/cocktail/${encodeURIComponent(id)}?surprise`,
  acheter: "#/acheter",
  ideal: "#/ideal",
};

export function useRoute(): Route {
  const [route, setRoute] = useState(() => lireRoute(location.hash));
  useEffect(() => {
    const maj = () => { setRoute(lireRoute(location.hash)); window.scrollTo(0, 0); };
    addEventListener("hashchange", maj);
    return () => removeEventListener("hashchange", maj);
  }, []);
  return route;
}
