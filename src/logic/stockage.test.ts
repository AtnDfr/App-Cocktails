import { describe, expect, it } from "vitest";
import { ecrireBar, lireBar } from "./stockage.ts";

const memoire = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }; };

describe("stockage du bar", () => {
  it("relit ce qui a été écrit", () => {
    const s = memoire();
    ecrireBar(new Set(["gin", "campari"]), s);
    expect([...lireBar(new Set(["gin", "campari", "vodka"]), s)].sort()).toEqual(["campari", "gin"]);
  });
  it("ignore les groupes qui n'existent plus et les données corrompues", () => {
    const s = memoire();
    s.setItem("app-cocktails:bar:v1", JSON.stringify(["gin", "ancien", 3]));
    expect([...lireBar(new Set(["gin"]), s)]).toEqual(["gin"]);
    s.setItem("app-cocktails:bar:v1", "{pas du json");
    expect(lireBar(new Set(["gin"]), s).size).toBe(0);
  });
  it("ne plante pas sans stockage", () => {
    const casse = { getItem: () => { throw new Error("bloqué"); }, setItem: () => { throw new Error("bloqué"); } };
    expect(lireBar(new Set(["gin"]), casse).size).toBe(0);
    expect(() => ecrireBar(new Set(["gin"]), casse)).not.toThrow();
  });
});
