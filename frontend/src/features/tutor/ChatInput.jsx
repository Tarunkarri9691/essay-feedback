import React, { useRef } from "react";
import { Sel } from "../../components/common/Input.jsx";
import { LANGS, CHAT_COPY } from "../../constants/languages.js";

export function ChatInput({
  text,
  setText,
  send,
  streaming,
  stopStreaming,
  difficulty,
  setDifficulty,
  language,
  setLanguage,
  listening,
  toggleListen,
  speechError,
  chatError,
  attachedFile,
  setAttachedFile,
  handleFileUpload,
  uploadingFile
}) {
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  return (
    <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80">
      <div className="max-w-3xl mx-auto space-y-2">
        {streaming && (
          <div className="flex justify-center">
            <button
              onClick={stopStreaming}
              className="px-4 py-1.5 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-sm border border-slate-300 dark:border-slate-700"
            >
              ⏹️ Stop generating
            </button>
          </div>
        )}

        {/* File Attachment Badge Chip */}
        {attachedFile && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-semibold text-teal-700 dark:text-teal-300 animate-fadeIn">
            <span className="flex items-center gap-1.5">
              📎 <span className="truncate max-w-[220px]">{attachedFile.filename}</span> (
              {Math.round(attachedFile.size / 1024)} KB)
            </span>
            <button
              onClick={() => setAttachedFile(null)}
              className="hover:text-red-500 font-bold px-1"
              title="Remove attachment"
            >
              ✕
            </button>
          </div>
        )}

        {/* Large Rounded Pill Input Container */}
        <div className="rounded-[24px] bg-slate-100 dark:bg-slate-800/90 p-3 border border-slate-200 dark:border-slate-700/80 shadow-md focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
          {/* Preferences Toolbar directly inside the Chat Box */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 dark:border-slate-700/60 px-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Sel label="Difficulty" value={difficulty} set={setDifficulty} items={["Beginner", "Intermediate", "Advanced"]} />
              <Sel label="Language" value={language} set={setLanguage} items={LANGS} />
            </div>
            <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 hidden sm:flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              <span>
                {language} • {difficulty}
              </span>
            </div>
          </div>

          {/* Main Input & Action Buttons Row */}
          <div className="flex items-end gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,text/plain"
              className="hidden"
            />

            {/* Left: Attach Button 📎 */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-teal-600 transition shrink-0"
              title="Attach a .txt document"
            >
              {uploadingFile ? (
                <span className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin inline-block" />
              ) : (
                <span className="text-base">📎</span>
              )}
            </button>

            {/* Center: Auto-growing Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none py-1.5 px-1 max-h-[140px] overflow-y-auto leading-relaxed font-sans"
              placeholder={CHAT_COPY[language]?.placeholder || CHAT_COPY.English.placeholder}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />

            {/* Right: Mic Button 🎤 */}
            <button
              onClick={() => toggleListen(text)}
              className={`p-2 rounded-full transition shrink-0 ${
                listening
                  ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
              title={listening ? "Recording... click to stop" : "Speech to Text"}
            >
              🎤
            </button>

            {/* Right: Round Send Button ⬆️ */}
            <button
              onClick={() => send()}
              disabled={(!text.trim() && !attachedFile) || streaming}
              className="w-9 h-9 rounded-full bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center font-bold transition disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-teal-600/20 shrink-0"
              title="Send Message"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>
        </div>

        {(chatError || speechError) && (
          <p role="alert" className="text-xs text-center text-red-600 dark:text-red-400">
            {chatError || speechError}
          </p>
        )}
      </div>
    </div>
  );
}

export default ChatInput;
