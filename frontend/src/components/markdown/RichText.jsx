import React from "react";

export function RichText({ text }) {
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

export default RichText;
