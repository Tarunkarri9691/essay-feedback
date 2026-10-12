# EduLinga AI
React + Vite + Tailwind | Node.js + Express | MongoDB/JSON storage | JWT + bcrypt | Recharts | Claude API

## Run
1. Configure `backend/.env` with `ANTHROPIC_API_KEY`. `MODEL` is optional and defaults to `claude-sonnet-5-5`.
2. Backend (PowerShell):
   ```powershell
   cd backend
   npm install
   npm run dev
   ```
3. Frontend, in a second terminal:
   ```powershell
   cd frontend
   npm install
   npm run dev -- --host 0.0.0.0
   ```
   Open http://localhost:5173. Set `VITE_API` when pointing the frontend at a separately hosted backend.

## Multilingual tutoring
Choose a response language and difficulty in the tutor header. The tutor is prompted to reply only in the selected language, including when the question is written in another language or transliterated text.

## Collections
users, conversations, essays (feedback embedded), progress
