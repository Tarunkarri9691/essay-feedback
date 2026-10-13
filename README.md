# StudyMate AI (EduLinga)

A modern, production-grade, multilingual AI-powered educational platform featuring an intelligent conversational tutor, essay evaluation with OCR and PDF report export, 20-question quiz generator, contextual language translator, flashcard study decks, and learning analytics.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, KaTeX, Mermaid.js, jsPDF.
- **Backend**: Node.js, Express, ES Modules, JWT Authentication, Multer, Tesseract.js (OCR).
- **AI Core**: Google Gemini (`@google/generative-ai`), supporting advanced multi-turn tutoring and evaluation.
- **Storage**: Dual-engine persistence supporting **MongoDB Atlas** (via Mongoose) with automatic fallback to high-performance local JSON storage (`edulinga_db.json`).

---

## 📁 Project Directory Structure

```text
edulinga/
├── backend/
│   ├── data/
│   │   └── seed.json                 # Initial database template
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js                # Centralized environment validator
│   │   │   └── db.js                 # Dual-mode DB connector (MongoDB / JSON)
│   │   ├── controllers/              # Request handlers
│   │   │   ├── auth.controller.js
│   │   │   ├── tutor.controller.js
│   │   │   ├── essay.controller.js
│   │   │   ├── quiz.controller.js
│   │   │   ├── translate.controller.js
│   │   │   ├── flashcard.controller.js
│   │   │   └── dashboard.controller.js
│   │   ├── middleware/               # Auth, file upload, error handling
│   │   ├── prompts/                  # System prompts & adaptive fallbacks
│   │   ├── routes/                   # Clean Express REST endpoints
│   │   ├── services/                 # AI (Gemini), Storage DAO, Tesseract OCR
│   │   └── app.js                    # Express app initialization & middleware
│   ├── .env.example
│   ├── package.json
│   └── server.js                     # Server entrypoint
├── frontend/
│   ├── src/
│   │   ├── api/                      # Fetch client & token storage
│   │   ├── components/               # Common UI widgets, layout, markdown rendering
│   │   ├── constants/                # Language matrices & prompt suggestions
│   │   ├── features/                 # Modular feature domains:
│   │   │   ├── auth/                 # Login / Register modal
│   │   │   ├── tutor/                # Chat, streaming, CoT, audio
│   │   │   ├── essay/                # Essay analysis, OCR, PDF generation
│   │   │   ├── quiz/                 # 20-question adaptive quizzes
│   │   │   ├── translator/           # Side-by-side translation workspace
│   │   │   ├── flashcards/           # Interactive flip-card study decks
│   │   │   └── progress/             # Analytics dashboard & Recharts
│   │   ├── hooks/                    # Speech-to-text, text-to-speech, theme
│   │   ├── App.jsx                   # Concise root coordinator
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **Google Gemini API Key**: [Google AI Studio](https://aistudio.google.com/)

### 2. Backend Setup
1. Open a terminal in the `backend/` directory:
   ```bash
   cd backend
   npm install
   ```
2. Create `backend/.env` (see `backend/.env.example`):
   ```env
   PORT=8000
   GOOGLE_API_KEY=your_gemini_api_key
   JWT_SECRET=your_jwt_secret_key
   # Optional: If omitted, local JSON database (edulinga_db.json) is used automatically
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
   DB_NAME=edulinga
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   *Health Check: Visit `http://localhost:8000/health`*

### 3. Frontend Setup
1. In a second terminal, navigate to `frontend/`:
   ```bash
   cd frontend
   npm install
   ```
2. Create `frontend/.env` (optional, defaults to `http://localhost:8000`):
   ```env
   VITE_API_URL=http://localhost:8000
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔒 Security & Best Practices
- **Token Authorization**: Secure JWT-based auth stored in `localStorage` with Bearer headers.
- **Upload Guards**: Multer file size caps (5MB max) with image MIME verification.
- **Resilient AI Calling**: Built-in retry handling and guaranteed fallback generators for resilient offline/quota operations.
- **Git Hygiene**: Runtime databases (`edulinga_db.json`) and trained OCR binaries (`eng.traineddata`) are excluded from version control.
