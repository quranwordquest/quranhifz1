import { useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------
export const PROGRESS_KEY = "ayah-puzzle-progress-v1";

export interface ProgressData {
  ayahsCompleted: number;
  timeSpentSeconds: number;
}

export function loadProgress(): ProgressData {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { ayahsCompleted: 0, timeSpentSeconds: 0 };
    const p = JSON.parse(raw);
    return {
      ayahsCompleted: typeof p.ayahsCompleted === "number" ? p.ayahsCompleted : 0,
      timeSpentSeconds: typeof p.timeSpentSeconds === "number" ? p.timeSpentSeconds : 0,
    };
  } catch {
    return { ayahsCompleted: 0, timeSpentSeconds: 0 };
  }
}

export function saveProgress(data: ProgressData): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable (private browsing quota, etc.)
  }
}

/**
 * Add seconds directly to localStorage without touching React state.
 * Used by useRevisionTimer so the timer never has to be in the same
 * component tree as useProgress.
 */
export function persistAddTime(seconds: number): void {
  if (seconds <= 0) return;
  const data = loadProgress();
  saveProgress({ ...data, timeSpentSeconds: data.timeSpentSeconds + seconds });
}

/**
 * Add completed ayahs directly to localStorage without touching React state.
 * Convenience for call-sites that don't need reactive progress state.
 */
export function persistAddAyahs(n: number): void {
  if (n <= 0) return;
  const data = loadProgress();
  saveProgress({ ...data, ayahsCompleted: data.ayahsCompleted + n });
}

// ---------------------------------------------------------------------------
// React hook — reactive progress state for display (e.g. home page)
// ---------------------------------------------------------------------------
export function useProgress() {
  const [progress, setProgress] = useState<ProgressData>(loadProgress);

  const addAyahs = useCallback((n: number) => {
    if (n <= 0) return;
    setProgress((prev) => {
      const next = { ...prev, ayahsCompleted: prev.ayahsCompleted + n };
      saveProgress(next);
      return next;
    });
  }, []);

  const addTime = useCallback((seconds: number) => {
    if (seconds <= 0) return;
    setProgress((prev) => {
      const next = { ...prev, timeSpentSeconds: prev.timeSpentSeconds + seconds };
      saveProgress(next);
      return next;
    });
  }, []);

  const resetProgress = useCallback(() => {
    const next: ProgressData = { ayahsCompleted: 0, timeSpentSeconds: 0 };
    saveProgress(next);
    setProgress(next);
  }, []);

  return { progress, addAyahs, addTime, resetProgress };
}
