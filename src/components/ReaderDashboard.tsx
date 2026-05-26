import React, { useState, useRef } from "react";
import { Book, ReadingProgress, ReaderSettings } from "../types";
import { 
  BookOpen, 
  Upload, 
  Trash2, 
  Calendar, 
  HardDrive, 
  FileText, 
  Sparkles, 
  BookMarked,
  Volume2,
  Globe,
  Sliders
} from "lucide-react";

interface ReaderDashboardProps {
  books: Book[];
  progresses: Record<string, ReadingProgress>;
  onUpload: (file: File) => void;
  onSelectBook: (book: Book) => void;
  onDeleteBook: (id: string) => void;
  settings: ReaderSettings;
  onUpdateSettings: (updated: Partial<ReaderSettings>) => void;
  voices: SpeechSynthesisVoice[];
}

const LANGUAGES = [
  { code: "pt-BR", label: "Português (Brasil)" },
  { code: "en-US", label: "English (United States)" },
  { code: "es-ES", label: "Español (España)" },
  { code: "fr-FR", label: "Français (France)" },
  { code: "de-DE", label: "Deutsch (Deutschland)" },
  { code: "it-IT", label: "Italiano (Italia)" },
];

export const ReaderDashboard: React.FC<ReaderDashboardProps> = ({
  books,
  progresses,
  onUpload,
  onSelectBook,
  onDeleteBook,
  settings,
  onUpdateSettings,
  voices,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio Test States
  const [testText, setTestText] = useState("");
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const lowerName = file.name.toLowerCase();
      const validExtensions = [".txt", ".md", ".json", ".csv", ".xml", ".html"];
      const isValid = validExtensions.some(ext => lowerName.endsWith(ext));

      if (isValid) {
        onUpload(file);
      } else {
        alert("Por favor, envie um arquivo de texto plano (.txt, .md, .json, .csv, .xml, .html).");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files[0]);
    }
  };

  // Sound Synth Live Voice Preview
  const handleVoiceTest = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("A síntese de voz nativa não é suportada neste navegador.");
      return;
    }

    if (isPlayingTest) {
      window.speechSynthesis.cancel();
      setIsPlayingTest(false);
      return;
    }

    const defaultPhrases: Record<string, string> = {
      "pt-BR": "Olá, eu sou o seu leitor virtual de Sophia. Seu estrado acústico está pronto para iniciar.",
      "en-US": "Hello, I am your Sophia reader voice. Your acoustic settings are applied successfully.",
      "es-ES": "Hola, soy tu lector virtual de Sophia. Tu configuración de audio está activada.",
      "fr-FR": "Bonjour, je suis votre voix de Sophia. Prêt pour la lecture avancée.",
      "de-DE": "Hallo, ich bin deine Sophia Stimme. Deine Audioeinstellungen sind bereit.",
      "it-IT": "Ciao, sono la tua voce di Sophia. La configurazione di lettura è pronta."
    };

    const targetLang = settings.ttsLang || "pt-BR";
    const sampleText = testText.trim() || defaultPhrases[targetLang] || "Sophia Reader Active.";
    const utterance = new SpeechSynthesisUtterance(sampleText);
    utterance.lang = targetLang;
    utterance.rate = settings.ttsSpeed;

    if (settings.ttsVoiceName) {
      const selected = voices.find(v => v.name === settings.ttsVoiceName);
      if (selected) utterance.voice = selected;
    }

    utterance.onend = () => setIsPlayingTest(false);
    utterance.onerror = () => setIsPlayingTest(false);

    setIsPlayingTest(true);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  // Filter voices on the basis of language and custom gender markers heuristic
  const filteredVoices = voices.filter((v) => {
    const targetLangCode = settings.ttsLang || "pt-BR";
    const matchesLang = v.lang.toLowerCase().startsWith(targetLangCode.split("-")[0]);
    if (!matchesLang) return false;

    if (settings.ttsGender === "female") {
      const name = v.name.toLowerCase();
      const isFemale = name.includes("female") || name.includes("samantha") || name.includes("zira") || name.includes("vitoria") || name.includes("luciana") || name.includes("joana") || name.includes("helena") || name.includes("karen") || name.includes("moira") || name.includes("tessa");
      return isFemale;
    }
    if (settings.ttsGender === "male") {
      const name = v.name.toLowerCase();
      const isMale = name.includes("male") || name.includes("daniel") || name.includes("david") || name.includes("felipe") || name.includes("ricardo") || name.includes("george") || name.includes("ravi");
      return isMale;
    }
    return true;
  });

  // Human bytes converter
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Time formatter
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div id="dashboard-view" className="max-w-4xl mx-auto px-6 py-10 md:py-16 animate-fade-in text-stone-900 dark:text-stone-100">
      {/* Title & Concept */}
      <header className="mb-12 text-center md:text-left border-b border-stone-200/80 dark:border-stone-800 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 font-sans text-[10px] font-bold uppercase tracking-[0.2em] border border-stone-200 dark:border-stone-800">
          <BookMarked className="w-3.5 h-3.5 text-stone-500" />
          <span>SOPHIA INDEX / 0.1</span>
        </div>
        <h1 className="font-serif text-5xl md:text-7xl font-black text-stone-900 dark:text-stone-50 tracking-tighter italic leading-none">
          Sophia Reader.
        </h1>
        <p className="mt-4 text-stone-600 dark:text-stone-400 font-serif italic text-base md:text-lg max-w-2xl leading-relaxed">
          Seu estojo de leitura acadêmica offline. Carregue livros em formato <span className="font-mono bg-stone-200 dark:bg-stone-800 px-1 rounded text-xs text-stone-850 dark:text-stone-200">.txt</span>, <span className="font-mono bg-stone-200 dark:bg-stone-800 px-1 rounded text-xs text-stone-850 dark:text-stone-200">.md</span> ou <span className="font-mono bg-stone-200 dark:bg-stone-800 px-1 rounded text-xs text-stone-850 dark:text-stone-200">.json</span> localmente. Configure a voz do leitor de livros nativo e traduza conceitos eruditos em múltiplos idiomas pelo Gemini.
        </p>
      </header>

      {/* Upload Box */}
      <div
        id="upload-dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative mb-14 p-10 md:p-14 border-4 transition-all duration-300 cursor-pointer text-center select-none ${
          isDragOver
            ? "border-stone-900 bg-stone-100 scale-[0.99] dark:border-stone-100 dark:bg-stone-900"
            : "border-stone-300 hover:border-stone-900 dark:border-stone-800 dark:hover:border-stone-350 bg-stone-100/30 hover:bg-stone-50/50 dark:bg-stone-950/30"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".txt,.md,.json,.csv,.xml,.html"
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 bg-stone-900 dark:bg-stone-100 rounded flex items-center justify-center text-stone-100 dark:text-stone-900 font-bold transition-transform group-hover:scale-105">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.25em] font-black text-stone-900 dark:text-stone-150">
              Importar Novo Compêndio
            </p>
            <p className="mt-2.5 text-xs text-stone-500 dark:text-stone-400 font-serif italic max-w-md mx-auto leading-relaxed">
              Arraste seu arquivo (.txt, .md, .json, etc.) para o estojo ou clique aqui para buscar. Processado de forma assíncrona inteiramente no navegador.
            </p>
          </div>
        </div>
      </div>

      {/* NOVO PAINEL DE CONTROLE DE VOZ NA ABA INICIAL */}
      <section className="mb-14 border-4 border-stone-900 dark:border-stone-100 bg-stone-100/50 dark:bg-stone-950/40 p-6 md:p-8">
        <div className="flex items-center gap-2.5 mb-6 border-b-2 border-stone-900 dark:border-stone-800 pb-3">
          <Volume2 className="w-4.5 h-4.5 text-stone-900 dark:text-stone-100" />
          <h2 className="font-sans text-xs uppercase tracking-[0.2em] font-black text-stone-900 dark:text-stone-100">
            Ajustes Vocais &amp; Acústica do Sintetizador
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {/* Idioma selector */}
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[10px] uppercase tracking-[0.15em] font-black text-stone-500 dark:text-stone-405 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              Idioma do Sintetizador (Pronúncia)
            </label>
            <select
              value={settings.ttsLang || "pt-BR"}
              onChange={(e) => {
                const nextLang = e.target.value;
                // Auto choose first voice corresponding to this prefix
                const matchV = voices.find(v => v.lang.toLowerCase().startsWith(nextLang.split("-")[0]));
                onUpdateSettings({ 
                  ttsLang: nextLang, 
                  ttsVoiceName: matchV ? matchV.name : null 
                });
              }}
              className="w-full p-3 border-2 border-stone-900 bg-white dark:border-stone-700 dark:bg-stone-900 text-xs font-sans text-stone-900 dark:text-stone-100 uppercase tracking-wider focus:outline-hidden cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label} [{lang.code}]
                </option>
              ))}
            </select>
          </div>

          {/* Gênero de Voz */}
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[10px] uppercase tracking-[0.15em] font-black text-stone-500 dark:text-stone-405">
              Tipo / Foco de Gênero
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["any", "male", "female"] as const).map((g) => {
                const isSelected = settings.ttsGender === g;
                const labels = { any: "Qualquer", female: "Feminina", male: "Masculina" };
                return (
                  <button
                    key={g}
                    onClick={() => {
                      onUpdateSettings({ ttsGender: g });
                    }}
                    className={`py-3 text-[9px] font-sans font-black uppercase tracking-wider border-2 transition-all cursor-pointer text-center ${
                      isSelected
                        ? "bg-stone-900 text-stone-50 border-stone-900 dark:bg-white dark:text-stone-950 dark:border-white font-heavy scale-[0.98]"
                        : "border-stone-300 dark:border-stone-800 hover:bg-stone-200/40 text-stone-600 dark:text-stone-405"
                    }`}
                  >
                    {labels[g]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Velocidade Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center mb-1">
              <label className="font-sans text-[10px] uppercase tracking-[0.15em] font-black text-stone-500 dark:text-stone-405 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                Velocidade da Voz
              </label>
              <span className="font-mono text-xs font-black bg-stone-300 dark:bg-stone-800 px-2 py-0.5">
                {settings.ttsSpeed}x
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-sans font-bold text-stone-400">0.5x</span>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.ttsSpeed}
                onChange={(e) => onUpdateSettings({ ttsSpeed: parseFloat(e.target.value) })}
                className="flex-1 accent-stone-900 dark:accent-stone-100 hover:accent-stone-850 select-none bg-stone-200 dark:bg-stone-800 appearance-none h-1.5 z-10 cursor-pointer"
              />
              <span className="text-[10px] font-sans font-bold text-stone-400">2.0x</span>
            </div>
          </div>

          {/* Seletor de sintetizadores disponíveis do navegador */}
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[10px] uppercase tracking-[0.15em] font-black text-stone-500 dark:text-stone-405">
              Sintetizador Disponível ({filteredVoices.length})
            </label>
            {filteredVoices.length === 0 ? (
              <div className="p-3 border-2 border-dashed border-stone-400 dark:border-stone-800 text-center text-xs text-amber-600 dark:text-amber-500 font-serif italic">
                Nenhuma voz nativa correspondente encontrada no seu navegador.
              </div>
            ) : (
              <select
                value={settings.ttsVoiceName || ""}
                onChange={(e) => onUpdateSettings({ ttsVoiceName: e.target.value })}
                className="w-full p-2.5 border-2 border-stone-900 bg-white dark:border-stone-700 dark:bg-stone-900 text-xs font-sans text-stone-900 dark:text-stone-100 tracking-wider focus:outline-hidden cursor-pointer"
              >
                {filteredVoices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Teste Vocálico Instantâneo */}
        <div className="mt-6 pt-6 border-t border-stone-300 dark:border-stone-800 flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full flex flex-col gap-1.5">
            <label className="font-sans text-[10px] uppercase tracking-[0.15em] font-black text-stone-500 dark:text-stone-405">
              Testador de Acústica
            </label>
            <input
              type="text"
              placeholder="Digite um fragmento para testar o falante..."
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="w-full p-2.5 border-2 border-stone-900 bg-white dark:border-stone-700 dark:bg-stone-900 text-xs font-sans tracking-wide text-stone-900 dark:text-stone-100 focus:outline-hidden"
            />
          </div>
          <button
            onClick={handleVoiceTest}
            className={`w-full sm:w-auto px-5 py-3 border-2 text-[10px] font-sans font-black uppercase tracking-wider transition-colors cursor-pointer ${
              isPlayingTest
                ? "bg-amber-400 text-stone-950 border-amber-500 hover:bg-amber-350"
                : "bg-stone-900 text-stone-50 hover:bg-stone-800 border-stone-900 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-50 dark:border-stone-100"
            }`}
          >
            {isPlayingTest ? "Parar Teste" : "Testar Acústica"}
          </button>
        </div>
      </section>

      {/* Saved Books Grid */}
      <section className="mb-14">
        <div className="flex items-center justify-between mb-8 border-b-2 border-stone-900 dark:border-stone-100 pb-3">
          <h2 className="font-serif text-xs uppercase tracking-[0.2em] font-black text-stone-900 dark:text-stone-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-stone-500" />
            Estante Literária / Sophia Volumes
          </h2>
          <span className="font-mono text-[10px] font-bold text-stone-550 dark:text-stone-400 bg-stone-200/50 dark:bg-stone-900 px-2 py-0.5 rounded">
            {books.length} {books.length === 1 ? "título" : "títulos"}
          </span>
        </div>

        {books.length === 0 ? (
          <div className="p-16 text-center border-2 border-dashed border-stone-300 dark:border-stone-800 bg-transparent/20">
            <BookOpen className="w-8 h-8 text-stone-400 dark:text-stone-700 mx-auto mb-4" />
            <h3 className="font-serif text-lg text-stone-700 dark:text-stone-350 italic font-medium">Estante de Poimandres Vazia</h3>
            <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-500 font-sans uppercase tracking-widest leading-relaxed">
              Carregue um volume para iniciar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {books.map((book) => {
              const progress = progresses[book.id];
              const pct = progress?.scrollPercentage || 0;

              return (
                <div
                  key={book.id}
                  id={`book-card-${book.id}`}
                  className="group relative flex flex-col justify-between p-6 bg-stone-50 dark:bg-stone-900/60 border-2 border-stone-250 dark:border-stone-800 hover:border-stone-900 dark:hover:border-stone-200 transition-all duration-300"
                >
                  <div>
                    {/* Header Details */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <h3
                        onClick={() => onSelectBook(book)}
                        className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100 hover:underline hover:underline-offset-4 cursor-pointer break-words leading-tight flex-1 italic"
                      >
                        {book.name}
                      </h3>
                      <button
                        id={`delete-btn-${book.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Excluir "${book.name}" da sua estante local?`)) {
                            onDeleteBook(book.id);
                          }
                        }}
                        className="p-1.5 rounded text-stone-400 hover:text-stone-100 hover:bg-stone-900 dark:hover:bg-stone-100 dark:hover:text-stone-950 transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Remover livro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Metadata indicators */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-6 font-sans text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-semibold">
                      <span className="flex items-center gap-1 bg-stone-200/50 dark:bg-stone-950 px-2 py-0.5 rounded">
                        <HardDrive className="w-3 h-3" />
                        {formatBytes(book.size)}
                      </span>
                      <span className="flex items-center gap-1 bg-stone-200/50 dark:bg-stone-950 px-2 py-0.5 rounded">
                        <Calendar className="w-3 h-3" />
                        {formatDate(book.addedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Reading Progress details */}
                  <div
                    onClick={() => onSelectBook(book)}
                    className="cursor-pointer pt-4 mt-auto border-t border-stone-200 dark:border-stone-800"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="flex items-center gap-1 font-sans text-[9px] uppercase tracking-[0.15em] font-bold text-stone-500 dark:text-stone-400">
                        <BookOpen className="w-3 h-3 text-stone-400" />
                        {pct > 0 ? (
                          pct >= 99.5 ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-black">Concluído</span>
                          ) : (
                            <span>Em Leitura</span>
                          )
                        ) : (
                          <span>Preservado</span>
                        )}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-stone-900 dark:text-stone-100 bg-stone-200 dark:bg-stone-950 px-1.5 py-0.5 rounded">{pct}%</span>
                    </div>

                    {/* Progress slider tracking */}
                    <div className="w-full h-2 bg-stone-200 dark:bg-stone-800 rounded-none overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          pct >= 99.5
                            ? "bg-emerald-600 dark:bg-emerald-500"
                            : "bg-stone-800 dark:bg-stone-300"
                        }`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick performance highlight and tips */}
      <footer className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-[11px] text-stone-500 dark:text-stone-400 border-t border-stone-300 dark:border-stone-800 pt-10 leading-relaxed font-serif italic">
        <div className="space-y-1.5">
          <span className="font-sans font-bold uppercase tracking-[0.25em] text-stone-900 dark:text-stone-200 block text-[10px] not-italic">IndexedDB Local</span>
          Lógica assíncrona local sob o navegador do leitor. Nossos arquivos nunca beiram bases de dados corporativas ou nuvens não autorizadas.
        </div>
        <div className="space-y-1.5">
          <span className="font-sans font-bold uppercase tracking-[0.25em] text-stone-900 dark:text-stone-200 block text-[10px] not-italic">Refinamento Crítico</span>
          O suporte do modelo Gemini permite a tradução de termos raros sob o viés acadêmico e rituais herméticos.
        </div>
        <div className="space-y-1.5">
          <span className="font-sans font-bold uppercase tracking-[0.25em] text-stone-900 dark:text-stone-200 block text-[10px] not-italic">Voz &amp; Acústica</span>
          Ative as vozes de síntese de voz nativa gratuitas de forma instantânea ao dar dois toques ("Double-Click") em qualquer parágrafo.
        </div>
      </footer>
    </div>
  );
};
