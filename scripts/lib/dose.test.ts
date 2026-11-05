import { describe, expect, it } from "vitest";
import { parseDose, readNumber, roundMl, splitIbaLine } from "./dose.ts";

describe("readNumber", () => {
  it("lit entiers, décimaux, fractions", () => {
    expect(readNumber("2 oz")?.value).toBe(2);
    expect(readNumber("1.5 oz")?.value).toBe(1.5);
    expect(readNumber("1,5 cl")?.value).toBe(1.5);
    expect(readNumber("3/4 oz")?.value).toBe(0.75);
    expect(readNumber("1 1/2 oz")?.value).toBe(1.5);
    expect(readNumber("1½ oz")?.value).toBe(1.5);
    expect(readNumber("Top")).toBeNull();
  });
});

describe("roundMl", () => {
  it("garde les entiers", () => {
    expect(roundMl(30)).toBe(30);
    expect(roundMl(20)).toBe(20);
    expect(roundMl(3 * (1 / 3) * 30)).toBe(30);
  });
  it("arrondit les non-entiers au multiple de 5 supérieur", () => {
    expect(roundMl(22.5)).toBe(25);
    expect(roundMl(7.5)).toBe(10);
    expect(roundMl(52.5)).toBe(55);
    expect(roundMl(12.5)).toBe(15);
    expect(roundMl(3.75)).toBe(5);
  });
});

describe("parseDose", () => {
  it("oz → ml (1 oz = 30 ml)", () => {
    expect(parseDose("2 oz")).toMatchObject({ kind: "ml", ml: 60 });
    expect(parseDose("1 1/2 oz")).toMatchObject({ kind: "ml", ml: 45 });
    expect(parseDose("3/4 oz")).toMatchObject({ kind: "ml", ml: 25 }); // 22,5 → 25
    expect(parseDose("1/3 oz")).toMatchObject({ kind: "ml", ml: 10 });
  });
  it("cl et ml", () => {
    expect(parseDose("4 cl")).toMatchObject({ kind: "ml", ml: 40 });
    expect(parseDose("2.5 cl")).toMatchObject({ kind: "ml", ml: 25 });
    expect(parseDose("22.5 ml")).toMatchObject({ kind: "ml", ml: 25 });
    expect(parseDose("60ml")).toMatchObject({ kind: "ml", ml: 60 });
  });
  it("traits et cuillères de bar, sans arrondi à 5", () => {
    expect(parseDose("2 dashes")).toMatchObject({ kind: "ml", ml: 2 });
    expect(parseDose("1 dash")).toMatchObject({ kind: "ml", ml: 1 });
    expect(parseDose("Dash")).toMatchObject({ kind: "ml", ml: 1 });
    expect(parseDose("1 Bar Spoon")).toMatchObject({ kind: "ml", ml: 5 });
    expect(parseDose("2 Bar Spoons")).toMatchObject({ kind: "ml", ml: 10 });
  });
  it("fractions de cuillère de bar : à vérifier, jamais devinées", () => {
    expect(parseDose("1/4 Bar Spoon")).toMatchObject({ kind: "a_verifier" });
    expect(parseDose("1/2 Bar Spoon")).toMatchObject({ kind: "a_verifier" });
  });
  it("cuillères à café / soupe (hors cadrage, signalées)", () => {
    expect(parseDose("2 tsp")).toMatchObject({ kind: "ml", ml: 10, note: expect.any(String) });
    expect(parseDose("1 Tablespoon")).toMatchObject({ kind: "ml", ml: 15 });
  });
  it("unités non convertibles et plages : à vérifier", () => {
    expect(parseDose("1 shot")).toMatchObject({ kind: "a_verifier" });
    expect(parseDose("2 parts")).toMatchObject({ kind: "a_verifier" });
    expect(parseDose("1 cup")).toMatchObject({ kind: "a_verifier" });
    expect(parseDose("1-2 oz")).toMatchObject({ kind: "a_verifier" });
    expect(parseDose("90")).toMatchObject({ kind: "a_verifier" });
  });
  it("doses non chiffrables : texte", () => {
    expect(parseDose("Top")).toMatchObject({ kind: "texte" });
    expect(parseDose("Fill with")).toMatchObject({ kind: "texte" });
    expect(parseDose("Juice of 1")).toMatchObject({ kind: "texte" });
    expect(parseDose("1 twist of")).toMatchObject({ kind: "texte" });
    expect(parseDose("2")).toMatchObject({ kind: "texte" });
    expect(parseDose("")).toMatchObject({ kind: "texte" });
  });
});

describe("splitIbaLine", () => {
  it("détache dose et ingrédient", () => {
    expect(splitIbaLine("30 ml Bitter Campari")).toEqual({ measure: "30 ml", ingredient: "Bitter Campari" });
    expect(splitIbaLine("60ml Gin")).toEqual({ measure: "60ml", ingredient: "Gin" });
    expect(splitIbaLine("1 Bar Spoon Crème de Violette")).toEqual({ measure: "1 Bar Spoon", ingredient: "Crème de Violette" });
    expect(splitIbaLine("1/4 Bar Spoon of Absinthe")).toEqual({ measure: "1/4 Bar Spoon", ingredient: "Absinthe" });
    expect(splitIbaLine("2 Dashes Orange Bitters")).toEqual({ measure: "2 Dashes", ingredient: "Orange Bitters" });
  });
  it("nombre sans unité : dose à vérifier", () => {
    const r = splitIbaLine("90 Fresh Pineapple Juice");
    expect(r).toEqual({ measure: "90", ingredient: "Fresh Pineapple Juice" });
    expect(parseDose(r.measure).kind).toBe("a_verifier");
  });
  it("comptage et texte : la ligne entière sert de dose texte", () => {
    expect(splitIbaLine("1 Sugar Cube")).toEqual({ measure: "1 Sugar Cube", ingredient: "Sugar Cube" });
    expect(splitIbaLine("A splash of Soda Water").measure).toBe("A splash of Soda Water");
    expect(parseDose(splitIbaLine("Top with Cola").measure).kind).toBe("texte");
  });
});

describe("comptages IBA", () => {
  it("pièces, gouttes et plages restent en texte", () => {
    for (const l of ["10 pcs Italian Basil leaves", "5 drops Maraschino Luxardo", "3 to 4 pcs Pineapple Chunks", "6/8 pcs Mint Leaves", "2-3 quarter size sliced fresh ginger"]) {
      expect(parseDose(splitIbaLine(l).measure).kind, l).toBe("texte");
    }
    expect(splitIbaLine("10 pcs Italian Basil leaves").ingredient).toBe("Italian Basil leaves");
    expect(splitIbaLine("Few Dashes Angostura Bitters").ingredient).toBe("Angostura Bitters");
    expect(splitIbaLine("Top with Cola").ingredient).toBe("Cola");
  });
  it("plage sur des ml : à vérifier", () => {
    expect(parseDose("1-2 oz").kind).toBe("a_verifier");
  });
});
