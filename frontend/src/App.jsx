import React, { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend
} from "recharts";

const API = import.meta.env.VITE_API || "http://localhost:8000";

const LANGS = [
  "English",
  "Telugu",
  "Hindi",
  "Tamil",
  "Kannada",
  "Bengali",
  "Spanish",
  "French"
];

const SUBJECTS = [
  "General Knowledge",
  "Science & Physics",
  "Mathematics",
  "History & Civics",
  "English Grammar",
  "Computer Science",
  "Economics"
];

const QUICK_PROMPTS = [
  { text: "naku ai gurinchi full ga explain chei", subject: "General Knowledge", lang: "Telugu" },
  { text: "Explain Photosynthesis step-by-step", subject: "Science & Physics", lang: "Telugu" },
  { text: "How does Machine Learning work?", subject: "Computer Science", lang: "English" },
  { text: "Explain Pythagoras Theorem with example", subject: "Mathematics", lang: "Hindi" }
];


const tk = () => localStorage.getItem("token");

async function api(path, opts = {}) {
  const isForm = opts.body instanceof FormData;
  const res = await fetch(API + path, {
    ...opts,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(tk() ? { Authorization: "Bearer " + tk() } : {})
    },
    body: isForm ? opts.body : opts.body ? JSON.stringify(opts.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}

// Icons
const IconBot = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const IconUser = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const IconSparkles = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const IconBook = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const IconQuiz = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconTranslate = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
  </svg>
);

const IconCards = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const IconChart = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const Field = (p) => (
  <input
    {...p}
    className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
  />
);

const Btn = ({ children, variant = "primary", className = "", ...p }) => {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm";
  const styles = {
    primary: "bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700 active:scale-95 shadow-teal-500/20",
    secondary: "bg-slate-800 text-white hover:bg-slate-900 active:scale-95",
    outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:scale-95",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100"
  };
  return (
    <button {...p} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Sel = ({ value, set, items, label }) => (
  <div className="flex items-center gap-2">
    {label && <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}:</span>}
    <select
      value={value}
      onChange={(e) => set(e.target.value)}
      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
    >
      {items.map((i) => (
        <option key={i} value={i}>
          {i}
        </option>
      ))}
    </select>
  </div>
);

// Auth Component
function Auth({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ name: "", email: "", password: "", preferred_language: "English" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const go = async (e) => {
    if (e) e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const d = await api("/auth/" + (mode === "login" ? "login" : "register"), {
        method: "POST",
        body: f
      });
      localStorage.setItem("token", d.token);
      localStorage.setItem("name", d.name);
      onAuth();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const quickDemo = async () => {
    setLoading(true);
    setErr("");
    try {
      const demoUser = {
        name: "Learner Student",
        email: "demo@edulinga.ai",
        password: "demopassword123",
        preferred_language: "Telugu"
      };
      try {
        const d = await api("/auth/register", { method: "POST", body: demoUser });
        localStorage.setItem("token", d.token);
        localStorage.setItem("name", d.name);
      } catch (err) {
        const d = await api("/auth/login", { method: "POST", body: { email: demoUser.email, password: demoUser.password } });
        localStorage.setItem("token", d.token);
        localStorage.setItem("name", d.name);
      }
      onAuth();
    } catch (e) {
      setErr("Demo login failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(20,184,166,0.25),rgba(255,255,255,0))]">
      <div className="w-full max-w-md rounded-3xl bg-white/95 p-8 shadow-2xl backdrop-blur-xl border border-white/20">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white shadow-lg shadow-teal-500/30 mb-3">
            <IconSparkles />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">EduLinga AI</h1>
          <p className="mt-2 text-sm text-slate-500">
            Multilingual AI Educational Platform — Tutoring, Essays, Quizzes & Translation
          </p>
        </div>

        <form onSubmit={go} className="space-y-4">
          {mode === "register" && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Full Name</label>
                <Field placeholder="Jane Doe" value={f.name} onChange={set("name")} required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Preferred Native Language</label>
                <select
                  value={f.preferred_language}
                  onChange={(e) => setF({ ...f, preferred_language: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-slate-800 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  {LANGS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Email Address</label>
            <Field placeholder="student@example.com" type="email" value={f.email} onChange={set("email")} required />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Password</label>
            <Field placeholder="••••••••" type="password" value={f.password} onChange={set("password")} required />
          </div>

          {err && (
            <div className="rounded-xl bg-red-50 p-3 border border-red-200 text-xs font-medium text-red-600">
              {err}
            </div>
          )}

          <Btn type="submit" variant="primary" className="w-full py-3 text-base" disabled={loading}>
            {loading ? "Processing..." : mode === "login" ? "Sign In to EduLinga" : "Create Free Account"}
          </Btn>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col items-center gap-3">
          <Btn variant="outline" className="w-full" onClick={quickDemo} disabled={loading}>
            ⚡ 1-Click Demo Login
          </Btn>

          <button
            type="button"
            className="text-xs font-medium text-teal-600 hover:text-teal-700 underline"
            onClick={() => {
              setErr("");
              setMode(mode === "login" ? "register" : "login");
            }}
          >
            {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

// 1. AI TUTOR COMPONENT
function Tutor() {
  const [msgs, setMsgs] = useState([]);
  const [cid, setCid] = useState(null);
  const [hist, setHist] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [subject, setSubject] = useState("General Knowledge");
  const [difficulty, setDiff] = useState("Intermediate");
  const [language, setLang] = useState("Telugu");
  const endRef = useRef();

  const loadHist = () => api("/tutor/conversations").then(setHist).catch(() => {});

  useEffect(() => {
    loadHist();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

  const send = async (overrideText = null, overrideSub = null, overrideLang = null) => {
    const m = overrideText || text;
    if (!m.trim() || busy) return;
    const activeSub = overrideSub || subject;
    const activeLang = overrideLang || language;

    if (!overrideText) setText("");
    setBusy(true);
    setMsgs((x) => [...x, { role: "user", content: m, language: activeLang }]);

    try {
      const d = await api("/tutor/chat", {
        method: "POST",
        body: {
          message: m,
          conversation_id: cid,
          subject: activeSub,
          difficulty,
          language: activeLang
        }
      });
      setCid(d.conversation_id);
      setMsgs((x) => [...x, { role: "assistant", content: d.answer, language: activeLang }]);
      loadHist();
    } catch (e) {
      setMsgs((x) => [...x, { role: "assistant", content: "Error: " + e.message, isError: true }]);
    } finally {
      setBusy(false);
    }
  };

  const openConv = async (id) => {
    try {
      const d = await api("/tutor/conversations/" + id);
      setCid(id);
      setMsgs(d.messages);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-[260px_1fr] h-[calc(100vh-140px)]">
      {/* Sidebar */}
      <aside className="flex flex-col rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 overflow-hidden">
        <Btn variant="primary" className="w-full mb-4" onClick={() => { setCid(null); setMsgs([]); }}>
          + New Tutoring Session
        </Btn>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
          Recent Conversations
        </div>
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {hist.map((h) => (
            <button
              key={h.id}
              onClick={() => openConv(h.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition font-medium truncate flex flex-col gap-0.5 ${
                cid === h.id ? "bg-teal-50 text-teal-700 border border-teal-200" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="truncate">{h.title}</span>
              <span className="text-[10px] text-slate-400 font-normal">{h.subject}</span>
            </button>
          ))}
          {!hist.length && (
            <div className="text-center py-8 text-xs text-slate-400">No past conversations yet.</div>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <section className="flex flex-col rounded-2xl bg-white shadow-sm border border-slate-200/80 overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center gap-4">
          <Sel label="Subject" value={subject} set={setSubject} items={SUBJECTS} />
          <Sel label="Difficulty" value={difficulty} set={setDiff} items={["Beginner", "Intermediate", "Advanced"]} />
          <Sel label="Answer Language" value={language} set={setLang} items={LANGS} />
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!msgs.length && (
            <div className="max-w-lg mx-auto py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4">
                <IconSparkles />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Ask EduLinga Anything</h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                 EduLinga uses Chain-of-Thought AI to reason in English, then responds in your selected native language ({language}) with clear step-by-step explanations.
              </p>

              <div className="mt-6 text-left">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Try asking a quick question:
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {QUICK_PROMPTS.map((qp, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSubject(qp.subject);
                        setLang(qp.lang);
                        send(qp.text, qp.subject, qp.lang);
                      }}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-200 text-left transition text-xs font-medium text-slate-700"
                    >
                      💡 {qp.text} ({qp.lang})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {msgs.map((m, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 max-w-[85%] ${
                m.role === "user" ? "ml-auto flex-row-reverse" : ""
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  m.role === "user"
                    ? "bg-slate-800 text-white"
                    : "bg-teal-600 text-white shadow-md shadow-teal-500/20"
                }`}
              >
                {m.role === "user" ? <IconUser /> : <IconBot />}
              </div>

              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-slate-800 text-white rounded-tr-none"
                    : m.isError
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/50"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {busy && (
            <div className="flex items-start gap-3 max-w-[85%]">
              <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                <IconBot />
              </div>
              <div className="rounded-2xl rounded-tl-none bg-teal-50 border border-teal-100 px-4 py-3 text-xs font-medium text-teal-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                Thinking step by step in English CoT, generating {language} response...
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-100 bg-white flex gap-2">
          <Field
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder={`Ask your question in any language (EduLinga will answer in ${language})...`}
          />
          <Btn onClick={() => send()} disabled={busy || !text.trim()}>
            Send
          </Btn>
        </div>
      </section>
    </div>
  );
}

// 2. ESSAY EVALUATOR COMPONENT
const ScoreBar = ({ label, v }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs font-semibold text-slate-700">
      <span>{label}</span>
      <span className="text-teal-700 font-bold">{v}/100</span>
    </div>
    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, v))}%` }}
      />
    </div>
  </div>
);

function Essay() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [fl, setFl] = useState("English");
  const [file, setFile] = useState(null);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  const go = async () => {
    setErr("");
    setBusy(true);
    setRes(null);
    const fd = new FormData();
    fd.append("title", title || "Untitled Essay");
    fd.append("content", content);
    fd.append("feedback_language", fl);
    if (file) fd.append("file", file);

    try {
      const data = await api("/essays/evaluate", { method: "POST", body: fd });
      setRes(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Editor Box */}
      <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Essay Submission</h2>
          <p className="text-xs text-slate-500">Paste your text below or upload a plain text file (.txt).</p>
        </div>

        <Field
          placeholder="Essay Title (e.g., The Impact of Renewable Energy)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="relative">
          <textarea
            rows={12}
            className="w-full rounded-xl border border-slate-200 p-4 text-sm text-slate-800 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            placeholder="Write or paste your essay here (minimum 30 words)..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="absolute bottom-3 right-3 text-xs font-medium text-slate-400 bg-white/80 px-2 py-1 rounded-md border">
            {wordCount} words
          </div>
        </div>

        <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-600">Upload Text File:</span>
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
            className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
          />
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

      {/* Results Box */}
      <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
        <h2 className="text-lg font-bold text-slate-800">AI Evaluation Report</h2>

        {!res ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <IconBook />
            <p className="mt-3 text-sm text-slate-500">
              Submit an essay to receive comprehensive multilingual AI scoring across grammar, vocabulary, structure, and actionable corrections.
            </p>
          </div>
        ) : (
          <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)] pr-1">
            {/* Score Banner */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-500/20">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider opacity-80">Overall Essay Score</span>
                <div className="text-4xl font-black">{res.overall}<span className="text-lg font-normal opacity-80">/100</span></div>
              </div>
              <div className="text-right">
                <span className="text-xs uppercase font-bold tracking-wider opacity-80">Detected Language</span>
                <div className="text-base font-semibold">{res.language || "English"}</div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Detailed Metrics</h3>
              {["grammar", "vocabulary", "coherence", "structure", "originality"].map((k) => (
                <ScoreBar key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} v={res[k] || 0} />
              ))}
            </div>

            {/* Perfect Academic Rewrite Card (How to Write it Correctly!) */}
            {res.improvedVersion && (
              <div className="p-5 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                    ✨ Perfect Academic Rewrite (ఎలా సరైన పద్ధతిలో రాయాలి)
                  </h3>
                  <span className="text-[10px] font-bold bg-teal-200 text-teal-900 px-2 py-0.5 rounded-md">
                    Model Essay
                  </span>
                </div>
                <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-medium p-3 bg-white rounded-xl border border-teal-100 shadow-inner">
                  {res.improvedVersion}
                </div>
              </div>
            )}

            {/* Key Takeaways & Topic Points */}
            {!!res.keyTakeaways?.length && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  📌 Key Points & Core Takeaways
                </h3>
                <ul className="space-y-1 text-xs text-slate-700 list-disc pl-4 font-medium">
                  {res.keyTakeaways.map((kt, i) => (
                    <li key={i}>{kt}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Strengths & Improvements */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">✅ Key Strengths</h3>
                <ul className="space-y-1 text-xs text-emerald-900 list-disc pl-4">
                  {(res.strengths || []).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">🎯 Areas to Improve</h3>
                <ul className="space-y-1 text-xs text-amber-900 list-disc pl-4">
                  {(res.improvements || []).map((imp, i) => (
                    <li key={i}>{imp}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Suggestions */}
            {!!res.suggestions?.length && (
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-800">💡 Writing Coach Suggestions</h3>
                <ul className="space-y-1 text-xs text-blue-900 list-disc pl-4">
                  {res.suggestions.map((sug, i) => (
                    <li key={i}>{sug}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Corrections */}
            {!!res.corrections?.length && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">📝 Specific Corrections</h3>
                <div className="space-y-2">
                  {res.corrections.map((c, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-white border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="line-through text-red-500 font-medium">{c.original}</span>
                        <span>➔</span>
                        <span className="text-emerald-700 font-bold">{c.fixed}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 italic">Why: {c.why}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}


// 3. AI QUIZ GENERATOR COMPONENT (Interactive Preset Topics & Custom Topic Search)
function Quiz() {
  const [customTopic, setCustomTopic] = useState("");
  const [subject, setSubject] = useState("General Knowledge");
  const [difficulty, setDiff] = useState("Intermediate");
  const [language, setLang] = useState("Telugu");
  const [quiz, setQuiz] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const POPULAR_TOPICS = [
    { title: "Artificial Intelligence & ML", category: "Computer Science", icon: "🤖", desc: "Machine Learning, Neural Networks, and NLP concepts" },
    { title: "Photosynthesis & Botany", category: "Biology & Science", icon: "🌿", desc: "Light reactions, glucose synthesis, and plant biology" },
    { title: "Quantum Physics & Relativity", category: "Physics", icon: "⚛️", desc: "Subatomic particles, wave-particle duality, and energy" },
    { title: "Pythagoras & Geometry", category: "Mathematics", icon: "📐", desc: "Triangles, hypotenuse formulas, and spatial reasoning" },
    { title: "Data Structures & Algorithms", category: "Computer Science", icon: "💻", desc: "Arrays, trees, graphs, and sorting complexity" },
    { title: "World History & Revolutions", category: "History", icon: "📜", desc: "Key historical epochs, global events, and leaders" },
    { title: "Genetics & DNA Structure", category: "Biology", icon: "🧬", desc: "Chromosomes, gene expression, and inheritance" },
    { title: "Economics & Global Markets", category: "Economics", icon: "💰", desc: "Supply & demand, microeconomics, and fiscal policies" }
  ];

  const generate = async (overrideTopic = null) => {
    const activeTopic = overrideTopic !== null ? overrideTopic : (customTopic.trim() || subject);
    setLoading(true);
    setSubmitted(false);
    setSelectedAnswers({});
    try {
      const data = await api("/quiz/generate", {
        method: "POST",
        body: { topic: activeTopic, subject, difficulty, language }
      });
      setQuiz(data);
    } catch (e) {
      alert("Error generating quiz: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (qId, optionIdx) => {
    if (submitted) return;
    setSelectedAnswers({ ...selectedAnswers, [qId]: optionIdx });
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
    } catch (e) {
      console.error(e);
    }
  };

  const correctCount = quiz?.questions.filter((q) => selectedAnswers[q.id] === q.answerIndex).length || 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Quiz Controls Header */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">AI Multilingual Quiz Generator & Topic Explorer</h2>
            <p className="text-xs text-slate-500">Pick from curated topics below or type any custom topic of your choice.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Sel label="Difficulty" value={difficulty} set={setDiff} items={["Beginner", "Intermediate", "Advanced"]} />
            <Sel label="Quiz Language" value={language} set={setLang} items={LANGS} />
          </div>
        </div>

        {/* Custom Topic Input Field */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
          <input
            type="text"
            className="flex-1 rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            placeholder="Type any custom topic (e.g. Artificial Intelligence, Photosynthesis, Thermodynamics, World History...)"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate()}
          />
          <Btn onClick={() => generate()} disabled={loading}>
            {loading ? "Generating Quiz..." : "⚡ Generate Quiz"}
          </Btn>
        </div>
      </div>

      {/* Popular Topics Grid (Shown when no active quiz is displayed) */}
      {!quiz && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              🎯 Explore & Test Popular Academic Topics ({language})
            </h3>
            <span className="text-xs text-teal-600 font-semibold">Click any card to start quiz</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {POPULAR_TOPICS.map((t, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCustomTopic(t.title);
                  generate(t.title);
                }}
                className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-teal-400 hover:shadow-md transition text-left space-y-2 group active:scale-95 flex flex-col justify-between"
              >
                <div>
                  <div className="text-2xl mb-1">{t.icon}</div>
                  <h4 className="text-sm font-bold text-slate-800 group-hover:text-teal-700 transition">{t.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">{t.desc}</p>
                </div>
                <div className="pt-2 flex items-center justify-between text-[10px] font-bold text-teal-600 border-t border-slate-100">
                  <span>{t.category}</span>
                  <span className="group-hover:translate-x-1 transition-transform">Start Quiz ➔</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quiz Body */}
      {quiz && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800 text-white">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-teal-400">{quiz.subject} • {difficulty}</span>
              <h3 className="text-lg font-bold">{quiz.title}</h3>
            </div>
            {submitted ? (
              <div className="px-4 py-2 rounded-xl bg-teal-500 text-slate-900 font-black text-sm shadow-md">
                Score: {correctCount} / {quiz.questions.length} ({Math.round((correctCount / quiz.questions.length) * 100)}%)
              </div>
            ) : (
              <button
                onClick={() => setQuiz(null)}
                className="text-xs text-slate-300 hover:text-white underline font-semibold"
              >
                ← Change Topic
              </button>
            )}
          </div>

          <div className="space-y-4">
            {quiz.questions.map((q, qIdx) => {
              const isSelected = selectedAnswers[q.id] !== undefined;
              const isCorrect = selectedAnswers[q.id] === q.answerIndex;

              return (
                <div key={q.id} className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 font-bold text-xs flex items-center justify-center shrink-0">
                      Q{qIdx + 1}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-800 leading-snug">{q.question}</h4>
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-2 pl-10">
                    {q.options.map((opt, optIdx) => {
                      const picked = selectedAnswers[q.id] === optIdx;
                      let btnStyle = "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700";

                      if (submitted) {
                        if (optIdx === q.answerIndex) {
                          btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold";
                        } else if (picked) {
                          btnStyle = "border-red-500 bg-red-50 text-red-800 line-through";
                        }
                      } else if (picked) {
                        btnStyle = "border-teal-500 bg-teal-50 text-teal-800 font-bold ring-2 ring-teal-500/20";
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelect(q.id, optIdx)}
                          className={`p-3.5 rounded-xl border text-left text-xs transition flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {submitted && optIdx === q.answerIndex && <span>✓</span>}
                        </button>
                      );
                    })}
                  </div>

                  {submitted && (
                    <div className="ml-10 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                      <strong className="text-slate-800">Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!submitted ? (
            <div className="text-right">
              <Btn onClick={submitQuiz} disabled={Object.keys(selectedAnswers).length < quiz.questions.length}>
                Submit Answers & View Score
              </Btn>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-2">
              <Btn onClick={() => setQuiz(null)} variant="outline">
                ← Explore More Topics
              </Btn>
              <Btn onClick={() => generate(customTopic || quiz.subject)} variant="primary">
                Try Another Quiz on this Topic
              </Btn>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// 4. TRANSLATOR COMPONENT (Dual-Pane Side-by-Side View)
function Translator() {
  const [text, setText] = useState("Photosynthesis is the process by which green plants turn carbon dioxide and water into food using sunlight.");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("English");
  const [targetLang, setTargetLang] = useState("Telugu");
  const [vocabulary, setVocabulary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedSrc, setCopiedSrc] = useState(false);
  const [copiedTgt, setCopiedTgt] = useState(false);

  const translate = async (inputText = text, src = sourceLang, tgt = targetLang) => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const data = await api("/translate/text", {
        method: "POST",
        body: { text: inputText, sourceLang: src, targetLang: tgt }
      });
      setTranslatedText(data.translatedText || "");
      setVocabulary(data.vocabulary || []);
    } catch (e) {
      alert("Translation failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    translate(text, sourceLang, targetLang);
  }, []);

  const swapLanguages = () => {
    const newSrc = targetLang;
    const newTgt = sourceLang;
    const newText = translatedText || text;
    const newTrans = text;

    setSourceLang(newSrc);
    setTargetLang(newTgt);
    setText(newText);
    setTranslatedText(newTrans);
    translate(newText, newSrc, newTgt);
  };

  const copyToClipboard = (val, isSource) => {
    navigator.clipboard.writeText(val);
    if (isSource) {
      setCopiedSrc(true);
      setTimeout(() => setCopiedSrc(false), 2000);
    } else {
      setCopiedTgt(true);
      setTimeout(() => setCopiedTgt(false), 2000);
    }
  };

  const speakText = (val, lang) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(val);
    utterance.lang = lang.toLowerCase().includes('telugu') ? 'te-IN' :
                     lang.toLowerCase().includes('hindi') ? 'hi-IN' :
                     lang.toLowerCase().includes('tamil') ? 'ta-IN' :
                     lang.toLowerCase().includes('kannada') ? 'kn-IN' :
                     lang.toLowerCase().includes('bengali') ? 'bn-IN' :
                     lang.toLowerCase().includes('french') ? 'fr-FR' :
                     lang.toLowerCase().includes('spanish') ? 'es-ES' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const SAMPLE_PRESETS = [
    { label: "Photosynthesis (Biology)", val: "Photosynthesis is the process by which green plants use sunlight to synthesize nutrients from carbon dioxide and water." },
    { label: "Newton's Third Law (Physics)", val: "Newton's Third Law states that for every action, there is an equal and opposite reaction." },
    { label: "Pythagoras Theorem (Math)", val: "The Pythagorean theorem states that in a right-angled triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides." }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Title & Presets Header */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Multilingual Academic Translator & Dual-Language Editor</h2>
            <p className="text-xs text-slate-500">View and edit both languages side-by-side with instant academic vocabulary breakdown.</p>
          </div>

          <Btn onClick={() => translate()} disabled={loading || !text.trim()}>
            {loading ? "Translating..." : "⚡ Translate Text"}
          </Btn>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-xs font-bold uppercase text-slate-400">Sample Topics:</span>
          {SAMPLE_PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setText(p.val);
                translate(p.val, sourceLang, targetLang);
              }}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-200 text-slate-700 font-medium transition"
            >
              💡 {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Side-by-Side Dual-Pane Translator View */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] items-start">
        {/* Source Language Pane */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <Sel label="From" value={sourceLang} set={(v) => { setSourceLang(v); translate(text, v, targetLang); }} items={LANGS} />
            <div className="flex items-center gap-2">
              <button
                onClick={() => speakText(text, sourceLang)}
                title="Listen Audio"
                className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-slate-100 transition text-xs font-bold"
              >
                🔊 Speak
              </button>
              <button
                onClick={() => copyToClipboard(text, true)}
                title="Copy Text"
                className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-slate-100 transition text-xs font-bold"
              >
                {copiedSrc ? "✓ Copied" : "📋 Copy"}
              </button>
              {text && (
                <button
                  onClick={() => setText("")}
                  title="Clear Text"
                  className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-slate-100 transition text-xs"
                >
                  ✕ Clear
                </button>
              )}
            </div>
          </div>

          <textarea
            rows={8}
            className="w-full rounded-xl border border-slate-200 p-4 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none font-medium leading-relaxed"
            placeholder={`Enter text in ${sourceLang}...`}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{text.length} characters</span>
            <span>{text.trim() ? text.trim().split(/\s+/).length : 0} words</span>
          </div>
        </div>

        {/* Swap Languages Button */}
        <div className="flex md:flex-col items-center justify-center self-center py-2">
          <button
            onClick={swapLanguages}
            title="Swap Languages & Text"
            className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-600 hover:text-white transition shadow-md shadow-teal-500/10 font-bold active:scale-95"
          >
            ⇄
          </button>
        </div>

        {/* Target Language Pane (Editable!) */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <Sel label="To" value={targetLang} set={(v) => { setTargetLang(v); translate(text, sourceLang, v); }} items={LANGS} />
            <div className="flex items-center gap-2">
              <button
                onClick={() => speakText(translatedText, targetLang)}
                title="Listen Audio"
                className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-slate-100 transition text-xs font-bold"
              >
                🔊 Speak
              </button>
              <button
                onClick={() => copyToClipboard(translatedText, false)}
                title="Copy Translation"
                className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-slate-100 transition text-xs font-bold"
              >
                {copiedTgt ? "✓ Copied" : "📋 Copy"}
              </button>
            </div>
          </div>

          <textarea
            rows={8}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none font-medium leading-relaxed"
            placeholder={loading ? "Translating..." : `Translation in ${targetLang} (you can edit directly)...`}
            value={translatedText}
            onChange={(e) => setTranslatedText(e.target.value)}
          />

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{translatedText.length} characters</span>
            <span className="text-teal-600 font-semibold">Editable Translation</span>
          </div>
        </div>
      </div>

      {/* Academic Vocabulary Breakdown */}
      {!!vocabulary.length && (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-2">
            📚 Academic Vocabulary & Terminology Breakdown
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {vocabulary.map((v, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1">
                <div className="text-xs font-bold text-slate-500 uppercase">{v.word}</div>
                <div className="text-sm font-bold text-emerald-800">{v.translation}</div>
                <p className="text-xs text-slate-600 pt-1 leading-normal">{v.meaning}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// 5. FLASHCARDS COMPONENT
function Flashcards() {
  const [cards, setCards] = useState([]);
  const [term, setTerm] = useState("");
  const [def, setDef] = useState("");
  const [subject, setSubject] = useState("General Knowledge");
  const [lang, setLang] = useState("Telugu");

  const loadCards = () => api("/flashcards").then(setCards).catch(() => {});

  useEffect(() => {
    loadCards();
  }, []);

  const addCard = async (e) => {
    e.preventDefault();
    if (!term || !def) return;
    try {
      await api("/flashcards", {
        method: "POST",
        body: { term, definition: def, subject, language: lang }
      });
      setTerm("");
      setDef("");
      loadCards();
    } catch (err) {
      alert("Failed to add card: " + err.message);
    }
  };

  const deleteCard = async (id) => {
    try {
      await api("/flashcards/" + id, { method: "DELETE" });
      loadCards();
    } catch (err) {}
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Create Form */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Digital Study Notes & Flashcards</h2>
          <p className="text-xs text-slate-500">Save key formulas, definitions, and CoT notes for review.</p>
        </div>

        <form onSubmit={addCard} className="grid gap-4 sm:grid-cols-2">
          <Field placeholder="Term / Question / Concept" value={term} onChange={(e) => setTerm(e.target.value)} required />
          <Field placeholder="Definition / Answer / Step-by-Step Note" value={def} onChange={(e) => setDef(e.target.value)} required />

          <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex gap-4">
              <Sel label="Subject" value={subject} set={setSubject} items={SUBJECTS} />
              <Sel label="Language" value={lang} set={setLang} items={LANGS} />
            </div>
            <Btn type="submit">+ Save Flashcard</Btn>
          </div>
        </form>
      </div>

      {/* Cards Deck */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.id} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between space-y-3 relative group">
            <button
              onClick={() => deleteCard(c.id)}
              className="absolute top-3 right-3 text-slate-300 hover:text-red-500 font-bold text-xs transition"
            >
              ✕
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">
                {c.subject} ({c.language})
              </span>
              <h4 className="text-base font-bold text-slate-800 mt-2">{c.term}</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{c.definition}</p>
            </div>

            <div className="text-[10px] text-slate-400 border-t pt-2">
              Saved {new Date(c.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
        {!cards.length && (
          <div className="sm:col-span-2 md:col-span-3 rounded-2xl bg-white p-12 text-center text-slate-400 text-sm">
            No study flashcards created yet. Fill out the form above to build your personal deck!
          </div>
        )}
      </div>
    </div>
  );
}

// 6. PROGRESS DASHBOARD COMPONENT
function Progress() {
  const [d, setD] = useState(null);

  useEffect(() => {
    api("/dashboard").then(setD).catch(() => {});
  }, []);

  if (!d) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-400 font-medium">
        Loading Analytics Dashboard...
      </div>
    );
  }

  const kpis = [
    { label: "Questions Asked", val: d.questions, icon: "💬" },
    { label: "Essays Evaluated", val: d.essays, icon: "📄" },
    { label: "Languages Practiced", val: d.languages, icon: "🌐" },
    { label: "Average Essay Score", val: `${d.avg_score}%`, icon: "🏆" }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="text-3xl font-black text-slate-900">{k.val}</div>
              <div className="text-xs font-semibold text-slate-500 mt-1">{k.label}</div>
            </div>
            <div className="text-2xl">{k.icon}</div>
          </div>
        ))}
      </div>

      {/* Progress Chart */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
        <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <IconChart /> Score Trend History
        </h2>
        <div className="h-80 w-full">
          {d.trend.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={d.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="title" stroke="#64748b" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", color: "#fff", border: "none" }} />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#0d9488" strokeWidth={3} name="Overall Score" />
                <Line type="monotone" dataKey="grammar" stroke="#3b82f6" name="Grammar" />
                <Line type="monotone" dataKey="vocabulary" stroke="#f59e0b" name="Vocabulary" />
                <Line type="monotone" dataKey="coherence" stroke="#8b5cf6" name="Coherence" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400 text-sm">
              Submit essays to begin tracking performance trajectory over time.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// MAIN APPLICATION LAYOUT
export default function App() {
  const [authed, setAuthed] = useState(!!tk());
  const [tab, setTab] = useState("tutor");
  const [userName, setUserName] = useState(localStorage.getItem("name") || "Student");

  useEffect(() => {
    setUserName(localStorage.getItem("name") || "Student");
  }, [authed]);

  if (!authed) return <Auth onAuth={() => setAuthed(true)} />;

  const tabs = [
    { key: "tutor", label: "AI Tutor", icon: <IconBot /> },
    { key: "essay", label: "Essay Feedback", icon: <IconBook /> },
    { key: "quiz", label: "Quizzes", icon: <IconQuiz /> },
    { key: "translate", label: "Translator", icon: <IconTranslate /> },
    { key: "cards", label: "Flashcards", icon: <IconCards /> },
    { key: "progress", label: "Progress", icon: <IconChart /> }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <IconSparkles />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">EduLinga AI</h1>
              <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Multilingual Suite</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/60 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                  tab === t.key
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </nav>

          {/* User Section */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-800">{userName}</div>
              <div className="text-[10px] text-teal-600 font-semibold">Active Learner</div>
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                setAuthed(false);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Body Content */}
      <main className="mx-auto max-w-7xl p-4 sm:p-6">
        {tab === "tutor" ? (
          <Tutor />
        ) : tab === "essay" ? (
          <Essay />
        ) : tab === "quiz" ? (
          <Quiz />
        ) : tab === "translate" ? (
          <Translator />
        ) : tab === "cards" ? (
          <Flashcards />
        ) : (
          <Progress />
        )}
      </main>
    </div>
  );
}
