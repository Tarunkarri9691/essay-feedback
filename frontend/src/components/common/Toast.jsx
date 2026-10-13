import React from "react";

export function ToastContainer({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

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

export default ToastContainer;
