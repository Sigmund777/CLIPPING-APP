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
from datetime import datetime, timezone, timedelta
from typing import Optional, List

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File, Header, Query
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

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
