import React, { useState } from "react";

export function CodeBlock({ code, language = "javascript" }) {
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

export default CodeBlock;
