import React, { useState, useEffect, useRef } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose"
});

export function MermaidDiagram({ chart }) {
  const [svg, setSvg] = useState("");
  const idRef = useRef("mermaid_" + Math.random().toString(36).substring(2, 9));

  useEffect(() => {
    if (!chart) return;
    try {
      mermaid
        .render(idRef.current, chart.trim())
        .then(({ svg }) => {
          setSvg(svg);
        })
        .catch((err) => {
          console.warn("Mermaid render error:", err);
        });
    } catch (e) {
      console.warn("Mermaid exception:", e);
    }
  }, [chart]);

  if (!svg) {
    return (
      <div className="my-3 p-4 rounded-xl bg-slate-900 text-teal-300 font-mono text-xs overflow-x-auto border border-teal-500/30">
        <div className="text-[10px] text-teal-400 font-bold mb-1 uppercase tracking-wider">
          📊 Visual Flowchart Diagram
        </div>
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

export default MermaidDiagram;
