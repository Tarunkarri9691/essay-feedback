import React from "react";
import CodeBlock from "./CodeBlock.jsx";
import MermaidDiagram from "./MermaidDiagram.jsx";
import RichText from "./RichText.jsx";

export function FormattedMessage({ text }) {
  if (!text) return null;

  // Strip <reasoning> tags for main answer view
  const mainText = text
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "")
    .replace(/<answer>/gi, "")
    .replace(/<\/answer>/gi, "")
    .trim();

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

export default FormattedMessage;
