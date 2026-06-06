import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Home, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSurah } from "@/data/surahs";
import { useT } from "@/i18n/LanguageContext";
import { tReplace } from "@/i18n/translations";
import { persistAddAyahs } from "@/hooks/useProgress";
import { useRevisionTimer } from "@/hooks/useRevisionTimer";
import Footer from "@/components/Footer";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SECTION_SIZE = 10;

const BASMALAH_WORDS: string[] =
  getSurah(1)?.ayahs.find((a) => a.number === 1)?.words ?? [];

function getAyahDisplayText(surahNum: number, ayahNum: number, words: string[]): string {
  if (
    surahNum === 1 ||
    ayahNum !== 1 ||
    BASMALAH_WORDS.length === 0 ||
    words.length < BASMALAH_WORDS.length
  ) return words.join(" ");
  const hasBasmalah = BASMALAH_WORDS.every((w, i) => words[i] === w);
  return hasBasmalah ? words.slice(BASMALAH_WORDS.length).join(" ") : words.join(" ");
}

// ---------------------------------------------------------------------------
// Shuffle helper
// ---------------------------------------------------------------------------
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeShuffledBank(nums: number[]): number[] {
  if (nums.length <= 1) return [...nums];
  let shuffled = shuffleArray(nums);
  while (JSON.stringify(shuffled) === JSON.stringify(nums)) {
    shuffled = shuffleArray(nums);
  }
  return shuffled;
}

// ---------------------------------------------------------------------------
// Hint helpers
// ---------------------------------------------------------------------------
/**
 * Returns the index of the first position where the answer diverges from
 * correctOrder. When textByNum is supplied (always pass it), positions are
 * compared by DISPLAYED TEXT so that surahs with repeated ayah text (e.g.
 * Al-Kafirun 3 & 5) are judged correct regardless of which identical ayah
 * the user placed there.
 */
function getNextIncorrectPos(
  answerNums: number[],
  correctOrder: number[],
  textByNum: Record<number, string>,
): number {
  for (let i = 0; i < correctOrder.length; i++) {
    const answered = answerNums[i];
    const expected = correctOrder[i];
    if (answered === undefined) return i;
    if (textByNum[answered] !== textByNum[expected]) return i;
  }
  return correctOrder.length;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
type GameState = "playing" | "correct" | "wrong";

export default function ArrangeAyahsPage() {
  const { surahNumber, from: fromParam } = useParams<{
    surahNumber: string;
    from: string;
  }>();
  const [, setLocation] = useLocation();
  const t = useT();

  const sNum = parseInt(surahNumber, 10);
  const from = parseInt(fromParam, 10);
  const surah = getSurah(sNum);

  const lastAyahNum = surah ? surah.ayahs[surah.ayahs.length - 1].number : 0;
  const to = Math.min(from + SECTION_SIZE - 1, lastAyahNum);

  const sectionAyahs = surah
    ? surah.ayahs.filter((a) => a.number >= from && a.number <= to)
    : [];

  const correctOrder = sectionAyahs.map((a) => a.number);

  const [bankNums, setBankNums] = useState<number[]>([]);
  const [answerNums, setAnswerNums] = useState<number[]>([]);
  const [gameState, setGameState] = useState<GameState>("playing");
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintHighlightSlot, setHintHighlightSlot] = useState<number | null>(null);
  const completedRef = useRef(false);

  useRevisionTimer();

  useEffect(() => {
    if (sectionAyahs.length === 0) return;
    setBankNums(makeShuffledBank(correctOrder));
    setAnswerNums([]);
    setGameState("playing");
    setHintsUsed(0);
    setHintHighlightSlot(null);
    completedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sNum, from]);

  useEffect(() => {
    if (gameState === "correct" && !completedRef.current) {
      completedRef.current = true;
      persistAddAyahs(sectionAyahs.length);
    }
  }, [gameState, sectionAyahs.length]);

  if (!surah || sectionAyahs.length === 0) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">{t.sectionNotFound}</p>
          <button
            onClick={() => setLocation(`/surah/${sNum}`)}
            className="text-primary underline text-sm"
          >
            {t.backToSurah}
          </button>
        </div>
      </div>
    );
  }

  const textByNum: Record<number, string> = {};
  for (const a of sectionAyahs) {
    textByNum[a.number] = getAyahDisplayText(sNum, a.number, a.words);
  }

  // -------------------------------------------------------------------------
  // Core interaction handlers
  // -------------------------------------------------------------------------
  function handleBankTap(ayahNum: number) {
    if (gameState === "correct") return;
    setBankNums((prev) => {
      if (!prev.includes(ayahNum)) return prev;
      return prev.filter((n) => n !== ayahNum);
    });
    setAnswerNums((prev) => {
      if (prev.includes(ayahNum)) return prev;
      return [...prev, ayahNum];
    });
    setGameState("playing");
    setHintHighlightSlot(null);
  }

  function handleAnswerTap(ayahNum: number) {
    if (gameState === "correct") return;
    setAnswerNums((prev) => {
      if (!prev.includes(ayahNum)) return prev;
      return prev.filter((n) => n !== ayahNum);
    });
    setBankNums((prev) => {
      if (prev.includes(ayahNum)) return prev;
      return [...prev, ayahNum];
    });
    setGameState("playing");
    setHintHighlightSlot(null);
  }

  // -------------------------------------------------------------------------
  // Hint logic — mirrors PuzzlePage
  // -------------------------------------------------------------------------
  /**
   * Reveal `count` correct ayahs starting at `fromPos` in the answer area.
   * Any displaced wrong-position items are returned to the bank.
   */
  function revealAyahs(fromPos: number, count: number) {
    const displaced = answerNums.slice(fromPos);
    const kept = answerNums.slice(0, fromPos);
    const combined = [...bankNums, ...displaced];
    const newAnswer = [...kept];
    const newBank = [...combined];
    for (let k = 0; k < count; k++) {
      const target = correctOrder[fromPos + k];
      if (target === undefined) break;
      const idx = newBank.indexOf(target);
      if (idx !== -1) {
        newAnswer.push(newBank[idx]);
        newBank.splice(idx, 1);
      }
    }
    setAnswerNums(newAnswer);
    setBankNums(newBank);
  }

  function handleHint() {
    if (hintsUsed >= 3 || gameState === "correct") return;
    const nextLevel = hintsUsed + 1;
    const pos = getNextIncorrectPos(answerNums, correctOrder, textByNum);
    if (pos < correctOrder.length) {
      if (nextLevel === 1) {
        // Highlight the slot only
        setHintHighlightSlot(pos);
      } else {
        // Reveal 1 or 2 ayahs at that position
        revealAyahs(pos, nextLevel === 2 ? 1 : 2);
        setHintHighlightSlot(null);
      }
    }
    setHintsUsed(nextLevel);
  }

  // -------------------------------------------------------------------------
  // Check / Reset
  // -------------------------------------------------------------------------
  function handleCheck() {
    // Compare by displayed text rather than ayah number so that surahs with
    // repeated ayah text (e.g. Al-Kafirun ayahs 3 & 5) are marked correct
    // regardless of which identical ayah the user placed at each position.
    const isCorrect =
      answerNums.length === correctOrder.length &&
      answerNums.every((n, idx) => textByNum[n] === textByNum[correctOrder[idx]]);
    if (isCorrect) {
      setGameState("correct");
      setHintHighlightSlot(null);
    } else {
      setGameState("wrong");
      setHintHighlightSlot(null);
      setTimeout(() => setGameState("playing"), 900);
    }
  }

  function handleReset() {
    setBankNums(makeShuffledBank(correctOrder));
    setAnswerNums([]);
    setGameState("playing");
    setHintsUsed(0);
    setHintHighlightSlot(null);
  }

  const nextFrom = to + 1;
  const hasNextSection = nextFrom <= lastAyahNum;
  const isSurahComplete = gameState === "correct" && !hasNextSection;
  const surahInfo = `${surah.nameArabic} ${sNum}`;

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center py-12 px-4 bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-2xl w-full flex flex-col gap-8">

        {/* ── Header ── */}
        <header className="relative text-center space-y-3 pt-8 sm:pt-0">
          <div className="absolute left-0 top-1 flex items-center gap-1">
            <button
              onClick={() => setLocation(`/surah/${sNum}`)}
              className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
              aria-label="Back to Surah"
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
            {t.arrangeAyahsTitle}
          </h1>
          <p className="text-muted-foreground text-lg">{t.putAyahsInOrder}</p>
        </header>

        <main className="flex flex-col gap-8 w-full">
          {/* Surah + section label */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span
              className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium font-serif border border-primary/20"
              dir="rtl"
            >
              {surahInfo}
            </span>
            <span className="bg-secondary text-secondary-foreground px-4 py-1.5 rounded-full text-sm font-medium border border-border">
              {t.ayahsLabel} {from}–{to}
            </span>
          </div>

          {/* ── Answer Area ── */}
          <motion.div
            className={`min-h-[120px] bg-card border-2 border-dashed rounded-2xl p-5 flex flex-col gap-3 shadow-sm transition-colors duration-300 ${
              gameState === "correct"
                ? "border-green-500 bg-green-50/50 shadow-green-500/20 shadow-lg"
                : gameState === "wrong"
                ? "border-destructive/50 bg-destructive/5"
                : "border-border"
            }`}
            animate={gameState === "wrong" ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            data-testid="area-answer"
          >
            <AnimatePresence>
              {answerNums.length === 0 && hintHighlightSlot !== 0 && (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full text-center text-muted-foreground/50 font-serif text-lg italic py-4 pointer-events-none select-none"
                >
                  {t.tapAyahsPlaceholder}
                </motion.div>
              )}

              {answerNums.map((ayahNum, index) => (
                <motion.button
                  key={`answer-${ayahNum}`}
                  layout
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  whileHover={gameState !== "correct" ? { scale: 1.005 } : {}}
                  whileTap={gameState !== "correct" ? { scale: 0.995 } : {}}
                  onClick={() => handleAnswerTap(ayahNum)}
                  className={`w-full flex items-start gap-3 bg-secondary text-secondary-foreground border rounded-xl px-5 py-4 shadow-sm hover:shadow-md transition-all cursor-pointer text-right select-none ${
                    hintHighlightSlot === index
                      ? "border-amber-400 ring-2 ring-amber-400 ring-offset-1"
                      : "border-secondary-border"
                  }`}
                  dir="rtl"
                  data-testid={`button-answer-ayah-${ayahNum}`}
                >
                  <span className="shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-bold font-mono flex items-center justify-center mt-0.5">
                    {index + 1}
                  </span>
                  <p className="font-serif text-xl md:text-2xl leading-loose flex-1">
                    {textByNum[ayahNum]}
                  </p>
                </motion.button>
              ))}

              {/* Ghost slot — Hint 1 highlights the next empty position */}
              {hintHighlightSlot === answerNums.length && (
                <motion.div
                  key="ghost-slot"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                  className="w-full flex items-center gap-3 rounded-xl border-2 border-dashed border-amber-400 bg-amber-50/60 px-5 py-4 pointer-events-none select-none"
                  dir="rtl"
                >
                  <span className="shrink-0 w-7 h-7 rounded-full border-2 border-dashed border-amber-400 text-amber-400 text-xs font-bold font-mono flex items-center justify-center mt-0.5">
                    {answerNums.length + 1}
                  </span>
                  <p className="font-serif text-xl text-amber-400 leading-loose">
                    ?
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Completion panel */}
          <AnimatePresence>
            {gameState === "correct" && (
              <motion.div
                key="complete-msg"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-green-200 bg-green-50/60 px-6 py-4 text-center"
              >
                <p className="text-green-700/70 text-xs mb-2 font-sans tracking-wide uppercase">
                  {t.ayahsLabel} {from}–{to}
                </p>
                <p className="text-green-800 font-serif text-base leading-relaxed">
                  {sectionAyahs.map((a) => a.number).join(" → ")}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Controls ── */}
          <div className="flex flex-wrap items-center justify-center gap-4 py-2">
            {gameState !== "correct" ? (
              <>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleReset}
                  disabled={answerNums.length === 0 && hintsUsed === 0}
                  className="px-8 font-medium text-base rounded-full"
                  data-testid="button-reset"
                >
                  {t.reset}
                </Button>

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

                <Button
                  size="lg"
                  onClick={handleCheck}
                  disabled={answerNums.length !== correctOrder.length}
                  className="px-8 font-medium text-base rounded-full shadow-md"
                  data-testid="button-check"
                >
                  {t.checkAnswer}
                </Button>
              </>
            ) : isSurahComplete ? (
              /* ── Surah complete: cross-surah navigation ── */
              <>
                {sNum > 1 && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setLocation(`/arrange/${sNum - 1}/1`)}
                    className="px-6 font-medium text-base rounded-full"
                    data-testid="button-prev-surah"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    {t.previousSurah}
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setLocation("/")}
                  className="px-6 font-medium text-base rounded-full"
                  data-testid="button-home"
                >
                  <Home className="w-4 h-4 mr-1" />
                  {t.home}
                </Button>
                {sNum < 114 && (
                  <Button
                    size="lg"
                    onClick={() => setLocation(`/arrange/${sNum + 1}/1`)}
                    className="px-6 font-medium text-base rounded-full bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/20"
                    data-testid="button-next-surah"
                  >
                    {t.nextSurah}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </>
            ) : (
              /* ── Section complete: within-surah navigation ── */
              <>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleReset}
                  className="px-8 font-medium text-base rounded-full"
                >
                  {t.retrySection}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setLocation(`/surah/${sNum}`)}
                  className="px-8 font-medium text-base rounded-full"
                >
                  {t.backToSurah}
                </Button>
                <Button
                  size="lg"
                  onClick={() => setLocation(`/arrange/${sNum}/${nextFrom}`)}
                  className="px-8 font-medium text-base rounded-full bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/20"
                  data-testid="button-next-section"
                >
                  {t.nextSection}
                </Button>
              </>
            )}
          </div>

          {/* ── Feedback ── */}
          <div className="flex flex-col items-center justify-center gap-3 min-h-[4rem]" aria-live="polite">
            <AnimatePresence mode="wait">
              {gameState === "correct" && (
                <motion.div
                  key="correct"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-1"
                  data-testid="text-success"
                >
                  <p className="text-green-600 font-serif text-xl font-bold">
                    {t.correctMashaAllah}
                  </p>
                  <p className="text-primary font-serif text-lg font-semibold">
                    {isSurahComplete
                      ? t.mashaAllahSurahComplete
                      : tReplace(t.mashaAllahCompleted, { from, to })}
                  </p>
                </motion.div>
              )}
              {gameState === "wrong" && (
                <motion.div
                  key="wrong"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-destructive font-medium text-lg"
                  data-testid="text-error"
                >
                  {t.tryAgain}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Ayah Bank ── */}
          <div className="flex flex-col gap-3" data-testid="area-bank">
            <AnimatePresence>
              {bankNums.map((ayahNum) => (
                <motion.button
                  key={`bank-${ayahNum}`}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ layout: { duration: 0.2 } }}
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleBankTap(ayahNum)}
                  className="w-full flex items-start gap-3 bg-card text-card-foreground border border-border rounded-xl px-5 py-4 shadow-sm hover:shadow-md transition-all cursor-pointer text-right select-none"
                  dir="rtl"
                  data-testid={`button-bank-ayah-${ayahNum}`}
                >
                  <span className="shrink-0 w-7 h-7 rounded-full bg-muted text-muted-foreground text-xs font-bold font-mono flex items-center justify-center mt-0.5">
                    ?
                  </span>
                  <p className="font-serif text-xl md:text-2xl text-foreground leading-loose flex-1">
                    {textByNum[ayahNum]}
                  </p>
                </motion.button>
              ))}
            </AnimatePresence>
            {bankNums.length === 0 && answerNums.length < correctOrder.length && (
              <p className="text-center text-muted-foreground/50 text-sm italic py-2">
                {t.allAyahsPlaced}
              </p>
            )}
          </div>

        </main>

        <Footer />
      </div>
    </div>
  );
}
