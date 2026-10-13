export function getQuizPrompt(subject, difficulty, language, count = 20, seed = '') {
  let diffSpec = '';
  const diffLower = (difficulty || 'Intermediate').toLowerCase();
  if (diffLower.includes('beginner')) {
    diffSpec = `
- LEVEL: BEGINNER (Foundational & Conceptual)
- Focus on elementary concepts, core definitions, basic terminology, identification, and straightforward scenarios.
- Make questions accessible, clear, and encouraging for a beginner.`;
  } else if (diffLower.includes('advanced')) {
    diffSpec = `
- LEVEL: ADVANCED (In-depth Mastery & Technical Rigor)
- Focus on deep architectural mechanisms, mathematical/algorithmic foundations, edge cases, system trade-offs, debugging scenarios, and performance optimization.
- Distractors must be plausible, challenging, and test true mastery.`;
  } else {
    diffSpec = `
- LEVEL: INTERMEDIATE (Application & Analysis)
- Focus on practical implementations, comparing techniques, cause-and-effect relationships, and multi-step problem solving.
- Questions should challenge the learner to apply principles rather than just recite definitions.`;
  }

  return `You are an elite academic professor and multilingual quiz author.
Create a comprehensive test of exactly ${count} multiple-choice questions on "${subject}" at the "${difficulty}" level.

LANGUAGE MANDATE:
- The question texts, all 4 options, and explanations MUST be written in ${language}.
- When technical terms or proper nouns appear, you may include the Latin/English term in parentheses for clarity (e.g., in Telugu: 'మెషిన్ లెర్నింగ్ (Machine Learning)').

${diffSpec}

RANDOMIZATION & FRESHNESS (Seed: ${seed}):
- Generate a completely fresh and unique set of ${count} questions covering diverse facets of "${subject}".
- Vary question formats (e.g. "What is...", "Which scenario best illustrates...", "What will happen if...", "Identify the primary benefit of...", "Which technique addresses...").
- Exactly 4 options per question (indices 0 to 3), with randomize the correct answer position across questions.
- Provide a clear, educational explanation in ${language} for why the correct answer is right.

Output valid JSON matching this exact schema:
{
  "title": "${subject} Quiz (${difficulty})",
  "subject": "${subject}",
  "difficulty": "${difficulty}",
  "language": "${language}",
  "questions": [
    {
      "id": 1,
      "question": "Question in ${language}...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIndex": 0,
      "explanation": "Explanation in ${language}..."
    }
  ]
}`;
}

export function generateFallbackQuiz(topic, subject, difficulty, language, count = 20, seed = '') {
  const isTelugu = (language || '').toLowerCase().includes('telugu');
  const isHindi = (language || '').toLowerCase().includes('hindi');
  const isTamil = (language || '').toLowerCase().includes('tamil');
  const activeTopic = topic || subject || 'General Knowledge';
  const diff = difficulty || 'Intermediate';

  const seedNum = parseInt(seed) || Date.now();
  const offset = seedNum % 4;

  const questions = [];

  const subtopics = [
    { en: 'Core Principles', te: 'ప్రాథమిక సూత్రాలు', hi: 'मूल सिद्धांत', ta: 'அடிப்படை கோட்பாடுகள்' },
    { en: 'Architecture & Design', te: 'నిర్మాణం మరియు రూపకల్పన', hi: 'संरचना और डिज़ाइन', ta: 'கட்டமைப்பு மற்றும் வடிவமைப்பு' },
    { en: 'Practical Application', te: 'ఆచరణాత్మక వినియోగం', hi: 'व्यावहारिक अनुप्रयोग', ta: 'நடைமுறை பயன்பாடு' },
    { en: 'Problem Solving & Logic', te: 'సమస్య పరిష్కార తర్కం', hi: 'समस्या समाधान तर्क', ta: 'சிக்கல் தீர்க்கும் தர்க்கம்' },
    { en: 'Optimization & Efficiency', te: 'ఆప్టిమైజేషన్ మరియు సామర్థ్యం', hi: 'अनुकूलन और दक्षता', ta: 'உகப்பாக்கம் மற்றும் செயல்திறன்' },
    { en: 'Error Handling & Edge Cases', te: 'ఎర్రర్ నిర్వహణ మరియు అంచులు', hi: 'त्रुटि निवारण', ta: 'பிழை கையாளுதல்' },
    { en: 'Historical Evolution', te: 'చారిత్రక పరిణామం', hi: 'ऐतिहासिक विकास', ta: 'வரலாற்று பரிணாமம்' },
    { en: 'Security & Integrity', te: 'భద్రత మరియు సమగ్రత', hi: 'सुरक्षा और अखंडता', ta: 'பாதுகாப்பு மற்றும் ஒருமைப்பாடு' },
    { en: 'Data Flow & Transformation', te: 'డేటా ప్రవాహం మరియు మార్పిడి', hi: 'डेटा प्रवाह और रूपांतरण', ta: 'தரவு ஓட்டம் மற்றும் மாற்றம்' },
    { en: 'System Integration', te: 'వ్యవస్థ సమన్వయం', hi: 'प्रणाली एकीकरण', ta: 'அமைப்பு ஒருங்கிணைப்பு' },
    { en: 'Evaluation Metrics', te: 'మూల్యాంకన ప్రమాణాలు', hi: 'मूल्यांकन मेट्रिक्स', ta: 'மதிப்பீட்டு அளவீடுகள்' },
    { en: 'Scalability & Growth', te: 'స్కేలబిలిటీ మరియు వృద్ధి', hi: 'मापनीयता और विकास', ta: 'அளவிடுதல் மற்றும் வளர்ச்சி' },
    { en: 'Future Trends & Research', te: 'భవిష్యత్ పోకడలు', hi: 'भविष्य के रुझान', ta: 'எதிர்கால போக்குகள்' },
    { en: 'Industry Standards', te: 'పరిశ్రమ ప్రమాణాలు', hi: 'उद्योग मानक', ta: 'தொழில்துறை தரநிலைகள்' },
    { en: 'Common Pitfalls', te: 'సాధారణ లోపాలు', hi: 'सामान्य गलतियाँ', ta: 'பொதுவான தவறுகள்' },
    { en: 'Theoretical Foundations', te: 'సిద్ధాంత పునాదులు', hi: 'सैद्धांतिक आधार', ta: 'கோட்பாட்டு அடிப்படைகள்' },
    { en: 'Comparative Analysis', te: 'తులనాత్మక విశ్లేషణ', hi: 'तुलनात्मक विश्लेषण', ta: 'ஒப்பீட்டு பகுப்பாய்வு' },
    { en: 'Component Interaction', te: 'భాగాల పరస్పర చర్య', hi: 'घटक सहभागिता', ta: 'கூறு தொடர்பு' },
    { en: 'Lifecycle Management', te: 'జీవిత చక్ర నిర్వహణ', hi: 'जीवन चक्र प्रबंधन', ta: 'வாழ்க்கை சுழற்சி மேலாண்மை' },
    { en: 'Best Practices', te: 'ఉత్తమ అభ్యాసాలు', hi: 'सर्वोत्तम प्रथाएँ', ta: 'சிறந்த நடைமுறைகள்' }
  ];

  for (let i = 0; i < count; i++) {
    const sub = subtopics[(i + offset) % subtopics.length];
    const subName = isTelugu ? sub.te : isHindi ? sub.hi : isTamil ? sub.ta : sub.en;
    const correctIdx = (i + offset) % 4;

    let qText = '';
    let options = [];
    let explanation = '';

    if (diff.toLowerCase().includes('beginner')) {
      if (isTelugu) {
        qText = `${activeTopic} లో '${subName}' కి సంబంధించి ప్రాథమిక భావన ఏది? (ప్రశ్న ${i + 1})`;
        options = [
          `నిర్దిష్ట లక్ష్యాన్ని సాధించడానికి ఆధారపడే మౌలిక సిద్ధాంతం`,
          `యాదృచ్ఛికంగా ఊహించే తాత్కాలిక ఆలోచన`,
          `పరిశీలించని సమాచారాల సంకలనం`,
          `సంబంధం లేని బాహ్య పరికరం`
        ];
        explanation = `${activeTopic} లో ప్రాథమిక సూత్రాలు లక్ష్య సాధనకు మూలస్తంభంగా నిలుస్తాయి.`;
      } else if (isHindi) {
        qText = `${activeTopic} में '${subName}' से संबंधित मूल अवधारणा क्या है? (प्रश्न ${i + 1})`;
        options = [
          `लक्ष्य प्राप्त करने का आधारभूत सिद्धांत`,
          `यादृच्छिक अनुमान`,
          `अनावश्यक विवरण`,
          `असंबंधित तत्व`
        ];
        explanation = `आधारभूत सिद्धांत समस्या समाधान की नींव रखते हैं।`;
      } else if (isTamil) {
        qText = `${activeTopic} பாடத்தில் '${subName}' தொடர்பான அடிப்படை கருத்து யாது? (கேள்வி ${i + 1})`;
        options = [
          `இலக்கை அடைய உதவும் அடிப்படைக் கொள்கை`,
          `தோராயமான ஊகம்`,
          `தேவையற்ற விவரங்கள்`,
          `தொடர்பற்ற பொருள்`
        ];
        explanation = `அடிப்படைக் கொள்கை துல்லியமான புரிதலை வழங்குகிறது.`;
      } else {
        qText = `In ${activeTopic}, what is the foundational concept regarding ${subName}? (Question ${i + 1})`;
        options = [
          `The core foundational principle that guides systematic execution`,
          `An arbitrary assumption without empirical support`,
          `An unrelated superficial metric`,
          `An obsolete legacy practice`
        ];
        explanation = `Foundational principles establish systematic correctness.`;
      }
    } else if (diff.toLowerCase().includes('advanced')) {
      if (isTelugu) {
        qText = `${activeTopic} లో సంక్లిష్ట సమస్యను పరిష్కరించేటప్పుడు '${subName}' పరంగా ఎదురయ్యే ప్రధాన సవాలు లేదా ట్రేడ్-ఆఫ్ ఏమిటి? (ప్రశ్న ${i + 1})`;
        options = [
          `పరిమితులు, వనరుల వినియోగం మరియు ఖచ్చితత్వం మధ్య సరైన సమతుల్యత సాధించడం`,
          `వ్యవస్థను పూర్తిగా నిలిపివేయడం`,
          `అన్ని కొలమానాలను విస్మరించడం`,
          `ప్రాథమిక నియమాలను తొలగించడం`
        ];
        explanation = `అధునాతన స్థాయిలో వనరుల ఆప్టిమైజేషన్ మరియు ఖచ్చితత్వం మధ్య బ్యాలెన్స్ అత్యంత కీలకం.`;
      } else if (isHindi) {
        qText = `${activeTopic} में जटिल परिदृश्यों में '${subName}' के अंतर्गत मुख्य ट्रेड-ऑफ क्या है? (प्रश्न ${i + 1})`;
        options = [
          `संसाधनों की दक्षता और सटीकता के बीच संतुलन स्थापित करना`,
          `सिस्टम को बंद करना`,
          `मापों की उपेक्षा करना`,
          `नियमों को मिटाना`
        ];
        explanation = `उन्नत स्तर पर सटीकता और संसाधन प्रबंधन का संतुलन आवश्यक है।`;
      } else if (isTamil) {
        qText = `${activeTopic} உயர்நிலை சிக்கல்களில் '${subName}' சார்ந்த முக்கிய தேர்வு யாது? (கேள்வி ${i + 1})`;
        options = [
          `வளங்களின் திறன் மற்றும் துல்லியத்திற்கு இடையே சமநிலை பேணல்`,
          `அமைப்பை நிறுத்துதல்`,
          `விதிமுறைகளை புறக்கணித்தல்`,
          `தவறான தரவு பயன்பாடு`
        ];
        explanation = `மேம்பட்ட மட்டத்தில் திறன் மற்றும் துல்லியத்தின் சமநிலை இன்றியமையாதது.`;
      } else {
        qText = `In advanced ${activeTopic}, what is the primary algorithmic tradeoff regarding ${subName}? (Question ${i + 1})`;
        options = [
          `Balancing computational resource complexity against precision and scalability`,
          `Blindly reducing all data dimensions`,
          `Disregarding convergence bounds completely`,
          `Sacrificing determinism without empirical justification`
        ];
        explanation = `Advanced engineering requires balancing throughput, precision, and latency constraints.`;
      }
    } else {
      if (isTelugu) {
        qText = `${activeTopic} లో '${subName}' ని ఆచరణలో సమర్థవంతంగా అమలు చేయడానికి ఉత్తమ విధానం ఏది? (ప్రశ్న ${i + 1})`;
        options = [
          `దశలవారీ విశ్లేషణ, నమూనా పరీక్ష మరియు క్రమబద్ధమైన ఆప్టిమైజేషన్`,
          `హడావుడి నిర్ణయాలు తీసుకోవడం`,
          `పరిశీలనలు లేకుండా ఊహించడం`,
          `పాత పద్ధతులను గుడ్డిగా అనుసరించడం`
        ];
        explanation = `దశలవారీ విశ్లేషణ మరియు క్రమబద్ధమైన ఆప్టిమైజేషన్ ఖచ్చితమైన ఫలితాలను అందిస్తుంది.`;
      } else if (isHindi) {
        qText = `${activeTopic} में '${subName}' को प्रभावी ढंग से लागू करने का सर्वोत्तम तरीका क्या है? (प्रश्न ${i + 1})`;
        options = [
          `चरणबद्ध विश्लेषण, परीक्षण और व्यवस्थित अनुकूलन`,
          `जल्दबाज़ी में निष्कर्ष निकालना`,
          `पूर्वाग्रह पर भरोसा करना`,
          `बिना सोचे-समझे नकल करना`
        ];
        explanation = `चरणबद्ध विश्लेषण सटीकता और विश्वसनीयता सुनिश्चित करता है।`;
      } else if (isTamil) {
        qText = `${activeTopic} பாடத்தில் '${subName}' அம்சத்தை செயல்படுத்த சிறந்த முறை எது? (கேள்வி ${i + 1})`;
        options = [
          `படிபடியான பகுப்பாய்வு, சோதனை மற்றும் உகப்பாக்கம்`,
          `அவசர முடிவு எடுத்தல்`,
          `ஊகங்களை நம்புதல்`,
          `பழைய முறைகளை கண்மூடித்தனமாக பின்பற்றுதல்`
        ];
        explanation = `படிபடியான பகுப்பாய்வு நம்பகமான தீர்வை அளிக்கிறது.`;
      } else {
        qText = `In ${activeTopic}, which analytical method provides the best outcome for ${subName}? (Question ${i + 1})`;
        options = [
          `Structured step-by-step validation, empirical testing, and iterative refinement`,
          `Hasty generalization based on incomplete samples`,
          `Relying purely on undocumented intuition`,
          `Ignoring system feedback loops`
        ];
        explanation = `Structured empirical validation and iterative testing guarantees robust results.`;
      }
    }

    const correctOpt = options[0];
    const otherOpts = options.slice(1);
    const shuffledOpts = [];
    let otherPtr = 0;
    for (let c = 0; c < 4; c++) {
      if (c === correctIdx) {
        shuffledOpts.push(correctOpt);
      } else {
        shuffledOpts.push(otherOpts[otherPtr++]);
      }
    }

    questions.push({
      id: i + 1,
      question: qText,
      options: shuffledOpts,
      answerIndex: correctIdx,
      explanation
    });
  }

  return {
    id: 'qz_' + Date.now(),
    title: `${activeTopic} Quiz (${diff})`,
    subject: activeTopic,
    difficulty: diff,
    language: language || 'English',
    questions
  };
}
