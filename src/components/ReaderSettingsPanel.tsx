import React, { useState, useEffect } from "react";
import { ReaderSettings, ReaderTheme, THEMES } from "../types";
import { X, Type, MessageSquare, AudioLines, Settings2, Sliders } from "lucide-react";

interface ReaderSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onUpdateSettings: (settings: Partial<ReaderSettings>) => void;
  voices: SpeechSynthesisVoice[];
}

export const ReaderSettingsPanel: React.FC<ReaderSettingsPanelProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  voices,
}) => {
  const currentTheme = THEMES[settings.theme];
  const [activeTab, setActiveTab] = useState<"visual" | "auditivo">("visual");

  // Filter voices according to selected gender approximation & selected language
  const getFilteredVoices = () => {
    const targetLangCode = settings.ttsLang || "pt-BR";
    const prefix = targetLangCode.split("-")[0];
    let filtered = voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
    
    // Fallback if no voices for chosen lang
    const fallbackPt = voices.filter((v) => v.lang.startsWith("pt"));
    if (filtered.length === 0) {
      filtered = fallbackPt;
    }
    if (filtered.length === 0) {
      filtered = voices;
    }

    if (settings.ttsGender === "female") {
      filtered = filtered.filter((v) => {
        const name = v.name.toLowerCase();
        return (
          name.includes("maria") ||
          name.includes("luciana") ||
          name.includes("joana") ||
          name.includes("zira") ||
          name.includes("samantha") ||
          name.includes("karen") ||
          name.includes("tessa") ||
          name.includes("moira") ||
          name.includes("microsoft sabina") ||
          name.includes("google voice pt-br-x-y-female") ||
          name.includes("google voice f") ||
          name.includes("female") ||
          name.includes("mulher") ||
          name.includes("fem") ||
          v.name.match(/\b(Amália|Rita|Sofia|Helena|Catarina|Inês)\b/i)
        );
      });
    } else if (settings.ttsGender === "male") {
      filtered = filtered.filter((v) => {
        const name = v.name.toLowerCase();
        return (
          name.includes("daniel") ||
          name.includes("marcos") ||
          name.includes("felipe") ||
          name.includes("microsoft daniel") ||
          name.includes("google voice m") ||
          name.includes("male") ||
          name.includes("homem") ||
          name.includes("masc") ||
          v.name.match(/\b(Ricardo|Pedro|João|Luís|Manuel|Carlos)\b/i)
        );
      });
    }

    return filtered;
  };

  const filteredVoices = getFilteredVoices();

  useEffect(() => {
    // If current voice name is not in the filtered list (due to gender filter changing),
    // update current voice selection to first available of filtered lists
    if (filteredVoices.length > 0) {
      const exists = filteredVoices.some((v) => v.name === settings.ttsVoiceName);
      if (!exists && settings.ttsVoiceName !== null) {
        onUpdateSettings({ ttsVoiceName: filteredVoices[0].name });
      }
    }
  }, [settings.ttsGender, settings.ttsLang, voices]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30 backdrop-blur-xs select-none animate-fade-in">
      {/* Invisible backdrop click-to-close */}
      <div className="flex-1" onClick={onClose}></div>

      {/* Main Settings Panel Wrapper */}
      <div
        id="settings-panel-sidebar"
        className={`w-full max-w-sm h-full flex flex-col shadow-2xl border-l-4 transition-transform duration-300 ${
          currentTheme.isDark
            ? "bg-stone-950 border-stone-800 text-stone-100"
            : "bg-stone-50 border-stone-900 text-stone-900"
        }`}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b-2 border-stone-900 dark:border-stone-850">
          <h3 className="font-serif text-xs font-black uppercase tracking-[0.2em] flex items-center gap-1.5 text-stone-900 dark:text-stone-100">
            <Settings2 className="w-4 h-4 text-stone-500" />
            Preferências / 0.1
          </h3>
          <button
            onClick={onClose}
            className="p-1 px-2 border border-stone-900 dark:border-stone-400 font-sans text-[10px] uppercase font-bold hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-stone-950 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b-2 border-stone-900 dark:border-stone-800 text-[10px] font-sans uppercase tracking-widest font-black">
          <button
            onClick={() => setActiveTab("visual")}
            className={`flex-1 py-4 text-center border-b-4 transition-all cursor-pointer ${
              activeTab === "visual"
                ? "border-stone-900 bg-stone-100/65 text-stone-900 dark:border-stone-100 dark:bg-stone-900 dark:text-stone-100"
                : "border-transparent text-stone-400"
            }`}
          >
            Estilo Visual
          </button>
          <button
            onClick={() => setActiveTab("auditivo")}
            className={`flex-1 py-4 text-center border-b-4 transition-all cursor-pointer ${
              activeTab === "auditivo"
                ? "border-stone-900 bg-stone-100/65 text-stone-900 dark:border-stone-100 dark:bg-stone-900 dark:text-stone-100"
                : "border-transparent text-stone-400"
            }`}
          >
            Leitor de Voz
          </button>
        </div>

        {/* Panel Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {activeTab === "visual" ? (
            <>
              {/* Palette Theme Section */}
              <div className="space-y-4">
                <span className="font-sans text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] font-bold block">
                  Paleta de Cores
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(THEMES) as ReaderTheme[]).map((themeKey) => {
                    const theme = THEMES[themeKey];
                    const isSelected = settings.theme === themeKey;
                    return (
                      <button
                        key={themeKey}
                        onClick={() => onUpdateSettings({ theme: themeKey })}
                        className={`text-left p-3 border-2 flex flex-col justify-between h-20 transition-all cursor-pointer ${theme.bg} ${theme.text} ${
                          isSelected
                            ? "border-stone-900 ring-4 ring-stone-900/10 dark:border-stone-100 dark:ring-stone-100/10 font-bold"
                            : "border-stone-300 dark:border-stone-850 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <span className="text-[10px] font-sans uppercase tracking-wider font-bold">{theme.name}</span>
                        <div className="flex justify-between items-center w-full">
                          <span className={`w-3.5 h-3.5 border-2 border-current ${theme.bg}`}></span>
                          <span className="text-[9px] font-mono opacity-60">A</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Typography Font Sizes */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-sans text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] font-bold">
                    Tamanho da Fonte
                  </span>
                  <span className="font-mono text-xs font-black bg-stone-200 dark:bg-stone-900 px-2 py-0.5">{settings.fontSize}px</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-sans font-bold text-stone-400">A-</span>
                  <input
                    type="range"
                    min="14"
                    max="32"
                    step="1"
                    value={settings.fontSize}
                    onChange={(e) => onUpdateSettings({ fontSize: parseInt(e.target.value) })}
                    className="flex-1 accent-stone-900 dark:accent-stone-100 hover:accent-stone-850 select-none bg-stone-200 dark:bg-stone-850 appearance-none h-1.5 z-10 cursor-pointer"
                  />
                  <span className="text-sm font-sans font-bold text-stone-550">A+</span>
                </div>
              </div>

              {/* Font Family Preference */}
              <div className="space-y-4">
                <span className="font-sans text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] font-bold block">
                  Estilo de Tipografia
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => onUpdateSettings({ fontFamily: "serif" })}
                    className={`py-3 px-3 border-2 text-[11px] font-serif hover:border-stone-900 leading-none text-center transition-all cursor-pointer ${
                      settings.fontFamily === "serif"
                        ? "bg-stone-900 text-stone-50 border-stone-900 dark:bg-white dark:text-stone-950 dark:border-white font-heavy"
                        : "border-stone-250 dark:border-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900"
                    }`}
                  >
                    Clássico (Lora)
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ fontFamily: "sans" })}
                    className={`py-3 px-3 border-2 text-[11px] font-sans hover:border-stone-950 leading-none text-center transition-all cursor-pointer ${
                      settings.fontFamily === "sans"
                        ? "bg-stone-900 text-stone-50 border-stone-900 dark:bg-white dark:text-stone-950 dark:border-white font-heavy"
                        : "border-stone-250 dark:border-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900"
                    }`}
                  >
                    Contemporâneo
                  </button>
                </div>
              </div>

              {/* Line Spacing Preferences */}
              <div className="space-y-4">
                <span className="font-sans text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] font-bold block">
                  Espaçamento de Linha
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {(["tight", "normal", "relaxed", "loose"] as const).map((space) => {
                    const isSelected = settings.lineSpacing === space;
                    const labels = { tight: "Compacto", normal: "Médio", relaxed: "Amplo", loose: "Farto" };
                    return (
                      <button
                        key={space}
                        onClick={() => onUpdateSettings({ lineSpacing: space })}
                        className={`py-2 px-1 border-2 text-[10px] font-sans font-bold leading-none text-center transition-all cursor-pointer ${
                          isSelected
                            ? "bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-950 dark:border-white font-heavy"
                            : "border-stone-250 dark:border-stone-850 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900"
                        }`}
                      >
                        {labels[space]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Speed Slider Option */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-sans text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] font-bold flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5" />
                    Velocidade de Leitura
                  </span>
                  <span className="font-mono text-xs font-black bg-stone-200 dark:bg-stone-900 px-2 py-0.5">{settings.ttsSpeed}x</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-sans font-bold text-stone-400">0.5x</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={settings.ttsSpeed}
                    onChange={(e) => onUpdateSettings({ ttsSpeed: parseFloat(e.target.value) })}
                    className="flex-1 accent-stone-900 dark:accent-stone-100 h-1.5 bg-stone-200 dark:bg-stone-850 appearance-none cursor-pointer"
                  />
                  <span className="text-[10px] font-sans font-bold text-stone-550">2.0x</span>
                </div>
              </div>

              {/* Curated Gender filter */}
              <div className="space-y-4">
                <span className="font-sans text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] font-bold block">
                  Aproximação de Gênero
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(["any", "female", "male"] as const).map((g) => {
                    const isSelected = settings.ttsGender === g;
                    const labels = { any: "Qualquer", female: "Feminino", male: "Masculino" };
                    return (
                      <button
                        key={g}
                        onClick={() => onUpdateSettings({ ttsGender: g })}
                        className={`py-2 px-1 border-2 text-[10px] font-sans font-bold leading-none text-center transition-all cursor-pointer ${
                          isSelected
                            ? "bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-950 dark:border-white font-heavy"
                            : "border-stone-250 dark:border-stone-850 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900"
                        }`}
                      >
                        {labels[g]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Voice select dropdown menu options */}
              <div className="space-y-4">
                <label className="font-sans text-[10px] text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] font-bold block">
                  Sintetizadores ({filteredVoices.length})
                </label>
                {filteredVoices.length === 0 ? (
                  <p className="text-xs italic text-amber-600 dark:text-amber-400">
                    Nenhum sintetizador nativo de Português detectado com os filtros atuais.
                  </p>
                ) : (
                  <div className="relative">
                    <select
                      value={settings.ttsVoiceName || ""}
                      onChange={(e) => onUpdateSettings({ ttsVoiceName: e.target.value })}
                      className={`w-full p-3 border-2 font-sans focus:outline-hidden cursor-pointer text-xs ${
                        currentTheme.isDark
                          ? "bg-stone-950 border-stone-800 text-stone-100"
                          : "bg-stone-100 border-stone-900 text-stone-950"
                      }`}
                    >
                      {filteredVoices.map((voice) => (
                        <option key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang.slice(0, 5)}) {voice.default ? "[Padrão]" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <p className="text-[10px] text-stone-500 dark:text-stone-400 font-serif italic leading-relaxed mt-2.5">
                  Dica: Vozes locais/nativas dependem do seu navegador e do sistema operacional ativo.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Panel Footer UI preview */}
        <div className={`p-4 border-t-2 text-[9px] font-sans uppercase tracking-widest text-center flex items-center justify-center gap-1 ${
          currentTheme.isDark ? "bg-stone-950 border-stone-850 text-stone-400" : "bg-stone-100 border-stone-900 text-stone-900"
        }`}>
          <Sliders className="w-3.5 h-3.5 text-stone-400" />
          <span className="font-bold">Ajustado Instantaneamente</span>
        </div>
      </div>
    </div>
  );
};
