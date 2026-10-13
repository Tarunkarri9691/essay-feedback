import React from "react";

export function StudyMode({
  cards,
  studyIndex,
  setStudyIndex,
  studyRevealed,
  setStudyRevealed
}) {
  if (!cards || cards.length === 0) return null;
  const currentCard = cards[studyIndex];

  return (
    <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white p-8 rounded-3xl border border-teal-500/30 shadow-2xl space-y-6 text-center animate-fadeIn">
      <div className="flex items-center justify-between text-xs text-teal-300 font-bold">
        <span>
          CARD {studyIndex + 1} OF {cards.length}
        </span>
        <span className="bg-teal-900/60 px-2.5 py-1 rounded-full border border-teal-500/30">
          {currentCard?.subject || "Vocabulary"}
        </span>
      </div>

      <div className="min-h-[140px] flex flex-col items-center justify-center p-6 bg-slate-800/80 rounded-2xl border border-slate-700 shadow-inner">
        <h3 className="text-2xl font-black text-white mb-2">{currentCard?.term}</h3>
        {studyRevealed ? (
          <p className="text-sm text-teal-200 mt-3 leading-relaxed max-w-lg animate-fadeIn font-medium">
            {currentCard?.definition}
          </p>
        ) : (
          <button
            onClick={() => setStudyRevealed(true)}
            className="mt-3 px-4 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-bold border border-teal-500/40 transition"
          >
            👁️ Tap to Reveal Answer
          </button>
        )}
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => {
            setStudyIndex((prev) => (prev > 0 ? prev - 1 : cards.length - 1));
            setStudyRevealed(false);
          }}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
        >
          ← Previous
        </button>
        <button
          onClick={() => {
            setStudyIndex((prev) => (prev < cards.length - 1 ? prev + 1 : 0));
            setStudyRevealed(false);
          }}
          className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-bold text-white shadow-md shadow-teal-600/30 transition"
        >
          Next Card →
        </button>
      </div>
    </div>
  );
}

export default StudyMode;
