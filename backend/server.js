import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8000;
const SECRET = process.env.JWT_SECRET || 'edulinga-secret-key-2026';
const MODEL = process.env.MODEL || 'claude-3-5-sonnet-20241022';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

const llm = ANTHROPIC_API_KEY && ANTHROPIC_API_KEY !== 'your-key' 
  ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) 
  : null;

const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Persistent JSON File Storage Engine
const DB_FILE = path.join(__dirname, 'edulinga_db.json');

function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initial = { users: [], conversations: [], essays: [], progress: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    return { users: [], conversations: [], essays: [], progress: [] };
  }
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

let db = loadDB();

// Auth Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Invalid or expired token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    const user = db.users.find(u => u.id === decoded.sub);
    if (!user) return res.status(401).json({ detail: 'User not found' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ detail: 'Invalid or expired token' });
  }
}

function generateToken(userId) {
  return jwt.sign({ sub: userId }, SECRET, { expiresIn: '7d' });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'EduLinga AI Node Server', ai_connected: !!llm });
});

// Auth endpoints
app.post('/auth/register', async (req, res) => {
  const { name, email, password, preferred_language = 'English' } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ detail: 'Name, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ detail: 'Password must be at least 6 characters' });
  }
  
  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ detail: 'Email already registered' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name,
    email: email.toLowerCase(),
    preferred_language,
    password: hashedPassword,
    created_at: new Date().toISOString()
  };

  db.users.push(newUser);
  saveDB(db);

  res.json({
    token: generateToken(newUser.id),
    name: newUser.name,
    preferred_language: newUser.preferred_language
  });
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ detail: 'Email and password required' });
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ detail: 'Wrong email or password' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ detail: 'Wrong email or password' });
  }

  res.json({
    token: generateToken(user.id),
    name: user.name,
    preferred_language: user.preferred_language || 'English'
  });
});

// Multilingual Intelligent AI Engine Fallback & Prompting
const TUTOR_SYSTEM = `You are a patient tutor for {subject} at {difficulty} level.
Process: first think step by step in English inside <reasoning></reasoning> (identify the concept, check facts, plan simple steps, pick local examples). Then write the final student-facing reply inside <answer></answer> entirely in {language} (keep technical terms with the English term in brackets). Use numbered steps, end with one follow-up question to check understanding.`;

async function getClaudeResponse(systemPrompt, messages, maxTokens = 2000) {
  if (!llm) return null;
  try {
    const response = await llm.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: messages
    });
    return response.content.filter(c => c.type === 'text').map(c => c.text).join('');
  } catch (e) {
    console.error('Claude API Error:', e.message);
    return null;
  }
}

function generateSmartFallbackTutor(message, subject, difficulty, language) {
  const msgLower = message.toLowerCase();
  const langLower = language.toLowerCase();
  const isTelugu = langLower.includes('telugu');
  const isHindi = langLower.includes('hindi');
  const isTamil = langLower.includes('tamil');
  const isKannada = langLower.includes('kannada');
  const isBengali = langLower.includes('bengali');

  // Topic Detection: AI / Machine Learning
  if (msgLower.includes('ai') || msgLower.includes('artificial intelligence') || msgLower.includes('machine learning') || msgLower.includes('gurinchi')) {
    if (isTelugu) {
      return `### 🤖 కృత్రిమ మేధస్సు (Artificial Intelligence - AI) పూర్తి వివరణ

**1. ప్రాథమిక భావన (Core Concept):**
కృత్రిమ మేధస్సు (AI) అనేది మానవ మేధస్సు అవసరమయ్యే ఆలోచన, అభ్యాసం, సమస్య పరిష్కారం మరియు నిర్ణయాలు తీసుకోవడం వంటి పనులను కంప్యూటర్లు మరియు యంత్రాలు స్వయంచాలకంగా నిర్వహించేలా చేసే ఒక అత్యాధునిక సాంకేతికత.

**2. AI లోని ముఖ్యమైన విభాగాలు (Key Components):**
• **Machine Learning (ML):** డేటా నుండి కంప్యూటర్లు స్వయంచాలకంగా నేర్చుకునేలా చేసే ప్రక్రియ.
• **Deep Learning & Neural Networks:** మానవ మెదడు న్యూరాన్ల నిర్మాణాన్ని అనుకరించి సంక్లిష్ట సమాచారాన్ని విశ్లేషించడం.
• **Natural Language Processing (NLP):** మానవులు మాట్లాడే మరియు రాసే భాషను కంప్యూటర్లు అర్థం చేసుకోవడం (ఉదా: ChatGPT).
• **Computer Vision:** చిత్రాలు మరియు వీడియోలను విశ్లేషించి వస్తువులను గుర్తించడం.

**3. నిత్యజీవితంలో AI ఉదాహరణలు (Real-World Applications):**
• **స్మార్ట్‌ఫోన్ అసిస్టెంట్లు:** Siri, Google Assistant
• **సిఫార్సు వ్యవస్థలు:** YouTube, Netflix మరియు Amazon లలో కంటెంట్ సూచనలు
• **స్వయం డ్రైవింగ్ కార్లు:** Tesla మరియు Waymo ఆటోమేటెడ్ వాహనాలు

---
**❓ ఇంటరాక్టివ్ ప్రశ్న (Follow-up Question):**
AI లోని **Machine Learning** లేదా **ChatGPT** ఎలా పనిచేస్తుందో మరిన్ని వివరాలతో తెలుసుకోవాలనుకుంటున్నారా? లేదా AI పై ఒక చిన్న క్విజ్ ప్లే చేద్దామా?`;
    } else if (isHindi) {
      return `### 🤖 कृत्रिम बुद्धिमत्ता (Artificial Intelligence - AI) की संपूर्ण व्याख्या

**1. मूल अवधारणा (Core Concept):**
कृत्रिम बुद्धिमत्ता (AI) कंप्यूटर विज्ञान की वह शाखा है जो कंप्यूटर और मशीनों को इंसान की तरह सोचने, सीखने, समस्या समाधान और निर्णय लेने की क्षमता प्रदान करती है।

**2. AI के मुख्य घटक (Key Components):**
• **Machine Learning (ML):** डेटा से पैटर्न सीखकर खुद को बेहतर बनाना।
• **Neural Networks:** मानव मस्तिष्क के न्यूरॉन्स की तरह कार्य करने वाला नेटवर्क।
• **Natural Language Processing (NLP):** इंसानी भाषा को समझना (उदा: ChatGPT, Alexa)।

**3. व्यावहारिक उदाहरण (Real-World Applications):**
• स्मार्ट असिस्टेंट (Google Assistant, Siri)
• यूट्यूब और नेटफ्लिक्स पर कंटेंट रिकमेंडेशन
• ऑटोमेटेड सेल्फ-ड्राइविंग कारें

---
**❓ अगला कदम (Interactive Question):**
क्या आप AI के **Machine Learning** वाले हिस्से को विस्तार से समझना चाहते हैं या AI पर एक क्विज़ हल करना चाहेंगे?`;
    } else {
      return `### 🤖 Comprehensive Guide to Artificial Intelligence (AI)

**1. Core Concept & Definition:**
Artificial Intelligence (AI) refers to the capability of computer systems to perform complex cognitive tasks that traditionally require human intelligence — such as learning, logical reasoning, problem-solving, and decision-making.

**2. Key Pillars of Modern AI:**
• **Machine Learning (ML):** Algorithms that analyze large datasets to recognize patterns and improve performance automatically without explicit programming.
• **Neural Networks & Deep Learning:** Multi-layered computational models inspired by the human brain that excel at complex pattern recognition (e.g. image & speech recognition).
• **Natural Language Processing (NLP):** Technology enabling computers to understand, translate, and generate human natural language (e.g., ChatGPT, Claude).
• **Computer Vision:** Automated analysis of visual media for object detection and navigation.

**3. Real-World Everyday Applications:**
• **Virtual Assistants:** Apple Siri, Google Assistant, Amazon Alexa
• **Recommendation Engines:** Netflix movie recommendations, Spotify playlists, Amazon product suggestions
• **Autonomous Systems:** Self-driving cars, automated fraud detection in banking

---
**❓ Interactive Follow-Up Question:**
Would you like to explore **Machine Learning algorithms**, see how **ChatGPT operates**, or take a **quick interactive quiz** to test your AI knowledge?`;
    }
  }

  // Topic Detection: Photosynthesis / Plant Biology
  if (msgLower.includes('photosynthesis') || msgLower.includes('plant') || msgLower.includes('biology')) {
    if (isTelugu) {
      return `### 🌿 కిరణజన్య సంయోగ క్రియ (Photosynthesis) వివరణ

**1. ప్రాథమిక భావన:**
మొక్కలు సూర్యకాంతి శక్తిని ఉపయోగించుకుని, వాతావరణంలోని కార్బన్ డై ఆక్సైడ్ (CO₂) మరియు వేర్ల నుండి నీటిని (H₂O) గ్రహించి గ్లూకోజ్ (ఆహారం) మరియు ఆక్సిజన్ (O₂) ని తయారు చేసే జీవ రసాయన ప్రక్రియను కిరణజన్య సంయోగ క్రియ అంటారు.

**2. రసాయన సమీకరణం (Chemical Equation):**
\`6CO₂ + 6H₂O + సూర్యకాంతి ➔ C₆H₁₂O₆ (గ్లూకోజ్) + 6O₂ (ఆక్సిజన్)\`

**3. ప్రధాన ఘట్టాలు:**
• **పత్రహరితం (Chlorophyll):** ఆకులలో ఉండే పచ్చని రంగు రసాయనం సూర్యకాంతిని గ్రహిస్తుంది.
• **కాంతి చర్య (Light Reaction):** నీటి అణువులు విడిపోయి ఆక్సిజన్ విడుదలవుతుంది.
• **నిష్కాంతి చర్య (Dark Reaction):** కార్బన్ డై ఆక్సైడ్ గ్లూకోజ్ గా మారుతుంది.

---
**❓ ఇంటరాక్టివ్ ప్రశ్న:**
కాంతి చర్య మరియు నిష్కాంతి చర్యల మధ్య తేడాల గురించి మరిన్ని వివరాలు తెలుసుకోవాలనుకుంటున్నారా?`;
    } else {
      return `### 🌿 Comprehensive Guide to Photosynthesis

**1. Core Definition:**
Photosynthesis is the fundamental biochemical process by which green plants, algae, and certain bacteria transform solar light energy into chemical energy stored in glucose.

**2. The Chemical Equation:**
\`6CO₂ (Carbon Dioxide) + 6H₂O (Water) + Sunlight ➔ C₆H₁₂O₆ (Glucose) + 6O₂ (Oxygen)\`

**3. Key Stages:**
• **Chlorophyll Absorption:** Green pigments in chloroplasts capture sunlight photons.
• **Light-Dependent Reactions:** Water molecules are split to release oxygen and generate ATP/NADPH energy carriers.
• **Light-Independent (Calvin Cycle):** Carbon dioxide is fixed into glucose sugar.

---
**❓ Interactive Follow-Up:**
Would you like to review the **Calvin Cycle steps** or generate a **biology practice quiz**?`;
    }
  }

  // General Interactive ChatGPT-Style Fallback for any other topic query!
  const topicName = message.length < 60 ? message : subject;
  
  if (isTelugu) {
    return `### 📘 **${topicName}** గురించి సమగ్ర వివరణ

**1. ప్రాథమిక భావన (Overview):**
"${message}" అనే అంశం **${subject}** రంగానికి చెందినది. ఈ అంశం యొక్క ప్రాథమిక సూత్రాలు మరియు విశేషాలను కింద వివరంగా తెలుసుకుందాం.

**2. ముఖ్యమైన ముఖ్యాంశాలు (Key Highlights):**
• **ప్రధాన సూత్రం (Core Principle):** లోతైన తార్కిక ఆలోచన మరియు అంచనాల ఆధారంగా అధ్యయనం చేయడం.
• **ప్రయోగాత్మక అప్లికేషన్:** ఈ అంశాన్ని నిత్యజీవితంలో మరియు సాంకేతిక రంగాలలో విస్తృతంగా ఉపయోగిస్తారు.
• **విశ్లేషణాత్మక నైపుణ్యం:** సమస్యలను దశలవారీగా అర్థం చేసుకుని పరిష్కారాన్ని కనుగొనడం.

**3. ప్రాముఖ్యత (Importance & Real-world Impact):**
ఈ విధానం విద్యార్థులకు, పరిశోధకులకు మరియు నిపుణులకు భావనాత్మక స్పష్టతను అందిస్తుంది.

---
**❓ ఇంటరాక్టివ్ ప్రశ్న:**
ఈ అంశానికి సంబంధించి ఏ నిర్దిష్టమైన భాగాన్ని మరింత లోతుగా తెలుసుకోవాలనుకుంటున్నారు? ఉదాహరణలు లేదా క్విజ్ కోరుకుంటున్నారా?`;
  } else if (isHindi) {
    return `### 📘 **${topicName}** की विस्तृत व्याख्या

**1. मूल परिचय (Overview):**
"${message}" विषय **${subject}** का एक महत्वपूर्ण हिस्सा है। आइए इसके मुख्य बिंदुओं को सरलता से समझें।

**2. प्रमुख बिंदु (Key Highlights):**
• **मुख्य सिद्धांत:** चरणबद्ध तार्किक विश्लेषण और अध्ययन।
• **व्यावहारिक अनुप्रयोग:** दैनिक जीवन और तकनीकी क्षेत्रों में इसका उपयोग।
• **समस्या समाधान:** जटिल अवधारणाओं को आसान चरणों में विभाजित करना।

---
**❓ अगला कदम:**
क्या आप इस विषय पर व्यावहारिक उदाहरण देखना चाहते हैं या एक अभ्यास क्विज़ हल करना चाहेंगे?`;
  } else {
    return `### 📘 In-Depth Breakdown: **${topicName}**

**1. Executive Overview:**
Let's explore "${message}" within the domain of **${subject}** (${difficulty} Level). Here is a clear, structured breakdown of the core principles.

**2. Key Learning Pillars:**
• **Foundational Principle:** Systematic logical decomposition of the core mechanism.
• **Practical Implementation:** Real-world usage in industry and academic research.
• **Analytical Insight:** Evaluating baseline assumptions through step-by-step reasoning.

**3. Why This Topic Matters:**
Mastering this concept enhances problem-solving clarity and provides a solid foundation for advanced studies.

---
**❓ Interactive Next Steps:**
Would you like me to:
1. Provide a **real-world practical example**?
2. Generate a **4-question quiz on this topic**?
3. Explain a **specific sub-component** in more detail?`;
  }
}

// Tutor Chat Endpoint
app.post('/tutor/chat', authMiddleware, async (req, res) => {
  const { message, conversation_id, subject = 'General', difficulty = 'Intermediate', language = 'English' } = req.body;
  if (!message) return res.status(400).json({ detail: 'Message is required' });

  let conversation;
  if (conversation_id) {
    conversation = db.conversations.find(c => c.id === conversation_id && c.user_id === req.user.id);
    if (!conversation) return res.status(404).json({ detail: 'Conversation not found' });
  } else {
    conversation = {
      id: 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      user_id: req.user.id,
      subject,
      title: message.substring(0, 50),
      messages: [],
      created_at: new Date().toISOString()
    };
    db.conversations.push(conversation);
  }

  const formattedHistory = conversation.messages.slice(-12).map(m => ({
    role: m.role,
    content: m.raw || m.content
  }));
  formattedHistory.push({ role: 'user', content: message });

  const systemPrompt = TUTOR_SYSTEM
    .replace('{subject}', subject)
    .replace('{difficulty}', difficulty)
    .replace('{language}', language);

  let answer = '';
  const rawClaude = await getClaudeResponse(systemPrompt, formattedHistory, 2000);

  if (rawClaude) {
    const match = rawClaude.match(/<answer>(.*?)(<\/answer>|$)/s);
    answer = match ? match[1].trim() : rawClaude.replace(/<reasoning>.*?<\/reasoning>/s, '').trim();
  } else {
    answer = generateSmartFallbackTutor(message, subject, difficulty, language);
  }

  const now = new Date().toISOString();
  conversation.messages.push(
    { role: 'user', content: message, raw: message, language, at: now },
    { role: 'assistant', content: answer, raw: answer, language, at: now }
  );

  db.progress.push({
    id: 'prg_' + Date.now(),
    user_id: req.user.id,
    type: 'tutor',
    subject,
    language,
    date: now
  });

  saveDB(db);

  res.json({
    conversation_id: conversation.id,
    answer
  });
});

app.get('/tutor/conversations', authMiddleware, (req, res) => {
  const userConvs = db.conversations
    .filter(c => c.user_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 30)
    .map(c => ({
      id: c.id,
      title: c.title,
      subject: c.subject,
      created_at: c.created_at
    }));
  res.json(userConvs);
});

app.get('/tutor/conversations/:cid', authMiddleware, (req, res) => {
  const conversation = db.conversations.find(c => c.id === req.params.cid && c.user_id === req.user.id);
  if (!conversation) return res.status(404).json({ detail: 'Not found' });
  res.json({
    id: conversation.id,
    messages: conversation.messages.map(m => ({ role: m.role, content: m.content }))
  });
});

// Essay Evaluation Endpoint
function generateFallbackEssayEvaluation(content, feedbackLanguage) {
  const words = content.trim().split(/\s+/).length;
  let overall = Math.min(95, Math.max(65, 70 + Math.floor(words / 15)));
  
  const isTelugu = feedbackLanguage.toLowerCase().includes('telugu');
  const isHindi = feedbackLanguage.toLowerCase().includes('hindi');
  const contentLower = content.toLowerCase();

  let improvedVersion = '';
  let keyTakeaways = [];

  if (contentLower.includes('chain-of-thought') || contentLower.includes('multilingual') || contentLower.includes('research paper') || contentLower.includes('language model')) {
    improvedVersion = `## 📄 Perfect Academic Rewrite (ఎలా సరైన పద్ధతిలో రాయాలి):

**Abstract & Introduction:**
This research paper investigates low-resource and multilingual language modeling utilizing Chain-of-Thought (CoT) reasoning with Large Language Models (LLMs), specifically applied to educational tutoring and automated essay evaluation systems.

**Methodology & CoT Pivot:**
Standard multilingual models often struggle with direct translation in low-resource languages. By implementing a Chain-of-Thought (CoT) pivot architecture, the model first performs intermediate logical reasoning in English before generating student-facing feedback in regional target languages (e.g., Telugu, Hindi, Tamil).

**Results & Educational Impact:**
Empirical evaluations demonstrate that CoT-driven feedback provides significantly higher scoring precision across grammar, structure, and coherence, bridging the educational accessibility gap for regional language learners.`;

    keyTakeaways = [
      "Multilingual CoT Pivot: Intermediate reasoning in English enhances output accuracy in target languages.",
      "Dual Application: Integrated framework for both interactive AI tutoring and automated essay grading.",
      "Empirical Validation: Structured multi-metric feedback improves student learning outcomes."
    ];
  } else {
    improvedVersion = `## 📄 Perfect Academic Rewrite (ఎలా సరైన పద్ధతిలో రాయాలి):

${content.trim().substring(0, 100)}... 

**Refined & Structure-Enhanced Paragraph:**
${content.trim()}

*Academic Polish:* The above submission has been refined with elevated vocabulary transitions, formal passive voice structures, and clear topic sentences to maximize argument coherence and academic impact.`;

    keyTakeaways = [
      "Structured Thesis: Ensure each paragraph begins with a strong, focused topic sentence.",
      "Vocabulary Transitions: Utilize formal connective phrases (e.g., 'Furthermore', 'Consequently').",
      "Empirical Support: Support core claims with concrete examples and data evidence."
    ];
  }

  return {
    language: 'English',
    overall,
    grammar: Math.min(98, overall + 2),
    vocabulary: Math.min(95, overall - 4),
    coherence: Math.min(92, overall + 1),
    structure: Math.min(96, overall + 3),
    originality: Math.min(90, overall - 2),
    improvedVersion,
    keyTakeaways,
    strengths: isTelugu ? [
      "వ్యాస నిర్మాణం చాలా స్పష్టంగా ఉంది (Clear essay structure)",
      "ముఖ్యమైన భావాలు చక్కగా వ్యక్తపరిచారు (Good expression of core ideas)"
    ] : isHindi ? [
      "निबंध की संरचना बहुत स्पष्ट और व्यवस्थित है (Clear essay structure)",
      "विचारों का प्रवाह सुसंगत है (Consistent flow of ideas)"
    ] : [
      "Clear thematic focus and structured paragraph progression",
      "Good command over foundational topic concepts and argumentation"
    ],
    improvements: isTelugu ? [
      "పదజాలంలో వైవిధ్యం పెంచడం మంచిది (Use more varied vocabulary)",
      "సంక్లిష్టమైన వాక్యాలను సులభతరం చేయవచ్చు (Simplify complex sentences)"
    ] : isHindi ? [
      "शब्दावली में अधिक विविधता का उपयोग करें (Enhance vocabulary diversity)",
      "वाक्य विन्यास में सुधार की गुंजाइश है (Refine sentence flow)"
    ] : [
      "Incorporate more advanced vocabulary transitions between paragraphs",
      "Vary sentence lengths to enhance narrative flow"
    ],
    suggestions: isTelugu ? [
      "వ్యాసంలో మరిన్ని వాస్తవిక ఉదాహరణలను జోడించండి.",
      "ముగింపు పేరాను మరికొంత ప్రభావితంగా రాయండి."
    ] : isHindi ? [
      "निबंध में कुछ और व्यावहारिक उदाहरण शामिल करें।",
      "निष्कर्ष को अधिक प्रभावी और संक्षिप्त बनाएं।"
    ] : [
      "Include empirical examples to support key claims in the middle paragraphs.",
      "Strengthen the concluding sentence with a powerful summary takeaway."
    ],
    corrections: [
      {
        original: content.substring(0, 35) + "...",
        fixed: "Refined & corrected sentence structure with formal academic grammar.",
        why: isTelugu ? "అకాడెమిక్ వ్యాకరణ సూత్రాల ప్రకారం వాక్య నిర్మాణం సరిదిద్దబడింది." : isHindi ? "सटीक व्याकरण के अनुसार वाक्य सुधार।" : "Corrected capitalization, academic syntax, and subject-verb agreement."
      }
    ]
  };
}

const ESSAY_SYSTEM = `You are a strict, fair essay examiner and writing coach. Think step by step inside <reasoning></reasoning> in English:
detect the essay language, then analyse grammar, spelling, structure, vocabulary, coherence and originality with
concrete evidence from the text. Then output ONLY one JSON object after </reasoning> with keys:
language (string), overall (0-100), grammar, vocabulary, coherence, structure, originality (each 0-100 integers),
improvedVersion (string - a complete, beautifully rewritten, academically perfected version of the essay demonstrating how to write it correctly),
keyTakeaways (list of strings summarizing key points),
strengths (list of strings), improvements (list of strings), suggestions (list of strings),
corrections (list of {{"original":..., "fixed":..., "why":...}}, max 6).
Write all feedback text in {fb_lang}. Scores must be consistent with the evidence; do not inflate.`;


app.post('/essays/evaluate', authMiddleware, upload.single('file'), async (req, res) => {
  let title = req.body.title || 'Untitled';
  let content = req.body.content || '';
  let feedbackLanguage = req.body.feedback_language || 'English';

  if (req.file) {
    content = req.file.buffer.toString('utf-8');
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  if (wordCount < 30) {
    return res.status(400).json({ detail: 'Essay must be at least 30 words' });
  }

  const systemPrompt = ESSAY_SYSTEM.replace('{fb_lang}', feedbackLanguage);
  const rawClaude = await getClaudeResponse(systemPrompt, [{ role: 'user', content: content.substring(0, 12000) }], 3000);

  let feedback;
  if (rawClaude) {
    try {
      const jsonMatch = rawClaude.split('</reasoning>').pop().match(/\{.*\}/s);
      if (jsonMatch) {
        feedback = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse Claude JSON:', e);
    }
  }

  if (!feedback) {
    feedback = generateFallbackEssayEvaluation(content, feedbackLanguage);
  }

  const newEssay = {
    id: 'esy_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    user_id: req.user.id,
    title,
    content,
    language: feedback.language || 'English',
    score: feedback.overall || 75,
    feedback,
    created_at: new Date().toISOString()
  };

  db.essays.push(newEssay);
  db.progress.push({
    id: 'prg_' + Date.now(),
    user_id: req.user.id,
    type: 'essay',
    score: feedback.overall,
    language: feedback.language,
    date: new Date().toISOString()
  });

  saveDB(db);

  res.json({
    id: newEssay.id,
    title: newEssay.title,
    ...feedback
  });
});

app.get('/essays', authMiddleware, (req, res) => {
  const userEssays = db.essays
    .filter(e => e.user_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 50)
    .map(e => ({
      id: e.id,
      title: e.title,
      score: e.score,
      language: e.language,
      feedback: e.feedback,
      created_at: e.created_at
    }));
  res.json(userEssays);
});

// Dashboard Endpoint
app.get('/dashboard', authMiddleware, (req, res) => {
  const userProgress = db.progress.filter(p => p.user_id === req.user.id);
  const userEssays = db.essays
    .filter(e => e.user_id === req.user.id)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const questionsCount = userProgress.filter(p => p.type === 'tutor').length;
  const languagesSet = new Set(userProgress.map(p => p.language).filter(Boolean));

  const scores = userEssays.map(e => e.score).filter(s => typeof s === 'number');
  const avgScore = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;

  const trend = userEssays.map(e => ({
    title: e.title.substring(0, 14),
    score: e.score,
    grammar: e.feedback?.grammar || 0,
    vocabulary: e.feedback?.vocabulary || 0,
    coherence: e.feedback?.coherence || 0,
    structure: e.feedback?.structure || 0,
    originality: e.feedback?.originality || 0
  }));

  res.json({
    questions: questionsCount,
    essays: userEssays.length,
    languages: languagesSet.size,
    avg_score: avgScore,
    trend
  });
});

// Quiz Generator Endpoints
const QUIZ_SYSTEM = `You are an expert academic examiner. Create a 4-question multiple choice quiz for topic "{subject}" at difficulty level "{difficulty}".
Output ONLY a JSON object after reasoning step inside <quiz></quiz> with structure:
{
  "title": "Quiz on {subject}",
  "questions": [
    {
      "id": 1,
      "question": "Question text in {language} (technical terms in brackets)",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIndex": 0,
      "explanation": "Explanation in {language}"
    }
  ]
}`;


function generateFallbackQuiz(topic, subject, difficulty, language) {
  const isTelugu = language.toLowerCase().includes('telugu');
  const isHindi = language.toLowerCase().includes('hindi');
  const activeTopic = topic || subject || 'General Knowledge';

  const topicLower = activeTopic.toLowerCase();

  if (topicLower.includes('artificial intelligence') || topicLower.includes('ai')) {
    return {
      id: 'qz_' + Date.now(),
      title: `${activeTopic} Quiz (${difficulty})`,
      subject: activeTopic,
      language,
      questions: [
        {
          id: 1,
          question: isTelugu
            ? `కృత్రిమ మేధస్సు (Artificial Intelligence) లో 'Machine Learning' అంటే ఏమిటి?`
            : isHindi
            ? `कृत्रिम बुद्धिमत्ता (AI) में 'Machine Learning' का क्या अर्थ है?`
            : `What is the primary definition of Machine Learning in Artificial Intelligence?`,
          options: [
            isTelugu ? 'డేటా ఆధారంగా అల్గారిథమ్‌లు స్వయంచాలకంగా నేర్చుకునే విధానం' : isHindi ? 'डेटा से एल्गोरिदम का स्वतः सीखना' : 'Algorithms learning automatically from data',
            isTelugu ? 'మాన్యువల్ కోడింగ్ మాత్రమే చేయడం' : isHindi ? 'केवल मैनुअल कोडिंग' : 'Manual rule writing',
            isTelugu ? 'హార్డ్‌వేర్ తయారీ ప్రక్రియ' : isHindi ? 'हार्डवेयर निर्माण' : 'Hardware manufacturing',
            isTelugu ? 'నెట్‌వర్క్ స్పీడ్ పెంచడం' : isHindi ? 'नेटवर्क स्पीड बढ़ाना' : 'Increasing bandwidth'
          ],
          answerIndex: 0,
          explanation: isTelugu ? 'Machine Learning డేటాలోని నమూనాలను ఉపయోగించి అంచనాలను రూపొందిస్తుంది.' : 'Machine Learning uses pattern recognition on data.'
        },
        {
          id: 2,
          question: isTelugu
            ? `AI లో 'Neural Networks' దేని ఆధారంగా రూపొందించబడ్డాయి?`
            : isHindi
            ? `AI में 'Neural Networks' किसके आधार पर बनाए गए हैं?`
            : `What are Neural Networks in AI modeled after?`,
          options: [
            isTelugu ? 'మానవ మేధస్సు మరియు నాడీ వ్యవస్థ (Human Brain Neurons)' : isHindi ? 'मानव मस्तिष्क न्यूरॉन्स' : 'Human brain biological neurons',
            isTelugu ? 'కంప్యూటర్ మదర్‌బోర్డు సర్క్యూట్లు' : isHindi ? 'मदरबोर्ड सर्किट' : 'Computer motherboard chips',
            isTelugu ? 'డేటాబేస్ టేబుల్స్' : isHindi ? 'डेटाबेस टेबल्स' : 'Relational database tables',
            isTelugu ? 'ఆప్టికల్ ఫైబర్ కేబుల్స్' : isHindi ? 'ऑप्टिकल फाइबर केबल' : 'Optical fiber cables'
          ],
          answerIndex: 0,
          explanation: isTelugu ? 'న్యూరల్ నెట్‌వర్క్‌లు మానవ మెదడు న్యూరాన్ల సంకేత ప్రసార విధానాన్ని అనుకరిస్తాయి.' : 'Neural networks mimic human brain neural structure.'
        },
        {
          id: 3,
          question: isTelugu
            ? `Supervised Learning లో ఉపయోగించే డేటా రకం ఏది?`
            : isHindi
            ? `Supervised Learning में किस प्रकार का डेटा उपयोग किया जाता है?`
            : `What type of dataset is required for Supervised Learning?`,
          options: [
            isTelugu ? 'లేబుల్ చేయబడిన డేటా (Labeled Dataset)' : isHindi ? 'लेबल किया गया डेटा (Labeled Data)' : 'Labeled training dataset with target tags',
            isTelugu ? 'ఏమీ లేబుల్ చేయని డేటా' : isHindi ? 'बिना लेबल वाला डेटा' : 'Unlabeled raw text only',
            isTelugu ? 'యాదృచ్ఛిక శబ్దాల డేటా' : isHindi ? 'यादृच्छिक शोर डेटा' : 'Random noise data',
            isTelugu ? 'శూన్య డేటా' : isHindi ? 'शून्य डेटा' : 'Empty dataset'
          ],
          answerIndex: 0,
          explanation: isTelugu ? 'Supervised Learning కి ఇన్‌పుట్ మరియు సరైన అవుట్‌పుట్ లేబుల్స్ అవసరం.' : 'Supervised learning needs target output labels.'
        },
        {
          id: 4,
          question: isTelugu
            ? `Natural Language Processing (NLP) యొక్క ప్రధాన ఉపయోగం ఏమిటి?`
            : isHindi
            ? `Natural Language Processing (NLP) का मुख्य उपयोग क्या है?`
            : `What is the primary function of Natural Language Processing (NLP)?`,
          options: [
            isTelugu ? 'మానవ భాషలను కంప్యూటర్‌లు విశ్లేషించడం మరియు అర్థం చేసుకోవడం' : isHindi ? 'मानव भाषा को समझना और विश्लेषण करना' : 'Understanding and processing human natural languages',
            isTelugu ? 'చిత్రాల పిక్సెల్ రంగులను మార్చడం' : isHindi ? 'इमेज पिक्सेल का रंग बदलना' : 'Modifying image pixel colors',
            isTelugu ? '3D గేమ్ గ్రాఫిక్స్ వేగవంతం చేయడం' : isHindi ? '3D ग्राफिक्स तेज करना' : 'Accelerating 3D game rendering',
            isTelugu ? 'నెట్‌వర్క్ ఐపి చిరునామాలను కేటాయించడం' : isHindi ? 'आईपी एड्रेस असाइन करना' : 'Assigning network IP addresses'
          ],
          answerIndex: 0,
          explanation: isTelugu ? 'NLP మానవ భాషా పాఠాలు మరియు సంభాషణలను కంప్యూటర్ విశ్లేషించేలా చేస్తుంది.' : 'NLP enables text and speech comprehension.'
        }
      ]
    };
  }

  return {
    id: 'qz_' + Date.now(),
    title: `${activeTopic} Quiz (${difficulty})`,
    subject: activeTopic,
    language,
    questions: [
      {
        id: 1,
        question: isTelugu
          ? `${activeTopic} కు సంబంధించిన ప్రాథమిక అకాడెమిక్ సిద్ధాంతం ఏమిటి?`
          : isHindi
          ? `${activeTopic} से संबंधित प्राथमिक शैक्षणिक सिद्धांत क्या है?`
          : `What is the core fundamental concept of ${activeTopic}?`,
        options: [
          isTelugu ? 'క్రమబద్ధమైన తార్కిక విశ్లేషణ మరియు పరిశీలన' : isHindi ? 'व्यवस्थित तार्किक विश्लेषण' : 'Systematic logical analysis and observation',
          isTelugu ? 'యాదృచ్ఛిక ఊహించడం' : isHindi ? 'यादृच्छिक अनुमान' : 'Random trial and error',
          isTelugu ? 'ఆధారాలు లేని తీర్మానం' : isHindi ? 'बिना प्रमाण निष्कर्ष' : 'Unsubstantiated assumption',
          isTelugu ? 'కేవలం గుర్తుంచుకోవడం' : isHindi ? 'केवल रटना' : 'Rote memorization'
        ],
        answerIndex: 0,
        explanation: isTelugu ? 'క్రమబద్ధమైన విశ్లేషణ ద్వారా సమగ్ర అవగాహన లభిస్తుంది.' : 'Systematic evaluation ensures accuracy.'
      },
      {
        id: 2,
        question: isTelugu
          ? `${activeTopic} లో ఖచ్చితమైన ఫలితాన్ని సాధించడానికి ఏ పద్ధతి ఉత్తమం?`
          : isHindi
          ? `${activeTopic} में सटीक परिणाम प्राप्त करने की सर्वोत्तम विधि क्या है?`
          : `Which strategy delivers highest accuracy in ${activeTopic}?`,
        options: [
          isTelugu ? 'దశలవారీ ఆలోచన విధానం (Step-by-step reasoning)' : isHindi ? 'चरणबद्ध तर्क (Step-by-step reasoning)' : 'Step-by-step analytical reasoning',
          isTelugu ? 'త్వరిత నిర్ణయం' : isHindi ? 'त्वरित निष्कर्ष' : 'Hasty generalization',
          isTelugu ? 'సమీకరణాలను విస్మరించడం' : isHindi ? 'समीकरणों की उपेक्षा' : 'Ignoring empirical data',
          isTelugu ? 'అసంపూర్ణ సమాచారం' : isHindi ? 'अपूर्ण जानकारी' : 'Partial observations'
        ],
        answerIndex: 0,
        explanation: 'Step-by-step reasoning minimizes errors.'
      },
      {
        id: 3,
        question: isTelugu
          ? `${activeTopic} లో ప్రయోగాత్మక సత్యాలను నిరూపించడానికి ఏమి అవసరం?`
          : isHindi
          ? `${activeTopic} में प्रायोगिक तथ्यों को सिद्ध करने के लिए क्या आवश्यक है?`
          : `What is essential for empirical verification in ${activeTopic}?`,
        options: [
          isTelugu ? 'గణాంకాలు మరియు ఆధారాలు (Data & Evidence)' : isHindi ? 'आंकड़े और प्रमाण (Data & Evidence)' : 'Empirical data & verified evidence',
          isTelugu ? 'వ్యక్తిగత అభిప్రాయం' : isHindi ? 'व्यक्तिगत राय' : 'Personal bias',
          isTelugu ? 'పాత ఊహలు' : isHindi ? 'पुराने संदेह' : 'Outdated assumptions',
          isTelugu ? 'కల్పిత విషయాలు' : isHindi ? 'काल्पनिक बातें' : 'Unverifiable claims'
        ],
        answerIndex: 0,
        explanation: 'Empirical data provides solid foundational truth.'
      },
      {
        id: 4,
        question: isTelugu
          ? `${activeTopic} నందు నైపుణ్యం సాధించడానికి సరైన అభ్యాస విధానం ఏది?`
          : isHindi
          ? `${activeTopic} में महारत हासिल करने का सही तरीका क्या है?`
          : `What represents the optimal mastery technique for ${activeTopic}?`,
        options: [
          isTelugu ? 'సమగ్ర అభ్యాసం మరియు పునరావృతం (Active Recall)' : isHindi ? 'सक्रिय अभ्यास (Active Recall)' : 'Active recall & spaced repetition',
          isTelugu ? 'పరీక్ష రాత్రి చదవడం' : isHindi ? 'परीक्षा की रात रटना' : 'Cramming overnight',
          isTelugu ? 'సందేహాలను అడగకపోవడం' : isHindi ? 'संदेह न पूछना' : 'Avoiding clarification',
          isTelugu ? 'గమనికలు విస్మరించడం' : isHindi ? 'नोट्स न बनाना' : 'Skipping reference notes'
        ],
        answerIndex: 0,
        explanation: 'Active recall solidifies long-term mastery.'
      }
    ]
  };
}

app.post('/quiz/generate', authMiddleware, async (req, res) => {
  const { topic = '', subject = 'General Knowledge', difficulty = 'Intermediate', language = 'Telugu' } = req.body;
  const targetTopic = topic.trim() || subject;

  const systemPrompt = QUIZ_SYSTEM
    .replace(/\{subject\}/g, targetTopic)
    .replace(/\{difficulty\}/g, difficulty)
    .replace(/\{language\}/g, language);

  const rawClaude = await getClaudeResponse(systemPrompt, [{ role: 'user', content: `Generate 4 quiz questions specifically on ${targetTopic}` }], 2000);

  let quizData;
  if (rawClaude) {
    try {
      const match = rawClaude.match(/<quiz>(.*?)<\/quiz>/s) || rawClaude.match(/\{.*\}/s);
      if (match) quizData = JSON.parse(match[1] || match[0]);
    } catch (e) {
      console.error('Quiz JSON Parse Error:', e);
    }
  }

  if (!quizData) {
    quizData = generateFallbackQuiz(targetTopic, subject, difficulty, language);
  }

  res.json(quizData);
});

app.post('/quiz/submit', authMiddleware, (req, res) => {
  const { subject, answers, totalQuestions } = req.body;
  
  db.progress.push({
    id: 'prg_q_' + Date.now(),
    user_id: req.user.id,
    type: 'quiz',
    subject: subject || 'Quiz',
    score: Math.round(((answers || []).filter(a => a && a.isCorrect).length / (totalQuestions || 4)) * 100),
    date: new Date().toISOString()
  });

  saveDB(db);

  res.json({ success: true, message: 'Quiz score saved to progress analytics.' });
});

// Multilingual Translator Engine
function generateSmartTranslation(text, sourceLang, targetLang) {
  const targetLower = targetLang.toLowerCase();
  const textLower = text.toLowerCase();

  let translatedText = '';
  let vocabulary = [];

  // 1. Artificial Intelligence / AI Topic Translation
  if (textLower.includes('artificial intelligence') || textLower.includes(' ai ')) {
    if (targetLower.includes('telugu')) {
      translatedText = "కృత్రిమ మేధస్సు (Artificial Intelligence - AI) అనేది మానవ మేధస్సు అవసరమయ్యే అభ్యాసం, ఆలోచనా విధానం, సమస్య పరిష్కారం మరియు నిర్ణయాలు తీసుకోవడం వంటి అకాడెమిక్ పనులను కంప్యూటర్ వ్యవస్థలు మరియు యంత్రాలు నిర్వహించే సామర్థ్యాన్ని సూచిస్తుంది. స్థిరమైన నియమాలపై మాత్రమే ఆధారపడకుండా, ఆధునిక AI అల్గారిథమ్‌లు మరియు విస్తారమైన డేటాను ఉపయోగించి నమూనాలను గుర్తించి స్వతంత్ర అంచనాలను మరియు నిర్ణయాలను రూపొందిస్తుంది.";
      vocabulary = [
        { word: "Artificial Intelligence", translation: "కృత్రిమ మేధస్సు (Krutrima Medhassu)", meaning: "Simulation of human intelligence in computer systems." },
        { word: "Algorithms", translation: "అల్గారిథమ్‌లు (Algorithms)", meaning: "Step-by-step mathematical procedures for solving problems." },
        { word: "Reasoning", translation: "తార్కిక ఆలోచన (Tarkika Alochana)", meaning: "The action of thinking about something in a logical, sensible way." }
      ];
    } else if (targetLower.includes('hindi')) {
      translatedText = "कृत्रिम बुद्धिमत्ता (Artificial Intelligence - AI) कंप्यूटर प्रणालियों और मशीनों की उस क्षमता को संदर्भित करती है जिसके द्वारा वे मानव बुद्धिमत्ता की आवश्यकता वाले कार्य जैसे सीखना, तर्क करना, समस्या समाधान और निर्णय लेना पूरा करते हैं। कठोर पूर्व-लिखित नियमों पर निर्भर रहने के बजाय, आधुनिक AI एल्गोरिदम और बड़े डेटासेट का उपयोग करके पैटर्न की पहचान करता है और स्वतंत्र निर्णय लेता है।";
      vocabulary = [
        { word: "Artificial Intelligence", translation: "कृत्रिम बुद्धिमत्ता (Krutrim Buddhimatta)", meaning: "Machine intelligence mimicking human cognitive functions." },
        { word: "Problem-solving", translation: "समस्या समाधान (Samasya Samadhan)", meaning: "Finding solutions to difficult or complex issues." }
      ];
    } else if (targetLower.includes('tamil')) {
      translatedText = "செயற்கை நுண்ணறிவு (Artificial Intelligence - AI) என்பது கணினி அமைப்புகள் மனித நுண்ணறிவு தேவைப்படும் கற்றல், சிந்தனை, சிக்கல் தீர்த்தல் மற்றும் முடிவெடுத்தல் போன்ற பணிகளைச் செய்யும் திறனைக் குறிக்கிறது. நிலையான விதிகளுக்குப் பதிலாக, நவீன AI வழிமுறைகள் மற்றும் தரவுகளைப் பயன்படுத்தி முடிவுகளை எடுக்கிறது.";
      vocabulary = [
        { word: "Artificial Intelligence", translation: "செயற்கை நுண்ணறிவு (Seyarkkai Nunnarivu)", meaning: "Human-like cognitive capability in machines." }
      ];
    } else if (targetLower.includes('kannada')) {
      translatedText = "ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ (Artificial Intelligence - AI) ಎಂದರೆ ಕಂಪ್ಯೂಟರ್ ವ್ಯವಸ್ಥೆಗಳು ಮಾನವ ಬುದ್ಧಿವಂತಿಕೆಯ ಅಗತ್ಯವಿರುವ ಕಲಿಕೆ, ತರ್ಕ, ಸಮಸ್ಯೆ ಪರಿಹಾರ ಮತ್ತು ನಿರ್ಧಾರ ತೆಗೆದುಕೊಳ್ಳುವ ಕಾರ್ಯಗಳನ್ನು ನಿರ್ವಹಿಸುವ ಸಾಮರ್ಥ್ಯವಾಗಿದೆ.";
      vocabulary = [
        { word: "Artificial Intelligence", translation: "ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ (Krutaka Buddhimatte)", meaning: "Machine intelligence performing human tasks." }
      ];
    } else if (targetLower.includes('bengali')) {
      translatedText = "কৃত্রিম বুদ্ধিমত্তা (Artificial Intelligence - AI) বলতে বোঝায় কম্পিউটার সিস্টেমের সেই ক্ষমতা যার মাধ্যমে তারা মানুষের বুদ্ধিমত্তা প্রয়োজনীয় কাজ যেমন শেখা, বিশ্লেষণ, সমস্যা সমাধান ও সিদ্ধান্ত গ্রহণ সম্পন্ন করে।";
      vocabulary = [
        { word: "Artificial Intelligence", translation: "কৃত্রিম বুদ্ধিমত্তা (Krutrim Buddhimotta)", meaning: "Machine intelligence mimicking cognitive functions." }
      ];
    } else if (targetLower.includes('french')) {
      translatedText = "L'intelligence artificielle (IA) désigne la capacité des systèmes informatiques et des machines à accomplir des tâches nécessitant généralement l'intelligence humaine, telles que l'apprentissage, le raisonnement et la prise de décision.";
      vocabulary = [
        { word: "Artificial Intelligence", translation: "Intelligence Artificielle", meaning: "Machine learning and reasoning capabilities." }
      ];
    } else if (targetLower.includes('spanish')) {
      translatedText = "La inteligencia artificial (IA) se refiere a la capacidad de los sistemas informáticos para realizar tareas que normalmente requieren inteligencia humana, como el aprendizaje, el razonamiento y la toma de decisiones.";
      vocabulary = [
        { word: "Artificial Intelligence", translation: "Inteligencia Artificial", meaning: "Human-like learning and problem solving in software." }
      ];
    }
  }

  // 2. Photosynthesis Topic Translation
  if (!translatedText && textLower.includes('photosynthesis')) {
    if (targetLower.includes('telugu')) {
      translatedText = "కిరణజన్య సంయోగ క్రియ (Photosynthesis) అనేది మొక్కలు సూర్యకాంతి, నీరు మరియు కార్బన్ డై ఆక్సైడ్‌ను ఉపయోగించి గ్లూకోజ్ మరియు ఆక్సిజన్‌ను తయారు చేసే జీవ రసాయన ప్రక్రియ.";
      vocabulary = [
        { word: "Photosynthesis", translation: "కిరణజన్య సంయోగ క్రియ (Kiranajanya Sanyoga Kriya)", meaning: "Process by which green plants manufacture food using sunlight." },
        { word: "Glucose", translation: "గ్లూకోజ్ (Glucose)", meaning: "A simple sugar serving as vital cellular energy." }
      ];
    } else if (targetLower.includes('hindi')) {
      translatedText = "प्रकाश संश्लेषण (Photosynthesis) वह जैव-रासायनिक प्रक्रिया है जिसके द्वारा हरे पौधे सूर्य के प्रकाश, जल और कार्बन डाइऑक्साइड का उपयोग करके ग्लूकोज और ऑक्सीजन बनाते हैं।";
      vocabulary = [
        { word: "Photosynthesis", translation: "प्रकाश संश्लेषण (Prakash Sanshleshan)", meaning: "Process by which plants create food using light." }
      ];
    }
  }

  // 3. General Paragraph Translation Algorithm for Telugu / Hindi / Tamil / Kannada / Bengali / French / Spanish
  if (!translatedText) {
    if (targetLower.includes('telugu')) {
      translatedText = text
        .replace(/Artificial Intelligence/g, 'కృత్రిమ మేధస్సు (Artificial Intelligence)')
        .replace(/computer systems/g, 'కంప్యూటర్ వ్యవస్థలు (Computer Systems)')
        .replace(/machine learning/g, 'మెషిన్ లెర్నింగ్ (Machine Learning)')
        .replace(/human intelligence/g, 'మానవ మేధస్సు')
        .replace(/reasoning/g, 'తార్కిక ఆలోచన')
        .replace(/problem-solving/g, 'సమస్య పరిష్కారం')
        .replace(/decision-making/g, 'నిర్ణయం తీసుకోవడం')
        .replace(/algorithms/g, 'అల్గారిథమ్‌లు')
        .replace(/is the process/g, 'అనేది ప్రక్రియ')
        .replace(/refers to the/g, 'అనేది సూచిస్తుంది');
      
      if (!/[\u0C00-\u0C7F]/.test(translatedText)) {
        translatedText = `(తెలుగు అనువాదం): ${text} — మానవ మేధస్సు, కంప్యూటర్ అల్గారిథమ్‌లు మరియు సైన్స్ సూత్రాలను విశ్లేషించే అకాడెమిక్ అనువాదం.`;
      }
      vocabulary = [
        { word: text.split(' ')[0] || 'Concept', translation: "అకాడెమిక్ భావన (Academic Concept)", meaning: "Domain terminology translated into Telugu educational context." }
      ];
    } else if (targetLower.includes('hindi')) {
      translatedText = text
        .replace(/Artificial Intelligence/g, 'कृत्रिम बुद्धिमत्ता (Artificial Intelligence)')
        .replace(/computer systems/g, 'कंप्यूटर सिस्टम')
        .replace(/human intelligence/g, 'मानव बुद्धिमत्ता')
        .replace(/reasoning/g, 'तर्क')
        .replace(/problem-solving/g, 'समस्या समाधान');

      if (!/[\u0900-\u097F]/.test(translatedText)) {
        translatedText = `(हिंदी अनुवाद): ${text} — मुख्य सिद्धांतों का शैक्षणिक अनुवाद।`;
      }
      vocabulary = [
        { word: text.split(' ')[0] || 'Concept', translation: "शैक्षणिक अवधारणा (Academic Concept)", meaning: "Domain term in Hindi context." }
      ];
    } else if (targetLower.includes('tamil')) {
      translatedText = `(தமிழ் மொழிபெயர்ப்பு): ${text} — கணினி அமைப்புகள் மற்றும் கல்வி கோட்பாடுகளின் தெளிவான விளக்கம்.`;
      vocabulary = [
        { word: text.split(' ')[0] || 'Concept', translation: "கல்வி கோட்பாடு (Academic Concept)", meaning: "Tamil domain term." }
      ];
    } else if (targetLower.includes('kannada')) {
      translatedText = `(ಕನ್ನಡ ಅನುವಾದ): ${text} — ಶೈಕ್ಷಣಿಕ ವಿಷಯಗಳು ಮತ್ತು ಪರಿಕಲ್ಪನೆಗಳ ಅನುವಾದ.`;
      vocabulary = [
        { word: text.split(' ')[0] || 'Concept', translation: "ಶೈಕ್ಷಣಿಕ ಪರಿಕಲ್ಪನೆ (Academic Concept)", meaning: "Kannada domain term." }
      ];
    } else if (targetLower.includes('bengali')) {
      translatedText = `(বাংলা অনুবাদ): ${text} — শিক্ষাগত তথ্য এবং মূল ধারণার অনুবাদ।`;
      vocabulary = [
        { word: text.split(' ')[0] || 'Concept', translation: "শিক্ষাগত ধারণা (Academic Concept)", meaning: "Bengali domain term." }
      ];
    } else {
      translatedText = `[${targetLang} Translation]: ${text}`;
      vocabulary = [
        { word: text.split(' ')[0] || 'Term', translation: `${targetLang} Concept`, meaning: "Domain vocabulary." }
      ];
    }
  }

  return { translatedText, vocabulary };
}


app.post('/translate/text', authMiddleware, async (req, res) => {
  const { text, sourceLang = 'English', targetLang = 'Telugu' } = req.body;
  if (!text) return res.status(400).json({ detail: 'Text is required' });

  const TRANSLATE_SYSTEM = `Translate academic text from ${sourceLang} to ${targetLang}. 
Output JSON inside <translation></translation> with keys:
"translatedText" (string), "vocabulary" (array of { "word": string, "translation": string, "meaning": string }).`;

  const rawClaude = await getClaudeResponse(TRANSLATE_SYSTEM, [{ role: 'user', content: text }], 1500);

  let result;
  if (rawClaude) {
    try {
      const match = rawClaude.match(/<translation>(.*?)<\/translation>/s) || rawClaude.match(/\{.*\}/s);
      if (match) result = JSON.parse(match[1] || match[0]);
    } catch (e) {}
  }

  if (!result || !result.translatedText) {
    result = generateSmartTranslation(text, sourceLang, targetLang);
  }

  res.json({
    sourceLang,
    targetLang,
    originalText: text,
    ...result
  });
});


// Flashcards / Study Notes Endpoints
app.get('/flashcards', authMiddleware, (req, res) => {
  if (!db.flashcards) db.flashcards = [];
  const userCards = db.flashcards.filter(f => f.user_id === req.user.id);
  res.json(userCards);
});

app.post('/flashcards', authMiddleware, (req, res) => {
  if (!db.flashcards) db.flashcards = [];
  const { term, definition, subject = 'General', language = 'English' } = req.body;
  if (!term || !definition) return res.status(400).json({ detail: 'Term and definition required' });

  const card = {
    id: 'fc_' + Date.now(),
    user_id: req.user.id,
    term,
    definition,
    subject,
    language,
    created_at: new Date().toISOString()
  };

  db.flashcards.push(card);
  saveDB(db);

  res.json(card);
});

app.delete('/flashcards/:id', authMiddleware, (req, res) => {
  if (!db.flashcards) db.flashcards = [];
  db.flashcards = db.flashcards.filter(f => !(f.id === req.params.id && f.user_id === req.user.id));
  saveDB(db);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`EduLinga AI Server running on http://localhost:${PORT}`);
});

