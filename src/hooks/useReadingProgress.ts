import { useState, useEffect, useCallback } from "react";
import { ReadingProgress } from "../types";

const PROGRESS_KEY_PREFIX = "minimal_reader_progress_";

export function useReadingProgress(bookId: string | null) {
  const [progress, setProgress] = useState<ReadingProgress | null>(null);

  // Load progress when bookId changes
  useEffect(() => {
    if (!bookId) {
      setProgress(null);
      return;
    }

    try {
      const key = `${PROGRESS_KEY_PREFIX}${bookId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed: ReadingProgress = JSON.parse(saved);
        setProgress(parsed);
      } else {
        setProgress({
          bookId,
          scrollPosition: 0,
          scrollPercentage: 0,
          updatedAt: Date.now(),
        });
      }
    } catch (e) {
      console.error("Falha ao recuperar progresso do localStorage:", e);
      setProgress({
        bookId,
        scrollPosition: 0,
        scrollPercentage: 0,
        updatedAt: Date.now(),
      });
    }
  }, [bookId]);

  // Save progress function
  const saveProgress = useCallback((scrollPosition: number, scrollPercentage: number) => {
    if (!bookId) return;

    const updated: ReadingProgress = {
      bookId,
      scrollPosition,
      scrollPercentage: Math.min(100, Math.max(0, parseFloat(scrollPercentage.toFixed(2)))),
      updatedAt: Date.now(),
    };

    try {
      localStorage.setItem(`${PROGRESS_KEY_PREFIX}${bookId}`, JSON.stringify(updated));
      setProgress(updated);
    } catch (e) {
      console.error("Falha ao salvar o progresso no localStorage:", e);
    }
  }, [bookId]);

  // Clear progress function (e.g., if checking reading again)
  const clearProgress = useCallback(() => {
    if (!bookId) return;
    try {
      localStorage.removeItem(`${PROGRESS_KEY_PREFIX}${bookId}`);
      setProgress({
        bookId,
        scrollPosition: 0,
        scrollPercentage: 0,
        updatedAt: Date.now(),
      });
    } catch (e) {
      console.error("Falha ao limpar progresso do localStorage:", e);
    }
  }, [bookId]);

  return {
    progress,
    saveProgress,
    clearProgress,
  };
}
