import { describe, expect, it } from "vitest";
import { auHasard, doseAffichee } from "./portions.ts";

describe("doseAffichee", () => {
  it("multiplie les doses en ml", () => {
    expect(doseAffichee({ ml: 30, texte: null }, 1)).toBe("30 ml");
    expect(doseAffichee({ ml: 25, texte: null }, 4)).toBe("100 ml");
  });
  it("ajoute « × n » aux doses texte chiffrées", () => {
    expect(doseAffichee({ ml: null, texte: "6 branches" }, 2)).toBe("6 branches × 2");
    expect(doseAffichee({ ml: null, texte: "½ rondelle" }, 4)).toBe("½ rondelle × 4");
    expect(doseAffichee({ ml: null, texte: "6 branches" }, 1)).toBe("6 branches");
  });
  it("laisse intactes les doses non chiffrables", () => {
    expect(doseAffichee({ ml: null, texte: "compléter" }, 4)).toBe("compléter");
    expect(doseAffichee({ ml: null, texte: "quelques gouttes (facultatif)" }, 2)).toBe("quelques gouttes (facultatif)");
  });
});

describe("auHasard", () => {
  it("tire un élément selon l'aléa", () => {
    expect(auHasard(["a", "b", "c"], undefined, () => 0)).toBe("a");
    expect(auHasard(["a", "b", "c"], undefined, () => 0.99)).toBe("c");
  });
  it("évite l'élément exclu quand il y a le choix", () => {
    for (const r of [0, 0.5, 0.99]) expect(auHasard(["a", "b"], "a", () => r)).toBe("b");
    expect(auHasard(["a"], "a", () => 0)).toBe("a");
  });
  it("renvoie undefined sur une liste vide", () => {
    expect(auHasard([], undefined, () => 0)).toBeUndefined();
  });
});
