import React, { useState } from "react";
import { Copy, Volume2, X, Sparkles, Check, AlertCircle } from "lucide-react";

interface TranslationDialogProps {
  text: string;
  isOpen: boolean;
  onClose: () => void;
  themeIsDark: boolean;
  contextBefore?: string;
  contextAfter?: string;
  targetLang: string;
}

export const TranslationDialog: React.FC<TranslationDialogProps> = ({
  text,
  isOpen,
  onClose,
  themeIsDark,
  contextBefore = "",
  contextAfter = "",
  targetLang,
}) => {
  const [loading, setLoading] = useState(false);
  const [translation, setTranslation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Trigger translation fetch when dialog opens and hasn't loaded yet
  React.useEffect(() => {
    if (isOpen && text) {
      fetchTranslation();
    } else {
      // Reset state when closed
      setTranslation(null);
      setError(null);
      setCopied(false);
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      }
    }
  }, [isOpen, text]);

  const fetchTranslation = async () => {
    setLoading(true);
    setError(null);
    setTranslation(null);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text,
          contextBefore: contextBefore.slice(-100), // Grab immediate neighboring text
          contextAfter: contextAfter.slice(0, 100),
          targetLang: targetLang,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "Falha ao se conectar com o serviço de tradução Gemini.");
      }

      const data = await response.json();
      setTranslation(data.translation);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro inesperado de tradução.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!translation) return;
    navigator.clipboard.writeText(translation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!translation) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(translation);
    utterance.lang = targetLang || "pt-BR";
    
    // Find voice matching the target language prefix
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = (targetLang || "pt-BR").split("-")[0];
    const matchVoice = voices.find(v => v.lang.startsWith(langPrefix)) || voices.find(v => v.lang.startsWith("pt")) || voices[0];
    if (matchVoice) {
      utterance.voice = matchVoice;
    }

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-text animate-fade-in">
      <div
        id="translation-modal"
        className={`w-full max-w-xl border-4 shadow-2xl overflow-hidden transition-all duration-300 transform scale-100 ${
          themeIsDark
            ? "bg-stone-950 border-stone-800 text-stone-100"
            : "bg-stone-50 border-stone-900 text-stone-900"
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b-2 border-stone-900 dark:border-stone-850">
          <div className="flex items-center gap-2">
            <div className="p-1 px-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 font-sans text-[10px] font-black tracking-[0.2em] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>TRADUTOR ACADÊMICO GEMINI</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 px-2 border-2 border-stone-900 dark:border-stone-400 font-sans text-[10px] uppercase font-bold hover:bg-stone-800 dark:hover:bg-white dark:hover:text-stone-950 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {/* Selected Text Portion */}
          <div>
            <span className="font-sans text-[10px] text-stone-400 dark:text-stone-550 uppercase tracking-[0.2em] font-bold block mb-2">
              Termos Selecionados
            </span>
            <p className={`p-4 border-2 font-serif italic text-sm leading-relaxed ${
              themeIsDark ? "bg-stone-900 border-stone-800 text-stone-200" : "bg-white border-stone-200 text-stone-800"
            }`}>
              "{text}"
            </p>
          </div>

          {/* Translation Result Portion */}
          <div>
            <span className="font-sans text-[10px] text-stone-400 dark:text-stone-550 uppercase tracking-[0.2em] font-bold block mb-2">
              Análise Literária &amp; Tradução
            </span>

            {loading && (
              <div className="space-y-3 py-4 animate-pulse">
                <div className="h-4 bg-stone-300 dark:bg-stone-800 rounded w-1/4"></div>
                <div className="h-4 bg-stone-200 dark:bg-stone-800/60 rounded w-full"></div>
                <div className="h-4 bg-stone-200 dark:bg-stone-800/60 rounded w-5/6"></div>
              </div>
            )}

            {error && (
              <div className="flex gap-2.5 p-4 border-2 border-red-500 bg-red-50 text-red-950 dark:bg-red-950/20 dark:text-red-300 text-xs font-sans uppercase tracking-wider font-bold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <div>
                  <h4 className="font-black">Erro de Conectividade</h4>
                  <p className="mt-1 normal-case font-normal">{error}</p>
                </div>
              </div>
            )}

            {translation && (
              <div className="border-2 border-stone-300 dark:border-stone-800 bg-stone-100/40 dark:bg-stone-900/40 p-5 font-serif text-base leading-relaxed break-words whitespace-pre-wrap text-stone-850 dark:text-stone-200">
                {translation}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-100 dark:bg-stone-950 border-t-2 border-stone-900 dark:border-stone-850">
          <span className="text-[10px] font-sans uppercase tracking-widest font-bold text-stone-400 dark:text-stone-500">
            Foco: Rigor Acadêmico &amp; Filológico
          </span>

          {translation && (
            <div className="flex gap-2.5">
              <button
                onClick={handleSpeak}
                className="flex items-center gap-1.5 px-3.5 py-2 border-2 hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-stone-950 border-stone-900 dark:border-stone-400 text-[10px] font-sans uppercase tracking-widest font-black cursor-pointer transition-all"
              >
                <Volume2 className={`w-3.5 h-3.5 ${isPlaying ? "text-amber-500 animate-bounce" : ""}`} />
                <span>{isPlaying ? "Parar" : "Ouvir"}</span>
              </button>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 border-2 border-stone-900 dark:border-stone-100 text-[10px] font-sans uppercase tracking-widest font-black cursor-pointer transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
