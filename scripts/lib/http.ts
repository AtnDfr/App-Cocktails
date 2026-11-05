import { existsSync, writeFileSync } from "node:fs";

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Télécharge une URL en texte, avec quelques nouvelles tentatives. */
export async function fetchText(url: string): Promise<string> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "app-cocktails-import/1.0" } });
      if (!res.ok) throw new Error(`HTTP ${res.status} pour ${url}`);
      return await res.text();
    } catch (e) {
      if (attempt >= 4) throw e;
      await sleep(1000 * 2 ** attempt);
    }
  }
}

/** Écrit un fichier brut une seule fois : refuse d'écraser sauf avec --force. */
export function writeRawOnce(path: string, data: unknown) {
  if (existsSync(path) && !process.argv.includes("--force")) {
    console.error(`${path} existe déjà (import unique). Relancer avec --force pour écraser.`);
    process.exit(1);
  }
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
  console.log(`Écrit : ${path}`);
}

/** Vérifie avant de lancer un import qu'il n'écrasera rien. */
export function assertRawAbsent(path: string) {
  if (existsSync(path) && !process.argv.includes("--force")) {
    console.error(`${path} existe déjà (import unique). Relancer avec --force pour écraser.`);
    process.exit(1);
  }
}
