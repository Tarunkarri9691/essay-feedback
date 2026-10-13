import React from "react";

export function Btn({ children, variant = "primary", className = "", ...p }) {
  const v = {
    primary: "bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-600/20",
    secondary: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700",
    danger: "bg-red-500 hover:bg-red-600 text-white",
    outline: "border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
  };
  return (
    <button
      {...p}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${v[variant] || v.primary} ${className}`}
    >
      {children}
    </button>
  );
}

export default Btn;
