import React, { useState, useEffect } from "react";
import { api } from "../../api/client.js";
import { SUBJECTS } from "../../constants/subjects.js";
import { Field } from "../../components/common/Input.jsx";
import { Btn } from "../../components/common/Button.jsx";
import StudyMode from "./StudyMode.jsx";

export function Flashcards({ onXPUpdate, addToast }) {
  const [cards, setCards] = useState([]);
  const [term, setTerm] = useState("");
  const [def, setDef] = useState("");
  const [subject, setSubject] = useState("Academic Vocabulary");
  const [flipped, setFlipped] = useState({});
  const [search, setSearch] = useState("");
  const [studyMode, setStudyMode] = useState(false);
  const [studyIndex, setStudyIndex] = useState(0);
  const [studyRevealed, setStudyRevealed] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadCards = () => {
    setLoading(true);
    api("/flashcards")
      .then((data) => setCards(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCards();
  }, []);

  const addCard = async (e) => {
    e.preventDefault();
    if (!term.trim() || !def.trim()) return;
    try {
      await api("/flashcards", {
        method: "POST",
        body: { term: term.trim(), definition: def.trim(), subject }
      });
      setTerm("");
      setDef("");
      loadCards();
      if (onXPUpdate) onXPUpdate();
      if (addToast) addToast(`Added flashcard "${term.trim()}"!`, "success");
    } catch (err) {
      if (addToast) addToast("Could not add flashcard: " + err.message, "error");
    }
  };

  const deleteCard = async (id, e) => {
    e.stopPropagation();
    try {
      await api("/flashcards/" + id, { method: "DELETE" });
      setCards((prev) => prev.filter((c) => c.id !== id));
      if (addToast) addToast("Flashcard removed.", "info");
    } catch (err) {
      if (addToast) addToast("Delete failed: " + err.message, "error");
    }
  };

  const toggleFlip = (id) => {
    setFlipped((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const addSampleCards = async () => {
    const samples = [
      {
        term: "Photosynthesis",
        definition: "Process by which green plants use sunlight to synthesize nutrients from CO2 and water.",
        subject: "Biology"
      },
      {
        term: "Machine Learning",
        definition: "A branch of AI focusing on the use of data and algorithms to imitate the way humans learn.",
        subject: "Computer Science"
      },
      {
        term: "Coherence",
        definition: "The logical connections and clarity of thought that make a text easy to understand.",
        subject: "English Grammar"
      }
    ];
    for (const s of samples) {
      try {
        await api("/flashcards", { method: "POST", body: s });
      } catch (e) {}
    }
    loadCards();
    if (addToast) addToast("Sample flashcards added!", "success");
  };

  const filteredCards = cards.filter(
    (c) =>
      c.term?.toLowerCase().includes(search.toLowerCase()) ||
      c.definition?.toLowerCase().includes(search.toLowerCase()) ||
      c.subject?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Top Header & Study Mode Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>🗂️</span> Spaced Repetition Flashcards
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Active recall & SuperMemo SM-2 memory retention engine for academic vocabulary and key concepts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {cards.length > 0 && (
            <button
              onClick={() => {
                setStudyMode(!studyMode);
                setStudyIndex(0);
                setStudyRevealed(false);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                studyMode
                  ? "bg-teal-600 text-white"
                  : "bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800"
              }`}
            >
              {studyMode ? "✕ Exit Practice Mode" : "🎯 Start Study Mode"}
            </button>
          )}
          {cards.length === 0 && (
            <button
              onClick={addSampleCards}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition"
            >
              + Load Sample Cards
            </button>
          )}
        </div>
      </div>

      {/* Study Practice Mode */}
      {studyMode && cards.length > 0 && (
        <StudyMode
          cards={cards}
          studyIndex={studyIndex}
          setStudyIndex={setStudyIndex}
          studyRevealed={studyRevealed}
          setStudyRevealed={setStudyRevealed}
        />
      )}

      {/* Card Creation Form & Search */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 rounded-3xl bg-white dark:bg-slate-800 p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
            + New Flashcard
          </h3>
          <form onSubmit={addCard} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Concept / Term
              </label>
              <Field
                placeholder="e.g., Photosynthesis"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Subject / Domain
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                <option value="Academic Vocabulary">Academic Vocabulary</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Definition & Details
              </label>
              <textarea
                rows={4}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500/20"
                placeholder="Clear explanation, real-world example, or memory hook..."
                value={def}
                onChange={(e) => setDef(e.target.value)}
                required
              />
            </div>
            <Btn type="submit" className="w-full">
              Save Flashcard
            </Btn>
          </form>
        </div>

        {/* Cards Grid */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <input
              type="text"
              placeholder="🔍 Search cards by term, definition, or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500/20 shadow-sm"
            />
            <span className="text-xs font-bold text-slate-400 whitespace-nowrap">
              {filteredCards.length} cards
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">Loading flashcards...</div>
          ) : !filteredCards.length ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-400 text-xs space-y-2">
              <div className="text-3xl">📭</div>
              <p className="font-semibold">No flashcards found.</p>
              <p className="text-[11px] text-slate-500">
                Create one using the form on the left or save words from the Translator!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredCards.map((c) => {
                const isFlipped = !!flipped[c.id];
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleFlip(c.id)}
                    className="group relative cursor-pointer rounded-3xl bg-white dark:bg-slate-800 p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md hover:border-teal-400 dark:hover:border-teal-500 transition-all flex flex-col justify-between min-h-[160px]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                          {c.subject || "Vocabulary"}
                        </span>
                        <button
                          onClick={(e) => deleteCard(c.id, e)}
                          title="Delete Card"
                          className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-1"
                        >
                          🗑️
                        </button>
                      </div>

                      {isFlipped ? (
                        <div className="animate-fadeIn space-y-1">
                          <span className="text-[10px] font-bold text-teal-500 uppercase">
                            Definition:
                          </span>
                          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                            {c.definition}
                          </p>
                        </div>
                      ) : (
                        <div className="animate-fadeIn space-y-1 pt-2">
                          <h4 className="text-base font-black text-slate-900 dark:text-white">
                            {c.term}
                          </h4>
                          <p className="text-[11px] text-slate-400 italic">
                            Tap card to reveal definition
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                      <span>{isFlipped ? "🔄 Definition" : "💡 Front"}</span>
                      <span className="text-teal-600 dark:text-teal-400">Click to flip ↷</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Flashcards;
