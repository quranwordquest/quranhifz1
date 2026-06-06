import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AlQuranWord {
  text: string;
}

interface AlQuranAyah {
  numberInSurah: number;
  text: string;
}

interface AlQuranSurah {
  number: number;
  name: string;
  englishName: string;
  ayahs: AlQuranAyah[];
}

interface AlQuranResponse {
  data: AlQuranSurah;
}

async function fetchSurah(n: number): Promise<AlQuranSurah> {
  const url = `https://api.alquran.cloud/v1/surah/${n}/quran-uthmani`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch surah ${n}: ${res.status}`);
  const json = (await res.json()) as AlQuranResponse;
  return json.data;
}

function escapeWords(text: string): string[] {
  // Split on whitespace and filter empty strings
  return text.split(/\s+/).filter((w) => w.length > 0);
}

async function main() {
  const surahNames: Record<number, string> = {
    1: "Al-Fatiha", 2: "Al-Baqarah", 3: "Al-Imran", 4: "An-Nisa",
    5: "Al-Ma'idah", 6: "Al-An'am", 7: "Al-A'raf", 8: "Al-Anfal",
    9: "At-Tawbah", 10: "Yunus", 11: "Hud", 12: "Yusuf",
    13: "Ar-Ra'd", 14: "Ibrahim", 15: "Al-Hijr", 16: "An-Nahl",
    17: "Al-Isra", 18: "Al-Kahf", 19: "Maryam", 20: "Ta-Ha",
    21: "Al-Anbiya", 22: "Al-Hajj", 23: "Al-Mu'minun", 24: "An-Nur",
    25: "Al-Furqan", 26: "Ash-Shu'ara", 27: "An-Naml", 28: "Al-Qasas",
    29: "Al-Ankabut", 30: "Ar-Rum", 31: "Luqman", 32: "As-Sajdah",
    33: "Al-Ahzab", 34: "Saba", 35: "Fatir", 36: "Ya-Sin",
    37: "As-Saffat", 38: "Sad", 39: "Az-Zumar", 40: "Ghafir",
    41: "Fussilat", 42: "Ash-Shura", 43: "Az-Zukhruf", 44: "Ad-Dukhan",
    45: "Al-Jathiyah", 46: "Al-Ahqaf", 47: "Muhammad", 48: "Al-Fath",
    49: "Al-Hujurat", 50: "Qaf", 51: "Adh-Dhariyat", 52: "At-Tur",
    53: "An-Najm", 54: "Al-Qamar", 55: "Ar-Rahman", 56: "Al-Waqi'ah",
    57: "Al-Hadid", 58: "Al-Mujadila", 59: "Al-Hashr", 60: "Al-Mumtahanah",
    61: "As-Saf", 62: "Al-Jumu'ah", 63: "Al-Munafiqun", 64: "At-Taghabun",
    65: "At-Talaq", 66: "At-Tahrim", 67: "Al-Mulk", 68: "Al-Qalam",
    69: "Al-Haqqah", 70: "Al-Ma'arij", 71: "Nuh", 72: "Al-Jinn",
    73: "Al-Muzzammil", 74: "Al-Muddaththir", 75: "Al-Qiyamah", 76: "Al-Insan",
    77: "Al-Mursalat", 78: "An-Naba", 79: "An-Nazi'at", 80: "Abasa",
    81: "At-Takwir", 82: "Al-Infitar", 83: "Al-Mutaffifin", 84: "Al-Inshiqaq",
    85: "Al-Buruj", 86: "At-Tariq", 87: "Al-A'la", 88: "Al-Ghashiyah",
    89: "Al-Fajr", 90: "Al-Balad", 91: "Ash-Shams", 92: "Al-Layl",
    93: "Ad-Duha", 94: "Ash-Sharh", 95: "At-Tin", 96: "Al-Alaq",
    97: "Al-Qadr", 98: "Al-Bayyinah", 99: "Az-Zalzalah", 100: "Al-Adiyat",
    101: "Al-Qari'ah", 102: "At-Takathur", 103: "Al-Asr", 104: "Al-Humazah",
    105: "Al-Fil", 106: "Quraysh", 107: "Al-Ma'un", 108: "Al-Kawthar",
    109: "Al-Kafirun", 110: "An-Nasr", 111: "Al-Masad", 112: "Al-Ikhlas",
    113: "Al-Falaq", 114: "An-Nas",
  };

  const lines: string[] = [];
  lines.push(`export interface Ayah {`);
  lines.push(`  number: number;`);
  lines.push(`  words: string[];`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`export interface Surah {`);
  lines.push(`  number: number;`);
  lines.push(`  nameArabic: string;`);
  lines.push(`  nameEnglish: string;`);
  lines.push(`  ayahs: Ayah[];`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`export const SURAHS: Surah[] = [`);

  for (let n = 1; n <= 114; n++) {
    process.stdout.write(`Fetching surah ${n}/114...\r`);
    let surah: AlQuranSurah;
    try {
      surah = await fetchSurah(n);
    } catch (e) {
      console.error(`\nError fetching surah ${n}:`, e);
      process.exit(1);
    }

    lines.push(`  {`);
    lines.push(`    number: ${n},`);
    lines.push(`    nameArabic: ${JSON.stringify(surah.name)},`);
    lines.push(`    nameEnglish: ${JSON.stringify(surahNames[n] ?? surah.englishName)},`);
    lines.push(`    ayahs: [`);

    for (const ayah of surah.ayahs) {
      const words = escapeWords(ayah.text);
      const wordsJson = words.map((w) => JSON.stringify(w)).join(", ");
      lines.push(`      { number: ${ayah.numberInSurah}, words: [${wordsJson}] },`);
    }

    lines.push(`    ],`);
    lines.push(`  },`);

    // Small delay to be polite to the API
    await new Promise((r) => setTimeout(r, 150));
  }

  lines.push(`];`);
  lines.push(``);
  lines.push(`export function getSurah(surahNumber: number): Surah | undefined {`);
  lines.push(`  return SURAHS.find((s) => s.number === surahNumber);`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`export function getAyah(`);
  lines.push(`  surahNumber: number,`);
  lines.push(`  ayahNumber: number`);
  lines.push(`): Ayah | undefined {`);
  lines.push(`  const surah = getSurah(surahNumber);`);
  lines.push(`  if (!surah) return undefined;`);
  lines.push(`  return surah.ayahs.find((a) => a.number === ayahNumber);`);
  lines.push(`}`);

  const output = lines.join("\n");
  const outPath = path.resolve(
    __dirname,
    "../../artifacts/ayah-puzzle/src/data/surahs.ts"
  );
  fs.writeFileSync(outPath, output, "utf8");
  console.log(`\nDone! Written to ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
