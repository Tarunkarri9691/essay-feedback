import React from "react";

export function VocabCard({
  item,
  targetLang,
  isSaved,
  isSpeakingThis,
  handleSpeakWord,
  saveVocabCard
}) {
  return (
    <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-4 border border-slate-100 dark:border-slate-700/80 space-y-2 flex flex-col justify-between hover:border-teal-300 transition">
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
            {item.word}
          </h4>
          <button
            onClick={() => handleSpeakWord(item.translation || item.word, targetLang)}
            className={`p-1 rounded-lg text-xs transition ${
              isSpeakingThis
                ? "bg-teal-500 text-white"
                : "hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
            }`}
            title="Listen to pronunciation"
          >
            🔊
          </button>
        </div>

        <div className="p-2 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/60 text-xs font-semibold text-teal-900 dark:text-teal-200">
          {item.translation}
        </div>

        {item.meaning && (
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
            {item.meaning}
          </p>
        )}
      </div>

      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
        <button
          onClick={() => saveVocabCard(item)}
          disabled={isSaved}
          className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            isSaved
              ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-400 hover:text-teal-600"
          }`}
        >
          <span>{isSaved ? "✓" : "🧠"}</span>
          <span>{isSaved ? "Saved to Flashcards" : "Save to Flashcards"}</span>
        </button>
      </div>
    </div>
  );
}

export default VocabCard;
