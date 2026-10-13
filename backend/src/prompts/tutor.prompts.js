export const TUTOR_SYSTEM = `You are StudyMate AI, a world-class, deeply knowledgeable, warm, and interactive personal multilingual AI tutor.

CURRENT STUDENT LEARNING PROFILE:
- Target Language: {language}
- Difficulty Level: {difficulty}
- Subject Domain: {subject}

YOUR CORE MISSION AS A REAL AI TUTOR:
You are not a superficial summary bot or a search engine. You are an inspiring, patient, and highly effective teacher. You explain concepts thoroughly and clearly, demystify complex ideas, and conduct an active two-way conversational dialogue with the student.

1. CRITICAL LANGUAGE RULES:
- ALWAYS conduct your ENTIRE explanation in {language}.
  * If {language} is Tamil: Write purely in fluent, natural, grammatically correct Tamil script (தமிழ்).
  * If {language} is Telugu: Write purely in fluent Telugu script (తెలుగు).
  * If {language} is Hindi: Write purely in fluent Hindi script (हिंदी).
  * If {language} is Kannada: Write purely in fluent Kannada script (ಕನ್ನಡ).
  * If {language} is Malayalam: Write purely in fluent Malayalam script (മലയാളം).
  * If {language} is English: Write in clear, motivating English.
- If the student writes in English or Romanized transliteration (e.g., "ai pathi explain pannu", "what is photosynthesis", "machine learning basics"), STILL teach and reply fully in the user's selected language: {language}.
- Technical Terms: For scientific, mathematical, or computing terms, always write the native term followed by the English term in parentheses, e.g.:
  * In Tamil: இயந்திரக் கற்றல் (Machine Learning), நரம்பியல் வலையமைப்பு (Neural Network), ஒளிச்சேர்க்கை (Photosynthesis).
  * In Telugu: కిరణజన్య సంయోగ క్రియ (Photosynthesis), కృత్రిమ మేధస్సు (Artificial Intelligence).
  * In Hindi: प्रकाश संश्लेषण (Photosynthesis), कृत्रिम बुद्धिमत्ता (Artificial Intelligence).

2. DEPTH & DETAIL OF EXPLANATION (PROVIDE A THOROUGH, DETAILED LESSON):
Never give a short, superficial 2-sentence response. Give a comprehensive, structured lesson that truly teaches the concept:
- 📌 **Title & Core Concept (அடிப்படைத் தத்துவம் / Core Concept):** Clear, precise definition; why this concept was developed; why it is important.
- ⚙️ **How It Works Step-by-Step (இது எப்படிச் செயல்படுகிறது? / Detailed Mechanism):** Break down the exact inner process into 3-4 detailed logical stages. Explain the "why" and "how" behind each step.
- 💡 **Intuitive Real-World Analogy (எளிய நிஜ வாழ்க்கை உதாரணம் / Intuitive Analogy):** A vivid everyday metaphor (cooking in a kitchen, cricket, music playlists, traffic control, human memory) that makes the concept click instantly.
- 🌍 **Practical Real-World Implementations (நடைமுறைப் பயன்பாடுகள் / Real-World Applications):** 3-4 specific examples from modern industry, technology, or nature.
- ⚠️ **Key Takeaways & Common Misconceptions (முக்கியக் குறிப்புகள் / Key Insights):** Subtle nuances that students often confuse.

3. DIFFICULTY LEVEL ADAPTATION ({difficulty}):
- **Beginner**:
  * Focus on deep conceptual intuition, vivid analogies, and step-by-step storytelling.
  * Use simple, friendly words and zero intimidating jargon.
  * Thoroughly answer all "why" questions so the student builds a rock-solid foundation.
- **Intermediate**:
  * Balance conceptual depth with technical workflows, components, algorithms, and practical implementation patterns.
- **Advanced**:
  * Provide university/industry grade rigor: underlying mathematical formulations, algorithmic trade-offs, architecture diagrams, scalability considerations, and state-of-the-art standards.

4. TWO-WAY CONVERSATIONAL CHAT DYNAMICS:
- **If the student is responding to a previous question or quiz (e.g., answering "A", "B", "Option 2", or sharing their thought):**
  1. Immediately evaluate their answer with genuine, warm teacher feedback:
     - If correct: Celebrate their success enthusiastically (e.g., "சரியான விடை! மிக நன்று! 🎉 / That's 100% correct! Excellent job!"), explain clearly WHY their answer is correct, and explain why the other options were wrong.
     - If incorrect: Give kind, encouraging guidance, explain the misconception without making them feel bad, and clarify the correct reasoning.
  2. Seamlessly connect this answer to the next level of the topic!
- **If explaining a concept:**
  Always end your response with an **Interactive Check-In** in {language}:
  Present a quick 2-choice mini-quiz (with A) and B) options) or ask an engaging thought-provoking question to test understanding before moving forward!
- Output directly in clean, readable Markdown (headings with ###, bold text, bullet points). Do NOT wrap in XML tags.`;

export function generateSmartFallbackTutor(message, subject, difficulty, language) {
  const msgLower = (message || '').toLowerCase();
  const langLower = (language || 'English').toLowerCase();
  const isTelugu = langLower.includes('telugu');
  const isHindi = langLower.includes('hindi');
  const isTamil = langLower.includes('tamil');
  const isKannada = langLower.includes('kannada');
  const isMalayalam = langLower.includes('malayalam');

  // Topic Detection: AI / Machine Learning
  if (msgLower.includes('ai') || msgLower.includes('artificial intelligence') || msgLower.includes('machine learning') || msgLower.includes('gurinchi') || msgLower.includes('pathi') || msgLower.includes('செயற்கை')) {
    if (isTamil) {
      return `### 🤖 செயற்கை நுண்ணறிவு (Artificial Intelligence - AI) விளக்கம்

வணக்கம்! **${difficulty}** நிலையில் செயற்கை நுண்ணறிவு (AI) பற்றி எளிமையாகப் பார்ப்போம்.

**1. அடிப்படை கருத்து (Core Concept):**
மனிதர்கள் யோசிப்பது, புதிய விஷயங்களைக் கற்றுக்கொள்வது, மற்றும் முடிவெடுப்பது போல கணினிகளும் இயந்திரங்களும் தாங்களாகவே சிந்தித்து செயல்படும் தொழில்நுட்பமே **செயற்கை நுண்ணறிவு (AI)** ஆகும்.

**2. AI-யின் முக்கிய பிரிவுகள் (Key Pillars):**
• **இயந்திர கற்றல் (Machine Learning - ML):** கணினிக்கு நாம் ஒவ்வொரு வரியாக நிரல் எழுதாமல், தரவுகளிலிருந்து (Data) அதுவே தானாக கற்றுக்கொள்ளும் முறை.
• **ஆழ் கற்றல் (Deep Learning):** மனித மூளையின் நியூரான்களைப் போல (Neural Networks) சிக்கலான தகவல்களைப் புரிந்து கொள்ளுதல்.
• **இயற்கை மொழி செயலாக்கம் (NLP):** நாம் பேசும் மற்றும் எழுதும் மொழிகளை கணினி புரிந்துகொள்ளுதல் (எ.கா: ChatGPT).

**3. நிஜ வாழ்க்கை உதாரணங்கள்:**
• ஸ்மார்ட்போன்களில் உள்ள Google Assistant, Siri
• YouTube மற்றும் Netflix-ல் உங்களுக்கு பிடித்த காணொளிகளை பரிந்துரைப்பது

---
### ❓ ஊடாடும் கேள்வி (Interactive Question):
நீங்கள் சரியாகப் புரிந்துகொண்டீர்களா என்று பார்க்க ஒரு எளிய கேள்வி:
**YouTube உங்களுக்குப் பிடித்த வீடியோக்களை சரியாகப் பரிந்துரைப்பதற்குப் பின்னால் செயல்படும் AI பிரிவு எது?**
* **அ) இயந்திர கற்றல் (Machine Learning)**
* **ஆ) ஒளிப்படக்கருவி (Camera Hardware)**

உங்கள் பதிலை கீழே டைப் செய்யுங்கள்!`;
    } else if (isTelugu) {
      return `### 🤖 కృత్రిమ మేధస్సు (Artificial Intelligence - AI) సమగ్ర వివరణ

నమస్కారం! **${difficulty}** స్థాయిలో కృత్రిమ మేధస్సు (AI) గురించి సులభంగా నేర్చుకుందాం.

**1. ప్రాథమిక భావన (Core Concept):**
మానవుల మాదిరిగానే ఆలోచించడం, నేర్చుకోవడం మరియు నిర్ణయాలు తీసుకోవడం వంటి పనులను కంప్యూటర్లు స్వయంగా చేసే సాంకేతికతను **కృత్రిమ మేధస్సు (AI)** అంటారు.

**2. ముఖ్యమైన విభాగాలు:**
• **మెషిన్ లెర్నింగ్ (Machine Learning - ML):** డేటా నుండి కంప్యూటర్ స్వయంగా నేర్చుకునే ప్రక్రియ.
• **డీప్ లెర్నింగ్ (Deep Learning):** మానవ మెదడు న్యూరల్ నెట్‌వర్క్‌ల ఆధారంగా పనిచేసే అధునాతన వ్యవస్థ.
• **NLP:** మానవ భాషలను అర్థం చేసుకునే సామర్థ్యం.

---
### ❓ ఇంటరాక్టివ్ ప్రశ్న:
**YouTube మీ ఇష్టానుసారం వీడియోలను రికమండ్ చేయడానికి ఉపయోగించే AI భాగం ఏది?**
* **A) మెషిన్ లెర్నింగ్ (Machine Learning)**
* **B) సాధారణ ఫైల్ స్టోరేజ్**`;
    } else if (isHindi) {
      return `### 🤖 आर्टिफिशियल इंटेलिजेंस (AI) की सरल व्याख्या

नमस्ते! **${difficulty}** स्तर पर आर्टिफिशियल इंटेलिजेंस को समझते हैं।

**1. मूल अवधारणा (Core Concept):**
मनुष्यों की तरह सोचने, सीखने और निर्णय लेने में सक्षम कंप्यूटर सिस्टम को **आर्टिफिशियल इंटेलिजेंस (AI)** कहा जाता है।

**2. मुख्य घटक:**
• **मशीन लर्निंग (Machine Learning):** डेटा से पैटर्न पहचानना और सीखना।
• **डीप लर्निंग:** तंत्रिका नेटवर्क (Neural Networks) द्वारा जटिल समस्याओं को हल करना।

---
### ❓ संवादात्मक प्रश्न:
**यूट्यूब या नेटफ्लिक्स पर आपकी पसंद के अनुसार वीडियो दिखाने के लिए किस तकनीक का उपयोग होता है?**
* **क) Machine Learning**
* **ख) Storage Card**

अपना उत्तर लिखकर बताएं!`;
    } else if (isKannada) {
      return `### 🤖 ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ (Artificial Intelligence - AI) ವಿವರಣೆ

ನಮಸ್ಕಾರ! **${difficulty}** ಮಟ್ಟದಲ್ಲಿ AI ಬಗ್ಗೆ ಸರಳವಾಗಿ ಕಲಿಯೋಣ.

**1. ಮೂಲ ಕಲ್ಪನೆ (Core Concept):**
ಮಾನವರಂತೆ ಯೋಚಿಸಲು, ಕಲಿಯಲು ಮತ್ತು ನಿರ್ಧಾರಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಲು ಕಂಪ್ಯೂಟರ್‌ಗಳಿಗೆ ಕಲಿಸುವ ತಂತ್ರಜ್ಞಾನವೇ **ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ (AI)**.

**2. ಪ್ರಮುಖ ವಿಭಾಗಗಳು:**
• **Machine Learning (ML):** ಕಂಪ್ಯೂಟರ್ ಸ್ವತಃ ಡೇಟಾದಿಂದ ಕಲಿಯುವ ವಿಧಾನ.
• **NLP:** ಮಾನವ ಭಾಷೆಯನ್ನು ಕಂಪ್ಯೂಟರ್ ಅರ್ಥಮಾಡಿಕೊಳ್ಳುವುದು (ಉದಾ: ChatGPT).

---
### ❓ ಪ್ರಶ್ನೆ (Interactive Question):
**Machine Learning ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ ಎಂಬುದನ್ನು ಇನ್ನಷ್ಟು ಆಳವಾಗಿ ತಿಳಿಯಲು ಬಯಸುವಿರಾ?**`;
    } else if (isMalayalam) {
      return `### 🤖 നിർമ്മിത ബുദ്ധി (Artificial Intelligence - AI) വിവരണം

നമസ്കാരം! **${difficulty}** തലത്തിൽ AI-യെ കുറിച്ച് ലളിതമായി മനസ്സിലാക്കാം.

**1. അടിസ്ഥാന തത്വം (Core Concept):**
മനുഷ്യനെപ്പോലെ ചിന്തിക്കാനും തീരുമാനങ്ങളെടുക്കാനും കമ്പ്യൂട്ടറുകളെ പ്രാപ്തമാക്കുന്ന സാങ്കേതികവിദ്യയാണ് **നിർമ്മിത ബുദ്ധി (AI)**.

**2. പ്രധാന ഘടകങ്ങൾ:**
• **Machine Learning (ML):** ഡാറ്റയിൽ നിന്ന് സ്വയം പഠിക്കുന്ന രീതി.
• **NLP:** മനുഷ്യരുടെ ഭാഷ മനസ്സിലാക്കാനുള്ള കഴിവ്.

---
### ❓ ചോദ്യം (Interactive Question):
**AI-യുടെ പ്രായോഗിക ഉദാഹരണങ്ങൾ കൂടുതൽ അറിയാൻ ആഗ്രഹിക്കുന്നുണ്ടോ?**`;
    } else {
      return `### 🤖 Comprehensive Guide to Artificial Intelligence (AI)

Welcome! Let's explore Artificial Intelligence at the **${difficulty}** level.

**1. Core Concept:**
Artificial Intelligence (AI) is the science and engineering of making intelligent machines and software capable of performing cognitive tasks that typically require human intelligence — such as learning, reasoning, and problem-solving.

**2. Key Pillars of AI:**
• **Machine Learning (ML):** Systems that learn patterns from training data to make predictions.
• **Deep Learning:** Artificial neural networks inspired by the human brain for complex perceptual tasks.
• **Natural Language Processing (NLP):** Understanding and generating human language (e.g., ChatGPT).

**3. Real-World Applications:**
• Recommendation algorithms on YouTube and Netflix
• Voice assistants: Apple Siri & Google Assistant
• Autonomous driving and automated medical diagnostics

---
### ❓ Interactive Check-In:
**Which AI component allows YouTube or Spotify to recommend content personalized to your taste?**
* **A) Machine Learning (ML)**
* **B) Basic File Storage**

Type your answer below!`;
    }
  }

  // Topic Detection: Photosynthesis / Plant Biology
  if (msgLower.includes('photosynthesis') || msgLower.includes('plant') || msgLower.includes('biology') || msgLower.includes('ஒளிச்சேர்க்கை') || msgLower.includes('కిరణజన్య')) {
    if (isTamil) {
      return `### 🌿 ஒளிச்சேர்க்கை (Photosynthesis) எளிய விளக்கம்

வணக்கம்! தாவரங்கள் தங்களுக்குத் தேவையான உணவைத் தாங்களே தயாரிக்கும் **ஒளிச்சேர்க்கை (Photosynthesis)** முறையை **${difficulty}** நிலையில் எளிமையாகப் பார்ப்போம்.

**1. ஒளிச்சேர்க்கை என்றால் என்ன?**
பச்சைத் தாவரங்கள் சூரிய ஒளியைப் பயன்படுத்தி, நீரையும் கார்பன் டை ஆக்சைடையும் கொண்டு தங்களுக்குத் தேவையான உணவை (குளுக்கோஸ்) தயாரிக்கும் நிகழ்வே **ஒளிச்சேர்க்கை** ஆகும்.

**2. தேவைப்படும் பொருட்கள் (4 முக்கிய பொருட்கள்):**
• **சூரிய ஒளி (Sunlight):** ஆற்றல் தரும் மூலம்
• **பச்சையம் (Chlorophyll):** இலைகளில் இருக்கும் பச்சை நிறப் பொருள்
• **நீர் (Water):** வேர்கள் மூலம் உறிஞ்சப்படுகிறது
• **கார்பன் டை ஆக்சைடு (CO₂):** காற்றில் இருந்து உறிஞ்சப்படுகிறது

**3. வேதியியல் சமன்பாடு:**
\`6CO₂ + 6H₂O + சூரிய ஒளி ➔ C₆H₁₂O₆ (குளுக்கோஸ்) + 6O₂ (ஆக்ஸிஜன்)\`

---
### ❓ ஊடாடும் கேள்வி:
**ஒளிச்சேர்க்கையின் முடிவில் தாவரங்கள் மனிதர்கள் சுவாசிப்பதற்காக எந்த வாயுவை வெளியிடுகின்றன?**
* **அ) ஆக்ஸிஜன் (Oxygen)**
* **ஆ) கார்பன் டை ஆக்சைடு (Carbon Dioxide)**

உங்கள் பதில் என்ன?`;
    } else if (isTelugu) {
      return `### 🌿 కిరణజన్య సంయోగ క్రియ (Photosynthesis) సమగ్ర వివరణ

నమస్కారం! **${difficulty}** స్థాయిలో కిరణజన్య సంయోగ క్రియ గురించి తెలుసుకుందాం.

**1. ప్రాథమిక భావన:**
మొక్కలు సూర్యకాంతి సమక్షంలో నీరు (H₂O) మరియు కార్బన్ డై ఆక్సైడ్ (CO₂) లను ఉపయోగించి గ్లూకోజ్ మరియు ఆక్సిజన్ (O₂) లను తయారు చేసే ప్రక్రియను కిరణజన్య సంయోగ క్రియ అంటారు.

**2. రసాయన సమీకరణం:**
\`6CO₂ + 6H₂O + సూర్యకాంతి ➔ C₆H₁₂O₆ (గ్లూకోజ్) + 6O₂ (ఆక్సిజన్)\`

**3. ముఖ్య భాగాలు:**
• **పత్రహరితం (Chlorophyll):** ఆకులలో ఉండే ఆకుపచ్చని వర్ణద్రవ్యం.

---
### ❓ ఇంటరాక్టివ్ ప్రశ్న:
**కిరణజన్య సంయోగ క్రియ ద్వారా మొక్కలు ఏ వాయువును విడుదల చేస్తాయి?**
* **A) ఆక్సిజన్ (Oxygen)**
* **B) నైట్రోజన్ (Nitrogen)**`;
    } else if (isHindi) {
      return `### 🌿 प्रकाश संश्लेषण (Photosynthesis) की व्याख्या

नमस्ते! **${difficulty}** स्तर पर प्रकाश संश्लेषण को समझते हैं।

**1. मूल परिभाषा:**
हरे पौधे सूर्य के प्रकाश, पानी और कार्बन डाइऑक्साइड का उपयोग करके अपना भोजन (ग्लूकोज) बनाते हैं और ऑक्सीजन छोड़ते हैं।

**2. रासायनिक समीकरण:**
\`6CO₂ + 6H₂O + सूर्य का प्रकाश ➔ C₆H₁₂O₆ + 6O₂\`

---
### ❓ संवादात्मक प्रश्न:
**पौधे प्रकाश संश्लेषण के बाद कौन-सी गैस छोड़ते हैं?**
* **क) ऑक्सीजन (Oxygen)**
* **ख) कार्बन डाइऑक्साइड (CO₂)**`;
    } else {
      return `### 🌿 Comprehensive Guide to Photosynthesis

Welcome! Here is a structured explanation of Photosynthesis at the **${difficulty}** level.

**1. Definition:**
Photosynthesis is the biochemical process by which green plants and algae convert light energy into chemical energy stored in glucose.

**2. Chemical Equation:**
\`6CO₂ (Carbon Dioxide) + 6H₂O (Water) + Sunlight ➔ C₆H₁₂O₆ (Glucose) + 6O₂ (Oxygen)\`

---
### ❓ Quick Quiz:
**What gas do plants release into the atmosphere as a byproduct of photosynthesis?**
* **A) Oxygen (O₂)**
* **B) Carbon Dioxide (CO₂)**

Let me know your answer!`;
    }
  }

  // General Interactive Topic Fallback
  const topicName = message.length < 60 ? message : subject;
  if (isTamil) {
    return `### 📘 **${topicName}** பற்றிய விரிவான விளக்கம்

வணக்கம்! நீங்கள் கேட்ட **"${message}"** என்ற தலைப்பை **${subject}** பாடப்பிரிவில் **${difficulty}** நிலையில் விரிவாகப் பார்ப்போம்.

**1. முதன்மை விளக்கம் (Core Idea):**
இந்தத் தலைப்பின் அடிப்படைத் தத்துவங்களை நாம் எளிமையான படிகளில் புரிந்துகொள்ளலாம். இது அறிவியலிலும் நடைமுறை வாழ்விலும் மிகவும் முக்கியமான ஒன்றாகும்.

**2. முக்கிய கூறுகள் (Key Highlights):**
• **அடிப்படை விதி:** தர்க்கரீதியான மற்றும் தெளிவான அணுகுமுறை.
• **நடைமுறைப் பயன்பாடுகள்:** அன்றாட வாழ்க்கையிலும் கல்வித் துறையிலும் இதன் பங்கு.
• **சிந்தனைத் திறன்:** சிக்கலான கேள்விகளுக்கு படிப்படியாக தீர்வு காணுதல்.

---
### ❓ ஊடாடும் அடுத்த கட்டம் (Interactive Next Steps):
இந்தத் தலைப்பில் நீங்கள் என்ன செய்ய விரும்புகிறீர்கள்?
1. **நடைமுறை உதாரணங்களை** (Real-world examples) பார்க்கலாமா?
2. ஒரு **4-கேள்விகள் கொண்ட பயிற்சி வினாடி வினா** (Quiz) விளையாடலாமா?

உங்கள் விருப்பத்தைத் தெரிவியுங்கள்!`;
  } else if (isTelugu) {
    return `### 📘 **${topicName}** గురించి సమగ్ర వివరణ

నమస్కారం! **${subject}** పరిధిలో **${difficulty}** స్థాయిలో "${message}" అంశాన్ని వివరంగా చూద్దాం.

**1. ప్రాథమిక భావన (Overview):**
ఈ అంశం యొక్క మూల సూత్రాలను మరియు నిత్యజీవితంలో దీని ప్రాముఖ్యతను దశలవారీగా అర్థం చేసుకుందాం.

**2. ముఖ్యమైన ముఖ్యాంశాలు:**
• **ప్రధాన సూత్రం:** స్పష్టమైన తార్కిక అవగాహన.
• **ప్రయోగాత్మక వినియోగం:** శాస్త్ర సాంకేతిక రంగాలలో దీని పాత్ర.

---
### ❓ ఇంటరాక్టివ్ ప్రశ్న:
ఈ అంశంపై **నిజ జీవిత ఉదాహరణలు** కావాలా లేదా ఒక **చిన్న క్విజ్** ఆడుదామా? మీ స్పందన తెలియజేయండి!`;
  } else if (isHindi) {
    return `### 📘 **${topicName}** की विस्तृत व्याख्या

नमस्ते! **${subject}** के अंतर्गत **${difficulty}** स्तर पर "${message}" को समझते हैं।

**1. मूल परिचय (Overview):**
आइए इस विषय के मूलभूत सिद्धांतों को स्पष्ट और सरल चरणों में समझें।

**2. मुख्य बिंदु:**
• चरणबद्ध तार्किक विश्लेषण
• दैनिक जीवन और व्यावहारिक उपयोग

---
### ❓ अगला संवादात्मक कदम:
क्या आप इसके **व्यावहारिक उदाहरण** देखना चाहते हैं या इस पर एक **क्विज़** हल करना चाहेंगे?`;
  } else {
    return `### 📘 Structured Overview: **${topicName}**

Welcome! Let's explore "${message}" in **${subject}** at the **${difficulty}** level.

**1. Core Principles:**
A systematic breakdown designed to build deep conceptual clarity through intuitive reasoning and step-by-step logic.

**2. Key Insights:**
• **Core Mechanism:** Foundational framework and mechanics.
• **Practical Applications:** Real-world usage in industry and academic contexts.

---
### ❓ Interactive Next Step:
Would you like to:
1. Explore a **real-world practical case study**?
2. Take a **quick 3-question quiz** on this topic?`;
  }
}
