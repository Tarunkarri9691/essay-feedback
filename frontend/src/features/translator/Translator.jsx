import React, { useState, useEffect } from "react";
import { api } from "../../api/client.js";
import { LANGS } from "../../constants/languages.js";
import { useSpeechInput } from "../../hooks/useSpeechInput.js";
import { speakText } from "../../hooks/useTextToSpeech.js";
import { Sel } from "../../components/common/Input.jsx";
import { Btn } from "../../components/common/Button.jsx";
import VocabCard from "./VocabCard.jsx";

export function Translator({ addToast }) {
  const [text, setText] = useState("Photosynthesis is the process by which green plants turn carbon dioxide and water into food using sunlight.");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("English");
  const [targetLang, setTargetLang] = useState("Telugu");
  const [vocabulary, setVocabulary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedSource, setCopiedSource] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState(false);
  const [speakingSource, setSpeakingSource] = useState(false);
  const [speakingTarget, setSpeakingTarget] = useState(false);
  const [speakingWord, setSpeakingWord] = useState(null);
  const [savedCards, setSavedCards] = useState({});

  const { listening, speechError, toggleListen } = useSpeechInput(sourceLang, (transcript) => {
    setText((prev) => (prev ? prev + " " + transcript : transcript));
  });

  const ACADEMIC_PRESETS = [
    {
      title: "Photosynthesis & Botany",
      icon: "🌿",
      text: "Photosynthesis is the process by which green plants turn carbon dioxide and water into food using sunlight."
    },
    {
      title: "Pythagoras & Geometry",
      icon: "📐",
      text: "In a right-angled triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides (a² + b² = c²)."
    },
    {
      title: "Artificial Intelligence & ML",
      icon: "🤖",
      text: "Artificial intelligence enables computer systems to perform complex academic tasks including machine learning, reasoning, and automated decision making."
    },
    {
      title: "Quantum Physics & Relativity",
      icon: "⚛️",
      text: "Quantum physics explores atomic energy levels and photons, while Einstein's special relativity establishes mass-energy equivalence with E = mc²."
    }
  ];

  const translate = async (inputText = text, src = sourceLang, tgt = targetLang) => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/translate", {
        method: "POST",
        body: { text: inputText, sourceLang: src, targetLang: tgt }
      });
      setTranslatedText(data.reply || data.translatedText || "");
      setVocabulary(data.vocabulary || []);
    } catch (e) {
      setError(`Translation failed. ${e.message}`);
      if (addToast) addToast(`Translation failed: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    translate(text, sourceLang, targetLang);
  }, []);

  const swapLanguages = () => {
    const nextSrc = targetLang;
    const nextTgt = sourceLang;
    const nextText = translatedText || text;
    setSourceLang(nextSrc);
    setTargetLang(nextTgt);
    setText(nextText);
    setTranslatedText("");
    translate(nextText, nextSrc, nextTgt);
    if (addToast) addToast(`Swapped: ${nextSrc} ⇄ ${nextTgt}`, "info");
  };

  const handleSpeak = (content, lang, isSource = false) => {
    if (!content || !content.trim()) return;
    if (isSource) {
      if (speakingSource) {
        window.speechSynthesis?.cancel();
        setSpeakingSource(false);
        return;
      }
      setSpeakingSource(true);
      const res = speakText(content, lang, () => setSpeakingSource(false));
      if (!res.ok) {
        setSpeakingSource(false);
        if (addToast) addToast(res.message, "error");
      }
    } else {
      if (speakingTarget) {
        window.speechSynthesis?.cancel();
        setSpeakingTarget(false);
        return;
      }
      setSpeakingTarget(true);
      const res = speakText(content, lang, () => setSpeakingTarget(false));
      if (!res.ok) {
        setSpeakingTarget(false);
        if (addToast) addToast(res.message, "error");
      }
    }
  };

  const handleSpeakWord = (word, lang) => {
    setSpeakingWord(word);
    const res = speakText(word, lang, () => setSpeakingWord(null));
    if (!res.ok) {
      setSpeakingWord(null);
      if (addToast) addToast(res.message, "error");
    }
  };

  const copyToClipboard = (str, isSource = false) => {
    if (!str) return;
    navigator.clipboard.writeText(str);
    if (isSource) {
      setCopiedSource(true);
      setTimeout(() => setCopiedSource(false), 2000);
    } else {
      setCopiedTarget(true);
      setTimeout(() => setCopiedTarget(false), 2000);
    }
    if (addToast) addToast("Copied to clipboard!", "success");
  };

  const saveVocabCard = async (item) => {
    try {
      await api("/flashcards", {
        method: "POST",
        body: {
          term: item.word,
          definition: `${item.translation} — ${item.meaning || ""}`,
          subject: "Academic Vocabulary",
          language: targetLang
        }
      });
      setSavedCards((prev) => ({ ...prev, [item.word]: true }));
      if (addToast) addToast(`Saved "${item.word}" to Spaced Repetition Flashcards!`, "success");
    } catch (e) {
      if (addToast) addToast(`Could not save card: ${e.message}`, "error");
    }
  };

  const exportAsTextFile = () => {
    if (!translatedText) return;
    const content = `StudyMate AI — Academic Translation Document
==========================================
Date: ${new Date().toLocaleString()}
Source (${sourceLang}):
${text}

Translation (${targetLang}):
${translatedText}

Key Vocabulary & Definitions:
${vocabulary.map((v) => `• ${v.word} -> ${v.translation}: ${v.meaning || ""}`).join("\n")}
`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `StudyMate_Translation_${sourceLang}_to_${targetLang}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    if (addToast) addToast("Translation downloaded as text file!", "success");
  };

  const wordCountSource = text.trim() ? text.trim().split(/\s+/).length : 0;
  const wordCountTarget = translatedText.trim() ? translatedText.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/80 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 font-bold text-lg">
                🌐
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Multilingual Academic Translator</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Translate academic concepts across Indic languages with vocabulary breakdown, audio pronunciation, and flashcard syncing.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setText("");
                setTranslatedText("");
                setVocabulary([]);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              title="Clear text"
            >
              ✕ Clear All
            </button>
            <Btn onClick={() => translate(text, sourceLang, targetLang)} disabled={loading || !text.trim()}>
              {loading ? "Translating..." : "⚡ Translate"}
            </Btn>
          </div>
        </div>

        {/* Language Selection & Swap Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/80">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Source:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {["English", "Telugu", "Hindi", "Tamil"].map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setSourceLang(l);
                    translate(text, l, targetLang);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    sourceLang === l
                      ? "bg-teal-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {l}
                </button>
              ))}
              <Sel label="" value={sourceLang} set={(v) => { setSourceLang(v); translate(text, v, targetLang); }} items={LANGS} />
            </div>
          </div>

          {/* Swap Button */}
          <button
            onClick={swapLanguages}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-teal-50 dark:hover:bg-slate-800 text-teal-600 dark:text-teal-400 transition hover:rotate-180 duration-300 shadow-sm"
            title="Swap Source and Target Languages"
            aria-label="Swap languages"
          >
            ⇄
          </button>

          <div className="flex items-center gap-2 flex-1 min-w-[240px] justify-end">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Target:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {["Telugu", "Hindi", "English", "Tamil"].map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setTargetLang(l);
                    translate(text, sourceLang, l);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    targetLang === l
                      ? "bg-teal-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {l}
                </button>
              ))}
              <Sel label="" value={targetLang} set={(v) => { setTargetLang(v); translate(text, sourceLang, v); }} items={LANGS} />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-600 flex items-center gap-2">
          <span>🚨</span>
          <span>{error}</span>
        </div>
      )}

      {/* Dual Side-by-Side Translation Workspaces */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Pane: Source Input */}
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                {sourceLang} Text
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                Input
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {text.length} chars • {wordCountSource} words
            </span>
          </div>

          <div className="p-4 flex-1">
            <textarea
              rows={9}
              className="w-full bg-transparent p-2 text-sm text-slate-800 dark:text-slate-100 outline-none resize-none leading-relaxed placeholder:text-slate-400"
              placeholder={`Type, paste, or dictate academic text in ${sourceLang}...`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  translate(text, sourceLang, targetLang);
                }
              }}
            />
          </div>

          {/* Source Toolbar */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleListen(text)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  listening
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                }`}
                title="Dictate with microphone"
              >
                <span>🎙️</span>
                <span>{listening ? "Listening..." : "Dictate"}</span>
              </button>
              {speechError && <span className="text-[10px] text-red-500">{speechError}</span>}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleSpeak(text, sourceLang, true)}
                className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  speakingSource
                    ? "bg-teal-500 text-white animate-pulse"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
                title="Listen to original text"
              >
                <span>🔊</span>
                <span className="text-[11px] hidden sm:inline">{speakingSource ? "Stop" : "Listen"}</span>
              </button>

              <button
                onClick={() => copyToClipboard(text, true)}
                className="p-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1"
                title="Copy source text"
              >
                <span>{copiedSource ? "✓" : "📋"}</span>
                <span className="text-[11px] hidden sm:inline">{copiedSource ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Pane: Translation Output */}
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                {targetLang} Translation
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                Output
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {translatedText.length} chars • {wordCountTarget} words
            </span>
          </div>

          <div className="p-4 flex-1">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center p-8 space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
                <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 animate-pulse">
                  Translating into academic {targetLang}...
                </p>
              </div>
            ) : translatedText ? (
              <textarea
                rows={9}
                readOnly
                className="w-full bg-transparent p-2 text-sm text-slate-800 dark:text-slate-100 outline-none resize-none leading-relaxed font-medium"
                value={translatedText}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
                <span>Enter text on the left and click Translate to see the results.</span>
              </div>
            )}
          </div>

          {/* Translation Output Toolbar */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleSpeak(translatedText, targetLang, false)}
                disabled={!translatedText}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  speakingTarget
                    ? "bg-teal-500 text-white animate-pulse"
                    : "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100"
                } ${!translatedText ? "opacity-50 cursor-not-allowed" : ""}`}
                title={`Listen in native ${targetLang} voice`}
              >
                <span>🔊</span>
                <span>{speakingTarget ? "Stop Audio" : `Listen (${targetLang})`}</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => copyToClipboard(translatedText, false)}
                disabled={!translatedText}
                className={`p-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1 ${
                  !translatedText ? "opacity-50 cursor-not-allowed" : ""
                }`}
                title="Copy translated text"
              >
                <span>{copiedTarget ? "✓" : "📋"}</span>
                <span className="text-[11px] hidden sm:inline">{copiedTarget ? "Copied" : "Copy"}</span>
              </button>

              <button
                onClick={exportAsTextFile}
                disabled={!translatedText}
                className={`p-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1 ${
                  !translatedText ? "opacity-50 cursor-not-allowed" : ""
                }`}
                title="Download report (.txt)"
              >
                <span>📄</span>
                <span className="text-[11px] hidden sm:inline">Download</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Academic Vocabulary Breakdown */}
      {!!vocabulary.length && (
        <section className="rounded-2xl bg-white dark:bg-slate-800 p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">📚</span>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  Key Academic Vocabulary & Terminology
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Extracted subject-specific definitions. Listen to pronunciation or save terms directly to your spaced-repetition flashcards.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              {vocabulary.length} Terms
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {vocabulary.map((item, index) => (
              <VocabCard
                key={`${item.word}-${index}`}
                item={item}
                targetLang={targetLang}
                isSaved={savedCards[item.word]}
                isSpeakingThis={speakingWord === item.word}
                handleSpeakWord={handleSpeakWord}
                saveVocabCard={saveVocabCard}
              />
            ))}
          </div>
        </section>
      )}

      {/* Quick Academic Presets */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <span>⚡</span>
          <span>Explore Academic Translation Examples</span>
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {ACADEMIC_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setText(preset.text);
                translate(preset.text, sourceLang, targetLang);
              }}
              className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:border-teal-400 text-left space-y-1 group transition active:scale-95"
            >
              <div className="text-lg">{preset.icon}</div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-teal-600 transition">
                {preset.title}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                {preset.text}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Translator;
