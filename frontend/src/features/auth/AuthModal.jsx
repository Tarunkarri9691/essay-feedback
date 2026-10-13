import React, { useState } from "react";
import { api } from "../../api/client.js";
import { LANGS } from "../../constants/languages.js";
import { Btn } from "../../components/common/Button.jsx";
import { Field } from "../../components/common/Input.jsx";
import { IconSparkles } from "../../components/common/Icons.jsx";

export function AuthModal({ onAuth }) {
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
          <h1 className="text-3xl font-black tracking-tight text-slate-900">StudyMate AI</h1>
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
            {loading ? "Processing..." : mode === "login" ? "Sign In to StudyMate" : "Create Free Account"}
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

export default AuthModal;
