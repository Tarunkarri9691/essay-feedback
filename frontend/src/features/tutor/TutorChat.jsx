import React, { useState, useEffect, useRef } from "react";
import { api } from "../../api/client.js";
import { useSpeechInput } from "../../hooks/useSpeechInput.js";
import { speakText } from "../../hooks/useTextToSpeech.js";
import { FormattedMessage } from "../../components/markdown/FormattedMessage.jsx";
import { IconSparkles, IconBot } from "../../components/common/Icons.jsx";
import { CHAT_COPY } from "../../constants/languages.js";
import { QUICK_PROMPTS_BY_LANG } from "../../constants/prompts.js";
import { groupHistoryByDate } from "../../utils/dateUtils.js";
import Sidebar from "../../components/layout/Sidebar.jsx";
import ChatInput from "./ChatInput.jsx";

export function TutorChat({
  difficulty,
  setDifficulty,
  language,
  setLanguage,
  onXPUpdate,
  sidebarOpen,
  setSidebarOpen,
  setTab,
  userProfile,
  darkMode,
  setDarkMode
}) {
  const [msgs, setMsgs] = useState([]);
  const [cid, setCid] = useState(null);
  const [hist, setHist] = useState([]);
  const [text, setText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [editingCid, setEditingCid] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  const [copiedIdx, setCopiedIdx] = useState(null);
  const [feedbackState, setFeedbackState] = useState({});
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [editingUserIdx, setEditingUserIdx] = useState(null);
  const [editUserText, setEditUserText] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [chatError, setChatError] = useState("");
  const [speechMessage, setSpeechMessage] = useState("");

  const scrollRef = useRef(null);
  const requestRef = useRef(null);

  const { listening, speechError, toggleListen } = useSpeechInput(language, setText);

  const loadHist = () => api("/tutor/conversations").then(setHist).catch(() => {});

  useEffect(() => {
    loadHist();
  }, []);

  const scrollToBottom = (smooth = true) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto"
      });
    }
  };

  useEffect(() => {
    if (!userScrolledUp) scrollToBottom();
  }, [msgs, streaming]);

  const startNewChat = () => {
    stopStreaming();
    setCid(null);
    setMsgs([]);
    setText("");
    setAttachedFile(null);
    setChatError("");
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        startNewChat();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      requestRef.current?.abort();
    };
  }, []);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 80;
    setUserScrolledUp(!isAtBottom);
  };

  const stopStreaming = () => {
    requestRef.current?.abort();
    requestRef.current = null;
    setStreaming(false);
  };

  const handleCopy = (idx, content) => {
    if (!navigator.clipboard?.writeText) {
      setChatError("Clipboard access is not available in this browser.");
      return;
    }
    navigator.clipboard
      .writeText(content)
      .then(() => {
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);
      })
      .catch(() => setChatError("Could not copy the response. Check clipboard permissions and try again."));
  };

  const logFeedback = (idx, type, userMsg, assistantMsg) => {
    setFeedbackState((prev) => ({ ...prev, [idx]: type }));
    api("/tutor/feedback", {
      method: "POST",
      body: {
        conversation_id: cid,
        message_index: idx,
        feedback_type: type,
        user_message: userMsg || "",
        assistant_message: assistantMsg || ""
      }
    }).catch((err) => setChatError(`Could not save feedback. ${err.message}`));
  };

  const handleRegenerate = (idx) => {
    const userPrompt = msgs[idx - 1]?.content || msgs[msgs.length - 2]?.content;
    if (!userPrompt) return;
    logFeedback(idx, "regenerate", userPrompt, msgs[idx]?.content);

    setMsgs((prev) => prev.slice(0, idx - 1));
    send(userPrompt, { history: msgs.slice(0, idx - 1) });
  };

  const handleAudioToggle = (idx, content, messageLanguage = language) => {
    setSpeechMessage("");
    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
    } else {
      setSpeakingIdx(idx);
      const result = speakText(content, messageLanguage, () => setSpeakingIdx(null));
      if (!result.ok) {
        setSpeakingIdx(null);
        setSpeechMessage(result.message);
      }
    }
  };

  const handleSaveUserEdit = (idx) => {
    if (!editUserText.trim()) return;
    const newPrompt = editUserText.trim();
    setEditingUserIdx(null);
    setEditUserText("");
    setMsgs((prev) => prev.slice(0, idx));
    send(newPrompt, { history: msgs.slice(0, idx) });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setChatError("");
    if (!file.name.toLowerCase().endsWith(".txt")) {
      setChatError("Please attach a .txt file. PDF text extraction is not available here.");
      e.target.value = "";
      return;
    }
    if (file.size > 64 * 1024) {
      setChatError("Please attach a text file smaller than 64 KB.");
      e.target.value = "";
      return;
    }
    setUploadingFile(true);
    file
      .text()
      .then((contents) => setAttachedFile({ filename: file.name, text: contents, size: file.size }))
      .catch(() => setChatError("Could not read that text file. Please try another file."))
      .finally(() => {
        setUploadingFile(false);
        e.target.value = "";
      });
  };

  const send = async (overrideText = null, options = {}) => {
    let m = overrideText || text;
    if (attachedFile && !overrideText) {
      m = `[Attached Document: ${attachedFile.filename}]\n${attachedFile.text}\n\nStudent Query: ${m}`;
      setAttachedFile(null);
    }

    if (!m.trim() || streaming) return;

    if (!overrideText) {
      setText("");
    }
    setChatError("");
    setUserScrolledUp(false);
    const history = options.history || msgs;
    const controller = new AbortController();
    const requestId = `request_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const responseLanguage = options.language || language;
    requestRef.current = controller;
    setStreaming(true);
    setMsgs((x) => [
      ...x,
      { role: "user", content: m, language: responseLanguage },
      { role: "assistant", content: "", language: responseLanguage, requestId }
    ]);

    try {
      const d = await api("/api/chat", {
        method: "POST",
        signal: controller.signal,
        body: {
          message: m,
          messages: history.slice(-10).map(({ role, content }) => ({ role, content })),
          conversation_id: cid,
          difficulty,
          language: options.language || language,
          subject: options.subject || "General"
        }
      });
      const answer = d.reply || d.answer;
      if (typeof answer !== "string" || !answer.trim()) {
        throw new Error("The server returned an empty reply.");
      }
      setCid(d.conversation_id);
      setMsgs((prev) => {
        return prev.map((item) =>
          item.requestId === requestId
            ? { role: "assistant", content: answer, language: responseLanguage }
            : item
        );
      });
      loadHist();
      if (onXPUpdate) onXPUpdate();
    } catch (e) {
      if (e.name === "AbortError") {
        setMsgs((prev) => prev.filter((item) => item.requestId !== requestId));
        return;
      }
      const message =
        e instanceof TypeError
          ? "I couldn't connect to StudyMate. Please check that the backend is running and try again."
          : `I couldn't get a response right now. ${e.message}`;
      setChatError(message);
      setMsgs((prev) => {
        return prev.map((item) =>
          item.requestId === requestId
            ? { role: "assistant", content: message, language: responseLanguage, isError: true }
            : item
        );
      });
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setStreaming(false);
      }
    }
  };

  const openConv = async (id) => {
    stopStreaming();
    setChatError("");
    try {
      const d = await api("/tutor/conversations/" + id);
      setCid(id);
      setMsgs(d.messages);
      setUserScrolledUp(false);
    } catch (e) {
      setChatError(`Could not load this conversation. ${e.message}`);
    }
  };

  const deleteConv = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;
    try {
      await api("/tutor/conversations/" + id, { method: "DELETE" });
      if (cid === id) {
        setCid(null);
        setMsgs([]);
      }
      loadHist();
    } catch (err) {
      setChatError(`Could not delete this conversation. ${err.message}`);
    }
  };

  const saveRename = async (id, e) => {
    e.stopPropagation();
    if (!editTitle.trim()) return;
    try {
      await api("/tutor/conversations/" + id, {
        method: "PUT",
        body: { title: editTitle }
      });
      setEditingCid(null);
      loadHist();
    } catch (err) {
      setChatError(`Could not rename this conversation. ${err.message}`);
    }
  };

  const groupedHist = groupHistoryByDate(hist);

  return (
    <div className="relative flex h-[calc(100vh-65px)] overflow-hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* LEFT SIDEBAR */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        hist={hist}
        cid={cid}
        openConv={openConv}
        deleteConv={deleteConv}
        editingCid={editingCid}
        setEditingCid={setEditingCid}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        saveRename={saveRename}
        startNewChat={startNewChat}
        setTab={setTab}
        userProfile={userProfile}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        groupedHist={groupedHist}
      />

      {/* Backdrop for Mobile Sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm md:hidden"
        />
      )}

      {/* MAIN CONVERSATION COLUMN */}
      <section className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {!msgs.length && (
              <div className="py-16 text-center space-y-8 animate-fadeIn">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white flex items-center justify-center mx-auto shadow-xl shadow-teal-500/20">
                  <IconSparkles />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {CHAT_COPY[language]?.title || CHAT_COPY.English.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    {CHAT_COPY[language]?.welcome || CHAT_COPY.English.welcome}
                  </p>
                </div>

                {/* 4 Suggestion Cards */}
                <div className="grid gap-3 sm:grid-cols-2 text-left max-w-2xl mx-auto pt-4">
                  {(QUICK_PROMPTS_BY_LANG[language] || QUICK_PROMPTS_BY_LANG.English).map((qp, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        send(qp.text, { language: qp.lang || language, subject: qp.subject });
                      }}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-teal-400 hover:shadow-md transition text-xs font-medium text-slate-800 dark:text-slate-200 group active:scale-95 space-y-1"
                    >
                      <div className="font-bold text-slate-900 dark:text-white group-hover:text-teal-600">
                        💡 {qp.text}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {qp.subject} • {qp.lang || language}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* MESSAGES LIST */}
            {msgs.map((m, i) => (
              <div key={i} className="space-y-2">
                {m.role === "user" ? (
                  <div className="group flex flex-col items-end gap-1">
                    {editingUserIdx === i ? (
                      <div className="w-full max-w-2xl p-3 rounded-2xl bg-slate-800 border border-teal-500 space-y-2">
                        <textarea
                          rows={3}
                          className="w-full bg-transparent text-sm text-white border-none outline-none resize-none"
                          value={editUserText}
                          onChange={(e) => setEditUserText(e.target.value)}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2 text-xs">
                          <button
                            onClick={() => setEditingUserIdx(null)}
                            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveUserEdit(i)}
                            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold shadow-sm"
                          >
                            Save & Submit
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 max-w-[80%]">
                        <button
                          onClick={() => {
                            setEditingUserIdx(i);
                            setEditUserText(m.content);
                          }}
                          title="Edit message"
                          className="opacity-0 group-hover:opacity-100 transition p-1 text-slate-400 hover:text-teal-500 text-xs font-semibold"
                        >
                          ✏️ Edit
                        </button>
                        <div className="rounded-3xl rounded-tr-sm bg-slate-800 dark:bg-slate-700 text-white px-5 py-3.5 text-sm leading-relaxed shadow-sm font-medium">
                          {m.content}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-start gap-4 w-full py-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-500/20 mt-1">
                      <IconBot />
                    </div>
                    <div className="flex-1 space-y-2 overflow-hidden text-sm text-slate-800 dark:text-slate-100">
                      {m.isError ? (
                        <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-medium flex items-center justify-between gap-3 animate-fadeIn my-1">
                          <span className="flex items-center gap-2">
                            <span>⚠️</span>
                            <span>{m.content || "Connection interrupted. Failed to generate AI response."}</span>
                          </span>
                          <button
                            onClick={() => handleRegenerate(i)}
                            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-sm flex items-center gap-1 shrink-0"
                            aria-label="Retry generating AI response"
                          >
                            🔄 Retry
                          </button>
                        </div>
                      ) : m.content ? (
                        <FormattedMessage text={m.content} />
                      ) : (
                        streaming &&
                        i === msgs.length - 1 && (
                          <div className="flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400 font-semibold animate-pulse py-1">
                            <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                            StudyMate is thinking…
                          </div>
                        )
                      )}

                      {streaming && i === msgs.length - 1 && (
                        <span className="inline-block w-2 h-4 bg-teal-500 ml-1 animate-pulse" />
                      )}

                      {/* Action Icons Row */}
                      {m.content && !streaming && (
                        <div className="pt-2 space-y-2">
                          <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 text-xs border-t border-slate-100 dark:border-slate-800/80 pt-2">
                            <button
                              onClick={() => handleCopy(i, m.content)}
                              title="Copy response"
                              className="hover:text-slate-700 dark:hover:text-slate-200 transition flex items-center gap-1 font-medium"
                            >
                              {copiedIdx === i ? (
                                <span className="text-teal-500 font-bold">✓ Copied</span>
                              ) : (
                                <span>📋 Copy</span>
                              )}
                            </button>

                            <button
                              onClick={() => logFeedback(i, "thumbs_up", msgs[i - 1]?.content, m.content)}
                              title="Good response"
                              className={`hover:text-teal-600 transition flex items-center gap-1 font-medium ${
                                feedbackState[i] === "thumbs_up" ? "text-teal-600 font-bold" : ""
                              }`}
                            >
                              👍
                            </button>

                            <button
                              onClick={() => logFeedback(i, "thumbs_down", msgs[i - 1]?.content, m.content)}
                              title="Bad response"
                              className={`hover:text-red-500 transition flex items-center gap-1 font-medium ${
                                feedbackState[i] === "thumbs_down" ? "text-red-500 font-bold" : ""
                              }`}
                            >
                              👎
                            </button>

                            <button
                              onClick={() => handleRegenerate(i)}
                              title="Regenerate answer"
                              className="hover:text-teal-600 transition flex items-center gap-1 font-medium"
                            >
                              🔄 Regenerate
                            </button>

                            <button
                              onClick={() => handleAudioToggle(i, m.content, m.language || language)}
                              title={speakingIdx === i ? "Pause audio" : "Listen aloud"}
                              className={`transition flex items-center gap-1 font-medium ${
                                speakingIdx === i
                                  ? "text-teal-500 font-bold animate-pulse"
                                  : "hover:text-teal-600"
                              }`}
                            >
                              {speakingIdx === i ? "⏸️ Pause" : `🔊 Listen`}
                            </button>
                          </div>

                          {speechMessage && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">{speechMessage}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Floating "Scroll to Bottom" */}
        {userScrolledUp && (
          <button
            onClick={() => {
              setUserScrolledUp(false);
              scrollToBottom();
            }}
            className="absolute bottom-24 right-8 p-3 rounded-full bg-slate-900 dark:bg-slate-800 text-white shadow-xl border border-slate-700 hover:scale-105 transition text-xs font-bold flex items-center gap-1 z-20"
          >
            ↓ Scroll to bottom
          </button>
        )}

        {/* Bottom Composer */}
        <ChatInput
          text={text}
          setText={setText}
          send={send}
          streaming={streaming}
          stopStreaming={stopStreaming}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          language={language}
          setLanguage={setLanguage}
          listening={listening}
          toggleListen={toggleListen}
          speechError={speechError}
          chatError={chatError}
          attachedFile={attachedFile}
          setAttachedFile={setAttachedFile}
          handleFileUpload={handleFileUpload}
          uploadingFile={uploadingFile}
        />
      </section>
    </div>
  );
}

export default TutorChat;
