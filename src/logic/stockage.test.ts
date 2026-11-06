import { describe, expect, it } from "vitest";
import { ecrireBar, exporterBar, importerBar, lireBar } from "./stockage.ts";

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

describe("sauvegarde du bar dans un fichier", () => {
  it("relit ce qui a été exporté", () => {
    const f = exporterBar(new Set(["gin", "campari"]), new Date("2026-11-06T10:00:00Z"));
    expect(JSON.parse(f)).toMatchObject({ app: "bar-a-cocktails", version: 1, bar: ["campari", "gin"] });
    expect([...importerBar(f, new Set(["gin", "campari"]))].sort()).toEqual(["campari", "gin"]);
  });
  it("ignore les ingrédients qui n'existent plus", () => {
    expect([...importerBar(exporterBar(new Set(["gin", "ancien"])), new Set(["gin"]))]).toEqual(["gin"]);
  });
  it("refuse un fichier qui n'est pas une sauvegarde", () => {
    expect(() => importerBar("pas du json", new Set())).toThrow(/sauvegarde/);
    expect(() => importerBar('{"bar":["gin"]}', new Set(["gin"]))).toThrow(/sauvegarde/);
  });
});
