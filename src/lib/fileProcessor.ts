import { Book } from "../types";
import * as mammoth from "mammoth";

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
 * Load pdfjs-dist dynamically from high-performance Cloudflare CDN to avoid packaging overhead or worker asset issues.
 */
function loadPdfJS(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("A extração de PDFs é suportada apenas em ambientes com navegador."));
      return;
    }
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(pdfjsLib);
    };
    script.onerror = () => reject(new Error("Falha ao carregar a biblioteca de leitura de PDFs da CDN. Verifique a conexão."));
    document.head.appendChild(script);
  });
}

/**
 * Extracts plain text from PDF file ArrayBuffer.
 */
async function extractTextFromPdf(arrayBuffer: ArrayBuffer): Promise<string> {
  const pdfjsLib = await loadPdfJS();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  const maxPages = pdf.numPages;
  let fullText = "";

  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    fullText += pageText + "\n\n";
  }
  return fullText;
}

/**
 * Helper to read plain text files with correct encoding
 */
function readAsTextPromise(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("Não foi possível ler o arquivo como texto plano."));
      }
    };
    reader.onerror = () => reject(new Error("Erro ao ler o arquivo plano."));
    reader.readAsText(file, "UTF-8");
  });
}

/**
 * Reads a File object handles PDF, DOCX, or text-like extensions, and returns a promise with Book data model.
 */
export async function processTextFile(file: File): Promise<Book> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  let content = "";

  try {
    if (extension === "pdf") {
      const arrayBuffer = await file.arrayBuffer();
      content = await extractTextFromPdf(arrayBuffer);
    } else if (extension === "docx") {
      const arrayBuffer = await file.arrayBuffer();
      // mammoth browser conversion
      const result = await mammoth.extractRawText({ arrayBuffer });
      content = result.value;
    } else {
      // standard plain HTML/MD/TXT/JSON
      content = await readAsTextPromise(file);
    }

    if (!content || content.trim() === "") {
      throw new Error("O arquivo lido está vazio ou nenhuma informação pôde ser extraída.");
    }

    // Clean up carriage returns (\r\n) or extra messy PDF artifacts
    content = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    const id = generateBookId(file.name, file.size);
    return {
      id,
      name: file.name.replace(/\.[^/.]+$/, ""), // Strip extension
      content: content,
      size: file.size,
      addedAt: Date.now(),
    };
  } catch (error: any) {
    console.error("Erro no processamento do arquivo:", error);
    throw new Error(error.message || `Falha ao processar o arquivo compilado (.${extension}).`);
  }
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
