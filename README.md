# EduLinga AI
React + Vite + Tailwind | FastAPI | MongoDB | JWT + bcrypt | Recharts | Claude API

## Run
1. MongoDB running locally (or an Atlas URI).
2. Backend:
   cd backend && python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt && cp .env.example .env   # fill in keys
   uvicorn main:app --reload --port 8000
3. Frontend:
   cd frontend && npm install && npm run dev   # http://localhost:5173
   (set VITE_API=https://your-backend for deployment)

## How the multilingual reasoning works
Chain-of-thought pivot: the model reasons step by step in English (its strongest language),
then writes the student-facing answer/feedback in the chosen low-resource language (Telugu, Hindi, ...).
Reasoning is stored but never shown to students.

## Collections
users, conversations, essays (feedback embedded), progress
