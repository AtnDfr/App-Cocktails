/**
 * Import unique de la liste officielle IBA (iba-world.com) → data/raw/iba.json.
 * Le texte d'origine est conservé tel quel (anglais, doses d'origine).
 */
import * as cheerio from "cheerio";
import { assertRawAbsent, fetchText, sleep, writeRawOnce } from "./lib/http.ts";

const OUT = "data/raw/iba.json";
const LIST = "https://iba-world.com/cocktails/all-cocktails/";

assertRawAbsent(OUT);

// 1. Collecter les URL de fiches sur toutes les pages de la liste.
const urls = new Set<string>();
for (let page = 1; page < 30; page++) {
  const url = page === 1 ? LIST : `${LIST}page/${page}/`;
  let html: string;
  try {
    html = await fetchText(url);
  } catch {
    break; // page inexistante : fin de la pagination
  }
  const before = urls.size;
  const $ = cheerio.load(html);
  $('a[href*="/iba-cocktail/"]').each((_, a) => {
    const href = $(a).attr("href");
    if (href) urls.add(href.split("#")[0]);
  });
  if (urls.size === before) break;
  await sleep(500);
}
console.log(`${urls.size} fiches IBA trouvées`);

// 2. Lire chaque fiche.
function section($: cheerio.CheerioAPI, title: string) {
  const h = $("h4").filter((_, el) => $(el).text().trim().toLowerCase() === title.toLowerCase()).first();
  const block = h.closest(".elementor-element").nextAll(".elementor-element").first();
  return block;
}

const cocktails = [];
for (const url of [...urls].sort()) {
  const $ = cheerio.load(await fetchText(url));
  const name = $("title").text().replace(/\s*[–-]\s*IBA\s*$/, "").trim();
  const ingredients = section($, "Ingredients").find("li").map((_, li) => $(li).text().trim()).get();
  const method = section($, "Method").find("p").map((_, p) => $(p).text().trim()).get().filter(Boolean);
  const garnish = section($, "Garnish").find("p").map((_, p) => $(p).text().trim()).get().filter(Boolean);
  const category = ($("body").attr("class") ?? "").match(/cocktail-category-([a-z-]+)/)?.[1] ?? null;
  cocktails.push({ name, url, category, ingredients, method, garnish });
  if (ingredients.length === 0) console.warn(`⚠ aucun ingrédient lu pour ${url}`);
  await sleep(400);
}

writeRawOnce(OUT, { source: "IBA", fetchedAt: new Date().toISOString(), count: cocktails.length, cocktails });
