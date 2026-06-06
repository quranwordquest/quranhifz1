import { useEffect, useRef } from "react";
import { persistAddTime } from "./useProgress";

/**
 * Drop this hook into any "active revision" page (PuzzlePage, ArrangeAyahsPage,
 * RandomChallengePage) to automatically accumulate time in localStorage.
 *
 * Time is NOT counted while the tab is hidden (visibilitychange).
 * Accumulated seconds are flushed on unmount (page navigation).
 */
export function useRevisionTimer(): void {
  const startRef = useRef<number>(Date.now());
  const accumulatedRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = Date.now();
    accumulatedRef.current = 0;

    const handleVisibility = () => {
      if (document.hidden) {
        accumulatedRef.current += (Date.now() - startRef.current) / 1000;
      } else {
        startRef.current = Date.now();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (!document.hidden) {
        accumulatedRef.current += (Date.now() - startRef.current) / 1000;
      }
      const rounded = Math.round(accumulatedRef.current);
      if (rounded > 0) {
        persistAddTime(rounded);
      }
    };
  }, []);
}
