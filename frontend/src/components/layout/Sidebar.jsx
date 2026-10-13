import React from "react";

export function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  hist,
  cid,
  openConv,
  deleteConv,
  editingCid,
  setEditingCid,
  editTitle,
  setEditTitle,
  saveRename,
  startNewChat,
  setTab,
  userProfile,
  darkMode,
  setDarkMode,
  groupedHist
}) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-[260px] bg-slate-950 text-slate-200 flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Top Sidebar Header */}
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
        <button
          onClick={startNewChat}
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
                    cid === h.id
                      ? "bg-slate-800 text-white font-semibold"
                      : "text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  {editingCid === h.id ? (
                    <div
                      className="flex items-center gap-1 w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-teal-500 rounded px-1.5 py-0.5 text-xs text-white outline-none"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveRename(h.id, e)}
                        autoFocus
                      />
                      <button
                        onClick={(e) => saveRename(h.id, e)}
                        className="text-teal-400 font-bold px-1"
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="truncate pr-12">{h.title}</span>
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
  );
}

export default Sidebar;
