import React from "react";
import { IconSparkles } from "../common/Icons.jsx";

export function Header({
  tab,
  setTab,
  sidebarOpen,
  setSidebarOpen,
  signOut
}) {
  return (
    <header className="sticky top-0 z-30 h-[65px] border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Toggle Sidebar"
          aria-label="Toggle navigation drawer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setTab("tutor")}
          aria-label="StudyMate AI Home"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <IconSparkles />
          </div>
          <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
            StudyMate AI
          </span>
        </div>
      </div>

      {/* Right Nav Tabs & Sign Out */}
      <div className="flex items-center gap-2">
        <nav className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/60 dark:border-slate-700 overflow-x-auto max-w-[calc(100vw-220px)] sm:max-w-none">
          <button
            onClick={() => setTab("tutor")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              tab === "tutor"
                ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-teal-600"
            }`}
            aria-label="AI Tutor Mode"
          >
            🤖 AI Tutor
          </button>
          <button
            onClick={() => setTab("essay")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              tab === "essay"
                ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-teal-600"
            }`}
            aria-label="Essay Evaluation Mode"
          >
            📄 Essay Feedback
          </button>
          <button
            onClick={() => setTab("quiz")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              tab === "quiz"
                ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-teal-600"
            }`}
            aria-label="Interactive Quizzes Mode"
          >
            🏆 Quizzes
          </button>
          <button
            onClick={() => setTab("translate")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              tab === "translate"
                ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-teal-600"
            }`}
            aria-label="Translator Mode"
          >
            🌐 Translator
          </button>
          <button
            onClick={() => setTab("cards")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              tab === "cards"
                ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-teal-600"
            }`}
            aria-label="Flashcards Mode"
          >
            🗂️ Flashcards
          </button>
          <button
            onClick={() => setTab("progress")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              tab === "progress"
                ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-teal-600"
            }`}
            aria-label="Progress & Analytics Mode"
          >
            📊 Analytics
          </button>
        </nav>

        <button
          onClick={signOut}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition whitespace-nowrap"
          aria-label="Sign out of StudyMate AI account"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}

export default Header;
