import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Home, BookText, AlignJustify } from "lucide-react";
import { getSurah, type Surah } from "@/data/surahs";
import { useT } from "@/i18n/LanguageContext";
import Footer from "@/components/Footer";

const SECTION_SIZE = 10;

function getSections(surah: Surah): { from: number; to: number }[] {
  const lastNum = surah.ayahs[surah.ayahs.length - 1].number;
  const sections: { from: number; to: number }[] = [];
  for (let from = 1; from <= lastNum; from += SECTION_SIZE) {
    sections.push({ from, to: Math.min(from + SECTION_SIZE - 1, lastNum) });
  }
  return sections;
}

// ── Mode card accent definitions ──────────────────────────────────────────
const WORD_PUZZLE_ACCENT = {
  iconBg:   "rgba(77,171,247,0.14)",
  iconText: "#1b6cb0",
  cardBg:   "rgba(77,171,247,0.03)",
  cardBgActive: "rgba(77,171,247,0.06)",
  border:   "rgba(77,171,247,0.20)",
  borderActive: "rgba(77,171,247,0.40)",
};
const ARRANGE_ACCENT = {
  iconBg:   "rgba(255,212,59,0.18)",
  iconText: "#8a6400",
  cardBg:   "rgba(255,212,59,0.03)",
  cardBgActive: "rgba(255,212,59,0.07)",
  border:   "rgba(255,212,59,0.25)",
  borderActive: "rgba(255,212,59,0.45)",
};

export default function SurahModePage() {
  const { surahNumber } = useParams<{ surahNumber: string }>();
  const [, setLocation] = useLocation();
  const num = parseInt(surahNumber, 10);
  const surah = getSurah(num);
  const [showSections, setShowSections] = useState(false);
  const t = useT();

  if (!surah) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">{t.surahNotFound}</p>
          <button onClick={() => setLocation("/")} className="text-primary underline text-sm">
            {t.backToSurahList}
          </button>
        </div>
      </div>
    );
  }

  const sections = getSections(surah);
  const needsSectionPicker = sections.length > 1;

  const handleArrangeAyahs = () => {
    if (!needsSectionPicker) {
      setLocation(`/arrange/${num}/1`);
    } else {
      setShowSections((prev) => !prev);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center py-10 px-4 bg-background text-foreground">
      <div className="max-w-2xl w-full flex flex-col gap-8">

        {/* ── Header ── */}
        <div className="flex items-start gap-3">
          <button
            onClick={() => setLocation("/")}
            className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors shrink-0 text-sm font-medium"
            aria-label="Home"
          >
            <Home className="w-4 h-4" />
            {t.home}
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary tracking-tight">
                {surah.nameEnglish}
              </h1>
              <span className="text-2xl font-serif text-primary/70 leading-relaxed" dir="rtl">
                {surah.nameArabic}
              </span>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {t.surahLabel} {surah.number} &middot; {surah.ayahs.length}{" "}
              {surah.ayahs.length === 1 ? t.ayah : t.ayahs} &mdash; {t.chooseGameMode}
            </p>
          </div>
        </div>

        {/* ── Mode cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Word Puzzle — Sky Blue */}
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLocation(`/surah/${num}/word`)}
            className="flex flex-col items-start gap-3 border rounded-2xl px-6 py-5 shadow-sm hover:shadow-md transition-all cursor-pointer text-left"
            style={{
              background: WORD_PUZZLE_ACCENT.cardBg,
              borderColor: WORD_PUZZLE_ACCENT.border,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: WORD_PUZZLE_ACCENT.iconBg }}
            >
              <BookText className="w-5 h-5" style={{ color: WORD_PUZZLE_ACCENT.iconText }} />
            </div>
            <div>
              <p className="font-serif font-bold text-lg text-foreground">{t.wordPuzzle}</p>
              <p className="text-muted-foreground text-sm mt-0.5 leading-snug">{t.wordPuzzleDesc}</p>
            </div>
          </motion.button>

          {/* Arrange Ayahs — Golden Yellow */}
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleArrangeAyahs}
            className="flex flex-col items-start gap-3 border rounded-2xl px-6 py-5 shadow-sm hover:shadow-md transition-all cursor-pointer text-left"
            style={{
              background: showSections ? ARRANGE_ACCENT.cardBgActive : ARRANGE_ACCENT.cardBg,
              borderColor: showSections ? ARRANGE_ACCENT.borderActive : ARRANGE_ACCENT.border,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: ARRANGE_ACCENT.iconBg }}
            >
              <AlignJustify className="w-5 h-5" style={{ color: ARRANGE_ACCENT.iconText }} />
            </div>
            <div>
              <p className="font-serif font-bold text-lg text-foreground">{t.arrangeAyahs}</p>
              <p className="text-muted-foreground text-sm mt-0.5 leading-snug">{t.arrangeAyahsDesc}</p>
            </div>
          </motion.button>
        </div>

        {/* ── Section picker ── */}
        <AnimatePresence>
          {showSections && (
            <motion.div
              key="sections"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3"
            >
              <p className="text-sm text-muted-foreground font-medium">{t.chooseSection}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {sections.map(({ from, to }) => (
                  <motion.button
                    key={from}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setLocation(`/arrange/${num}/${from}`)}
                    className="bg-card border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:shadow-sm transition-all shadow-sm"
                    style={{
                      borderColor: ARRANGE_ACCENT.border,
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = ARRANGE_ACCENT.cardBgActive;
                      (e.currentTarget as HTMLButtonElement).style.borderColor = ARRANGE_ACCENT.borderActive;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = '';
                      (e.currentTarget as HTMLButtonElement).style.borderColor = ARRANGE_ACCENT.border;
                    }}
                  >
                    {t.ayahsLabel} {from}–{to}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Footer />
      </div>
    </div>
  );
}
