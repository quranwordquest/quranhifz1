import { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Home, Play, Square } from "lucide-react";
import { getSurah } from "@/data/surahs";
import { useT } from "@/i18n/LanguageContext";
import Footer from "@/components/Footer";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const BASMALAH_WORDS: string[] =
  getSurah(1)?.ayahs.find((a) => a.number === 1)?.words ?? [];

function stripBasmalah(surahNum: number, ayahNum: number, words: string[]): string[] {
  if (
    surahNum === 1 ||
    ayahNum !== 1 ||
    BASMALAH_WORDS.length === 0 ||
    words.length < BASMALAH_WORDS.length
  ) return words;
  const hasBasmalah = BASMALAH_WORDS.every((w, i) => words[i] === w);
  return hasBasmalah ? words.slice(BASMALAH_WORDS.length) : words;
}

function ayahAudioUrl(surahNum: number, ayahNum: number): string {
  const s = String(surahNum).padStart(3, "0");
  const a = String(ayahNum).padStart(3, "0");
  return `https://everyayah.com/data/Alafasy_128kbps/${s}${a}.mp3`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AyahListPage() {
  const { surahNumber } = useParams<{ surahNumber: string }>();
  const [, setLocation] = useLocation();
  const num = parseInt(surahNumber, 10);
  const surah = getSurah(num);
  const t = useT();

  // Which ayah number is currently playing (null = none)
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up audio when leaving this page
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  function handlePlayStop(e: React.MouseEvent, ayahNum: number) {
    e.stopPropagation(); // don't navigate to puzzle

    // Stop whatever is currently playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current = null;
    }

    // If we tapped the same ayah that was playing, just stop
    if (playingAyah === ayahNum) {
      setPlayingAyah(null);
      return;
    }

    // Play the new ayah
    const audio = new Audio(ayahAudioUrl(num, ayahNum));
    audioRef.current = audio;
    setPlayingAyah(ayahNum);
    audio.play().catch(() => {
      // If autoplay blocked or network error, just clear state
      setPlayingAyah(null);
      audioRef.current = null;
    });
    audio.onended = () => {
      setPlayingAyah(null);
      audioRef.current = null;
    };
  }

  if (!surah) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">{t.surahNotFound}</p>
          <button
            onClick={() => setLocation("/")}
            className="text-primary underline text-sm"
          >
            {t.backToSurahList}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center py-10 px-4 bg-background text-foreground">
      <div className="max-w-2xl w-full flex flex-col gap-8">

        {/* ── Header ── */}
        <div className="flex items-start gap-2">
          <button
            onClick={() => setLocation(`/surah/${num}`)}
            className="mt-1 p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors shrink-0"
            data-testid="button-back"
            aria-label="Back to Surah"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setLocation("/")}
            className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors shrink-0 text-sm font-medium"
            aria-label="Home"
          >
            <Home className="w-4 h-4" />
            {t.home}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary tracking-tight">
                {surah.nameEnglish}
              </h1>
              <span
                className="text-2xl font-serif text-primary/70 leading-relaxed"
                dir="rtl"
              >
                {surah.nameArabic}
              </span>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {t.surahLabel} {surah.number} &middot; {surah.ayahs.length}{" "}
              {surah.ayahs.length === 1 ? t.ayah : t.ayahs} &mdash;{" "}
              {t.selectAyahToPuzzle}
            </p>
          </div>
        </div>

        {/* ── Ayah list ── */}
        <div className="flex flex-col gap-3" data-testid="list-ayahs">
          {surah.ayahs.map((ayah, index) => {
            const isPlaying = playingAyah === ayah.number;
            return (
              <motion.div
                key={ayah.number}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.22, delay: index * 0.025 }}
                className="flex items-stretch gap-2"
              >
                {/* Audio play/stop button */}
                <button
                  onClick={(e) => handlePlayStop(e, ayah.number)}
                  aria-label={isPlaying ? t.stopAyah : t.playAyah}
                  data-testid={`button-audio-${ayah.number}`}
                  className={`shrink-0 w-10 rounded-xl border transition-all flex items-center justify-center ${
                    isPlaying
                      ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/20"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5"
                  }`}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {isPlaying ? (
                      <motion.span
                        key="stop"
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.7, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        {/* Pulsing ring while playing */}
                        <span className="relative flex items-center justify-center">
                          <span
                            className="absolute inline-flex rounded-full opacity-40 animate-ping"
                            style={{
                              width: "1.5rem",
                              height: "1.5rem",
                              backgroundColor: "var(--primary)",
                            }}
                          />
                          <Square className="w-4 h-4 relative" />
                        </span>
                      </motion.span>
                    ) : (
                      <motion.span
                        key="play"
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.7, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Play className="w-4 h-4" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>

                {/* Ayah card — navigates to puzzle */}
                <motion.button
                  whileHover={{ scale: 1.012 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() =>
                    setLocation(`/puzzle/${surah.number}/${ayah.number}`)
                  }
                  className={`flex-1 flex items-start gap-4 bg-card border rounded-xl px-5 py-4 shadow-sm hover:shadow-md transition-all cursor-pointer text-right ${
                    isPlaying
                      ? "border-primary/40 bg-primary/5"
                      : "border-border"
                  }`}
                  dir="rtl"
                  data-testid={`button-ayah-${ayah.number}`}
                >
                  <span
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold font-mono shrink-0 mt-0.5 transition-colors ${
                      isPlaying
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {ayah.number}
                  </span>
                  <p className="font-serif text-xl md:text-2xl text-foreground leading-relaxed flex-1">
                    {stripBasmalah(surah.number, ayah.number, ayah.words).join(" ")}
                  </p>
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        <Footer />
      </div>
    </div>
  );
}
