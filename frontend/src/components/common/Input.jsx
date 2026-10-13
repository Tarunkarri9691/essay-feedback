import React from "react";

export function Field(p) {
  return (
    <input
      {...p}
      className={`w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition ${p.className || ''}`}
    />
  );
}

export function Sel({ value, set, items, label, className = "" }) {
  return (
    <div>
      {label && <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">{label}</label>}
      <select
        value={value}
        onChange={(e) => set(e.target.value)}
        className={`w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition ${className}`}
      >
        {items.map((it) => (
          <option key={it} value={it}>{it}</option>
        ))}
      </select>
    </div>
  );
}
