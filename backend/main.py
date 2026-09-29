import os, re, json, datetime as dt
from bson import ObjectId
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
import bcrypt, jwt, anthropic
from dotenv import load_dotenv

load_dotenv()
db = AsyncIOMotorClient(os.getenv("MONGO_URI"))[os.getenv("DB_NAME", "edulinga_ai")]
llm = anthropic.AsyncAnthropic()
MODEL = os.getenv("MODEL", "claude-sonnet-5")
SECRET = os.getenv("JWT_SECRET", "dev")
app = FastAPI(title="EduLinga AI")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
bearer = HTTPBearer()

def now(): return dt.datetime.utcnow()
def clean(d):
    d["id"] = str(d.pop("_id"))
    for k in ("user_id", "conversation_id"):
        if k in d: d[k] = str(d[k])
    return d

async def user(cred=Depends(bearer)):
    try:
        uid = jwt.decode(cred.credentials, SECRET, algorithms=["HS256"])["sub"]
    except Exception:
        raise HTTPException(401, "Invalid or expired token")
    u = await db.users.find_one({"_id": ObjectId(uid)})
    if not u: raise HTTPException(401, "User not found")
    return u

def token(u):
    return jwt.encode({"sub": str(u["_id"]), "exp": now() + dt.timedelta(days=7)}, SECRET, algorithm="HS256")

class Reg(BaseModel):
    name: str; email: str; password: str; preferred_language: str = "English"
class Login(BaseModel):
    email: str; password: str
class Chat(BaseModel):
    message: str; conversation_id: str | None = None
    subject: str = "General"; difficulty: str = "Intermediate"; language: str = "English"

@app.on_event("startup")
async def idx():
    await db.users.create_index("email", unique=True)

@app.post("/auth/register")
async def register(b: Reg):
    if len(b.password) < 6: raise HTTPException(400, "Password must be at least 6 characters")
    doc = {"name": b.name, "email": b.email.lower(), "preferred_language": b.preferred_language,
           "password": bcrypt.hashpw(b.password.encode(), bcrypt.gensalt()), "created_at": now()}
    try: r = await db.users.insert_one(doc)
    except Exception: raise HTTPException(409, "Email already registered")
    doc["_id"] = r.inserted_id
    return {"token": token(doc), "name": b.name, "preferred_language": b.preferred_language}

@app.post("/auth/login")
async def login(b: Login):
    u = await db.users.find_one({"email": b.email.lower()})
    if not u or not bcrypt.checkpw(b.password.encode(), u["password"]):
        raise HTTPException(401, "Wrong email or password")
    return {"token": token(u), "name": u["name"], "preferred_language": u["preferred_language"]}

async def ask(system, messages, max_tokens=2000):
    r = await llm.messages.create(model=MODEL, max_tokens=max_tokens, system=system, messages=messages)
    return "".join(b.text for b in r.content if b.type == "text")

# Chain-of-thought pivot strategy: reason in English (strongest language), answer in the target language.
TUTOR = """You are a patient tutor for {subject} at {difficulty} level.
Process: first think step by step in English inside <reasoning></reasoning> (identify the concept, check facts,
plan simple steps, pick local examples). Then write the final student-facing reply inside <answer></answer>
entirely in {language} (keep technical terms with the English term in brackets). Use numbered steps, end with one
follow-up question to check understanding."""

@app.post("/tutor/chat")
async def chat(b: Chat, u=Depends(user)):
    if b.conversation_id:
        c = await db.conversations.find_one({"_id": ObjectId(b.conversation_id), "user_id": u["_id"]})
        if not c: raise HTTPException(404, "Conversation not found")
    else:
        c = {"user_id": u["_id"], "subject": b.subject, "messages": [], "created_at": now(), "title": b.message[:50]}
        c["_id"] = (await db.conversations.insert_one(c)).inserted_id
    hist = [{"role": m["role"], "content": m["raw"]} for m in c["messages"]][-12:]
    hist.append({"role": "user", "content": b.message})
    raw = await ask(TUTOR.format(subject=b.subject, difficulty=b.difficulty, language=b.language), hist)
    m = re.search(r"<answer>(.*?)(</answer>|$)", raw, re.S)
    answer = (m.group(1) if m else re.sub(r"<reasoning>.*?</reasoning>", "", raw, flags=re.S)).strip()
    await db.conversations.update_one({"_id": c["_id"]}, {"$push": {"messages": {"$each": [
        {"role": "user", "content": b.message, "raw": b.message, "language": b.language, "at": now()},
        {"role": "assistant", "content": answer, "raw": raw, "language": b.language, "at": now()}]}}})
    await db.progress.insert_one({"user_id": u["_id"], "type": "tutor", "subject": b.subject,
                                  "language": b.language, "date": now()})
    return {"conversation_id": str(c["_id"]), "answer": answer}

@app.get("/tutor/conversations")
async def convs(u=Depends(user)):
    cur = db.conversations.find({"user_id": u["_id"]}, {"title": 1, "subject": 1, "created_at": 1}).sort("created_at", -1).limit(30)
    return [clean(d) async for d in cur]

@app.get("/tutor/conversations/{cid}")
async def conv(cid: str, u=Depends(user)):
    c = await db.conversations.find_one({"_id": ObjectId(cid), "user_id": u["_id"]})
    if not c: raise HTTPException(404, "Not found")
    return {"id": cid, "messages": [{"role": m["role"], "content": m["content"]} for m in c["messages"]]}

ESSAY = """You are a strict, fair essay examiner. Think step by step inside <reasoning></reasoning> in English:
detect the essay language, then analyse grammar, spelling, structure, vocabulary, coherence and originality with
concrete evidence from the text. Then output ONLY one JSON object after </reasoning> with keys:
language (string), overall (0-100), grammar, vocabulary, coherence, structure, originality (each 0-100 integers),
strengths (list of strings), improvements (list of strings), suggestions (list of strings),
corrections (list of {{"original":..., "fixed":..., "why":...}}, max 6).
Write all feedback text in {fb_lang}. Scores must be consistent with the evidence; do not inflate."""

@app.post("/essays/evaluate")
async def evaluate(title: str = Form("Untitled"), content: str = Form(""), feedback_language: str = Form("English"),
                   file: UploadFile | None = File(None), u=Depends(user)):
    if file: content = (await file.read()).decode("utf-8", errors="ignore")
    if len(content.split()) < 30: raise HTTPException(400, "Essay must be at least 30 words")
    raw = await ask(ESSAY.format(fb_lang=feedback_language), [{"role": "user", "content": content[:12000]}], 3000)
    j = re.search(r"\{.*\}", raw.split("</reasoning>")[-1], re.S)
    if not j: raise HTTPException(502, "Model returned no feedback. Try again.")
    fb = json.loads(j.group(0))
    doc = {"user_id": u["_id"], "title": title, "content": content, "language": fb.get("language"),
           "score": fb.get("overall"), "feedback": fb, "created_at": now()}
    r = await db.essays.insert_one(doc)
    await db.progress.insert_one({"user_id": u["_id"], "type": "essay", "score": fb.get("overall"),
                                  "language": fb.get("language"), "date": now()})
    return {"id": str(r.inserted_id), "title": title, **fb}

@app.get("/essays")
async def essays(u=Depends(user)):
    cur = db.essays.find({"user_id": u["_id"]}, {"content": 0}).sort("created_at", -1).limit(50)
    return [clean(d) async for d in cur]

@app.get("/dashboard")
async def dash(u=Depends(user)):
    q = await db.progress.count_documents({"user_id": u["_id"], "type": "tutor"})
    es = [e async for e in db.essays.find({"user_id": u["_id"]}).sort("created_at", 1)]
    langs = set(await db.progress.distinct("language", {"user_id": u["_id"]}))
    sc = [e["score"] for e in es if isinstance(e.get("score"), (int, float))]
    return {"questions": q, "essays": len(es), "languages": len([l for l in langs if l]),
            "avg_score": round(sum(sc) / len(sc), 1) if sc else 0,
            "trend": [{"title": e["title"][:14], "score": e["score"], **{k: e["feedback"].get(k) for k in
                      ("grammar", "vocabulary", "coherence", "structure", "originality")}} for e in es]}
