/**
 * Import unique de TheCocktailDB (API publique, clé de test « 1 ») → data/raw/thecocktaildb.json.
 * Les objets « drink » sont conservés intacts.
 */
import { assertRawAbsent, fetchText, sleep, writeRawOnce } from "./lib/http.ts";

const OUT = "data/raw/thecocktaildb.json";
const API = "https://www.thecocktaildb.com/api/json/v1/1/search.php?f=";

assertRawAbsent(OUT);

const byId = new Map<string, Record<string, unknown>>();
for (const c of "abcdefghijklmnopqrstuvwxyz0123456789") {
  const json = JSON.parse(await fetchText(API + c)) as { drinks: Record<string, unknown>[] | null };
  for (const d of json.drinks ?? []) byId.set(String(d.idDrink), d);
  await sleep(300);
}
const drinks = [...byId.values()].sort((a, b) => String(a.strDrink).localeCompare(String(b.strDrink)));
console.log(`${drinks.length} cocktails TheCocktailDB`);
writeRawOnce(OUT, { source: "TheCocktailDB", fetchedAt: new Date().toISOString(), count: drinks.length, drinks });
