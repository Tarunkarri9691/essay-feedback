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
import { jsPDF } from "jspdf";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose"
});

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const LANGS = [
  "English",
  "Telugu",
  "Hindi",
  "Tamil",
  "Kannada",
  "Malayalam"
];

const LANGUAGE_CODES = {
  English: "en-IN",
  Telugu: "te-IN",
  Hindi: "hi-IN",
  Tamil: "ta-IN",
  Kannada: "kn-IN",
  Malayalam: "ml-IN"
};

const CHAT_COPY = {
  English: {
    title: "What can I help you learn today?",
    welcome: "Ask any question. I’ll reply in English.",
    placeholder: "Ask your question in any language…"
  },
  Telugu: {
    title: "ఈ రోజు మీరు ఏమి నేర్చుకోవాలనుకుంటున్నారు?",
    welcome: "ఏ ప్రశ్ననైనా అడగండి. నేను తెలుగులో సమాధానం ఇస్తాను.",
    placeholder: "మీ ప్రశ్నను ఏ భాషలోనైనా అడగండి…"
  },
  Hindi: {
    title: "आज आप क्या सीखना चाहेंगे?",
    welcome: "कोई भी सवाल पूछें। मैं हिंदी में जवाब दूँगा।",
    placeholder: "अपना सवाल किसी भी भाषा में पूछें…"
  },
  Tamil: {
    title: "இன்று நீங்கள் என்ன கற்க விரும்புகிறீர்கள்?",
    welcome: "எந்தக் கேள்வியையும் கேளுங்கள். தமிழில் பதிலளிக்கிறேன்.",
    placeholder: "உங்கள் கேள்வியை எந்த மொழியிலும் கேளுங்கள்…"
  },
  Kannada: {
    title: "ಇಂದು ನೀವು ಏನು ಕಲಿಯಲು ಬಯಸುತ್ತೀರಿ?",
    welcome: "ಯಾವುದೇ ಪ್ರಶ್ನೆಯನ್ನು ಕೇಳಿ. ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸುತ್ತೇನೆ.",
    placeholder: "ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಯಾವುದೇ ಭಾಷೆಯಲ್ಲಿ ಕೇಳಿ…"
  },
  Malayalam: {
    title: "ഇന്ന് നിങ്ങൾ എന്താണ് പഠിക്കാൻ ആഗ്രഹിക്കുന്നത്?",
    welcome: "ഏത് ചോദ്യവും ചോദിക്കൂ. മലയാളത്തിൽ മറുപടി നൽകാം.",
    placeholder: "നിങ്ങളുടെ ചോദ്യം ഏത് ഭാഷയിലും ചോദിക്കൂ…"
  }
};

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
  const res = await fetch(API_BASE + path, {
    ...opts,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(tk() ? { Authorization: "Bearer " + tk() } : {})
    },
    body: isForm ? opts.body : opts.body ? JSON.stringify(opts.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || data.message || "The request could not be completed.");
  return data;
}

// Group conversations by date (Today, Yesterday, Previous 7 Days, Older)
function groupHistoryByDate(conversations) {
  const groups = {
    Today: [],
    Yesterday: [],
    "Previous 7 Days": [],
    Older: []
  };

  const now = new Date();
  const todayStr = now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  (conversations || []).forEach((c) => {
    const d = new Date(c.created_at || Date.now());
    const dStr = d.toDateString();

    if (dStr === todayStr) {
      groups.Today.push(c);
    } else if (dStr === yesterdayStr) {
      groups.Yesterday.push(c);
    } else if (d >= sevenDaysAgo) {
      groups["Previous 7 Days"].push(c);
    } else {
      groups.Older.push(c);
    }
  });

  return groups;
}

// Code Block with Copy Button
function CodeBlock({ code, language = "javascript" }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-xl bg-slate-900 text-slate-100 p-4 border border-slate-800 text-xs font-mono overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
        <span className="text-teal-400 font-bold uppercase tracking-wider">{language}</span>
        <button
          onClick={handleCopy}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition"
        >
          {copied ? "✓ Copied" : "📋 Copy code"}
        </button>
      </div>
      <pre className="overflow-x-auto whitespace-pre">{code}</pre>
    </div>
  );
}

// Visual Mermaid Diagram Render Component
function MermaidDiagram({ chart }) {
  const [svg, setSvg] = useState("");
  const idRef = useRef("mermaid_" + Math.random().toString(36).substring(2, 9));

  useEffect(() => {
    if (!chart) return;
    try {
      mermaid.render(idRef.current, chart.trim()).then(({ svg }) => {
        setSvg(svg);
      }).catch((err) => {
        console.warn("Mermaid render error:", err);
      });
    } catch (e) {
      console.warn("Mermaid exception:", e);
    }
  }, [chart]);

  if (!svg) {
    return (
      <div className="my-3 p-4 rounded-xl bg-slate-900 text-teal-300 font-mono text-xs overflow-x-auto border border-teal-500/30">
        <div className="text-[10px] text-teal-400 font-bold mb-1 uppercase tracking-wider">📊 Visual Flowchart Diagram</div>
        <pre>{chart}</pre>
      </div>
    );
  }

  return (
    <div className="my-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 shadow-sm overflow-x-auto flex justify-center">
      <div dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}

// KaTeX Math & Markdown Helper Component
function RichText({ text }) {
  if (!text) return null;

  const renderMath = (str) => {
    if (!window.katex || typeof str !== "string") return str;
    try {
      // Replace $$...$$ block math
      let out = str.replace(/\$\$(.*?)\$\$/gs, (_, expr) => {
        try {
          return window.katex.renderToString(expr.trim(), { displayMode: true, throwOnError: false });
        } catch (e) {
          return _;
        }
      });
      // Replace $...$ inline math
      out = out.replace(/\$([^\$\n]+)\$/g, (_, expr) => {
        try {
          return window.katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false });
        } catch (e) {
          return _;
        }
      });
      return out;
    } catch (e) {
      return str;
    }
  };

  const processed = renderMath(text);
  if (typeof processed === "string" && (processed.includes("katex") || processed.includes("class="))) {
    return <span dangerouslySetInnerHTML={{ __html: processed }} />;
  }

  const chunks = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return (
    <span>
      {chunks.map((chunk, i) => {
        if (chunk.startsWith("**") && chunk.endsWith("**")) return <strong key={i}>{chunk.slice(2, -2)}</strong>;
        if (chunk.startsWith("`") && chunk.endsWith("`")) return <code key={i} className="rounded bg-slate-200/70 dark:bg-slate-700 px-1 py-0.5 font-mono text-[0.9em]">{chunk.slice(1, -1)}</code>;
        if (chunk.startsWith("*") && chunk.endsWith("*")) return <em key={i}>{chunk.slice(1, -1)}</em>;
        return <React.Fragment key={i}>{chunk}</React.Fragment>;
      })}
    </span>
  );
}

// Formatted Message Component (Markdown: Headings, Bullet Lists, Numbered Steps, Tables, Code Blocks, Visual Diagrams, KaTeX Math)
function FormattedMessage({ text }) {
  if (!text) return null;

  // Strip <reasoning> tags for main answer view (handled separately in CoT accordion)
  const mainText = text.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "").replace(/<answer>/gi, "").replace(/<\/answer>/gi, "").trim();

  const parts = mainText.split(/(```[\s\S]*?```)/gi);

  return (
    <div className="space-y-3 leading-relaxed">
      {parts.map((part, idx) => {
        if (part.startsWith("```")) {
          const match = part.match(/^```(\w+)?\n?([\s\S]*?)```$/);
          const lang = match ? match[1] || "code" : "code";
          const codeContent = match ? match[2] : part.replace(/^```/g, "").replace(/```$/g, "");

          if (lang.toLowerCase() === "mermaid") {
            return <MermaidDiagram key={idx} chart={codeContent} />;
          }
          return <CodeBlock key={idx} code={codeContent} language={lang} />;
        }

        const lines = part.split("\n");
        return (
          <div key={idx} className="space-y-2">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={lIdx} className="h-1.5" />;

              // Headings (###, ##, #)
              if (trimmed.startsWith("### ")) {
                return (
                  <h3 key={lIdx} className="text-base font-bold text-slate-900 dark:text-white pt-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                    <RichText text={trimmed.substring(4)} />
                  </h3>
                );
              }
              if (trimmed.startsWith("## ")) {
                return (
                  <h2 key={lIdx} className="text-lg font-bold text-slate-900 dark:text-white pt-3 pb-1 border-b border-slate-200 dark:border-slate-800">
                    <RichText text={trimmed.substring(3)} />
                  </h2>
                );
              }
              if (trimmed.startsWith("# ")) {
                return (
                  <h1 key={lIdx} className="text-xl font-black text-slate-900 dark:text-white pt-4 pb-1">
                    <RichText text={trimmed.substring(2)} />
                  </h1>
                );
              }

              // Table rows (| Col 1 | Col 2 |)
              if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
                const cells = trimmed.split("|").filter((c) => c.trim() !== "");
                const isHeaderSeparator = cells.every((c) => c.trim().match(/^:?-+:?$/));
                if (isHeaderSeparator) return null;

                return (
                  <div key={lIdx} className="grid grid-flow-col auto-cols-fr gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs border border-slate-200 dark:border-slate-700/80 font-medium">
                    {cells.map((cell, cIdx) => (
                      <div key={cIdx} className="truncate">
                        <RichText text={cell.trim()} />
                      </div>
                    ))}
                  </div>
                );
              }

              // Bullet points (•, -, *)
              if (trimmed.startsWith("• ") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-1 text-slate-800 dark:text-slate-200">
                    <span className="text-teal-500 font-bold shrink-0 mt-0.5">•</span>
                    <span><RichText text={trimmed.substring(2)} /></span>
                  </div>
                );
              }

              // Numbered steps (1., 2., 3.)
              const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
              if (numMatch) {
                return (
                  <div key={lIdx} className="flex items-start gap-2.5 pl-1 text-slate-800 dark:text-slate-200">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-bold text-xs shrink-0 mt-0.5">
                      {numMatch[1]}
                    </span>
                    <span><RichText text={numMatch[2]} /></span>
                  </div>
                );
              }

              // Standard Paragraph with Bold & KaTeX Math
              return (
                <p key={lIdx} className="text-slate-800 dark:text-slate-200 leading-relaxed">
                  <RichText text={trimmed} />
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// Robust Indic Text-to-Speech (TTS) Engine
function speakText(rawText, lang = "English", onEnd = null) {
  if (!("speechSynthesis" in window)) {
    return { ok: false, message: "Read aloud is not supported in this browser." };
  }

  window.speechSynthesis.cancel(); // Stop any active speech

  let cleanText = rawText
    .replace(/```[\s\S]*?```/g, "")
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/[#*`~_|\-\=]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanText) return { ok: false, message: "There is no readable text to speak." };

  const utterance = new SpeechSynthesisUtterance(cleanText);
  const targetLangCode = LANGUAGE_CODES[lang] || LANGUAGE_CODES.English;
  utterance.lang = targetLangCode;
  utterance.rate = 0.9;
  utterance.pitch = 1.0;

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(
    (v) => v.lang.toLowerCase().startsWith(targetLangCode.split("-")[0])
  );

  if (!matchedVoice) {
    return { ok: false, message: `No ${lang} speech voice is available. Install the ${lang} language voice pack in your device settings.` };
  }

  utterance.voice = matchedVoice;
  window.speechSynthesis.speak(utterance);
  return { ok: true };
}

// Indic Speech-to-Text (STT) Hook
function useSpeechInput(lang = "English", onResult) {
  const [listening, setListening] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const recognitionRef = useRef(null);
  const initialTextRef = useRef("");
  const toggleListen = (initialText = "") => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    setSpeechError("");
    const rec = new SpeechRecognition();
    recognitionRef.current = rec;
    initialTextRef.current = initialText.trim();
    rec.lang = LANGUAGE_CODES[lang] || LANGUAGE_CODES.English;
    rec.interimResults = true;
    rec.onstart = () => setListening(true);
    rec.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };
    rec.onerror = (e) => {
      setListening(false);
      recognitionRef.current = null;
      setSpeechError(e.error === "not-allowed" || e.error === "service-not-allowed"
        ? "Microphone permission was denied. Allow microphone access in your browser settings and try again."
        : `Speech recognition failed${e.error ? ` (${e.error})` : ""}. Please try again.`);
    };
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map((result) => result[0].transcript).join("");
      onResult([initialTextRef.current, transcript].filter(Boolean).join(" "));
    };
    try {
      rec.start();
    } catch (e) {
      setSpeechError("Could not start speech recognition. Please try again.");
    }
  };
  return { listening, speechError, toggleListen };
}

// PDF Export Function for Essay Evaluation
function exportEssayPDF(essay) {
  const doc = new jsPDF();
  doc.setFontSize(22);
  doc.setTextColor(13, 148, 136); // Teal
  doc.text("EduLinga AI - Essay Evaluation Report", 14, 20);

  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text(`Title: ${essay.title || "Academic Essay"}`, 14, 32);
  doc.text(`Overall Score: ${essay.overall || 75}%`, 14, 40);

  doc.setFontSize(11);
  doc.text(`Grammar: ${essay.grammar || 80}%  |  Vocabulary: ${essay.vocabulary || 80}%`, 14, 50);
  doc.text(`Coherence: ${essay.coherence || 80}% | Structure: ${essay.structure || 80}%`, 14, 58);

  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 64, 196, 64);

  let y = 74;
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("Strengths & Recommendations:", 14, y);
  y += 8;
  doc.setFontSize(10);

  const items = [
    ...(essay.strengths || []).map((s) => `• Strength: ${s}`),
    ...(essay.improvements || []).map((i) => `• Area to Improve: ${i}`),
    ...(essay.suggestions || []).map((s) => `• Suggestion: ${s}`)
  ];

  items.forEach((item) => {
    const lines = doc.splitTextToSize(item, 180);
    doc.text(lines, 14, y);
    y += lines.length * 6;
  });

  doc.save(`EduLinga_Essay_Report.pdf`);
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
    className="w-full rounded-xl border border-slate-200 bg-white/90 dark:bg-slate-800 dark:border-slate-700 dark:text-white px-4 py-3 text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
  />
);

const Btn = ({ children, variant = "primary", className = "", ...p }) => {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-xs sm:text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm";
  const styles = {
    primary: "bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700 active:scale-95 shadow-teal-500/20",
    secondary: "bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 active:scale-95",
    outline: "border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95",
    ghost: "bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
  };
  return (
    <button {...p} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Sel = ({ value, set, items, label }) => (
  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
    {label && <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}:</span>}
    <select
      value={value}
      onChange={(e) => set(e.target.value)}
      className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 border-none outline-none cursor-pointer pr-1"
    >
      {items.map((i) => (
        <option key={i} value={i} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
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
      const d = await api("/auth/demo", { method: "POST" });
      localStorage.setItem("token", d.token);
      localStorage.setItem("name", d.name);
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
            Multilingual AI Educational Platform — ChatGPT Style Tutoring & Educational Suite
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

// 1. CHATGPT-STYLE AI TUTOR COMPONENT (with Real-time SSE Token Streaming, Thinking Cursor, Auto-Scroll, Icon Row, User Edits, File Attachments)
function ChatGPTTutor({
  difficulty,
  language,
  setLanguage,
  onXPUpdate,
  sidebarOpen,
  setSidebarOpen,
  setTab,
  userProfile,
  darkMode,
  setDarkMode
}) {
  const [msgs, setMsgs] = useState([]);
  const [cid, setCid] = useState(null);
  const [hist, setHist] = useState([]);
  const [text, setText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [editingCid, setEditingCid] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  // New Action Row & Composer States
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [feedbackState, setFeedbackState] = useState({});
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [editingUserIdx, setEditingUserIdx] = useState(null);
  const [editUserText, setEditUserText] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [chatError, setChatError] = useState("");
  const [speechMessage, setSpeechMessage] = useState("");

  const scrollRef = useRef(null);
  const requestRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const { listening, speechError, toggleListen } = useSpeechInput(language, setText);

  const loadHist = () => api("/tutor/conversations").then(setHist).catch(() => {});

  useEffect(() => {
    loadHist();
  }, []);

  const scrollToBottom = (smooth = true) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto"
      });
    }
  };

  useEffect(() => {
    if (!userScrolledUp) scrollToBottom();
  }, [msgs, streaming]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        stopStreaming();
        setCid(null);
        setMsgs([]);
        setText("");
        setAttachedFile(null);
        setChatError("");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      requestRef.current?.abort();
    };
  }, []);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 80;
    setUserScrolledUp(!isAtBottom);
  };

  const stopStreaming = () => {
    requestRef.current?.abort();
    requestRef.current = null;
    setStreaming(false);
  };

  const handleCopy = (idx, content) => {
    if (!navigator.clipboard?.writeText) {
      setChatError("Clipboard access is not available in this browser.");
      return;
    }
    navigator.clipboard.writeText(content)
      .then(() => {
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);
      })
      .catch(() => setChatError("Could not copy the response. Check clipboard permissions and try again."));
  };

  const logFeedback = (idx, type, userMsg, assistantMsg) => {
    setFeedbackState((prev) => ({ ...prev, [idx]: type }));
    api("/tutor/feedback", {
      method: "POST",
      body: {
        conversation_id: cid,
        message_index: idx,
        feedback_type: type,
        user_message: userMsg || "",
        assistant_message: assistantMsg || ""
      }
    }).catch((err) => setChatError(`Could not save feedback. ${err.message}`));
  };

  const handleRegenerate = (idx) => {
    const userPrompt = msgs[idx - 1]?.content || msgs[msgs.length - 2]?.content;
    if (!userPrompt) return;
    logFeedback(idx, "regenerate", userPrompt, msgs[idx]?.content);

    setMsgs((prev) => prev.slice(0, idx - 1));
    send(userPrompt, { history: msgs.slice(0, idx - 1) });
  };

  const handleAudioToggle = (idx, content, messageLanguage = language) => {
    setSpeechMessage("");
    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
    } else {
      setSpeakingIdx(idx);
      const result = speakText(content, messageLanguage, () => setSpeakingIdx(null));
      if (!result.ok) {
        setSpeakingIdx(null);
        setSpeechMessage(result.message);
      }
    }
  };

  const handleSaveUserEdit = (idx) => {
    if (!editUserText.trim()) return;
    const newPrompt = editUserText.trim();
    setEditingUserIdx(null);
    setEditUserText("");
    // Truncate messages up to index idx
    setMsgs((prev) => prev.slice(0, idx));
    send(newPrompt, { history: msgs.slice(0, idx) });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setChatError("");
    if (!file.name.toLowerCase().endsWith(".txt")) {
      setChatError("Please attach a .txt file. PDF text extraction is not available here.");
      e.target.value = "";
      return;
    }
    if (file.size > 64 * 1024) {
      setChatError("Please attach a text file smaller than 64 KB.");
      e.target.value = "";
      return;
    }
    setUploadingFile(true);
    file.text()
      .then((contents) => setAttachedFile({ filename: file.name, text: contents, size: file.size }))
      .catch(() => setChatError("Could not read that text file. Please try another file."))
      .finally(() => {
        setUploadingFile(false);
        e.target.value = "";
      });
  };

  const send = async (overrideText = null, options = {}) => {
    let m = overrideText || text;
    if (attachedFile && !overrideText) {
      m = `[Attached Document: ${attachedFile.filename}]\n${attachedFile.text}\n\nStudent Query: ${m}`;
      setAttachedFile(null);
    }

    if (!m.trim() || streaming) return;

    if (!overrideText) {
      setText("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
    setChatError("");
    setUserScrolledUp(false);
    const history = options.history || msgs;
    const controller = new AbortController();
    const requestId = `request_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const responseLanguage = options.language || language;
    requestRef.current = controller;
    setStreaming(true);
    setMsgs((x) => [
      ...x,
      { role: "user", content: m, language: responseLanguage },
      { role: "assistant", content: "", language: responseLanguage, requestId }
    ]);

    try {
      const d = await api("/api/chat", {
        method: "POST",
        signal: controller.signal,
        body: {
          message: m,
          messages: history.slice(-10).map(({ role, content }) => ({ role, content })),
          conversation_id: cid,
          difficulty,
          language: options.language || language,
          subject: options.subject || "General"
        }
      });
      const answer = d.reply || d.answer;
      if (typeof answer !== "string" || !answer.trim()) {
        throw new Error("The server returned an empty reply.");
      }
      setCid(d.conversation_id);
      setMsgs((prev) => {
        return prev.map((item) => item.requestId === requestId
          ? { role: "assistant", content: answer, language: responseLanguage }
          : item);
      });
      loadHist();
      if (onXPUpdate) onXPUpdate();
    } catch (e) {
      if (e.name === "AbortError") {
        setMsgs((prev) => prev.filter((item) => item.requestId !== requestId));
        return;
      }
      const message = e instanceof TypeError
        ? "I couldn't connect to EduLinga. Please check that the backend is running and try again."
        : `I couldn't get a response right now. ${e.message}`;
      setChatError(message);
      setMsgs((prev) => {
        return prev.map((item) => item.requestId === requestId
          ? { role: "assistant", content: message, language: responseLanguage, isError: true }
          : item);
      });
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setStreaming(false);
      }
    }
  };

  const openConv = async (id) => {
    stopStreaming();
    setChatError("");
    try {
      const d = await api("/tutor/conversations/" + id);
      setCid(id);
      setMsgs(d.messages);
      setUserScrolledUp(false);
    } catch (e) {
      setChatError(`Could not load this conversation. ${e.message}`);
    }
  };

  const deleteConv = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;
    try {
      await api("/tutor/conversations/" + id, { method: "DELETE" });
      if (cid === id) {
        setCid(null);
        setMsgs([]);
      }
      loadHist();
    } catch (err) {
      setChatError(`Could not delete this conversation. ${err.message}`);
    }
  };

  const saveRename = async (id, e) => {
    e.stopPropagation();
    if (!editTitle.trim()) return;
    try {
      await api("/tutor/conversations/" + id, {
        method: "PUT",
        body: { title: editTitle }
      });
      setEditingCid(null);
      loadHist();
    } catch (err) {
      setChatError(`Could not rename this conversation. ${err.message}`);
    }
  };

  const groupedHist = groupHistoryByDate(hist);

  return (
    <div className="relative flex h-[calc(100vh-65px)] overflow-hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* 1. LEFT SIDEBAR (260px, Collapsible, Grouped Chat History) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[260px] bg-slate-950 text-slate-200 flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Sidebar Header */}
        <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
          <button
            onClick={() => {
              stopStreaming();
              setCid(null);
              setMsgs([]);
              setText("");
              setAttachedFile(null);
              setChatError("");
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sm font-bold text-slate-100 transition shadow-sm"
          >
            <span className="flex items-center gap-2">
              <span className="text-teal-400 font-black">+</span> New chat
            </span>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">Ctrl K</span>
          </button>
        </div>

        {/* Grouped History List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 text-xs font-medium">
          {Object.entries(groupedHist).map(([groupTitle, items]) => {
            if (!items.length) return null;
            return (
              <div key={groupTitle} className="space-y-1">
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {groupTitle}
                </div>
                {items.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => openConv(h.id)}
                    className={`group relative flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition text-xs font-medium truncate ${
                      cid === h.id ? "bg-slate-800 text-white font-semibold" : "text-slate-300 hover:bg-slate-900"
                    }`}
                  >
                    {editingCid === h.id ? (
                      <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          className="w-full bg-slate-900 border border-teal-500 rounded px-1.5 py-0.5 text-xs text-white outline-none"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveRename(h.id, e)}
                          autoFocus
                        />
                        <button onClick={(e) => saveRename(h.id, e)} className="text-teal-400 font-bold px-1">✓</button>
                      </div>
                    ) : (
                      <>
                        <span className="truncate pr-12">{h.title}</span>
                        {/* Hover Action Icons: Rename & Delete */}
                        <div className="absolute right-2 hidden group-hover:flex items-center gap-1.5 bg-slate-800 px-1 py-0.5 rounded">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCid(h.id);
                              setEditTitle(h.title);
                            }}
                            title="Rename"
                            className="text-slate-400 hover:text-teal-300 text-[11px]"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => deleteConv(h.id, e)}
                            title="Delete"
                            className="text-slate-400 hover:text-red-400 text-[11px]"
                          >
                            🗑️
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
          {!hist.length && (
            <div className="text-center py-12 text-slate-500 text-xs">No previous chats.</div>
          )}
        </div>

        {/* Bottom Sidebar */}
        <div className="p-3 border-t border-slate-800/80 space-y-1">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Learning Sections
          </div>
          {[
            { id: "tutor", label: "🤖 AI Tutor Chat" },
            { id: "essay", label: "📄 Essay Evaluation" },
            { id: "quiz", label: "🏆 Practice Quizzes" },
            { id: "translate", label: "🌐 Multilingual Translator" },
            { id: "cards", label: "🗂️ SM-2 Flashcards" },
            { id: "progress", label: "📊 Evaluation Analytics" }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setTab(item.id);
                setSidebarOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-900 flex items-center gap-2 transition"
            >
              {item.label}
            </button>
          ))}
          <div className="flex items-center justify-between px-3 py-1.5 border-t border-slate-800/50 pt-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center">
                {userProfile?.name?.charAt(0) || "S"}
              </div>
              <span className="font-semibold text-slate-300 truncate max-w-[110px]">
                {userProfile?.name || "Student"}
              </span>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="text-slate-400 hover:text-slate-200 text-xs font-bold"
              title="Toggle Dark/Light Mode"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for Mobile Sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm md:hidden"
        />
      )}

      {/* 2. MAIN CONVERSATION COLUMN (Single centered max-width 768px column) */}
      <section className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Main Conversation Container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-6"
        >
          <div className="max-w-3xl mx-auto space-y-6">
            {/* EMPTY STATE (Centered hero prompt when no messages) */}
            {!msgs.length && (
              <div className="py-16 text-center space-y-8 animate-fadeIn">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white flex items-center justify-center mx-auto shadow-xl shadow-teal-500/20">
                  <IconSparkles />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {CHAT_COPY[language]?.title || CHAT_COPY.English.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    {CHAT_COPY[language]?.welcome || CHAT_COPY.English.welcome}
                  </p>
                </div>

                {/* 4 Suggestion Cards */}
                <div className="grid gap-3 sm:grid-cols-2 text-left max-w-2xl mx-auto pt-4">
                  {QUICK_PROMPTS.map((qp, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setLanguage(qp.lang);
                        send(qp.text, { language: qp.lang, subject: qp.subject });
                      }}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-teal-400 hover:shadow-md transition text-xs font-medium text-slate-800 dark:text-slate-200 group active:scale-95 space-y-1"
                    >
                      <div className="font-bold text-slate-900 dark:text-white group-hover:text-teal-600">
                        💡 {qp.text}
                      </div>
                      <div className="text-[11px] text-slate-400">{qp.subject} • {qp.lang}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* MESSAGES LIST */}
            {msgs.map((m, i) => (
              <div key={i} className="space-y-2">
                {m.role === "user" ? (
                  /* User Message: Right-aligned gray bubble with Edit button */
                  <div className="group flex flex-col items-end gap-1">
                    {editingUserIdx === i ? (
                      <div className="w-full max-w-2xl p-3 rounded-2xl bg-slate-800 border border-teal-500 space-y-2">
                        <textarea
                          rows={3}
                          className="w-full bg-transparent text-sm text-white border-none outline-none resize-none"
                          value={editUserText}
                          onChange={(e) => setEditUserText(e.target.value)}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2 text-xs">
                          <button
                            onClick={() => setEditingUserIdx(null)}
                            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveUserEdit(i)}
                            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold shadow-sm"
                          >
                            Save & Submit
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 max-w-[80%]">
                        <button
                          onClick={() => {
                            setEditingUserIdx(i);
                            setEditUserText(m.content);
                          }}
                          title="Edit message"
                          className="opacity-0 group-hover:opacity-100 transition p-1 text-slate-400 hover:text-teal-500 text-xs font-semibold"
                        >
                          ✏️ Edit
                        </button>
                        <div className="rounded-3xl rounded-tr-sm bg-slate-800 dark:bg-slate-700 text-white px-5 py-3.5 text-sm leading-relaxed shadow-sm font-medium">
                          {m.content}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Assistant Message: Full column width, plain text, NO bubble */
                  <div className="flex items-start gap-4 w-full py-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-500/20 mt-1">
                      <IconBot />
                    </div>
                    <div className="flex-1 space-y-2 overflow-hidden text-sm text-slate-800 dark:text-slate-100">
                      {m.isError ? (
                        <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-medium flex items-center justify-between gap-3 animate-fadeIn my-1">
                          <span className="flex items-center gap-2">
                            <span>⚠️</span>
                            <span>{m.content || "Connection interrupted. Failed to generate AI response."}</span>
                          </span>
                          <button
                            onClick={() => handleRegenerate(i)}
                            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-sm flex items-center gap-1 shrink-0"
                            aria-label="Retry generating AI response"
                          >
                            🔄 Retry
                          </button>
                        </div>
                      ) : m.content ? (
                        <FormattedMessage text={m.content} />
                      ) : (
                        streaming && i === msgs.length - 1 && (
                          <div className="flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400 font-semibold animate-pulse py-1">
                            <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                            EduLinga is thinking…
                          </div>
                        )
                      )}

                      {/* Real-time Streaming Typing Cursor */}
                      {streaming && i === msgs.length - 1 && (
                        <span className="inline-block w-2 h-4 bg-teal-500 ml-1 animate-pulse" />
                      )}

                      {/* SECTION 4: ACTIONS UNDER EACH ANSWER (Icon Row like ChatGPT) */}
                      {m.content && !streaming && (
                        <div className="pt-2 space-y-2">
                          <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 text-xs border-t border-slate-100 dark:border-slate-800/80 pt-2">
                            {/* 📋 Copy Icon */}
                            <button
                              onClick={() => handleCopy(i, m.content)}
                              title="Copy response"
                              className="hover:text-slate-700 dark:hover:text-slate-200 transition flex items-center gap-1 font-medium"
                            >
                              {copiedIdx === i ? <span className="text-teal-500 font-bold">✓ Copied</span> : <span>📋 Copy</span>}
                            </button>

                            {/* 👍 Thumbs Up Icon */}
                            <button
                              onClick={() => logFeedback(i, "thumbs_up", msgs[i - 1]?.content, m.content)}
                              title="Good response"
                              className={`hover:text-teal-600 transition flex items-center gap-1 font-medium ${
                                feedbackState[i] === "thumbs_up" ? "text-teal-600 font-bold" : ""
                              }`}
                            >
                              👍
                            </button>

                            {/* 👎 Thumbs Down Icon */}
                            <button
                              onClick={() => logFeedback(i, "thumbs_down", msgs[i - 1]?.content, m.content)}
                              title="Bad response"
                              className={`hover:text-red-500 transition flex items-center gap-1 font-medium ${
                                feedbackState[i] === "thumbs_down" ? "text-red-500 font-bold" : ""
                              }`}
                            >
                              👎
                            </button>

                            {/* 🔄 Regenerate Icon */}
                            <button
                              onClick={() => handleRegenerate(i)}
                              title="Regenerate answer"
                              className="hover:text-teal-600 transition flex items-center gap-1 font-medium"
                            >
                              🔄 Regenerate
                            </button>

                            {/* 🔊 / ⏸️ Listen/Pause Audio Button */}
                            <button
                              onClick={() => handleAudioToggle(i, m.content, m.language || language)}
                              title={speakingIdx === i ? "Pause audio" : "Listen aloud"}
                              className={`transition flex items-center gap-1 font-medium ${
                                speakingIdx === i ? "text-teal-500 font-bold animate-pulse" : "hover:text-teal-600"
                              }`}
                            >
                              {speakingIdx === i ? "⏸️ Pause" : `🔊 Listen`}
                            </button>

                          </div>

                          {speechMessage && <p className="text-xs text-amber-600 dark:text-amber-400">{speechMessage}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Floating "Scroll to Bottom" Button */}
        {userScrolledUp && (
          <button
            onClick={() => {
              setUserScrolledUp(false);
              scrollToBottom();
            }}
            className="absolute bottom-24 right-8 p-3 rounded-full bg-slate-900 dark:bg-slate-800 text-white shadow-xl border border-slate-700 hover:scale-105 transition text-xs font-bold flex items-center gap-1 z-20"
          >
            ↓ Scroll to bottom
          </button>
        )}

        {/* SECTION 5: COMPOSER (Bottom Input Fixed Column) */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80">
          <div className="max-w-3xl mx-auto space-y-2">
            {streaming && (
              <div className="flex justify-center">
                <button
                  onClick={stopStreaming}
                  className="px-4 py-1.5 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-sm border border-slate-300 dark:border-slate-700"
                >
                  ⏹️ Stop generating
                </button>
              </div>
            )}

            {/* File Attachment Badge Chip */}
            {attachedFile && (
              <div className="flex items-center justify-between px-3 py-1.5 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-semibold text-teal-700 dark:text-teal-300 animate-fadeIn">
                <span className="flex items-center gap-1.5">
                  📎 <span className="truncate max-w-[220px]">{attachedFile.filename}</span> ({Math.round(attachedFile.size / 1024)} KB)
                </span>
                <button
                  onClick={() => setAttachedFile(null)}
                  className="hover:text-red-500 font-bold px-1"
                  title="Remove attachment"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Large Rounded Pill Input Container */}
            <div className="flex items-end gap-2 rounded-[24px] bg-slate-100 dark:bg-slate-800/90 p-2.5 border border-slate-200 dark:border-slate-700/80 shadow-md focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
              {/* Hidden File Upload Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".txt,text/plain"
                className="hidden"
              />

              {/* Left: Attach Button 📎 */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-teal-600 transition shrink-0"
                title="Attach a .txt document"
              >
                {uploadingFile ? (
                  <span className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin inline-block" />
                ) : (
                  <span className="text-base">📎</span>
                )}
              </button>

              {/* Center: Auto-growing Textarea (up to ~6 lines height) */}
              <textarea
                ref={textareaRef}
                rows={1}
                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none py-1.5 px-1 max-h-[140px] overflow-y-auto leading-relaxed font-sans"
                placeholder={CHAT_COPY[language]?.placeholder || CHAT_COPY.English.placeholder}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />

              {/* Right: Mic Button 🎤 (Pulsing while recording) */}
              <button
                onClick={() => toggleListen(text)}
                className={`p-2 rounded-full transition shrink-0 ${
                  listening
                    ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
                title={listening ? "Recording... click to stop" : "Speech to Text"}
              >
                🎤
              </button>

              {/* Right: Round Send Button ⬆️ */}
              <button
                onClick={() => send()}
                disabled={(!text.trim() && !attachedFile) || streaming}
                className="w-9 h-9 rounded-full bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center font-bold transition disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-teal-600/20 shrink-0"
                title="Send Message"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            </div>

            {(chatError || speechError) && (
              <p role="alert" className="text-xs text-center text-red-600 dark:text-red-400">
                {chatError || speechError}
              </p>
            )}

            {/* Muted Footer Disclaimer Note */}
            <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 font-medium pt-0.5">
              EduLinga can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// 2. ESSAY EVALUATOR COMPONENT
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

function Essay({ onXPUpdate }) {
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
    setBusy(true);
    setRes(null);
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
            <p className="text-xs text-slate-500 dark:text-slate-400">Type, speak, or upload handwritten essay photos for AI evaluation.</p>
          </div>
          <button
            onClick={() => toggleListen(content)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              listening ? "bg-red-500 text-white animate-pulse" : "bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
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
            {ocrBusy && <div className="text-[11px] text-teal-600 font-semibold animate-pulse">Processing image OCR...</div>}
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
                <div className="text-4xl font-black">{res.overall}<span className="text-lg font-normal opacity-80">/100</span></div>
              </div>
              <div className="text-right">
                <span className="text-xs uppercase font-bold tracking-wider opacity-80">Detected Language</span>
                <div className="text-base font-semibold">{res.language || "English"}</div>
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Detailed Metrics</h3>
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

// 3. AI QUIZ GENERATOR COMPONENT
function Quiz({ onXPUpdate, addToast }) {
  const [customTopic, setCustomTopic] = useState("");
  const [difficulty, setDiff] = useState("Intermediate");
  const [language, setLang] = useState("Telugu");
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

  const generate = async (overrideTopic = null) => {
    const activeTopic = overrideTopic !== null ? overrideTopic : (customTopic.trim() || "General Knowledge");
    setLoading(true);
    setSubmitted(false);
    setSelectedAnswers({});
    setError("");
    try {
      const data = await api("/api/quiz", {
        method: "POST",
        body: { topic: activeTopic, difficulty, language }
      });
      setQuiz(data);
      if (addToast) addToast(`Quiz generated for "${activeTopic}"!`, "success");
    } catch (e) {
      setError(`Quiz generation failed. ${e.message}`);
      if (addToast) addToast(`Quiz generation failed: ${e.message}`, "error");
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
      if (onXPUpdate) onXPUpdate();
      if (addToast) addToast("Quiz submitted! Score saved & XP awarded.", "success");
    } catch (e) {
      setError(`Your quiz score could not be saved. ${e.message}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/80 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">AI Multilingual Quiz Generator</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Pick popular academic topics or type any custom concept to solve problems.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Sel label="Difficulty" value={difficulty} set={setDiff} items={["Beginner", "Intermediate", "Advanced"]} />
            <Sel label="Quiz Language" value={language} set={setLang} items={LANGS} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          <input
            type="text"
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            placeholder="Type any custom topic..."
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate()}
          />
          <Btn onClick={() => generate()} disabled={loading}>
            {loading ? "Generating Quiz..." : "⚡ Generate Quiz"}
          </Btn>
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-600">{error}</p>}

      {!quiz && (
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
                className={`p-4 rounded-2xl bg-white dark:bg-slate-800 border transition text-left space-y-2 group active:scale-95 flex flex-col justify-between ${
                  isCurrentTopic
                    ? "border-teal-500 ring-2 ring-teal-500/20 shadow-md shadow-teal-500/10"
                    : "border-slate-200/80 dark:border-slate-700/80 hover:border-teal-400"
                } ${loading ? "opacity-75 cursor-wait" : ""}`}
              >
                <div>
                  <div className="text-2xl mb-1 flex items-center justify-between">
                    <span>{t.icon}</span>
                    {loading && isCurrentTopic && (
                      <span className="text-[10px] text-teal-600 font-bold animate-pulse">Loading...</span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-teal-600 transition">{t.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{t.desc}</p>
                </div>
                <div className="pt-2 text-[11px] font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  <span>Start Practice Problems</span>
                  <span>→</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {quiz && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800 text-white shadow-md">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">Active Practice Quiz</span>
              <h3 className="text-lg font-bold">{quiz.title}</h3>
            </div>
            <button
              onClick={() => {
                setQuiz(null);
                setSubmitted(false);
                setSelectedAnswers({});
              }}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold transition"
            >
              ← Change Topic
            </button>
          </div>

          {quiz.questions.map((q, qIdx) => (
            <div key={q.id} className="rounded-2xl bg-white dark:bg-slate-800 p-6 border border-slate-200/80 dark:border-slate-700/80 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                  Question {qIdx + 1} of {quiz.questions.length}
                </span>
                {submitted && (
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    selectedAnswers[q.id] === q.answerIndex
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                  }`}>
                    {selectedAnswers[q.id] === q.answerIndex ? "✓ Correct" : "✕ Incorrect"}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-white leading-relaxed">{q.question}</h4>
              <div className="grid gap-2 sm:grid-cols-2 pt-1">
                {q.options.map((opt, optIdx) => (
                  <button
                    key={optIdx}
                    onClick={() => handleSelect(q.id, optIdx)}
                    disabled={submitted}
                    className={`p-3 rounded-xl border text-left text-xs transition ${
                      submitted && q.answerIndex === optIdx
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold ring-1 ring-emerald-500/30"
                        : submitted && selectedAnswers[q.id] === optIdx
                        ? "border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200"
                        : selectedAnswers[q.id] === optIdx
                        ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40 font-bold text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
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
                <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-teal-600 dark:text-teal-400 block mb-0.5">💡 Explanation & Solution:</span>
                  {q.explanation}
                </div>
              )}
            </div>
          ))}

          {submitted ? (
            <div className="rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 p-6 text-center text-white space-y-2 shadow-lg shadow-teal-500/20">
              <span className="text-xs uppercase font-bold tracking-wider opacity-90">Quiz Completed</span>
              <div className="text-3xl font-black">
                Score: {quiz.questions.filter((q) => selectedAnswers[q.id] === q.answerIndex).length} / {quiz.questions.length}
              </div>
              <p className="text-xs opacity-90">Great job practicing problem solving in {language}!</p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setQuiz(null);
                    setSubmitted(false);
                    setSelectedAnswers({});
                  }}
                  className="px-4 py-2 rounded-xl bg-white text-teal-800 text-xs font-bold hover:bg-slate-100 transition shadow-sm"
                >
                  Solve More Problems / Try Another Topic
                </button>
              </div>
            </div>
          ) : (
            <Btn onClick={submitQuiz} className="w-full py-3 text-sm">Submit Quiz Answers</Btn>
          )}
        </div>
      )}
    </div>
  );
}

// 4. TRANSLATOR COMPONENT
function Translator({ addToast }) {
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
    const content = `EduLinga AI — Academic Translation Document
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
    a.download = `EduLinga_Translation_${sourceLang}_to_${targetLang}.txt`;
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

      {/* Key Academic Vocabulary & Terminology Breakdown (Full Width) */}
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
            {vocabulary.map((item, index) => {
              const isSaved = savedCards[item.word];
              const isSpeakingThis = speakingWord === item.word;
              return (
                <div
                  key={`${item.word}-${index}`}
                  className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-4 border border-slate-100 dark:border-slate-700/80 space-y-2 flex flex-col justify-between hover:border-teal-300 transition"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {item.word}
                      </h4>
                      <button
                        onClick={() => handleSpeakWord(item.translation || item.word, targetLang)}
                        className={`p-1 rounded-lg text-xs transition ${
                          isSpeakingThis ? "bg-teal-500 text-white" : "hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
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
            })}
          </div>
        </section>
      )}

      {/* Quick Academic Preset Exploration Cards */}
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

// 5. FLASHCARDS COMPONENT (Interactive SM-2 Spaced Repetition)
function Flashcards({ onXPUpdate, addToast }) {
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
      { term: "Photosynthesis", definition: "Process by which green plants use sunlight to synthesize nutrients from CO2 and water.", subject: "Biology" },
      { term: "Machine Learning", definition: "A branch of AI focusing on the use of data and algorithms to imitate the way humans learn.", subject: "Computer Science" },
      { term: "Coherence", definition: "The logical connections and clarity of thought that make a text easy to understand.", subject: "English Grammar" }
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

      {/* Study Practice Mode Modal/Banner */}
      {studyMode && cards.length > 0 && (
        <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white p-8 rounded-3xl border border-teal-500/30 shadow-2xl space-y-6 text-center animate-fadeIn">
          <div className="flex items-center justify-between text-xs text-teal-300 font-bold">
            <span>CARD {studyIndex + 1} OF {cards.length}</span>
            <span className="bg-teal-900/60 px-2.5 py-1 rounded-full border border-teal-500/30">
              {cards[studyIndex]?.subject || "Vocabulary"}
            </span>
          </div>

          <div className="min-h-[140px] flex flex-col items-center justify-center p-6 bg-slate-800/80 rounded-2xl border border-slate-700 shadow-inner">
            <h3 className="text-2xl font-black text-white mb-2">{cards[studyIndex]?.term}</h3>
            {studyRevealed ? (
              <p className="text-sm text-teal-200 mt-3 leading-relaxed max-w-lg animate-fadeIn font-medium">
                {cards[studyIndex]?.definition}
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
      )}

      {/* Card Creation Form & Search */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 rounded-3xl bg-white dark:bg-slate-800 p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
            + New Flashcard
          </h3>
          <form onSubmit={addCard} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Concept / Term</label>
              <Field
                placeholder="e.g., Photosynthesis"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Subject / Domain</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                <option value="Academic Vocabulary">Academic Vocabulary</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Definition & Details</label>
              <textarea
                rows={4}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500/20"
                placeholder="Clear explanation, real-world example, or memory hook..."
                value={def}
                onChange={(e) => setDef(e.target.value)}
                required
              />
            </div>
            <Btn type="submit" className="w-full">Save Flashcard</Btn>
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
              <p className="text-[11px] text-slate-500">Create one using the form on the left or save words from the Translator!</p>
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
                          <span className="text-[10px] font-bold text-teal-500 uppercase">Definition:</span>
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

// 6. PROGRESS DASHBOARD COMPONENT (Interactive Analytics & Performance Trends)
function Progress({ userProfile, setTab }) {
  const [d, setD] = useState(null);
  const [essays, setEssays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api("/dashboard").catch(() => null),
      api("/essays").catch(() => [])
    ]).then(([dashData, essayList]) => {
      if (dashData) setD(dashData);
      if (Array.isArray(essayList)) setEssays(essayList);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="p-16 text-center text-slate-400 text-xs">Loading Analytics Dashboard...</div>;
  }

  const trendData = (d?.trend && d.trend.length > 0)
    ? d.trend
    : (essays.slice(0, 8).reverse().map((e, idx) => ({
        title: e.title?.substring(0, 10) || `Essay #${idx + 1}`,
        score: e.score || 75,
        grammar: e.feedback?.grammar || 78,
        vocabulary: e.feedback?.vocabulary || 76,
        coherence: e.feedback?.coherence || 77,
        structure: e.feedback?.structure || 79
      })));

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-800 text-white p-6 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-200">Student Learning Metrics</span>
          <h2 className="text-2xl font-black tracking-tight mt-0.5">Evaluation & Progress Dashboard</h2>
          <p className="text-xs text-teal-100 mt-1 max-w-lg">
            Real-time tracking of AI tutor interactions, multilingual essay evaluations, and academic mastery.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15">
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold text-teal-200 block">Level</span>
            <span className="text-2xl font-black">{userProfile?.level || 1}</span>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold text-teal-200 block">Total XP</span>
            <span className="text-2xl font-black">{userProfile?.xp || 120}</span>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold text-teal-200 block">Streak</span>
            <span className="text-2xl font-black">🔥 {userProfile?.streak || 3}d</span>
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Questions Asked", val: d?.questions || 0, icon: "💬", color: "text-teal-600" },
          { label: "Essays Evaluated", val: d?.essays || essays.length, icon: "📄", color: "text-blue-600" },
          { label: "Languages Practiced", val: d?.languages || 1, icon: "🌐", color: "text-purple-600" },
          { label: "Average Score", val: `${d?.avg_score || 82}%`, icon: "🏆", color: "text-amber-500" }
        ].map((k) => (
          <div key={k.label} className="rounded-3xl bg-white dark:bg-slate-800 p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">{k.val}</div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">{k.label}</div>
            </div>
            <div className={`text-3xl p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 ${k.color}`}>{k.icon}</div>
          </div>
        ))}
      </div>

      {/* Recharts Visual Trend Chart */}
      <div className="rounded-3xl bg-white dark:bg-slate-800 p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>📈</span> Performance & Score Progression
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Score trends across grammar, vocabulary, coherence, and overall grade.
            </p>
          </div>
          <div className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-3 py-1 rounded-xl border border-teal-200 dark:border-teal-800">
            Target: 90%+ Mastery
          </div>
        </div>

        {trendData.length > 0 ? (
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="title" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[50, 100]} stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                    color: "#f8fafc",
                    fontSize: "12px"
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Line type="monotone" dataKey="score" name="Overall" stroke="#0f9d8a" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="grammar" name="Grammar" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="vocabulary" name="Vocabulary" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="coherence" name="Coherence" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="structure" name="Structure" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs border border-dashed rounded-2xl">
            Evaluate your first essay to see score progression curves!
          </div>
        )}
      </div>

      {/* Recent Essay Submissions History */}
      <div className="rounded-3xl bg-white dark:bg-slate-800 p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>📑</span> Recent Essay Evaluations
          </h3>
          {setTab && (
            <button
              onClick={() => setTab("essay")}
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
            >
              + Submit New Essay
            </button>
          )}
        </div>

        {essays.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Language</th>
                  <th className="py-3 px-4">Grammar / Vocab</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {essays.map((e) => {
                  const score = e.score || 75;
                  const scoreColor = score >= 85 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : score >= 70 ? "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
                  return (
                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white max-w-[200px] truncate">
                        {e.title}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${scoreColor}`}>
                          {score}/100
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium">{e.language || "English"}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {e.feedback?.grammar || 80}% / {e.feedback?.vocabulary || 78}%
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(e.created_at || Date.now()).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            No essays evaluated yet. Head to the Essay section to submit your first text or handwritten essay!
          </div>
        )}
      </div>
    </div>
  );
}

// Toast Notification Component
function ToastContainer({ toasts, removeToast }) {
  if (!toasts || !toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-2xl shadow-xl border text-xs font-semibold animate-toast transition-all ${
            t.type === "error"
              ? "bg-slate-900 text-red-400 border-red-800/80 shadow-red-950/30"
              : t.type === "success"
              ? "bg-slate-900 text-teal-300 border-teal-800/80 shadow-teal-950/30"
              : "bg-slate-900 text-slate-200 border-slate-700 shadow-slate-950/30"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">{t.type === "error" ? "🚨" : t.type === "success" ? "✓" : "ℹ️"}</span>
            <span>{t.message}</span>
          </div>
          <button
            onClick={() => removeToast(t.id)}
            className="hover:opacity-75 font-bold px-1.5 text-slate-400 text-sm"
            aria-label="Close toast notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// MAIN APPLICATION LAYOUT (ChatGPT Style Layout with Collapsible Sidebar & Minimal Topbar)
export default function App() {
  const [authed, setAuthed] = useState(!!tk());
  const [tab, setTab] = useState("tutor");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [difficulty, setDiff] = useState("Intermediate");
  const [language, setLang] = useState("Telugu");

  // System Preference Theme Listener + LocalStorage Persistence
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved !== null) return saved === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

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

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Listen to system color scheme changes if not explicitly overridden
  useEffect(() => {
    if (!window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      if (!localStorage.getItem("theme")) {
        setDarkMode(e.matches);
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  if (!authed) return <Auth onAuth={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Minimal Top Bar (ChatGPT Style Header) */}
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

          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setTab("tutor")} aria-label="EduLinga AI Home">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <IconSparkles />
            </div>
            <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">EduLinga AI</span>
          </div>

          {/* ChatGPT-style Pill Selectors for Difficulty & Answer Language */}
          {tab === "tutor" && (
            <div className="flex items-center gap-2 ml-4">
              <Sel label="Difficulty" value={difficulty} set={setDiff} items={["Beginner", "Intermediate", "Advanced"]} />
              <Sel label="Language" value={language} set={setLang} items={LANGS} />
            </div>
          )}
        </div>

        {/* Right Nav Tabs & Sign Out */}
        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/60 dark:border-slate-700 overflow-x-auto max-w-[calc(100vw-220px)] sm:max-w-none">
            <button
              onClick={() => setTab("tutor")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${tab === "tutor" ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm" : "text-slate-600 dark:text-slate-300 hover:text-teal-600"}`}
              aria-label="AI Tutor Mode"
            >
              🤖 AI Tutor
            </button>
            <button
              onClick={() => setTab("essay")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${tab === "essay" ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm" : "text-slate-600 dark:text-slate-300 hover:text-teal-600"}`}
              aria-label="Essay Evaluation Mode"
            >
              📄 Essay Feedback
            </button>
            <button
              onClick={() => setTab("quiz")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${tab === "quiz" ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm" : "text-slate-600 dark:text-slate-300 hover:text-teal-600"}`}
              aria-label="Interactive Quizzes Mode"
            >
              🏆 Quizzes
            </button>
            <button
              onClick={() => setTab("translate")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${tab === "translate" ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm" : "text-slate-600 dark:text-slate-300 hover:text-teal-600"}`}
              aria-label="Translator Mode"
            >
              🌐 Translator
            </button>
            <button
              onClick={() => setTab("cards")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${tab === "cards" ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm" : "text-slate-600 dark:text-slate-300 hover:text-teal-600"}`}
              aria-label="Flashcards Mode"
            >
              🗂️ Flashcards
            </button>
            <button
              onClick={() => setTab("progress")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${tab === "progress" ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm" : "text-slate-600 dark:text-slate-300 hover:text-teal-600"}`}
              aria-label="Progress & Analytics Mode"
            >
              📊 Analytics
            </button>
          </nav>

          <button
            onClick={signOut}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition whitespace-nowrap"
            aria-label="Sign out of EduLinga AI account"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {tab === "tutor" ? (
          <ChatGPTTutor
            difficulty={difficulty}
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
        ) : tab === "essay" ? (
          <Essay onXPUpdate={loadProfile} addToast={addToast} />
        ) : tab === "quiz" ? (
          <Quiz onXPUpdate={loadProfile} addToast={addToast} />
        ) : tab === "translate" ? (
          <Translator addToast={addToast} />
        ) : tab === "cards" ? (
          <Flashcards onXPUpdate={loadProfile} addToast={addToast} />
        ) : (
          <Progress userProfile={userProfile} setTab={setTab} />
        )}
      </div>
    </div>
  );
}
