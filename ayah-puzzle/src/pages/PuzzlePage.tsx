import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Home, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSurah, getAyah } from "@/data/surahs";
import { useT } from "@/i18n/LanguageContext";
import { persistAddAyahs } from "@/hooks/useProgress";
import { useRevisionTimer } from "@/hooks/useRevisionTimer";
import Footer from "@/components/Footer";

// ---------------------------------------------------------------------------
// Waqf symbol filter
// Tokens composed entirely of Quranic annotation signs (U+06D6–U+06DC,
// U+06DF–U+06E4, U+06E7, U+06E8, U+06EA–U+06ED) are stop/pause markers
// and must not appear as puzzle pieces.
// ---------------------------------------------------------------------------
const WAQF_ONLY = /^[\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]+$/;

function isPuzzleWord(word: string): boolean {
  const w = word.trim();
  return w.length > 0 && !WAQF_ONLY.test(w);
}

// ---------------------------------------------------------------------------
// Basmalah handling
// The AlQuran Cloud quran-uthmani API prepends the Basmalah to Ayah 1 of
// every surah except Surah 9 (At-Tawbah).  For Surah 1 (Al-Fatiha) the
// Basmalah genuinely IS Ayah 1, so it must remain as the puzzle.
// For all other surahs we strip the 4 Basmalah words and show them above
// the puzzle as a read-only decorative line.
//
// We derive the exact Basmalah word list from Surah 1 Ayah 1 in the data
// file so that Unicode characters match byte-for-byte with every other ayah.
// ---------------------------------------------------------------------------
const BASMALAH_WORDS: string[] =
  getSurah(1)?.ayahs.find((a) => a.number === 1)?.words ?? [];

function startsWithBasmalah(words: string[]): boolean {
  if (BASMALAH_WORDS.length === 0 || words.length < BASMALAH_WORDS.length) return false;
  return BASMALAH_WORDS.every((w, i) => words[i] === w);
}

// ---------------------------------------------------------------------------
// Shuffle helpers
// ---------------------------------------------------------------------------
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function makeShuffled(words: string[], ayahId: string) {
  if (words.length <= 1) {
    return words.map((word, i) => ({ id: `word-${ayahId}-${i}`, text: word }));
  }
  let shuffled = shuffleArray(words);
  while (JSON.stringify(shuffled) === JSON.stringify(words)) {
    shuffled = shuffleArray(words);
  }
  return shuffled.map((word, i) => ({ id: `word-${ayahId}-${i}`, text: word }));
}

// ---------------------------------------------------------------------------
// Hint helpers
// ---------------------------------------------------------------------------
function getNextIncorrectPos(
  answer: { id: string; text: string }[],
  puzzle: string[]
): number {
  for (let i = 0; i < puzzle.length; i++) {
    if (answer[i]?.text !== puzzle[i]) return i;
  }
  return puzzle.length;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function PuzzlePage() {
  const { surahNumber, ayahNumber } = useParams<{
    surahNumber: string;
    ayahNumber: string;
  }>();
  const [, setLocation] = useLocation();
  const t = useT();

  // Read challenge mode from query string (?challenge=easy|medium|hard).
  // Present only when navigated here from RandomChallengePage — normal puzzle
  // flow is completely unaffected when this is null.
  const challengeDifficulty = useMemo(() => {
    const p = new URLSearchParams(window.location.search).get("challenge");
    return p === "easy" || p === "medium" || p === "hard"
      ? (p as "easy" | "medium" | "hard")
      : null;
  }, []);

  const sNum = parseInt(surahNumber, 10);
  const aNum = parseInt(ayahNumber, 10);
  const surah = getSurah(sNum);
  const ayah = getAyah(sNum, aNum);

  // Determine whether the Basmalah should be stripped and shown separately.
  const shouldStripBasmalah =
    aNum === 1 &&
    sNum !== 1 &&
    ayah !== undefined &&
    startsWithBasmalah(ayah.words);

  // Words that actually belong to this ayah (Basmalah removed where needed).
  const effectiveAyahWords = ayah
    ? shouldStripBasmalah
      ? ayah.words.slice(BASMALAH_WORDS.length)
      : ayah.words
    : [];

  // Puzzle words = effective ayah words minus standalone waqf markers.
  const puzzleWords = effectiveAyahWords.filter(isPuzzleWord);

  // Full ayah text for the post-correct reference panel (waqf marks kept,
  // Basmalah excluded since it is shown separately above the puzzle).
  const fullAyahText = effectiveAyahWords.join(" ");

  const [bankWords, setBankWords] = useState<{ id: string; text: string }[]>([]);
  const [answerWords, setAnswerWords] = useState<{ id: string; text: string }[]>([]);
  const [gameState, setGameState] = useState<"playing" | "correct" | "wrong">("playing");
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintHighlightSlot, setHintHighlightSlot] = useState<number | null>(null);
  const completedRef = useRef(false);

  useRevisionTimer();

  useEffect(() => {
    if (!ayah) return;
    const ayahId = `${sNum}-${aNum}`;
    setBankWords(makeShuffled(puzzleWords, ayahId));
    setAnswerWords([]);
    setGameState("playing");
    setHintsUsed(0);
    setHintHighlightSlot(null);
    completedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sNum, aNum, ayah]);

  useEffect(() => {
    if (gameState === "correct" && !completedRef.current) {
      completedRef.current = true;
      persistAddAyahs(1);
    }
  }, [gameState]);

  if (!surah || !ayah) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">{t.ayahNotFound}</p>
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

  const handleBankWordClick = (wordObj: { id: string; text: string }) => {
    if (gameState === "correct") return;
    // Guard: only move the word if it actually exists in the bank at the time
    // the functional updater runs. This prevents duplicates when the user
    // taps rapidly before React can re-render (race condition).
    setBankWords((prev) => {
      if (!prev.some((w) => w.id === wordObj.id)) return prev;
      return prev.filter((w) => w.id !== wordObj.id);
    });
    setAnswerWords((prev) => {
      if (prev.some((w) => w.id === wordObj.id)) return prev;
      return [...prev, wordObj];
    });
    setGameState("playing");
    setHintHighlightSlot(null);
  };

  const handleAnswerWordClick = (wordObj: { id: string; text: string }) => {
    if (gameState === "correct") return;
    setAnswerWords((prev) => {
      if (!prev.some((w) => w.id === wordObj.id)) return prev;
      return prev.filter((w) => w.id !== wordObj.id);
    });
    setBankWords((prev) => {
      if (prev.some((w) => w.id === wordObj.id)) return prev;
      return [...prev, wordObj];
    });
    setGameState("playing");
    setHintHighlightSlot(null);
  };

  // Reveal `count` correct words starting at fromPos, sending displaced
  // wrong-position words back to the bank.
  const revealWords = (fromPos: number, count: number) => {
    const displaced = answerWords.slice(fromPos);
    const kept = answerWords.slice(0, fromPos);
    const combined = [...bankWords, ...displaced];
    const newAnswer = [...kept];
    const newBank = [...combined];
    for (let k = 0; k < count; k++) {
      const targetText = puzzleWords[fromPos + k];
      if (targetText === undefined) break;
      const idx = newBank.findIndex((w) => w.text === targetText);
      if (idx !== -1) {
        newAnswer.push(newBank[idx]);
        newBank.splice(idx, 1);
      }
    }
    setAnswerWords(newAnswer);
    setBankWords(newBank);
  };

  const handleHint = () => {
    if (hintsUsed >= 3 || gameState === "correct") return;
    const nextLevel = hintsUsed + 1;
    const pos = getNextIncorrectPos(answerWords, puzzleWords);
    if (pos < puzzleWords.length) {
      if (nextLevel === 1) {
        setHintHighlightSlot(pos);
      } else {
        revealWords(pos, nextLevel === 2 ? 1 : 2);
        setHintHighlightSlot(null);
      }
    }
    setHintsUsed(nextLevel);
  };

  const handleCheckAnswer = () => {
    const isCorrect =
      answerWords.length === puzzleWords.length &&
      answerWords.every((word, idx) => word.text === puzzleWords[idx]);
    if (isCorrect) {
      setGameState("correct");
    } else {
      setGameState("wrong");
      setTimeout(() => setGameState("playing"), 1000);
    }
  };

  const handleReset = () => {
    setBankWords((prev) => [...prev, ...answerWords]);
    setAnswerWords([]);
    setGameState("playing");
    setHintHighlightSlot(null);
  };

  const isLastAyah = !surah.ayahs.find((a) => a.number === aNum + 1);

  const handleNextAyah = () => {
    setLocation(`/puzzle/${sNum}/${aNum + 1}`);
  };

  const surahInfo = `${surah.nameArabic} ${sNum}:${aNum}`;

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center py-12 px-4 bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-2xl w-full flex flex-col gap-10">

        {/* Header */}
        <header className="relative text-center space-y-3 pt-8 sm:pt-0">
          <div className="absolute left-0 top-1 flex items-center gap-1">
            <button
              onClick={() => setLocation(`/surah/${sNum}`)}
              className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
              data-testid="button-back"
              aria-label="Back to ayah list"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setLocation("/")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors text-sm font-medium"
              aria-label="Home"
            >
              <Home className="w-4 h-4" />
              {t.home}
            </button>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary tracking-tight">
            {t.ayahPuzzleTitle}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t.arrangeWordsSubtitle}
          </p>
        </header>

        <main className="flex flex-col gap-8 w-full">
          {/* Surah label */}
          <div className="text-center flex items-center justify-center gap-2">
            <span
              className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium font-serif border border-primary/20"
              data-testid="text-surah-info"
              dir="rtl"
            >
              {surahInfo}
            </span>
          </div>

          {/* Basmalah — shown above the puzzle for ayah 1 of surahs that carry it */}
          {shouldStripBasmalah && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <span
                className="font-serif text-2xl md:text-3xl text-primary/80 leading-loose tracking-wide select-none"
                dir="rtl"
                aria-label="Basmalah"
              >
                {BASMALAH_WORDS.join(" ")}
              </span>
            </motion.div>
          )}

          {/* Answer Zone */}
          <motion.div
            className={`min-h-[120px] bg-card border-2 border-dashed rounded-2xl p-6 flex flex-wrap content-start gap-4 shadow-sm transition-colors duration-300 ${
              gameState === "correct"
                ? "border-green-500 bg-green-50/50 shadow-green-500/20 shadow-lg"
                : gameState === "wrong"
                ? "border-destructive/50 bg-destructive/5"
                : "border-border"
            }`}
            animate={gameState === "wrong" ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            dir="rtl"
            data-testid="area-answer"
          >
            <AnimatePresence>
              {answerWords.map((word, index) => (
                <motion.button
                  key={word.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAnswerWordClick(word)}
                  className={`px-6 py-4 bg-secondary text-secondary-foreground font-serif text-2xl md:text-3xl rounded-xl shadow-sm border hover:shadow-md transition-shadow cursor-pointer select-none leading-relaxed ${
                    hintHighlightSlot === index
                      ? "border-amber-400 ring-2 ring-amber-400 ring-offset-1"
                      : "border-secondary-border"
                  }`}
                  data-testid={`button-answer-word-${word.id}`}
                >
                  {word.text}
                </motion.button>
              ))}
              {/* Ghost slot — shown by Hint 1 when the next position is empty */}
              {hintHighlightSlot === answerWords.length && (
                <motion.div
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                  className="px-6 py-4 rounded-xl border-2 border-dashed border-amber-400 bg-amber-50/60 text-amber-400 font-serif text-2xl min-w-[80px] text-center pointer-events-none select-none leading-relaxed"
                >
                  ?
                </motion.div>
              )}
              {answerWords.length === 0 && hintHighlightSlot !== 0 && (
                <div className="w-full text-center text-muted-foreground/50 font-serif text-xl italic py-4 pointer-events-none select-none">
                  {t.tapWordsPlaceholder}
                </div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Full ayah reference panel — revealed after a correct answer */}
          <AnimatePresence>
            {gameState === "correct" && (
              <motion.div
                key="full-ayah"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-green-200 bg-green-50/60 px-6 py-4 text-center"
                dir="rtl"
              >
                <p
                  className="text-xs text-green-700/70 mb-2 font-sans tracking-wide uppercase text-right"
                  dir="ltr"
                >
                  {t.fullAyah}
                </p>
                <p className="font-serif text-2xl md:text-3xl text-foreground leading-loose">
                  {fullAyahText}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-center gap-4 py-2">
            <Button
              size="lg"
              variant="outline"
              onClick={handleReset}
              disabled={answerWords.length === 0 || gameState === "correct"}
              className="px-8 font-medium text-base rounded-full"
              data-testid="button-reset"
            >
              {t.reset}
            </Button>

            {/* Hint button — only shown while puzzle is active */}
            {gameState !== "correct" && (
              <Button
                size="lg"
                variant="outline"
                onClick={handleHint}
                disabled={hintsUsed >= 3}
                className="px-6 font-medium text-base rounded-full border-amber-400 text-amber-600 hover:bg-amber-50 disabled:opacity-40"
                data-testid="button-hint"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                {t.hint} ({3 - hintsUsed})
              </Button>
            )}

            {/* Next Random Ayah — skip current challenge without solving */}
            {challengeDifficulty && gameState !== "correct" && (
              <Button
                size="lg"
                variant="outline"
                onClick={() =>
                  setLocation(`/challenge/${challengeDifficulty}?exclude=${sNum}-${aNum}`)
                }
                className="px-8 font-medium text-base rounded-full"
              >
                {t.nextRandomAyah}
              </Button>
            )}

            {gameState !== "correct" ? (
              <Button
                size="lg"
                onClick={handleCheckAnswer}
                disabled={answerWords.length !== puzzleWords.length}
                className="px-8 font-medium text-base rounded-full shadow-md"
                data-testid="button-check"
              >
                {t.checkAnswer}
              </Button>
            ) : challengeDifficulty ? (
              // Challenge mode completion — replaces normal sequential buttons
              <>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setLocation("/challenge")}
                  className="px-8 font-medium text-base rounded-full"
                >
                  {t.newRandomAyah}
                </Button>
                <Button
                  size="lg"
                  onClick={() => setLocation(`/challenge/${challengeDifficulty}`)}
                  className="px-8 font-medium text-base rounded-full bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/20"
                >
                  {t.sameDifficultyAgain}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setLocation("/")}
                  className="px-8 font-medium text-base rounded-full"
                >
                  {t.backToHome}
                </Button>
              </>
            ) : !isLastAyah ? (
              <Button
                size="lg"
                onClick={handleNextAyah}
                className="px-8 font-medium text-base rounded-full bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/20"
                data-testid="button-next"
              >
                {t.nextAyah}
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={() => setLocation(`/surah/${sNum}`)}
                className="px-8 font-medium text-base rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                data-testid="button-surah-selection"
              >
                {t.backToSurah}
              </Button>
            )}
          </div>

          {/* Feedback */}
          <div className="flex flex-col items-center justify-center gap-3 min-h-[4rem]" aria-live="polite">
            <AnimatePresence mode="wait">
              {gameState === "correct" && !isLastAyah && (
                <motion.div
                  key="correct"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-green-600 font-serif text-xl font-bold"
                  data-testid="text-success"
                >
                  {t.correctMashaAllah}
                </motion.div>
              )}
              {gameState === "correct" && isLastAyah && (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-1"
                  data-testid="text-surah-complete"
                >
                  <p className="text-green-600 font-serif text-xl font-bold">
                    {t.correctMashaAllah}
                  </p>
                  <p className="text-primary font-serif text-lg font-semibold">
                    {t.mashaAllahSurahComplete}
                  </p>
                </motion.div>
              )}
              {gameState === "wrong" && (
                <motion.div
                  key="wrong"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-destructive font-medium text-lg"
                  data-testid="text-error"
                >
                  {t.tryAgain}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Word Bank */}
          <div
            className="flex flex-wrap-reverse flex-row-reverse justify-center gap-4 mt-4"
            dir="rtl"
            data-testid="area-bank"
          >
            <AnimatePresence>
              {bankWords.map((word) => (
                <motion.button
                  key={word.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleBankWordClick(word)}
                  className="px-6 py-4 bg-card text-card-foreground font-serif text-2xl md:text-3xl rounded-xl shadow-sm border border-card-border hover:shadow-md transition-all cursor-pointer select-none leading-relaxed"
                  data-testid={`button-bank-word-${word.id}`}
                >
                  {word.text}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
