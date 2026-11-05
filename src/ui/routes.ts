/** Navigation par hash (#/bar, #/cocktails, #/cocktail/negroni…), compatible fichier local et GitHub Pages. */
import { useEffect, useState } from "react";

export type Route =
  | { ecran: "bar" }
  | { ecran: "cocktails" }
  | { ecran: "cocktail"; id: string }
  | { ecran: "acheter" }
  | { ecran: "ideal" };

export function lireRoute(hash: string): Route {
  const [, ecran, id] = hash.replace(/^#/, "").split("/");
  if (ecran === "cocktail" && id) return { ecran: "cocktail", id: decodeURIComponent(id) };
  if (ecran === "cocktails" || ecran === "acheter" || ecran === "ideal") return { ecran };
  return { ecran: "bar" };
}

export const lien = {
  bar: "#/bar",
  cocktails: "#/cocktails",
  cocktail: (id: string) => `#/cocktail/${encodeURIComponent(id)}`,
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
