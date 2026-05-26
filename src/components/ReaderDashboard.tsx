import React, { useState, useRef } from "react";
import { Book, ReadingProgress } from "../types";
import { BookOpen, Upload, Trash2, Calendar, HardDrive, FileText, Sparkles, BookMarked } from "lucide-react";

interface ReaderDashboardProps {
  books: Book[];
  progresses: Record<string, ReadingProgress>;
  onUpload: (file: File) => void;
  onSelectBook: (book: Book) => void;
  onDeleteBook: (id: string) => void;
}

export const ReaderDashboard: React.FC<ReaderDashboardProps> = ({
  books,
  progresses,
  onUpload,
  onSelectBook,
  onDeleteBook,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      if (file.name.endsWith(".txt")) {
        onUpload(file);
      } else {
        alert("Por favor, envie apenas arquivos de texto (.txt).");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files[0]);
    }
  };

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
          Seu estojo de leitura acadêmica offline. Carregue livros em formato <span className="font-mono bg-stone-200 dark:bg-stone-800 px-1 rounded text-xs text-stone-850 dark:text-stone-200">.txt</span> localmente, execute a síntese de voz nativa e obtenha traduções de conceitos com o suporte erudito do Gemini.
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
          accept=".txt"
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 bg-stone-900 dark:bg-stone-100 rounded flex items-center justify-center text-stone-100 dark:text-stone-900 font-bold transition-transform group-hover:scale-105">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.25em] font-black text-stone-900 dark:text-stone-150">
              Importar Novo Volume (.txt)
            </p>
            <p className="mt-2.5 text-xs text-stone-500 dark:text-stone-400 font-serif italic max-w-md mx-auto leading-relaxed">
              Arraste seu arquivo para o estojo ou clique aqui para buscar. Processado de forma assíncrona inteiramente no navegador.
            </p>
          </div>
        </div>
      </div>

      {/* Saved Books Grid */}
      <section className="mb-14">
        <div className="flex items-center justify-between mb-8 border-b-2 border-stone-900 dark:border-stone-100 pb-3">
          <h2 className="font-serif text-xs uppercase tracking-[0.2em] font-black text-stone-900 dark:text-stone-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-stone-500" />
            Vozes Guardadas (.txt)
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
