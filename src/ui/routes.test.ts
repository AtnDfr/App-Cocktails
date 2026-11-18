import { describe, expect, it } from "vitest";
import { lien, lireRoute } from "./routes.ts";

describe("routes", () => {
  it("lit les écrans et les fiches", () => {
    expect(lireRoute("#/cocktails")).toEqual({ ecran: "cocktails" });
    expect(lireRoute(lien.cocktail("negroni"))).toEqual({ ecran: "cocktail", id: "negroni", surprise: false });
    expect(lireRoute(lien.surprise("negroni"))).toEqual({ ecran: "cocktail", id: "negroni", surprise: true });
    expect(lireRoute("")).toEqual({ ecran: "bar" });
  });
});
