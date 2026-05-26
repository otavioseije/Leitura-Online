import React, { useState, useEffect, useRef, useCallback } from "react";
import { Book, ReadingProgress, ReaderSettings, THEMES } from "./types";
import { getAllBooks, saveBook, deleteBook, getBook } from "./lib/db";
import { processTextFile, extractChapters, BookChapter } from "./lib/fileProcessor";
import { useReadingProgress } from "./hooks/useReadingProgress";
import { ReaderDashboard } from "./components/ReaderDashboard";
import { ReaderSettingsPanel } from "./components/ReaderSettingsPanel";
import { TranslationDialog } from "./components/TranslationDialog";

// Lucide Icons
import {
  ArrowLeft,
  ChevronRight,
  Menu,
  Play,
  Pause,
  Square,
  Volume2,
  ChevronLeft,
  Sparkles,
  BookOpenCheck,
  Settings,
  Heading,
} from "lucide-react";

export default function App() {
  // App views: "dashboard" or "reader"
  const [view, setView] = useState<"dashboard" | "reader">("dashboard");

  // Books catalogue state
  const [books, setBooks] = useState<Book[]>([]);
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<BookChapter[]>([]);
  const [progresses, setProgresses] = useState<Record<string, ReadingProgress>>({});

  // Active book progresses
  const { progress, saveProgress, clearProgress } = useReadingProgress(activeBook?.id || null);

  // Layout UI controllers
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChaptersOpen, setIsChaptersOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // List of native speech voices
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Reader Preferences settings
  const [settings, setSettings] = useState<ReaderSettings>({
    theme: "slate",
    fontSize: 18,
    fontFamily: "serif",
    lineSpacing: "relaxed",
    ttsSpeed: 1.0,
    ttsVoiceName: null,
    ttsGender: "any",
    ttsLang: "pt-BR",
  });

  const activeTheme = THEMES[settings.theme];

  // Apply dark mode class to HTML/Body elements for Tailwind classes
  useEffect(() => {
    if (activeTheme.isDark) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
  }, [settings.theme, activeTheme.isDark]);

  // Highlighted translation selections
  const [selectionDetails, setSelectionDetails] = useState<{
    text: string;
    contextBefore: string;
    contextAfter: string;
    x: number;
    y: number;
  } | null>(null);
  const [isTranslateOpen, setIsTranslateOpen] = useState(false);

  // Audio Playback / Voice synthesis tracking
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState<number | null>(null);

  // References
  const textContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const ttsUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Fetch Saved Book records on Mount
  useEffect(() => {
    loadCatalog();
    loadNativeVoices();

    // Chrome/Safari speech synthesis voice list trigger binding
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        loadNativeVoices();
      };
    }

    // Load user settings from localStorage if stored
    try {
      const savedSettings = localStorage.getItem("minimal_reader_settings");
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (e) {
      console.error("Erro ao carregar configurações de preferências:", e);
    }
  }, []);

  const loadCatalog = async () => {
    try {
      const allBooks = await getAllBooks();
      setBooks(allBooks);

      // Load progress map for each book into memory
      const listProgress: Record<string, ReadingProgress> = {};
      for (const b of allBooks) {
        const saved = localStorage.getItem(`minimal_reader_progress_${b.id}`);
        if (saved) {
          listProgress[b.id] = JSON.parse(saved);
        }
      }
      setProgresses(listProgress);
    } catch (e) {
      console.error("Falha ao abrirIndexedDB catálogo:", e);
    }
  };

  const loadNativeVoices = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const allVoices = window.speechSynthesis.getVoices();
      
      // Prioritize natural sounding Google Cloud and Microsoft online high-quality voices
      const sortedVoices = [...allVoices].sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        // Google Cloud voices or Microsoft Natural online voices get high priority
        const aIsPremium = aName.includes("google") || aName.includes("natural") || aName.includes("online");
        const bIsPremium = bName.includes("google") || bName.includes("natural") || bName.includes("online");
        
        if (aIsPremium && !bIsPremium) return -1;
        if (!aIsPremium && bIsPremium) return 1;
        
        // Then, default voices
        if (a.default && !b.default) return -1;
        if (!a.default && b.default) return 1;
        
        return a.name.localeCompare(b.name);
      });

      setVoices(sortedVoices);

      // Default fallback pt-BR voice from the prioritized list
      const defaultPt = sortedVoices.find((v) => v.lang.startsWith("pt-BR") && (v.name.toLowerCase().includes("google") || v.name.toLowerCase().includes("natural"))) ||
                        sortedVoices.find((v) => v.lang.startsWith("pt") && v.default) ||
                        sortedVoices.find((v) => v.lang.startsWith("pt")) ||
                        sortedVoices[0];

      setSettings((prev) => {
        if (!prev.ttsVoiceName && defaultPt) {
          return { ...prev, ttsVoiceName: defaultPt.name };
        }
        return prev;
      });
    }
  };

  const handleUploadBook = async (file: File) => {
    setIsProcessing(true);
    try {
      const processed = await processTextFile(file);
      // Save inside IndexedDB catalog
      await saveBook(processed);
      // Reload lists
      await loadCatalog();
    } catch (error: any) {
      alert(error.message || "Erro ao fazer upload do livro.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteBook = async (id: string) => {
    try {
      await deleteBook(id);
      // Clean progres
      localStorage.removeItem(`minimal_reader_progress_${id}`);
      // Refresh
      await loadCatalog();
      if (activeBook?.id === id) {
        setActiveBook(null);
        setView("dashboard");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Select a book to start reading
  const handleSelectBook = (book: Book) => {
    setActiveBook(book);
    const extracted = extractChapters(book.content);
    setChapters(extracted);
    setView("reader");
    setIsChaptersOpen(false);
    setIsSettingsOpen(false);
    // Reset TTS
    stopTTS();
  };

  // Convert settings changes inside registry
  const handleUpdateSettings = (updated: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem("minimal_reader_settings", JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Re-split book content into standard clean paragraphs
  const parsedParagraphs = React.useMemo(() => {
    if (!activeBook) return [];
    return activeBook.content
      .split(/\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }, [activeBook]);

  // Restore scroll positions once book content renders
  useEffect(() => {
    if (view === "reader" && progress && scrollContainerRef.current && parsedParagraphs.length > 0) {
      const container = scrollContainerRef.current;
      // We set position inside scroll viewport
      const timer = setTimeout(() => {
        container.scrollTop = progress.scrollPosition;
      }, 50); // Small render delay
      return () => clearTimeout(timer);
    }
  }, [view, activeBook?.id, progress?.bookId]);

  // Handle scrolling of container to measure progress ratio
  const handleScroll = () => {
    if (!activeBook || !scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    const totalScrollable = scrollHeight - clientHeight;
    const percentage = totalScrollable <= 0 ? 0 : (scrollTop / totalScrollable) * 100;

    saveProgress(scrollTop, percentage);

    // Sync state progresses list dynamically for dashboard metrics
    setProgresses((prev) => ({
      ...prev,
      [activeBook.id]: {
        bookId: activeBook.id,
        scrollPosition: scrollTop,
        scrollPercentage: parseFloat(percentage.toFixed(1)),
        updatedAt: Date.now(),
      },
    }));
  };

  // Jumping to a chapter checkpoint
  const handleJumpToChapter = (chapter: BookChapter) => {
    if (!activeBook || !scrollContainerRef.current) return;
    const container = scrollContainerRef.current;

    // Estimate based on line ratio inside paragraphs list
    const paragraphsCount = parsedParagraphs.length;
    let targetIndex = Math.floor((chapter.lineIndex / activeBook.content.split("\n").length) * paragraphsCount);
    targetIndex = Math.min(paragraphsCount - 1, Math.max(0, targetIndex));

    const paragraphElement = document.getElementById(`p-${targetIndex}`);
    if (paragraphElement) {
      paragraphElement.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      // Direct scroll projection estimation
      const charRatio = chapter.charOffset / activeBook.content.length;
      container.scrollTop = container.scrollHeight * charRatio;
    }
    setIsChaptersOpen(false);
  };

  // TextSelection parser to reveal Translater action bubble
  const handleTextSelection = useCallback(() => {
    if (!activeBook) return;
    const selection = window.getSelection();
    if (!selection) return;

    const text = selection.toString().trim();
    if (text.length === 0 || text.length > 250) {
      setSelectionDetails(null);
      return;
    }

    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Retrieve neighboring nodes context surrounding terms selected
      const fullText = activeBook.content;
      const termsIndex = fullText.indexOf(text);
      let contextBefore = "";
      let contextAfter = "";

      if (termsIndex !== -1) {
        contextBefore = fullText.substring(Math.max(0, termsIndex - 200), termsIndex);
        contextAfter = fullText.substring(termsIndex + text.length, Math.min(fullText.length, termsIndex + text.length + 200));
      }

      setSelectionDetails({
        text,
        contextBefore,
        contextAfter,
        x: rect.left + window.scrollX + rect.width / 2,
        y: rect.top + window.scrollY - 46, // Display hovering on top of text
      });
    } catch (e) {
      // Range failure safe fallbacks
      setSelectionDetails(null);
    }
  }, [activeBook]);

  // Bind selection listeners inside client view
  useEffect(() => {
    if (view !== "reader") {
      setSelectionDetails(null);
      return;
    }

    document.addEventListener("mouseup", handleTextSelection);
    return () => {
      document.removeEventListener("mouseup", handleTextSelection);
    };
  }, [view, handleTextSelection]);

  // Translate dialog opener
  const triggerTranslation = () => {
    if (!selectionDetails) return;
    setIsTranslateOpen(true);
  };

  // Speech helper: speaks a specific paragraph
  const speakParagraph = (index: number) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // Clear current queues

    if (index < 0 || index >= parsedParagraphs.length) {
      setIsPlayingTTS(false);
      setCurrentParagraphIndex(null);
      return;
    }

    const textToSpeak = parsedParagraphs[index];
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = settings.ttsLang || "pt-BR";
    utterance.rate = settings.ttsSpeed;

    // Match selected voice
    if (settings.ttsVoiceName) {
      const selected = voices.find((v) => v.name === settings.ttsVoiceName);
      if (selected) utterance.voice = selected;
    }

    // Scroll paragraph beautifully under view once playback focuses
    const pElement = document.getElementById(`p-${index}`);
    if (pElement) {
      pElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    // Bind event queues
    utterance.onend = () => {
      // Chain to next paragraph sequentially in continuous mode
      if (isPlayingTTS) {
        const next = index + 1;
        if (next < parsedParagraphs.length) {
          setCurrentParagraphIndex(next);
          speakParagraph(next);
        } else {
          setIsPlayingTTS(false);
          setCurrentParagraphIndex(null);
        }
      }
    };

    utterance.onerror = (e) => {
      console.error("Erro na síntese de voz:", e);
      setIsPlayingTTS(false);
      setCurrentParagraphIndex(null);
    };

    ttsUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Toggle active TTS trigger playback
  const toggleTTS = () => {
    if (isPlayingTTS) {
      // Pause
      window.speechSynthesis.pause();
      setIsPlayingTTS(false);
    } else {
      // Start or Resume
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlayingTTS(true);
      } else {
        // Find center paragraph inside visible scroll container to start reading from
        let targetIndex = 0;
        if (currentParagraphIndex !== null) {
          targetIndex = currentParagraphIndex;
        } else if (scrollContainerRef.current) {
          // Find closest visible paragraph index
          const container = scrollContainerRef.current;
          const containerTop = container.scrollTop;
          const pElements = Array.from(container.getElementsByClassName("book-para"));
          for (let i = 0; i < pElements.length; i++) {
            const el = pElements[i] as HTMLElement;
            if (el.offsetTop >= containerTop) {
              targetIndex = i;
              break;
            }
          }
        }

        setIsPlayingTTS(true);
        setCurrentParagraphIndex(targetIndex);
        speakParagraph(targetIndex);
      }
    }
  };

  // Clean Audio Synthesis
  const stopTTS = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingTTS(false);
    setCurrentParagraphIndex(null);
  };

  const handleBackwardParagraph = () => {
    if (currentParagraphIndex === null) return;
    const prev = Math.max(0, currentParagraphIndex - 1);
    setCurrentParagraphIndex(prev);
    speakParagraph(prev);
  };

  const handleForwardParagraph = () => {
    if (currentParagraphIndex === null) return;
    const next = Math.min(parsedParagraphs.length - 1, currentParagraphIndex + 1);
    setCurrentParagraphIndex(next);
    speakParagraph(next);
  };

  // Helper paragraph spacing styles classes
  const spacingClasses = {
    tight: "space-y-4 leading-relaxed",
    normal: "space-y-7 leading-relaxed",
    relaxed: "space-y-10 leading-loose",
    loose: "space-y-14 leading-[2.15]",
  };

  return (
    <div className={`${view === "reader" ? "h-screen overflow-hidden" : "min-h-screen"} flex flex-col transition-all duration-300 ${activeTheme.bg} ${activeTheme.text}`}>
      {/* ----------------- DASHBOARD VIEW ----------------- */}
      {view === "dashboard" && (
        <main className="flex-1">
          <ReaderDashboard
            books={books}
            progresses={progresses}
            onUpload={handleUploadBook}
            onSelectBook={handleSelectBook}
            onDeleteBook={handleDeleteBook}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            voices={voices}
            isProcessing={isProcessing}
          />
        </main>
      )}

      {/* ----------------- BOOK READER ACTIVE VIEW ----------------- */}
      {view === "reader" && activeBook && (
        <div id="reader-workspace" className="flex-1 flex flex-col h-screen relative overflow-hidden">
          {/* Top Control panel header bar */}
          <header
            id="reader-top-controls"
            className={`px-4 md:px-10 py-4 flex items-center justify-between border-b-2 shadow-none z-20 ${activeTheme.panelBg} ${activeTheme.border}`}
          >
            {/* Nav Back Section */}
            <div className="flex items-center gap-4">
              <button
                id="back-btn"
                onClick={() => {
                  stopTTS();
                  setView("dashboard");
                }}
                className="p-2 border-2 border-stone-900 dark:border-stone-100 bg-stone-900 text-stone-50 dark:bg-stone-50 dark:text-stone-950 font-bold hover:bg-stone-800 dark:hover:bg-stone-100 cursor-pointer flex items-center justify-center transition-colors"
                title="Voltar ao Painel"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="hidden md:block">
                <span className="text-[9px] uppercase tracking-[0.2em] font-sans font-bold text-stone-400 dark:text-stone-500 block">volumes</span>
                <h4 className="font-serif font-black italic text-sm line-clamp-1 max-w-[200px]">
                  {activeBook.name}
                </h4>
              </div>
            </div>

            {/* Continuous Audio Web Speech Player Controls */}
            <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-950 border-2 border-stone-300 dark:border-stone-800">
              <button
                onClick={handleBackwardParagraph}
                disabled={currentParagraphIndex === null || currentParagraphIndex === 0}
                className="p-1.5 hover:bg-stone-900 hover:text-white dark:hover:bg-stone-100 dark:hover:text-stone-950 text-stone-700 dark:text-stone-300 disabled:opacity-30 cursor-pointer"
                title="Parágrafo Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                id="playback-btn"
                onClick={toggleTTS}
                className={`py-1.5 px-2.5 sm:px-3.5 text-[9px] uppercase tracking-widest font-sans font-black flex items-center gap-1 cursor-pointer transition-all ${
                  isPlayingTTS
                    ? "bg-amber-400 border border-amber-500 text-stone-950"
                    : "bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-50"
                }`}
                title={isPlayingTTS ? "Pausar Leitura de Voz" : "Ler em voz alta"}
              >
                {isPlayingTTS ? <Pause className="w-3.5 h-3.5 animate-pulse" /> : <Play className="w-3.5 h-3.5" />}
                <span className="hidden xs:inline">{isPlayingTTS ? "Lendo" : "Executar"}</span>
              </button>

              {currentParagraphIndex !== null && (
                <button
                  onClick={stopTTS}
                  className="p-1.5 hover:bg-red-500 hover:text-white text-red-600 dark:text-red-400 cursor-pointer"
                  title="Parar Leitor"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              )}

              <button
                onClick={handleForwardParagraph}
                disabled={currentParagraphIndex === null || currentParagraphIndex === parsedParagraphs.length - 1}
                className="p-1.5 hover:bg-stone-900 hover:text-white dark:hover:bg-stone-100 dark:hover:text-stone-950 text-stone-700 dark:text-stone-300 disabled:opacity-30 cursor-pointer"
                title="Parágrafo Posterior"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Sidemenus Toggles */}
            <div className="flex items-center gap-2">
              <button
                id="summary-btn"
                onClick={() => setIsChaptersOpen(!isChaptersOpen)}
                className={`p-2 cursor-pointer border-2 flex items-center justify-center transition-colors ${
                  isChaptersOpen
                    ? "bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-950 dark:border-white"
                    : "border-stone-300 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-900"
                }`}
                title="Sumário de Capítulos"
              >
                <Heading className="w-4 h-4" />
              </button>

              <button
                id="settings-btn"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`p-2 cursor-pointer border-2 flex items-center justify-center transition-colors ${
                  isSettingsOpen
                    ? "bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-950 dark:border-white"
                    : "border-stone-300 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-900"
                }`}
                title="Configurações de Layout"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Core scrollable desk container */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Sidebar Chapter Navigator overlay drawer list */}
            {isChaptersOpen && (
              <>
                {/* Backdrop to dismiss chapters sidebar on smaller screens */}
                <div
                  onClick={() => setIsChaptersOpen(false)}
                  className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-30 transition-all cursor-pointer"
                />
                <div
                  id="chapters-sidebar-over"
                  className={`fixed md:static inset-y-0 left-0 w-72 border-r-2 h-full flex flex-col z-40 transition-transform duration-300 animate-slide-in shadow-2xl md:shadow-none ${activeTheme.panelBg} ${activeTheme.border}`}
                >
                  <div className="px-6 py-4 border-b-2 flex items-center justify-between border-stone-300/40 dark:border-stone-800">
                    <h4 className="font-sans font-bold text-[10px] flex items-center gap-1.5 uppercase tracking-widest text-stone-500 dark:text-stone-400">
                      <BookOpenCheck className="w-4.5 h-4.5" />
                      Índices do Compêndio
                    </h4>
                    <button
                      onClick={() => setIsChaptersOpen(false)}
                      className="md:hidden p-1 px-2 border-2 border-stone-900 dark:border-stone-400 font-sans text-[9px] font-black uppercase tracking-wider hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-stone-950 cursor-pointer"
                    >
                      X
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto py-2">
                    {chapters.map((chapter) => (
                      <button
                        key={chapter.id}
                        onClick={() => handleJumpToChapter(chapter)}
                        className="w-full text-left px-6 py-4 hover:bg-stone-200/40 dark:hover:bg-stone-800/40 transition-colors border-b border-stone-200 dark:border-stone-800/60 flex items-center justify-between gap-3 font-serif text-sm cursor-pointer"
                      >
                        <span className="truncate flex-1 italic font-semibold">{chapter.title}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Immersive Text Reader Port */}
            <div
              id="immersive-reader-desk"
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 md:py-16 scroll-smooth book-text-selection"
            >
              <div
                ref={textContainerRef}
                className={`max-w-2xl mx-auto tracking-normal px-2 ${
                  settings.fontFamily === "serif" ? "font-serif" : "font-sans"
                } ${spacingClasses[settings.lineSpacing]}`}
                style={{ fontSize: `${settings.settings_fontSize || settings.fontSize}px` }}
              >
                {/* Book Title display header matching Poimandres */}
                <div className="mb-12">
                  <span className="text-[10px] tracking-[0.25em] font-sans uppercase font-bold text-stone-400 dark:text-stone-500 block mb-2">
                    Volume sob Análise
                  </span>
                  <h1 className="text-6xl md:text-7xl font-black font-serif tracking-tighter italic leading-none mb-4 break-words text-stone-900 dark:text-stone-50">
                    {activeBook.name.replace(/\.[^/.]+$/, "")}.
                  </h1>
                  <div className="h-[2px] w-full bg-stone-900/10 dark:bg-stone-100/10"></div>
                </div>

                {/* Paragraph segments mapper block */}
                {parsedParagraphs.map((paragraph, idx) => {
                  const isAudiblyFocused = currentParagraphIndex === idx;

                  return (
                    <p
                      key={idx}
                      id={`p-${idx}`}
                      className={`book-para text-justify text-[1.08em] select-text transition-all duration-300 py-2.5 px-3 -mx-3 hover:bg-stone-200/20 dark:hover:bg-stone-800/10 ${
                        isAudiblyFocused
                          ? "bg-amber-100/60 text-stone-950 dark:bg-[#ebdcb9]/20 dark:text-[#f4efe2] ring-2 ring-stone-900 dark:ring-stone-100 border-l-4 border-stone-900 dark:border-stone-300"
                          : "text-stone-800 dark:text-stone-200"
                      }`}
                      onDoubleClick={() => {
                        // Double click parágrafo to trigger speech read from here instantly
                        setIsPlayingTTS(true);
                        setCurrentParagraphIndex(idx);
                        speakParagraph(idx);
                      }}
                      title="Clique duplo para ler daqui em voz"
                    >
                      {paragraph}
                    </p>
                  );
                })}
              </div>

              {/* Bottom Reading Complete Flag */}
              <div className="max-w-xl mx-auto mt-24 text-center border-t-2 border-stone-300 dark:border-stone-850 pt-12 pb-24">
                <span className="font-serif italic text-lg block text-stone-500 dark:text-stone-400">
                  Fim do Livro
                </span>
                <span className="font-sans text-[10px] uppercase font-bold text-stone-400 dark:text-stone-550 tracking-[0.2em] mt-2 block">
                  {activeBook.name}
                </span>
              </div>
            </div>

            {/* Right: Page Controls & Progress Gauge */}
            <div className="w-14 flex flex-col items-center justify-center py-16 border-l border-stone-200/50 dark:border-stone-800/50 hidden sm:flex bg-stone-100/30 dark:bg-stone-950/20">
              <div className="h-full w-[2px] bg-stone-250 dark:bg-stone-850 relative flex flex-col justify-end">
                <div 
                  className="absolute top-0 left-0 w-full bg-stone-800 dark:bg-stone-300 transition-all duration-300"
                  style={{ height: `${progresses[activeBook.id]?.scrollPercentage || 0}%` }}
                ></div>
                <div 
                  className="absolute -left-[11px] w-6 h-6 bg-stone-50 dark:bg-stone-900 border-2 border-stone-800 dark:border-stone-100 rounded-full flex items-center justify-center text-[9px] font-sans font-black text-stone-900 dark:text-stone-100 transition-all duration-300"
                  style={{ top: `calc(${progresses[activeBook.id]?.scrollPercentage || 0}% - 12px)` }}
                ></div>
              </div>
            </div>

            {/* FLOATING ACTION PILL ON TEXT SELECTION: Translate on highlight */}
            {selectionDetails && (
              <button
                id="floating-translate-pill"
                onClick={triggerTranslation}
                className="absolute z-40 flex items-center gap-1.5 px-3.5 py-2 rounded-full cursor-pointer bg-slate-900 dark:bg-zinc-100 text-slate-50 dark:text-zinc-950 font-sans font-medium text-xs shadow-lg transform -translate-x-1/2 -translate-y-full hover:scale-105 transition-all duration-150 border border-slate-700/60 dark:border-zinc-300"
                style={{
                  top: `${selectionDetails.y - 12}px`,
                  left: `${selectionDetails.x}px`,
                }}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>Traduzir com Gemini</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ----------------- SETTINGS SIDEBAR OVERLAY DRAWER ----------------- */}
      <ReaderSettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        voices={voices}
      />

      {/* ----------------- CONTEXTUAL TRANSLATION POPUP DIALOG ----------------- */}
      <TranslationDialog
        isOpen={isTranslateOpen}
        onClose={() => setIsTranslateOpen(false)}
        text={selectionDetails?.text || ""}
        contextBefore={selectionDetails?.contextBefore || ""}
        contextAfter={selectionDetails?.contextAfter || ""}
        themeIsDark={activeTheme.isDark}
        targetLang={settings.ttsLang || "pt-BR"}
      />
    </div>
  );
}
