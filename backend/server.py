from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
import secrets
import bcrypt
import jwt
import requests
import json
import re
from io import BytesIO
from datetime import datetime, timezone, timedelta
from typing import Optional, List

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File, Header, Query
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

# Emergent integrations — used for Whisper (audio→text) and Claude Sonnet 4.5 (text→clip ideas)
from emergentintegrations.llm.openai import OpenAISpeechToText
from emergentintegrations.llm.chat import LlmChat, UserMessage

# ---------- ENV / DB ----------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
APP_NAME = os.environ.get("APP_NAME", "clipforge")

STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
storage_key = None

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ---------- APP ----------
app = FastAPI(title="ClipForge AI API")
api_router = APIRouter(prefix="/api")


# ---------- HELPERS ----------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    return jwt.encode({"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=60), "type": "access"}, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    return jwt.encode({"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}, JWT_SECRET, algorithm=JWT_ALGORITHM)

def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")

def clear_auth_cookies(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage unavailable")
    resp = requests.put(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key, "Content-Type": content_type}, data=data, timeout=300)
    resp.raise_for_status()
    return resp.json()


def get_object(path: str) -> tuple:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage unavailable")
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=120)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ---------- MODELS ----------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class GoogleAuthIn(BaseModel):
    email: EmailStr
    name: str
    avatar: Optional[str] = None

class ClipCreateIn(BaseModel):
    title: str
    source_video_id: Optional[str] = None
    duration_seconds: Optional[int] = 60

class ClipUpdateIn(BaseModel):
    title: Optional[str] = None
    caption_style: Optional[str] = None
    is_exported: Optional[bool] = None


# ---------- MOCK AI DATA ----------
MOCK_TRANSCRIPT_SEGMENTS = [
    {"start": 0.0, "end": 4.2, "text": "What if I told you that the single biggest mistake creators make..."},
    {"start": 4.2, "end": 8.5, "text": "is treating short-form like a shrunken version of their long-form content."},
    {"start": 8.5, "end": 12.8, "text": "Algorithms reward emotional density in the first three seconds."},
    {"start": 12.8, "end": 17.4, "text": "If your hook doesn't slap, your video is dead on arrival."},
    {"start": 17.4, "end": 22.1, "text": "Here are the three patterns that consistently break a million views."},
    {"start": 22.1, "end": 27.6, "text": "Pattern one: open with a contradiction the viewer can't ignore."},
    {"start": 27.6, "end": 33.0, "text": "Pattern two: use motion in the first frame, never a static shot."},
    {"start": 33.0, "end": 38.9, "text": "Pattern three: end on a question that pulls them straight back to the start."},
]

MOCK_CLIP_SUGGESTIONS = [
    {"start": 0.0, "end": 38.9, "score": 96, "reason": "Strong hook with pattern-interrupt opening", "title": "The 3 hooks that broke a million views"},
    {"start": 17.4, "end": 55.0, "score": 89, "reason": "Clear value list, high retention curve", "title": "Three viral patterns creators sleep on"},
    {"start": 27.6, "end": 62.5, "score": 84, "reason": "Specific tactical advice, save-worthy", "title": "Never start your Reel with a static shot"},
    {"start": 41.0, "end": 78.4, "score": 78, "reason": "Curiosity loop ending, drives loops", "title": "Why your Reels die in the first 2 seconds"},
]

MOCK_TITLE_HOOKS = [
    "POV: You finally cracked the YouTube Shorts algorithm",
    "The 3-second rule that 10x'd my Reels",
    "Stop posting until you watch this",
    "Why your podcast clips aren't going viral (yet)",
    "This editing pattern hit 4M views in 12 hours",
    "Streamers, you're leaving views on the table",
]


# ---------- AUTH ROUTES ----------
@api_router.post("/auth/register")
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": email,
        "name": payload.name,
        "password_hash": hash_password(payload.password),
        "role": "user",
        "plan": "free",
        "avatar": None,
        "provider": "email",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user)
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    return {"id": user_id, "email": email, "name": payload.name, "role": "user", "plan": "free", "avatar": None}


@api_router.post("/auth/login")
async def login(payload: LoginIn, response: Response):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    access = create_access_token(user["id"], email)
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return {"id": user["id"], "email": user["email"], "name": user["name"], "role": user.get("role", "user"), "plan": user.get("plan", "free"), "avatar": user.get("avatar")}


@api_router.post("/auth/google")
async def google_auth(payload: GoogleAuthIn, response: Response):
    """Emergent-managed Google Auth — simplified flow for v1. Frontend posts user profile after social pop-up."""
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user:
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "email": email,
            "name": payload.name,
            "password_hash": hash_password(secrets.token_urlsafe(32)),
            "role": "user",
            "plan": "free",
            "avatar": payload.avatar,
            "provider": "google",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(user)
    access = create_access_token(user["id"], email)
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return {"id": user["id"], "email": user["email"], "name": user["name"], "role": user.get("role", "user"), "plan": user.get("plan", "free"), "avatar": user.get("avatar")}


@api_router.post("/auth/logout")
async def logout(response: Response, user: dict = Depends(get_current_user)):
    clear_auth_cookies(response)
    return {"ok": True}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# ---------- VIDEO + CLIPS ----------
@api_router.post("/videos/upload")
async def upload_video(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "mp4"
    if ext not in ("mp4", "mov", "webm", "mkv", "m4v"):
        raise HTTPException(status_code=400, detail="Unsupported video format")
    video_id = str(uuid.uuid4())
    path = f"{APP_NAME}/uploads/{user['id']}/{video_id}.{ext}"
    data = await file.read()
    if len(data) > 500 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 500MB)")
    try:
        result = put_object(path, data, file.content_type or "video/mp4")
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail="Upload failed")
    doc = {
        "id": video_id,
        "user_id": user["id"],
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result.get("size", len(data)),
        "duration_seconds": 600,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.videos.insert_one(doc)
    return {"id": video_id, "original_filename": file.filename, "size": doc["size"]}


@api_router.get("/videos/{video_id}/stream")
async def stream_video(video_id: str, auth: Optional[str] = Query(None), authorization: Optional[str] = Header(None)):
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
    elif auth:
        token = auth
    if not token:
        raise HTTPException(status_code=401, detail="Auth required")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload["sub"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    video = await db.videos.find_one({"id": video_id, "user_id": user_id, "is_deleted": False}, {"_id": 0})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    data, ct = get_object(video["storage_path"])
    return Response(content=data, media_type=video.get("content_type") or ct)


@api_router.post("/ai/transcript")
async def gen_transcript(body: dict, user: dict = Depends(get_current_user)):
    """Mocked transcript generation."""
    return {"segments": MOCK_TRANSCRIPT_SEGMENTS, "language": "en"}


@api_router.post("/ai/suggestions")
async def gen_suggestions(body: dict, user: dict = Depends(get_current_user)):
    """Mocked AI clip suggestions."""
    return {"clips": MOCK_CLIP_SUGGESTIONS, "viral_titles": MOCK_TITLE_HOOKS}


# ---------- REAL AI: Whisper + Claude Sonnet 4.5 ----------
MAX_ANALYZE_BYTES = 25 * 1024 * 1024  # 25MB — matches Whisper file-size limit
ALLOWED_ANALYZE_EXTS = {"mp4", "mov", "mp3", "wav", "m4a", "webm", "mpeg", "mpga"}
ALLOWED_CAPTION_STYLES = {"Clean", "Bold", "Meme", "Educational"}
ALLOWED_PLATFORMS = {"TikTok", "YouTube Shorts", "Instagram Reels"}

CLIP_SYSTEM_PROMPT = """You are Hookify, an AI clip strategist. Given a transcript of a long-form podcast/stream/video with second-level timestamps, identify 3-5 of the strongest moments to clip into 30-90 second short-form videos for TikTok, YouTube Shorts, or Instagram Reels.

Return STRICTLY valid JSON in this exact shape, with NO surrounding markdown, NO code fences, NO commentary:
{
  "suggestions": [
    {
      "start_seconds": <integer>,
      "end_seconds": <integer>,
      "title": "<short title idea, max 60 chars>",
      "hook": "<first-line hook the creator should open with, max 120 chars>",
      "caption_text": "<2-5 short lines of on-screen caption, use \\n line breaks, no emoji spam>",
      "caption_style": "<one of: Clean, Bold, Meme, Educational>",
      "platform": "<one of: TikTok, YouTube Shorts, Instagram Reels>",
      "reason": "<one honest sentence on why this moment will pop>",
      "confidence": <integer 0-100>
    }
  ]
}

Rules:
- Each clip must be 30 to 90 seconds long.
- start_seconds and end_seconds MUST come from timestamps you see in the transcript.
- Confidence is honest: 90+ = strong viral candidate, 70-89 = solid pick, below 70 = decent but optional.
- Sort suggestions by confidence descending.
- Return 3 to 5 suggestions, never more, never fewer than 3 — if the source is too short or thin, still return your three best moments.
- Do not invent content not present in the transcript."""


def _safe_str(v, default=""):
    return str(v).strip() if v is not None else default


def _coerce_suggestion(s, transcript_duration):
    """Normalise a single suggestion dict so the frontend can render it safely."""
    try:
        start = max(0, int(round(float(s.get("start_seconds", 0)))))
        end = max(start + 1, int(round(float(s.get("end_seconds", start + 30)))))
        if transcript_duration:
            end = min(end, int(round(float(transcript_duration))))
        duration = max(0, end - start)
        title = _safe_str(s.get("title"))[:80] or "Untitled clip idea"
        hook = _safe_str(s.get("hook"))[:200] or title
        caption_text = _safe_str(s.get("caption_text"))[:400] or hook
        caption_style = _safe_str(s.get("caption_style"), "Bold")
        if caption_style not in ALLOWED_CAPTION_STYLES:
            caption_style = "Bold"
        platform = _safe_str(s.get("platform"), "TikTok")
        if platform not in ALLOWED_PLATFORMS:
            platform = "TikTok"
        confidence = int(round(float(s.get("confidence", 75))))
        confidence = max(0, min(100, confidence))
        reason = _safe_str(s.get("reason"))[:240] or "Strong standalone moment with a clear hook."
        return {
            "id": f"real-{uuid.uuid4().hex[:8]}",
            "start_seconds": start,
            "end_seconds": end,
            "duration_seconds": duration,
            "title": title,
            "hook": hook,
            "caption_text": caption_text,
            "caption_style": caption_style,
            "platform": platform,
            "reason": reason,
            "confidence": confidence,
        }
    except Exception:
        return None


def _extract_json(raw_text):
    """LLMs sometimes wrap JSON in code fences; strip and parse defensively."""
    txt = raw_text.strip()
    if txt.startswith("```"):
        txt = re.sub(r"^```(?:json)?\s*", "", txt)
        txt = re.sub(r"\s*```$", "", txt)
    # Fallback: find first { ... last }
    if not txt.startswith("{"):
        m = re.search(r"\{[\s\S]*\}", txt)
        if m:
            txt = m.group(0)
    return json.loads(txt)


@api_router.post("/ai/analyze")
async def ai_analyze(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Real AI pipeline: Whisper transcription → Claude Sonnet 4.5 clip suggestions."""
    if not EMERGENT_KEY:
        raise HTTPException(status_code=503, detail="AI not configured. EMERGENT_LLM_KEY missing on server.")

    # ---- 1. Validate ----
    filename = file.filename or "upload"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_ANALYZE_EXTS:
        raise HTTPException(status_code=400, detail=f"Unsupported format '.{ext}'. Use mp4, mov, mp3, wav, or m4a.")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file.")
    if len(data) > MAX_ANALYZE_BYTES:
        raise HTTPException(status_code=413, detail="File too large. The MVP limit is 25 MB. Trim or compress your file and try again.")

    # ---- 2. Whisper transcription ----
    # Whisper supports mp3/mp4/mpeg/mpga/m4a/wav/webm. .mov containers usually work
    # when passed with an .mp4 extension hint to the API.
    send_ext = "mp4" if ext == "mov" else ext
    buf = BytesIO(data)
    buf.name = f"upload.{send_ext}"

    try:
        stt = OpenAISpeechToText(api_key=EMERGENT_KEY)
        transcript = await stt.transcribe(
            file=buf,
            model="whisper-1",
            response_format="verbose_json",
            timestamp_granularities=["segment"],
        )
    except Exception as e:
        logger.error(f"Whisper transcription failed: {e}")
        raise HTTPException(status_code=502, detail=f"Transcription failed. {str(e)[:200]}")

    # Normalise transcript segments (Whisper SDK may return dicts OR objects).
    raw_segments = getattr(transcript, "segments", None) or []
    segments = []
    for seg in raw_segments:
        try:
            if isinstance(seg, dict):
                start = float(seg.get("start", 0))
                end = float(seg.get("end", 0))
                text = _safe_str(seg.get("text", ""))
            else:
                start = float(getattr(seg, "start", 0))
                end = float(getattr(seg, "end", 0))
                text = _safe_str(getattr(seg, "text", ""))
            if text:
                segments.append({"start": start, "end": end, "text": text})
        except Exception:
            continue

    full_text = _safe_str(getattr(transcript, "text", "")) or " ".join(s["text"] for s in segments)
    duration = float(getattr(transcript, "duration", 0)) or (segments[-1]["end"] if segments else 0)
    language = _safe_str(getattr(transcript, "language", "en")) or "en"
    logger.info(f"Whisper OK: {len(segments)} segments, {len(full_text)} chars, {duration:.1f}s")

    if not segments and not full_text:
        raise HTTPException(status_code=422, detail="Transcription returned no usable text. Try a longer or clearer recording.")

    # ---- 3. Build LLM prompt ----
    if segments:
        ts_lines = [f"[{s['start']:.1f}s-{s['end']:.1f}s] {s['text']}" for s in segments if s["text"]]
        transcript_for_llm = "\n".join(ts_lines)
    else:
        transcript_for_llm = f"[0.0s-{duration:.1f}s] {full_text}"

    # Cap prompt size to avoid blowing context (Claude 4.5 has plenty, but be sensible).
    if len(transcript_for_llm) > 60000:
        transcript_for_llm = transcript_for_llm[:60000] + "\n\n[…transcript truncated for analysis…]"

    user_prompt = (
        f"Source duration: {duration:.1f}s. Language: {language}.\n\n"
        f"TRANSCRIPT (with second-level timestamps):\n\n{transcript_for_llm}\n\n"
        "Generate the JSON now. No commentary, no markdown — JSON only."
    )

    # ---- 4. Claude Sonnet 4.5 ----
    try:
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"hookify-analyze-{user['id']}-{uuid.uuid4().hex[:8]}",
            system_message=CLIP_SYSTEM_PROMPT,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        response_text = await chat.send_message(UserMessage(text=user_prompt))
    except Exception as e:
        logger.error(f"Claude analysis failed: {e}")
        raise HTTPException(status_code=502, detail=f"AI analysis failed. {str(e)[:200]}")

    # ---- 5. Parse + coerce ----
    try:
        parsed = _extract_json(response_text)
    except Exception:
        logger.error(f"AI returned non-JSON: {response_text[:400]}")
        raise HTTPException(status_code=502, detail="AI returned an unreadable response. Please retry.")

    raw_suggestions = parsed.get("suggestions") or []
    cleaned = []
    for s in raw_suggestions[:5]:
        cs = _coerce_suggestion(s, duration)
        if cs:
            cleaned.append(cs)
    cleaned.sort(key=lambda x: x["confidence"], reverse=True)

    if len(cleaned) < 3:
        raise HTTPException(status_code=502, detail="AI returned too few valid suggestions. Please retry.")

    # ---- 6. Persist a lightweight project record ----
    project_id = str(uuid.uuid4())
    try:
        await db.ai_projects.insert_one({
            "id": project_id,
            "user_id": user["id"],
            "filename": filename,
            "size_bytes": len(data),
            "language": language,
            "duration_seconds": duration,
            "suggestion_count": len(cleaned),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as e:
        logger.warning(f"Could not persist ai_project: {e}")

    return {
        "project_id": project_id,
        "filename": filename,
        "mode": "real_ai",
        "transcript": {
            "language": language,
            "duration": duration,
            "segments": segments,
            "text": full_text,
        },
        "suggestions": cleaned,
    }


@api_router.post("/clips")
async def create_clip(payload: ClipCreateIn, user: dict = Depends(get_current_user)):
    clip_id = str(uuid.uuid4())
    clip = {
        "id": clip_id,
        "user_id": user["id"],
        "title": payload.title,
        "source_video_id": payload.source_video_id,
        "duration_seconds": payload.duration_seconds or 60,
        "start_seconds": 0,
        "end_seconds": payload.duration_seconds or 60,
        "viral_score": 87,
        "caption_style": "Bold-Yellow",
        "is_exported": False,
        "thumbnail_color": "#CCFF00",
        "transcript_preview": MOCK_TRANSCRIPT_SEGMENTS[0]["text"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.clips.insert_one(clip)
    clip.pop("_id", None)
    return clip


@api_router.get("/clips")
async def list_clips(user: dict = Depends(get_current_user)):
    clips = await db.clips.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return clips


@api_router.get("/clips/{clip_id}")
async def get_clip(clip_id: str, user: dict = Depends(get_current_user)):
    clip = await db.clips.find_one({"id": clip_id, "user_id": user["id"]}, {"_id": 0})
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")
    return clip


@api_router.patch("/clips/{clip_id}")
async def update_clip(clip_id: str, payload: ClipUpdateIn, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    res = await db.clips.update_one({"id": clip_id, "user_id": user["id"]}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Clip not found")
    clip = await db.clips.find_one({"id": clip_id, "user_id": user["id"]}, {"_id": 0})
    return clip


@api_router.delete("/clips/{clip_id}")
async def delete_clip(clip_id: str, user: dict = Depends(get_current_user)):
    res = await db.clips.delete_one({"id": clip_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Clip not found")
    return {"ok": True}


@api_router.post("/clips/{clip_id}/export")
async def export_clip(clip_id: str, user: dict = Depends(get_current_user)):
    res = await db.clips.update_one({"id": clip_id, "user_id": user["id"]}, {"$set": {"is_exported": True}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Clip not found")
    return {"ok": True, "download_url": f"/api/clips/{clip_id}/download"}


@api_router.get("/")
async def root():
    return {"service": "ClipForge AI API", "ok": True}


# ---------- STARTUP ----------
async def seed_users():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@clipforge.ai")
    admin_password = os.environ.get("ADMIN_PASSWORD", "ClipForge2026!")
    if not await db.users.find_one({"email": admin_email}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "name": "ClipForge Admin",
            "password_hash": hash_password(admin_password),
            "role": "admin",
            "plan": "pro",
            "avatar": None,
            "provider": "email",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    test_email = os.environ.get("TEST_USER_EMAIL", "creator@clipforge.ai")
    test_password = os.environ.get("TEST_USER_PASSWORD", "Creator2026!")
    if not await db.users.find_one({"email": test_email}):
        test_user_id = str(uuid.uuid4())
        await db.users.insert_one({
            "id": test_user_id,
            "email": test_email,
            "name": "Maya Reyes",
            "password_hash": hash_password(test_password),
            "role": "user",
            "plan": "free",
            "avatar": None,
            "provider": "email",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        # Seed sample clips for the demo user
        demo_clips = [
            {"title": "The 3 hooks that broke a million views", "viral_score": 96, "duration_seconds": 38, "transcript_preview": "What if I told you that the single biggest mistake creators make..."},
            {"title": "Three viral patterns creators sleep on", "viral_score": 89, "duration_seconds": 42, "transcript_preview": "If your hook doesn't slap, your video is dead on arrival."},
            {"title": "Never start your Reel with a static shot", "viral_score": 84, "duration_seconds": 34, "transcript_preview": "Pattern two: use motion in the first frame, never a static shot."},
        ]
        for i, c in enumerate(demo_clips):
            await db.clips.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": test_user_id,
                "title": c["title"],
                "source_video_id": None,
                "duration_seconds": c["duration_seconds"],
                "start_seconds": 0,
                "end_seconds": c["duration_seconds"],
                "viral_score": c["viral_score"],
                "caption_style": "Bold-Yellow",
                "is_exported": False,
                "thumbnail_color": "#CCFF00",
                "transcript_preview": c["transcript_preview"],
                "created_at": (datetime.now(timezone.utc) - timedelta(days=i)).isoformat(),
            })


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.clips.create_index("user_id")
    await db.videos.create_index("user_id")
    await seed_users()
    try:
        init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.warning(f"Storage init deferred: {e}")
    logger.info("ClipForge AI API ready")


@app.on_event("shutdown")
async def shutdown():
    client.close()


# ---------- WIRING ----------
app.include_router(api_router)

frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
