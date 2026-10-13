import React, { useState, useEffect } from "react";
import { api } from "../../api/client.js";
import { TrendChart } from "./TrendChart.jsx";

export function Progress({ userProfile, setTab }) {
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

  const trendData =
    d?.trend && d.trend.length > 0
      ? d.trend
      : essays
          .slice(0, 8)
          .reverse()
          .map((e, idx) => ({
            title: e.title?.substring(0, 10) || `Essay #${idx + 1}`,
            score: e.score || 75,
            grammar: e.feedback?.grammar || 78,
            vocabulary: e.feedback?.vocabulary || 76,
            coherence: e.feedback?.coherence || 77,
            structure: e.feedback?.structure || 79
          }));

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-800 text-white p-6 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-200">
            Student Learning Metrics
          </span>
          <h2 className="text-2xl font-black tracking-tight mt-0.5">
            Evaluation &amp; Progress Dashboard
          </h2>
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
          <div
            key={k.label}
            className="rounded-3xl bg-white dark:bg-slate-800 p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-between"
          >
            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">{k.val}</div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">{k.label}</div>
            </div>
            <div className={`text-3xl p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 ${k.color}`}>
              {k.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Recharts Visual Trend Chart */}
      <div className="rounded-3xl bg-white dark:bg-slate-800 p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>📈</span> Performance &amp; Score Progression
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Score trends across grammar, vocabulary, coherence, and overall grade.
            </p>
          </div>
          <div className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-3 py-1 rounded-xl border border-teal-200 dark:border-teal-800">
            Target: 90%+ Mastery
          </div>
        </div>

        <TrendChart data={trendData} />
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
                  const scoreColor =
                    score >= 85
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : score >= 70
                      ? "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
                  return (
                    <tr
                      key={e.id || e._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition"
                    >
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

export default Progress;
