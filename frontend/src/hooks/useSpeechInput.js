import { useState, useRef } from "react";
import { LANGUAGE_CODES } from "../constants/languages.js";

export function useSpeechInput(lang = "English", onResult) {
  const [listening, setListening] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const recognitionRef = useRef(null);
  const initialTextRef = useRef("");

  const toggleListen = (initialText = "") => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    setSpeechError("");
    const rec = new SpeechRecognition();
    recognitionRef.current = rec;
    initialTextRef.current = (initialText || "").trim();
    rec.lang = LANGUAGE_CODES[lang] || LANGUAGE_CODES.English;
    rec.interimResults = true;
    rec.onstart = () => setListening(true);
    rec.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };
    rec.onerror = (e) => {
      setListening(false);
      recognitionRef.current = null;
      setSpeechError(
        e.error === "not-allowed" || e.error === "service-not-allowed"
          ? "Microphone permission was denied. Allow microphone access in your browser settings and try again."
          : `Speech recognition failed${e.error ? ` (${e.error})` : ""}. Please try again.`
      );
    };
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map((result) => result[0].transcript).join("");
      onResult([initialTextRef.current, transcript].filter(Boolean).join(" "));
    };
    try {
      rec.start();
    } catch (e) {
      setSpeechError("Could not start speech recognition. Please try again.");
    }
  };

  return { listening, speechError, toggleListen };
}
