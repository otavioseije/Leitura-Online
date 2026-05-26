import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Translate endpoint
app.post("/api/translate", async (req, res) => {
  try {
    const { text, contextBefore, contextAfter } = req.body;
    if (!text || typeof text !== "string" || text.trim() === "") {
      res.status(400).json({ error: "Texto para tradução inválido." });
      return;
    }

    const ai = getGeminiClient();

    // Construct a rich prompt with optional immediate context around the word
    let userPrompt = `Termo ou frase selecionada: "${text}"`;
    if (contextBefore || contextAfter) {
      userPrompt += `\n\nContexto no livro:\n... ${contextBefore || ""} [SELECIONADO: "${text}"] ${contextAfter || ""} ...`;
    }
    userPrompt += `\n\nPor favor, traduza o termo acima. Forneça primeiro a tradução direta e formal para o português do Brasil. Em seguida, adicione uma análise concisa do termo, focando no seu sentido histórico, literário ou esotérico apropriado, mantendo a sobriedade acadêmica.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: "Você é um tradutor acadêmico especializado em história e esoterismo. Traduza o termo selecionado mantendo o rigor terminológico da área, priorizando o contexto acadêmico e esotérico.",
        temperature: 0.3, // Lower temperature for more rigorous translation
      },
    });

    res.json({
      translation: response.text || "Não foi possível obter uma tradução do modelo.",
    });
  } catch (error: any) {
    console.error("Erro na tradução com Gemini:", error);
    res.status(500).json({
      error: error.message || "Ocorreu um erro interno ao processar a tradução.",
    });
  }
});

// App Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", time: new Date().toISOString() });
});

// Vite Middleware integrated after API routes
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static files server loaded.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Leitor de Livros server listening on http://0.0.0.0:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Falha ao iniciar o servidor express:", err);
});
