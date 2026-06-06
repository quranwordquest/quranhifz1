import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BookOpen, BookText, AlignJustify, Pencil, Star, Clock, RotateCcw } from "lucide-react";
import { SURAHS } from "@/data/surahs";
import { useT } from "@/i18n/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import Footer from "@/components/Footer";
import { useProgress } from "@/hooks/useProgress";

// ---------------------------------------------------------------------------
// Palette — cycles through the four game accent colours per surah card
// ---------------------------------------------------------------------------
const ACCENT = [
  { badgeBg: "rgba(255,107,107,0.14)", badgeText: "#c73e3e" },  // Coral Red
  { badgeBg: "rgba(77,171,247,0.14)",  badgeText: "#1b6cb0" },  // Sky Blue
  { badgeBg: "rgba(255,212,59,0.18)",  badgeText: "#8a6400" },  // Golden Yellow
  { badgeBg: "rgba(81,207,102,0.14)",  badgeText: "#27753d" },  // Green
] as const;

// ---------------------------------------------------------------------------
// Time formatting
// ---------------------------------------------------------------------------
function formatTime(seconds: number): string {
  if (seconds <= 0) return "0 min";
  if (seconds < 60) return "< 1 min";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hours} h ${rem} min` : `${hours} h`;
}

// ---------------------------------------------------------------------------
// Progress card
// ---------------------------------------------------------------------------
function ProgressCard() {
  const t = useT();
  const { progress, resetProgress } = useProgress();
  const [confirming, setConfirming] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-border bg-card shadow-sm px-5 py-4"
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Title */}
        <p className="font-serif font-semibold text-foreground text-base">
          {t.progressTitle}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-5 flex-1 justify-center flex-wrap">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,107,107,0.12)" }}
            >
              <BookOpen className="w-4 h-4" style={{ color: "#c73e3e" }} />
            </div>
            <div>
              <p
                className="text-xl font-bold font-mono leading-none"
                style={{ color: "#c73e3e" }}
              >
                {progress.ayahsCompleted.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-none">
                {t.ayahsCompleted}
              </p>
            </div>
          </div>

          <div
            className="w-px h-8 self-center shrink-0"
            style={{ background: "var(--border)" }}
          />

          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "rgba(77,171,247,0.12)" }}
            >
              <Clock className="w-4 h-4" style={{ color: "#1b6cb0" }} />
            </div>
            <div>
              <p
                className="text-xl font-bold font-mono leading-none"
                style={{ color: "#1b6cb0" }}
              >
                {formatTime(progress.timeSpentSeconds)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-none">
                {t.timeRevising}
              </p>
            </div>
          </div>
        </div>

        {/* Reset */}
        <div className="flex items-center gap-2 shrink-0">
          <AnimatePresence mode="wait">
            {confirming ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-2"
              >
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {t.confirmReset}
                </span>
                <button
                  onClick={() => { resetProgress(); setConfirming(false); }}
                  className="text-xs font-medium px-2.5 py-1 rounded-full text-white transition-colors"
                  style={{ background: "#c73e3e" }}
                >
                  {t.resetYes}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="text-xs font-medium px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t.resetCancel}
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="reset-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setConfirming(true)}
                className="flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors py-1"
                data-testid="button-reset-progress"
              >
                <RotateCcw className="w-3 h-3" />
                {t.resetProgress}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
function scrollToSurahList() {
  document.getElementById("surah-list")?.scrollIntoView({ behavior: "smooth" });
}

const CARD_ACCENTS = {
  puzzle: {
    iconBg: "rgba(77,171,247,0.14)", iconText: "#1b6cb0",
    cardBg: "rgba(77,171,247,0.04)", border: "rgba(77,171,247,0.22)",
  },
  arrange: {
    iconBg: "rgba(255,212,59,0.18)", iconText: "#8a6400",
    cardBg: "rgba(255,212,59,0.04)", border: "rgba(255,212,59,0.28)",
  },
  challenge: {
    iconBg: "rgba(255,107,107,0.15)", iconText: "#c73e3e",
    cardBg: "rgba(255,107,107,0.04)", border: "rgba(255,107,107,0.28)",
  },
};

export default function SurahSelectionPage() {
  const [, setLocation] = useLocation();
  const t = useT();

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center py-10 px-4 bg-background text-foreground">
      <div className="max-w-3xl w-full flex flex-col gap-8">

        {/* ── Header / Branding ── */}
        <header className="text-center space-y-3 relative pt-10 sm:pt-1">
          <div className="absolute right-0 top-0">
            <LanguageSelector />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight" style={{ color: "var(--game-coral, #FF6B6B)" }}>
            Quran Word Quest
          </h1>
          <p className="font-semibold text-foreground/80 text-base">
            Revise Quran in a Fun Way
          </p>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
            {t.homeDesc}
          </p>
        </header>

        {/* ── Feature cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Ayah Puzzle → scroll to surah list */}
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={scrollToSurahList}
            className="flex flex-col items-start gap-3 rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all cursor-pointer text-left"
            style={{ background: CARD_ACCENTS.puzzle.cardBg, borderColor: CARD_ACCENTS.puzzle.border }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: CARD_ACCENTS.puzzle.iconBg }}>
              <BookText className="w-5 h-5" style={{ color: CARD_ACCENTS.puzzle.iconText }} />
            </div>
            <div>
              <p className="font-serif font-bold text-base text-foreground">{t.ayahPuzzleTitle}</p>
              <p className="text-muted-foreground text-sm mt-1.5 leading-snug">{t.wordPuzzleCardDesc}</p>
            </div>
          </motion.button>

          {/* Arrange Ayahs → scroll to surah list */}
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.06 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={scrollToSurahList}
            className="flex flex-col items-start gap-3 rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all cursor-pointer text-left"
            style={{ background: CARD_ACCENTS.arrange.cardBg, borderColor: CARD_ACCENTS.arrange.border }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: CARD_ACCENTS.arrange.iconBg }}>
              <AlignJustify className="w-5 h-5" style={{ color: CARD_ACCENTS.arrange.iconText }} />
            </div>
            <div>
              <p className="font-serif font-bold text-base text-foreground">{t.arrangeAyahs}</p>
              <p className="text-muted-foreground text-sm mt-1.5 leading-snug">{t.arrangeAyahsCardDesc}</p>
            </div>
          </motion.button>

          {/* Random Challenge → navigate directly */}
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.12 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLocation("/challenge")}
            className="flex flex-col items-start gap-3 rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all cursor-pointer text-left"
            style={{ background: CARD_ACCENTS.challenge.cardBg, borderColor: CARD_ACCENTS.challenge.border }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: CARD_ACCENTS.challenge.iconBg }}>
              <Sparkles className="w-5 h-5" style={{ color: CARD_ACCENTS.challenge.iconText }} />
            </div>
            <div>
              <p className="font-serif font-bold text-base text-foreground">{t.randomAyahChallenge}</p>
              <p className="text-muted-foreground text-sm mt-1.5 leading-snug">{t.randomChallengeCardDesc}</p>
            </div>
          </motion.button>
        </div>

        {/* ── Progress card ── */}
        <ProgressCard />

        {/* ── How It Works ── */}
        <section className="space-y-4">
          <h2 className="text-base font-serif font-semibold text-foreground text-center tracking-tight">
            {t.howItWorks}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-4 bg-card rounded-xl border border-border px-4 py-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(81,207,102,0.14)" }}>
                <BookOpen className="w-4 h-4" style={{ color: "#27753d" }} />
              </div>
              <div>
                <p className="text-[10px] font-mono text-muted-foreground/40 leading-none mb-1 uppercase tracking-widest">01</p>
                <p className="text-sm font-medium text-foreground leading-snug">{t.howItWorksStep1}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-card rounded-xl border border-border px-4 py-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(77,171,247,0.14)" }}>
                <Pencil className="w-4 h-4" style={{ color: "#1b6cb0" }} />
              </div>
              <div>
                <p className="text-[10px] font-mono text-muted-foreground/40 leading-none mb-1 uppercase tracking-widest">02</p>
                <p className="text-sm font-medium text-foreground leading-snug">{t.howItWorksStep2}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-card rounded-xl border border-border px-4 py-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,212,59,0.18)" }}>
                <Star className="w-4 h-4" style={{ color: "#8a6400" }} />
              </div>
              <div>
                <p className="text-[10px] font-mono text-muted-foreground/40 leading-none mb-1 uppercase tracking-widest">03</p>
                <p className="text-sm font-medium text-foreground leading-snug">{t.howItWorksStep3}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Surah list ── */}
        <section className="space-y-4" id="surah-list">
          <h2 className="text-base font-serif font-semibold text-foreground tracking-tight">
            {t.chooseSurahHeading}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="grid-surahs">
          {SURAHS.map((surah, index) => {
            const accent = ACCENT[surah.number % ACCENT.length];
            return (
              <motion.button
                key={surah.number}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.018 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setLocation(`/surah/${surah.number}`)}
                className="flex items-center justify-between bg-card border border-border rounded-xl px-5 py-4 shadow-sm hover:shadow-md transition-all cursor-pointer text-left"
                data-testid={`button-surah-${surah.number}`}
              >
                <div className="flex items-center gap-4">
                  <span
                    className="w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold font-mono shrink-0"
                    style={{ backgroundColor: accent.badgeBg, color: accent.badgeText }}
                  >
                    {surah.number}
                  </span>
                  <div>
                    <div className="font-medium text-foreground text-sm leading-snug">
                      {surah.nameEnglish}
                    </div>
                    <div className="text-muted-foreground text-xs mt-0.5">
                      {surah.ayahs.length} {surah.ayahs.length === 1 ? t.ayah : t.ayahs}
                    </div>
                  </div>
                </div>
                <div
                  className="text-xl font-serif leading-relaxed"
                  dir="rtl"
                  style={{ color: accent.badgeText }}
                >
                  {surah.nameArabic}
                </div>
              </motion.button>
            );
          })}
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
