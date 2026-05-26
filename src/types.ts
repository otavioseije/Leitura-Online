/**
 * Core Types for the Minimalist Book Reader application.
 */

export interface Book {
  id: string;             // Unique identifier derived from file info (hash/name+size)
  name: string;           // File name
  content: string;        // Full raw book text content
  size: number;           // Size in bytes
  addedAt: number;        // Registration timestamp
}

export interface ReadingProgress {
  bookId: string;
  scrollPosition: number; // Current scroll offset in pixels
  scrollPercentage: number; // Progress indicator percentage (0 to 100)
  updatedAt: number;      // Last accessed timestamp
}

export type ReaderTheme = "white" | "slate" | "stone" | "sepia" | "charcoal" | "night";

export interface ReaderSettings {
  theme: ReaderTheme;
  fontSize: number;       // In pixels, e.g., 16, 18, 20, 24, 28
  fontFamily: "serif" | "sans";
  lineSpacing: "tight" | "normal" | "relaxed" | "loose";
  ttsSpeed: number;       // Web Speech API rate (0.5 to 2.0)
  ttsVoiceName: string | null; // Preference voice identifier
  ttsGender: "any" | "male" | "female"; // Hand-curated native speech filters
  ttsLang: string;        // Language code filter, e.g., "pt-BR", "en-US", etc.
}

export const THEMES: Record<
  ReaderTheme,
  {
    name: string;
    bg: string;
    text: string;
    border: string;
    panelBg: string;
    isDark: boolean;
  }
> = {
  white: {
    name: "Papel Claro",
    bg: "bg-white",
    text: "text-stone-900",
    border: "border-stone-200",
    panelBg: "bg-stone-50",
    isDark: false,
  },
  slate: {
    name: "Cinza Alquimia",
    bg: "bg-slate-50",
    text: "text-slate-900",
    border: "border-slate-200",
    panelBg: "bg-white border-b border-slate-100",
    isDark: false,
  },
  stone: {
    name: "Codex Alastor",
    bg: "bg-stone-50",
    text: "text-stone-900",
    border: "border-stone-300",
    panelBg: "bg-stone-100",
    isDark: false,
  },
  sepia: {
    name: "Biblioteca Antiga",
    bg: "bg-[#f5ebd3]",
    text: "text-[#382b1c]",
    border: "border-[#d8caa7]",
    panelBg: "bg-[#eddcb9]/60",
    isDark: false,
  },
  charcoal: {
    name: "Carvão Hermético",
    bg: "bg-stone-900", // Dark Slate/Stone
    text: "text-stone-100",
    border: "border-stone-800",
    panelBg: "bg-stone-950 border-b border-stone-850",
    isDark: true,
  },
  night: {
    name: "Obscuridade",
    bg: "bg-black",
    text: "text-stone-300",
    border: "border-stone-900",
    panelBg: "bg-stone-950 border-b border-stone-900",
    isDark: true,
  },
};
