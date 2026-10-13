import React, { useState } from "react";
import { api } from "../../api/client.js";
import { LANGS } from "../../constants/languages.js";
import { Sel } from "../../components/common/Input.jsx";
import { Btn } from "../../components/common/Button.jsx";

export function QuizGenerator({ onXPUpdate, addToast }) {
  const [customTopic, setCustomTopic] = useState("");
  const [difficulty, setDiff] = useState("Intermediate");
  const [language, setLang] = useState("Telugu");
  const [questionCount, setQuestionCount] = useState(20);
  const [quiz, setQuiz] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const POPULAR_TOPICS = [
    { title: "Artificial Intelligence & ML", category: "Computer Science", icon: "🤖", desc: "Machine Learning, Neural Networks, and NLP concepts" },
    { title: "Photosynthesis & Botany", category: "Biology & Science", icon: "🌿", desc: "Light reactions, glucose synthesis, and plant biology" },
    { title: "Quantum Physics & Relativity", category: "Physics", icon: "⚛️", desc: "Subatomic particles, wave-particle duality, and energy" },
    { title: "Pythagoras & Geometry", category: "Mathematics", icon: "📐", desc: "Triangles, hypotenuse formulas, and spatial reasoning" }
  ];

  const generate = async (overrideTopic = null, overrideDiff = null, overrideLang = null, forceNewSeed = false) => {
    const activeTopic = overrideTopic !== null ? overrideTopic : (customTopic.trim() || quiz?.subject || "General Knowledge");
    const activeDiff = overrideDiff !== null ? overrideDiff : difficulty;
    const activeLang = overrideLang !== null ? overrideLang : language;
    const seed = forceNewSeed ? (Date.now() + "_" + Math.random().toString(36).substring(2, 7)) : Date.now().toString();

    setLoading(true);
    setSubmitted(false);
    setSelectedAnswers({});
    setError("");

    try {
      const data = await api("/api/quiz", {
        method: "POST",
        body: {
          topic: activeTopic,
          difficulty: activeDiff,
          language: activeLang,
          count: questionCount,
          seed
        }
      });
      setQuiz(data);
      if (addToast) {
        addToast(
          forceNewSeed
            ? `Fresh 20 questions loaded for "${activeTopic}" (${activeDiff})!`
            : `20-question quiz generated for "${activeTopic}" (${activeDiff})!`,
          "success"
        );
      }
    } catch (e) {
      setError(`Quiz generation failed. ${e.message}`);
      if (addToast) addToast(`Quiz generation failed: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDiffChange = (newDiff) => {
    setDiff(newDiff);
    if (quiz) {
      generate(customTopic.trim() || quiz.subject, newDiff, language, true);
    }
  };

  const handleLangChange = (newLang) => {
    setLang(newLang);
    if (quiz) {
      generate(customTopic.trim() || quiz.subject, difficulty, newLang, true);
    }
  };

  const handleRefresh = () => {
    generate(customTopic.trim() || quiz?.subject || "General Knowledge", difficulty, language, true);
  };

  const handleSelect = (qId, optionIdx) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  const submitQuiz = async () => {
    if (!quiz) return;
    setSubmitted(true);

    const answersList = quiz.questions.map((q) => ({
      questionId: q.id,
      selected: selectedAnswers[q.id],
      correct: q.answerIndex,
      isCorrect: selectedAnswers[q.id] === q.answerIndex
    }));

    try {
      await api("/quiz/submit", {
        method: "POST",
        body: {
          quiz_id: quiz.id,
          subject: quiz.subject,
          answers: answersList,
          totalQuestions: quiz.questions.length
        }
      });
      if (onXPUpdate) onXPUpdate();
      if (addToast) addToast(`Quiz submitted! Scored ${answersList.filter(a => a.isCorrect).length} / ${quiz.questions.length}. XP awarded!`, "success");
    } catch (e) {
      setError(`Your quiz score could not be saved. ${e.message}`);
    }
  };

  const answeredCount = quiz ? quiz.questions.filter((q) => selectedAnswers[q.id] !== undefined).length : 0;
  const totalCount = quiz ? quiz.questions.length : 20;
  const progressPercent = Math.round((answeredCount / totalCount) * 100);

  const getDiffBadgeColor = (diff) => {
    const d = (diff || "").toLowerCase();
    if (d.includes("beginner")) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700";
    if (d.includes("advanced")) return "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-700";
    return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700";
  };

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      {/* Quiz Configuration Bar */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/80 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">AI Multilingual Quiz Generator</h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-700">
                20 Questions
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Type any topic to practice 20 questions. Refresh anytime for brand new questions, and switch levels anytime!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Sel label="Level" value={difficulty} set={handleDiffChange} items={["Beginner", "Intermediate", "Advanced"]} />
            <Sel label="Language" value={language} set={handleLangChange} items={LANGS} />
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Count:</span>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 border-none outline-none cursor-pointer pr-1"
              >
                <option value={20} className="bg-white dark:bg-slate-800">20 Questions</option>
                <option value={10} className="bg-white dark:bg-slate-800">10 Questions</option>
                <option value={5} className="bg-white dark:bg-slate-800">5 Questions</option>
              </select>
            </div>
          </div>
        </div>

        {/* Input & Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          <input
            type="text"
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            placeholder="Type any custom topic (e.g. Artificial Intelligence, Photosynthesis, Thermodynamics, Indian History)..."
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate()}
          />
          <Btn onClick={() => generate()} disabled={loading} className="whitespace-nowrap">
            {loading ? "Generating 20 Questions..." : "⚡ Generate Quiz"}
          </Btn>
          {quiz && (
            <button
              onClick={handleRefresh}
              disabled={loading}
              title="Refresh with fresh questions on this topic"
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 hover:bg-teal-50 hover:border-teal-300 dark:hover:bg-slate-600 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 whitespace-nowrap"
            >
              <span className={`text-sm ${loading ? "animate-spin" : ""}`}>🔄</span>
              <span>Refresh Questions</span>
            </button>
          )}
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-600">{error}</p>}

      {/* Popular Topics Cards */}
      {!quiz && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Popular Academic Topics (or type above)
            </span>
            <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">Click any topic to generate 20 questions</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {POPULAR_TOPICS.map((t, idx) => {
              const isCurrentTopic = customTopic === t.title;
              return (
                <button
                  key={idx}
                  disabled={loading}
                  onClick={() => {
                    setCustomTopic(t.title);
                    generate(t.title);
                  }}
                  className={`p-4 rounded-2xl bg-white dark:bg-slate-800 border transition text-left space-y-2 group active:scale-95 flex flex-col justify-between ${isCurrentTopic
                    ? "border-teal-500 ring-2 ring-teal-500/20 shadow-md shadow-teal-500/10"
                    : "border-slate-200/80 dark:border-slate-700/80 hover:border-teal-400"
                    } ${loading ? "opacity-75 cursor-wait" : ""}`}
                >
                  <div>
                    <div className="text-2xl mb-1 flex items-center justify-between">
                      <span>{t.icon}</span>
                      {loading && isCurrentTopic && (
                        <span className="text-[10px] text-teal-600 font-bold animate-pulse">Generating...</span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-teal-600 transition">{t.title}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{t.desc}</p>
                  </div>
                  <div className="pt-2 text-[11px] font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <span>Solve 20 Problems</span>
                    <span>→</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Practice Quiz Section */}
      {quiz && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-lg space-y-3 border border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                    Active Practice Quiz
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getDiffBadgeColor(quiz.difficulty || difficulty)}`}>
                    Level: {quiz.difficulty || difficulty}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {quiz.questions.length} Questions
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-teal-300 border border-slate-700">
                    {quiz.language || language}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mt-1 text-white">{quiz.title}</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="text-xs px-3.5 py-2 rounded-xl bg-teal-600/90 hover:bg-teal-500 text-white font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <span className={loading ? "animate-spin" : ""}>🔄</span>
                  <span>Refresh Questions</span>
                </button>
                <button
                  onClick={() => {
                    setQuiz(null);
                    setSubmitted(false);
                    setSelectedAnswers({});
                  }}
                  className="text-xs px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition active:scale-95"
                >
                  ← Change Topic
                </button>
              </div>
            </div>

            {/* Progress & Jump Navigator */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">
                  Progress: <strong className="text-teal-400">{answeredCount}</strong> of <strong className="text-white">{quiz.questions.length}</strong> answered
                </span>
                <span className="text-teal-400 font-bold">{progressPercent}% Completed</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-teal-500 to-emerald-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Numbered Quick-Jump Pills */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Question Quick-Jump (Click to navigate):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {quiz.questions.map((q, idx) => {
                    const isAnswered = selectedAnswers[q.id] !== undefined;
                    const isCorrect = submitted && selectedAnswers[q.id] === q.answerIndex;
                    const isWrong = submitted && isAnswered && !isCorrect;

                    let pillClass = "bg-slate-800 text-slate-300 border-slate-700 hover:border-teal-500";
                    if (submitted) {
                      if (isCorrect) pillClass = "bg-emerald-600 text-white border-emerald-500 font-bold";
                      else if (isWrong) pillClass = "bg-rose-600 text-white border-rose-500 font-bold";
                      else pillClass = "bg-slate-800/50 text-slate-500 border-slate-800";
                    } else if (isAnswered) {
                      pillClass = "bg-teal-600 text-white border-teal-400 font-bold shadow-sm shadow-teal-500/20";
                    }

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => {
                          const el = document.getElementById(`quiz-q-${q.id}`);
                          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                        }}
                        className={`w-7 h-7 rounded-lg text-[11px] font-semibold border flex items-center justify-center transition active:scale-95 ${pillClass}`}
                        title={`Go to Question ${idx + 1}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {!submitted && answeredCount > 0 && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs">
              <span className="text-teal-800 dark:text-teal-200 font-medium">
                You have answered <strong>{answeredCount}</strong> of <strong>{quiz.questions.length}</strong> questions. Ready to verify?
              </span>
              <button
                onClick={submitQuiz}
                className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition shadow-sm active:scale-95"
              >
                Submit Answers Now
              </button>
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-4">
            {quiz.questions.map((q, qIdx) => (
              <div
                key={q.id}
                id={`quiz-q-${q.id}`}
                className="rounded-2xl bg-white dark:bg-slate-800 p-6 border border-slate-200/80 dark:border-slate-700/80 space-y-3 shadow-sm transition hover:border-slate-300 dark:hover:border-slate-600"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                      Question {qIdx + 1} of {quiz.questions.length}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getDiffBadgeColor(quiz.difficulty || difficulty)}`}>
                      {quiz.difficulty || difficulty}
                    </span>
                  </div>
                  {submitted && (
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${selectedAnswers[q.id] === q.answerIndex
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                      }`}>
                      {selectedAnswers[q.id] === q.answerIndex ? "✓ Correct" : "✕ Incorrect"}
                    </span>
                  )}
                </div>

                <h4 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white leading-relaxed">
                  {q.question}
                </h4>

                <div className="grid gap-2 sm:grid-cols-2 pt-1">
                  {q.options.map((opt, optIdx) => (
                    <button
                      key={optIdx}
                      onClick={() => handleSelect(q.id, optIdx)}
                      disabled={submitted}
                      className={`p-3 rounded-xl border text-left text-xs sm:text-sm transition ${submitted && q.answerIndex === optIdx
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold ring-1 ring-emerald-500/30"
                        : submitted && selectedAnswers[q.id] === optIdx
                          ? "border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200"
                          : selectedAnswers[q.id] === optIdx
                            ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40 font-bold text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/20"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-850"
                        }`}
                    >
                      <span className="inline-block w-5 font-bold opacity-60">
                        {String.fromCharCode(65 + optIdx)}.
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>

                {submitted && (
                  <div className="mt-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    <span className="font-bold text-teal-600 dark:text-teal-400 block mb-0.5">💡 Solution & Explanation:</span>
                    {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Submission and Results Footer */}
          {submitted ? (
            <div className="rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 p-8 text-center text-white space-y-3 shadow-lg shadow-teal-500/20">
              <span className="text-xs uppercase font-extrabold tracking-wider opacity-90">Quiz Completed</span>
              <div className="text-4xl font-black">
                Score: {quiz.questions.filter((q) => selectedAnswers[q.id] === q.answerIndex).length} / {quiz.questions.length}
              </div>
              <p className="text-sm opacity-90">
                Great job solving 20 problems on "{quiz.subject}" in {quiz.language || language}!
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                <button
                  onClick={handleRefresh}
                  className="px-5 py-2.5 rounded-xl bg-white text-teal-800 text-xs font-bold hover:bg-slate-100 transition shadow-sm active:scale-95"
                >
                  🔄 Refresh & Try 20 New Questions
                </button>
                <button
                  onClick={() => {
                    setQuiz(null);
                    setSubmitted(false);
                    setSelectedAnswers({});
                  }}
                  className="px-5 py-2.5 rounded-xl bg-teal-800/80 hover:bg-teal-900 text-white text-xs font-bold transition shadow-sm active:scale-95"
                >
                  ⚡ Choose Another Topic
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Completed: <strong>{answeredCount}</strong> of <strong>{quiz.questions.length}</strong> questions</span>
                <span>{quiz.questions.length - answeredCount} remaining</span>
              </div>
              <Btn onClick={submitQuiz} className="w-full py-3.5 text-sm font-bold shadow-md">
                Submit All 20 Quiz Answers
              </Btn>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default QuizGenerator;
