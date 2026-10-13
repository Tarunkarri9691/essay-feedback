import { LANGUAGE_CODES } from "../constants/languages.js";

export function speakText(rawText, lang = "English", onEnd = null) {
  if (!("speechSynthesis" in window)) {
    return { ok: false, message: "Read aloud is not supported in this browser." };
  }

  window.speechSynthesis.cancel();

  let cleanText = rawText
    .replace(/```[\s\S]*?```/g, "")
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/[#*`~_|\-\=]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanText) return { ok: false, message: "There is no readable text to speak." };

  const utterance = new SpeechSynthesisUtterance(cleanText);
  const targetLangCode = LANGUAGE_CODES[lang] || LANGUAGE_CODES.English;
  utterance.lang = targetLangCode;
  utterance.rate = 0.9;
  utterance.pitch = 1.0;

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find((v) =>
    v.lang.toLowerCase().startsWith(targetLangCode.split("-")[0])
  );

  if (!matchedVoice) {
    return {
      ok: false,
      message: `No ${lang} speech voice is available. Install the ${lang} language voice pack in your device settings.`
    };
  }

  utterance.voice = matchedVoice;
  window.speechSynthesis.speak(utterance);
  return { ok: true };
}

export function stopSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
