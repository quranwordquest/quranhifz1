import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { motion } from "framer-motion";
import { ChevronLeft, Zap, BookOpen, Flame, Home } from "lucide-react";
import { SURAHS } from "@/data/surahs";
import { useT } from "@/i18n/LanguageContext";
import Footer from "@/components/Footer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type Difficulty = "easy" | "medium" | "hard";
const VALID: Difficulty[] = ["easy", "medium", "hard"];

// ---------------------------------------------------------------------------
// Word-count helpers — must mirror PuzzlePage logic exactly
// ---------------------------------------------------------------------------
const WAQF_RE = /^[\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]+$/;
const BASMALAH_WORDS: string[] =
  SURAHS[0]?.ayahs.find((a) => a.number === 1)?.words ?? [];

function effectivePuzzleWordCount(surahNum: number, ayahNum: number, words: string[]): number {
  let effective = words;
  if (
    surahNum !== 1 &&
    ayahNum === 1 &&
    BASMALAH_WORDS.length > 0 &&
    words.length >= BASMALAH_WORDS.length &&
    BASMALAH_WORDS.every((w, i) => words[i] === w)
  ) {
    effective = words.slice(BASMALAH_WORDS.length);
  }
  return effective.filter((w) => !WAQF_RE.test(w)).length;
}

function inDifficulty(count: number, diff: Difficulty): boolean {
  if (diff === "easy")   return count >= 1 && count <= 6;
  if (diff === "medium") return count >= 7 && count <= 10;
  return count >= 11;
}

// ---------------------------------------------------------------------------
// Ayah pool — built once at module load
// ---------------------------------------------------------------------------
type AyahRef = { surahNum: number; ayahNum: number };
const POOL: Record<Difficulty, AyahRef[]> = { easy: [], medium: [], hard: [] };

for (const surah of SURAHS) {
  for (const ayah of surah.ayahs) {
    const count = effectivePuzzleWordCount(surah.number, ayah.number, ayah.words);
    for (const d of VALID) {
      if (inDifficulty(count, d)) {
        POOL[d].push({ surahNum: surah.number, ayahNum: ayah.number });
        break;
      }
    }
  }
}

function pickRandom(pool: AyahRef[], exclude?: AyahRef): AyahRef {
  if (pool.length === 1 || !exclude) return pool[Math.floor(Math.random() * pool.length)];
  const filtered = pool.filter((a) => !(a.surahNum === exclude.surahNum && a.ayahNum === exclude.ayahNum));
  const src = filtered.length > 0 ? filtered : pool;
  return src[Math.floor(Math.random() * src.length)];
}

// ---------------------------------------------------------------------------
// Difficulty card config — uses the four-colour game palette
// ---------------------------------------------------------------------------
const DIFFICULTY_CONFIG: {
  key: Difficulty;
  range: string;
  icon: React.ElementType;
  iconColor: string;
  textColor: string;
  cardBg: string;
  cardBorder: string;
  cardBorderHover: string;
}[] = [
  {
    key: "easy",
    range: "1–6",
    icon: BookOpen,
    iconColor: "#27753d",
    textColor: "#27753d",
    cardBg: "rgba(81,207,102,0.06)",
    cardBorder: "rgba(81,207,102,0.35)",
    cardBorderHover: "rgba(81,207,102,0.65)",
  },
  {
    key: "medium",
    range: "7–10",
    icon: Zap,
    iconColor: "#8a6400",
    textColor: "#8a6400",
    cardBg: "rgba(255,212,59,0.07)",
    cardBorder: "rgba(255,212,59,0.45)",
    cardBorderHover: "rgba(255,212,59,0.75)",
  },
  {
    key: "hard",
    range: "11+",
    icon: Flame,
    iconColor: "#c73e3e",
    textColor: "#c73e3e",
    cardBg: "rgba(255,107,107,0.06)",
    cardBorder: "rgba(255,107,107,0.35)",
    cardBorderHover: "rgba(255,107,107,0.65)",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function RandomChallengePage() {
  const params = useParams<{ difficulty?: string }>();
  const [, setLocation] = useLocation();
  const t = useT();

  const difficulty = (VALID.includes(params.difficulty as Difficulty) ? params.difficulty : null) as Difficulty | null;

  useEffect(() => {
    if (!difficulty) return;
    const pool = POOL[difficulty];
    if (!pool.length) return;
    const excludeParam = new URLSearchParams(window.location.search).get("exclude");
    let exclude: AyahRef | undefined;
    if (excludeParam) {
      const [s, a] = excludeParam.split("-").map(Number);
      if (!isNaN(s) && !isNaN(a)) exclude = { surahNum: s, ayahNum: a };
    }
    const pick = pickRandom(pool, exclude);
    setLocation(`/puzzle/${pick.surahNum}/${pick.ayahNum}?challenge=${difficulty}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  if (difficulty) {
    return (
      <div className="min-h-[100dvh] relative flex flex-col items-center justify-center gap-5 bg-background">
        <button
          onClick={() => setLocation("/")}
          className="absolute left-4 top-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors text-sm font-medium"
          aria-label="Home"
        >
          <Home className="w-4 h-4" />
          {t.home}
        </button>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-muted-foreground text-lg font-serif"
        >
          {t.selectingRandomAyah}
        </motion.p>
      </div>
    );
  }

  const diffLabel: Record<Difficulty, string> = {
    easy: t.easy, medium: t.medium, hard: t.hard,
  };
  const diffDesc: Record<Difficulty, string> = {
    easy: t.easyDesc, medium: t.mediumDesc, hard: t.hardDesc,
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center py-12 px-4 bg-background text-foreground">
      <div className="max-w-2xl w-full flex flex-col gap-8">

        {/* ── Header ── */}
        <header className="relative text-center space-y-3 pt-8 sm:pt-0">
          <button
            onClick={() => setLocation("/")}
            className="absolute left-0 top-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors text-sm font-medium"
            aria-label="Home"
          >
            <Home className="w-4 h-4" />
            {t.home}
          </button>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary tracking-tight">
            {t.randomAyahChallengeTitle}
          </h1>
          <p className="text-muted-foreground text-lg">{t.chooseDifficulty}</p>
        </header>

        {/* ── Difficulty cards ── */}
        <div className="flex flex-col gap-4">
          {DIFFICULTY_CONFIG.map(({ key, range, icon: Icon, iconColor, textColor, cardBg, cardBorder, cardBorderHover }) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setLocation(`/challenge/${key}`)}
              className="flex items-center gap-5 border-2 rounded-2xl px-6 py-5 shadow-sm hover:shadow-md transition-all cursor-pointer text-left bg-card"
              style={{ borderColor: cardBorder, background: cardBg }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = cardBorderHover;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = cardBorder;
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.9)" }}
              >
                <Icon className="w-6 h-6" style={{ color: iconColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="font-serif font-bold text-xl" style={{ color: textColor }}>
                    {diffLabel[key]}
                  </p>
                  <span className="text-xs font-medium text-muted-foreground bg-white/80 border border-border px-2 py-0.5 rounded-full">
                    {range} {t.words}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm mt-0.5 leading-snug">{diffDesc[key]}</p>
              </div>
              <div className="text-2xl font-bold shrink-0 select-none" style={{ color: textColor, opacity: 0.3 }}>→</div>
            </motion.button>
          ))}
        </div>

        {/* ── Pool sizes ── */}
        <div className="flex justify-center gap-6 text-xs text-muted-foreground/60">
          {VALID.map((d) => (
            <span key={d}>
              {diffLabel[d]}: {POOL[d].length.toLocaleString()} {t.ayahs}
            </span>
          ))}
        </div>

        <Footer />
      </div>
    </div>
  );
}
