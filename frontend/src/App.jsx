import React, { useState, useEffect } from "react";
import { api, tk } from "./api/client.js";
import { useTheme } from "./hooks/useTheme.js";
import { Header } from "./components/layout/Header.jsx";
import { ToastContainer } from "./components/common/Toast.jsx";
import { AuthModal } from "./features/auth/AuthModal.jsx";
import { TutorChat } from "./features/tutor/TutorChat.jsx";
import { EssayEvaluator } from "./features/essay/EssayEvaluator.jsx";
import { QuizGenerator } from "./features/quiz/QuizGenerator.jsx";
import { Translator } from "./features/translator/Translator.jsx";
import { Flashcards } from "./features/flashcards/Flashcards.jsx";
import { Progress } from "./features/progress/Progress.jsx";

export default function App() {
  const [authed, setAuthed] = useState(!!tk());
  const [tab, setTab] = useState("tutor");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [difficulty, setDiff] = useState("Intermediate");
  const [language, setLang] = useState("Telugu");
  const { darkMode, setDarkMode } = useTheme();

  // Global Toast State
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = "info") => {
    const id = "toast_" + Date.now() + "_" + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const signOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    setUserProfile(null);
    setAuthed(false);
    addToast("Signed out successfully", "info");
  };

  const loadProfile = () => {
    if (tk()) {
      api("/user/profile").then(setUserProfile).catch(() => {});
    }
  };

  useEffect(() => {
    if (authed) loadProfile();
  }, [authed]);

  if (!authed) {
    return <AuthModal onAuth={() => setAuthed(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <Header
        tab={tab}
        setTab={setTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        signOut={signOut}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {tab === "tutor" && (
          <TutorChat
            difficulty={difficulty}
            setDifficulty={setDiff}
            language={language}
            setLanguage={setLang}
            onXPUpdate={loadProfile}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            setTab={setTab}
            userProfile={userProfile}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />
        )}
        {tab === "essay" && (
          <EssayEvaluator onXPUpdate={loadProfile} addToast={addToast} />
        )}
        {tab === "quiz" && (
          <QuizGenerator onXPUpdate={loadProfile} addToast={addToast} />
        )}
        {tab === "translate" && (
          <Translator addToast={addToast} />
        )}
        {tab === "cards" && (
          <Flashcards onXPUpdate={loadProfile} addToast={addToast} />
        )}
        {tab === "progress" && (
          <Progress userProfile={userProfile} setTab={setTab} />
        )}
      </main>
    </div>
  );
}
