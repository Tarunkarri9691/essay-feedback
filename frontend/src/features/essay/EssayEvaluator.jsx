import React, { useState } from "react";
import { api } from "../../api/client.js";
import { LANGS } from "../../constants/languages.js";
import { useSpeechInput } from "../../hooks/useSpeechInput.js";
import { speakText } from "../../hooks/useTextToSpeech.js";
import { Field, Sel } from "../../components/common/Input.jsx";
import { Btn } from "../../components/common/Button.jsx";
import { IconBook } from "../../components/common/Icons.jsx";
import { exportEssayPDF } from "./exportPdf.js";

const ScoreBar = ({ label, v }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
      <span>{label}</span>
      <span className="text-teal-700 dark:text-teal-400 font-bold">{v}/100</span>
    </div>
    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, v))}%` }}
      />
    </div>
  </div>
);

export function EssayEvaluator({ onXPUpdate }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [fl, setFl] = useState("English");
  const [file, setFile] = useState(null);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [err, setErr] = useState("");

  const { listening, speechError, toggleListen } = useSpeechInput(fl, setContent);
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  const handleOCRUpload = async (e) => {
    const imgFile = e.target.files[0];
    if (!imgFile) return;

    setOcrBusy(true);
    setErr("");
    const fd = new FormData();
    fd.append("image", imgFile);

    try {
      const data = await api("/essays/ocr", { method: "POST", body: fd });
      if (data.extractedText) {
        setContent(data.extractedText);
        if (!title) setTitle(imgFile.name.replace(/\.[^/.]+$/, ""));
      } else {
        setErr("No readable text found in image.");
      }
    } catch (err) {
      setErr("OCR Error: " + err.message);
    } finally {
      setOcrBusy(false);
    }
  };

  const go = async () => {
    setErr("");
    setRes(null);

    const words = content.trim().toLowerCase().split(/\s+/);
    const totalWords = words.length;
    if (totalWords >= 30) {
      const allChars = content.replace(/\s+/g, "");
      const vowels = (allChars.match(/[aeiou]/gi) || []).length;
      const vowelRatio = vowels / allChars.length;
      const tinyWords = words.filter((w) => w.length <= 2).length;
      const COMMON = new Set([
        "the", "a", "an", "is", "are", "was", "were", "have", "has", "and", "but", "or",
        "i", "you", "he", "she", "it", "we", "they", "me", "not", "in", "on", "to", "of",
        "by", "with", "from", "at", "this", "that", "do", "can", "will", "for", "my", "be", "if", "so"
      ]);
      const knownRatio = words.filter((w) => COMMON.has(w)).length / totalWords;
      const latinRatio = (allChars.match(/[a-zA-Z]/g) || []).length / allChars.length;
      if (vowelRatio < 0.12 || tinyWords / totalWords > 0.55 || (latinRatio > 0.7 && knownRatio < 0.08)) {
        setErr("⚠️ The text looks like random characters. Please write a real essay or paragraph to get meaningful feedback.");
        return;
      }
    }

    setBusy(true);
    const fd = new FormData();
    fd.append("title", title || "Untitled Essay");
    fd.append("content", content);
    fd.append("feedback_language", fl);
    if (file) fd.append("file", file);

    try {
      const data = await api("/api/essay", { method: "POST", body: fd });
      setRes(data);
      if (onXPUpdate) onXPUpdate();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 max-w-6xl mx-auto py-4">
      <section className="flex flex-col gap-4 rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/80">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Essay Submission</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Type, speak, or upload handwritten essay photos for AI evaluation.
            </p>
          </div>
          <button
            onClick={() => toggleListen(content)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              listening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
            }`}
          >
            🎙️ {listening ? "Listening..." : "Dictate Essay"}
          </button>
          {speechError && <p role="alert" className="text-xs text-red-600">{speechError}</p>}
        </div>

        <Field
          placeholder="Essay Title (e.g., The Impact of Renewable Energy)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="relative">
          <textarea
            rows={12}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 text-sm text-slate-800 dark:text-slate-100 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            placeholder="Write, dictate, or OCR-scan your essay here (minimum 30 words)..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="absolute bottom-3 right-3 text-xs font-medium text-slate-400 bg-white/80 dark:bg-slate-800/80 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
            {wordCount} words
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-xs space-y-1">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">📷 Handwritten OCR Scan:</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleOCRUpload}
              disabled={ocrBusy}
              className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-teal-100 file:text-teal-800"
            />
            {ocrBusy && (
              <div className="text-[11px] text-teal-600 font-semibold animate-pulse">
                Processing image OCR...
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-xs space-y-1">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">📄 Text File (.txt):</span>
            <input
              type="file"
              accept=".txt"
              onChange={(e) => {
                const f = e.target.files[0];
                setFile(f);
                if (f) {
                  const reader = new FileReader();
                  reader.onload = (ev) => setContent(ev.target.result);
                  reader.readAsText(f);
                }
              }}
              className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-teal-100 file:text-teal-800"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <Sel label="Feedback In" value={fl} set={setFl} items={LANGS} />
          <Btn onClick={go} disabled={busy || (!content.trim() && !file)}>
            {busy ? "Evaluating CoT..." : "Grade Essay & Get Feedback"}
          </Btn>
        </div>

        {err && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
            {err}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/80">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">AI Evaluation Report</h2>
          {res && (
            <div className="flex gap-2">
              <button
                onClick={() => speakText(res.improvedVersion || res.keyTakeaways?.join(" "), fl)}
                className="px-3 py-1 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-800"
              >
                🔊 Read Aloud ({fl})
              </button>
              <button
                onClick={() => exportEssayPDF({ ...res, title: title || "Essay Report" })}
                className="px-3 py-1 rounded-xl bg-slate-800 text-white text-xs font-bold shadow-sm hover:bg-slate-900"
              >
                📄 Download PDF
              </button>
            </div>
          )}
        </div>

        {!res ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            <IconBook />
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Submit an essay to receive comprehensive multilingual AI scoring across grammar, vocabulary, structure, and actionable corrections.
            </p>
          </div>
        ) : (
          <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)] pr-1">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-500/20">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider opacity-80">Overall Essay Score</span>
                <div className="text-4xl font-black">
                  {res.overall}
                  <span className="text-lg font-normal opacity-80">/100</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs uppercase font-bold tracking-wider opacity-80">Detected Language</span>
                <div className="text-base font-semibold">{res.language || "English"}</div>
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Detailed Metrics
              </h3>
              {["grammar", "vocabulary", "coherence", "structure", "originality"].map((k) => (
                <ScoreBar key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} v={res[k] || 0} />
              ))}
            </div>

            {res.improvedVersion && (
              <div className="p-5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                    ✨ Perfect Academic Rewrite
                  </h3>
                  <span className="text-[10px] font-bold bg-teal-200 dark:bg-teal-900 text-teal-900 dark:text-teal-100 px-2 py-0.5 rounded-md">
                    Model Essay
                  </span>
                </div>
                <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-medium p-3 bg-white dark:bg-slate-900 rounded-xl border border-teal-100 dark:border-teal-900 shadow-inner">
                  {res.improvedVersion}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default EssayEvaluator;
