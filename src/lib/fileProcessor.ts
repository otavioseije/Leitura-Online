import { Book } from "../types";

export interface BookChapter {
  id: number;
  title: string;
  charOffset: number;
  lineIndex: number;
}

/**
 * Generate a clean unique ID for any loaded text file based on size and metadata.
 */
export function generateBookId(name: string, size: number): string {
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 30);
  return `txt_${cleanName}_${size}`;
}

/**
 * Reads a File object and returns a promise with the Book data model.
 */
export function processTextFile(file: File): Promise<Book> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result !== "string") {
        reject(new Error("Formato de arquivo inválido. Apenas arquivos text/plain são suportados."));
        return;
      }

      const id = generateBookId(file.name, file.size);
      resolve({
        id,
        name: file.name.replace(/\.[^/.]+$/, ""), // Strip extension
        content: result,
        size: file.size,
        addedAt: Date.now(),
      });
    };

    reader.onerror = () => {
      reject(new Error("Falha ao carregar o arquivo local."));
    };

    reader.readAsText(file, "UTF-8"); // Supports standard UTF-8 text encoding
  });
}

/**
 * Automatically parses chapter markers within a book's text content.
 * Returns a list of structured checkpoints.
 */
export function extractChapters(content: string): BookChapter[] {
  const lines = content.split("\n");
  const chapters: BookChapter[] = [];
  
  // Clean regex for Capítulo I, Capítulo 1, Prólogo, Epílogo, Seção 1, etc.
  const chapterRegex = /^(?:cap[íi]tulo\s+\w+|cap\.\s*\w+|pr[óo]logo|ep[íi]logo|se[çc][ãa]o\s+\w+|chapter\s+\w+|part\s+\w+|introdu[çc][ãa]o|conclus[ãa]o)\b/i;
  
  let charOffset = 0;
  let idCounter = 1;

  // Add an initial chapter representing the beginning of the text
  chapters.push({
    id: 0,
    title: "Início do Livro",
    charOffset: 0,
    lineIndex: 0,
  });

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Match line and prevent overly long sentences being captured falsely
    if (line.length > 0 && line.length < 100 && chapterRegex.test(line)) {
      chapters.push({
        id: idCounter++,
        title: line,
        charOffset: charOffset,
        lineIndex: i,
      });
    }
    charOffset += lines[i].length + 1; // +1 for the newline char
  }

  return chapters;
}
