"""
Hookify AI — FastAPI backend.

Auth: Supabase (verified via Supabase.auth.get_user using the user's access token).
DB:   Supabase Postgres (via supabase-py client with the service-role key).
Storage: Supabase Storage (hookify-sources, hookify-renders) — service-role for backend ops.
Render: FFmpeg subprocess, source/output staged through Supabase Storage.
"""

from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import re
import json
import uuid
import asyncio
import logging
import tempfile
import shutil
import subprocess
from io import BytesIO
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Header
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from supabase import create_client, Client
from emergentintegrations.llm.openai import OpenAISpeechToText
from emergentintegrations.llm.chat import LlmChat, UserMessage

# ---------- ENV ----------
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
SUPABASE_ANON_KEY = os.environ["SUPABASE_ANON_KEY"]
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
SOURCES_BUCKET = os.environ.get("SOURCES_BUCKET", "hookify-sources")
RENDERS_BUCKET = os.environ.get("RENDERS_BUCKET", "hookify-renders")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("hookify")

# ---------- CLIENTS ----------
sb_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
# A second client used purely for verifying user tokens (auth.get_user).
sb_anon: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

app = FastAPI(title="Hookify AI API")
api_router = APIRouter(prefix="/api")


# ---------- AUTH DEPENDENCY ----------
async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """Verify the Supabase access token attached as `Authorization: Bearer <jwt>`."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization[7:]
    try:
        # supabase-py: pass the token to .auth.get_user which validates against /auth/v1/user.
        resp = sb_anon.auth.get_user(token)
        if not resp or not getattr(resp, "user", None):
            raise HTTPException(status_code=401, detail="Invalid token")
        u = resp.user
        return {
            "id": u.id,
            "email": u.email,
            "name": (u.user_metadata or {}).get("name") or (u.email.split("@")[0] if u.email else "Creator"),
            "avatar": (u.user_metadata or {}).get("avatar_url"),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired session")


# ---------- HELPERS ----------
def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _safe_str(v, default=""):
    return str(v).strip() if v is not None else default


# ---------- STORAGE HELPERS ----------
def storage_download(bucket: str, key: str) -> bytes:
    return sb_admin.storage.from_(bucket).download(key)


def storage_upload(bucket: str, key: str, data: bytes, content_type: str = "video/mp4") -> str:
    sb_admin.storage.from_(bucket).upload(
        key,
        data,
        {"content-type": content_type, "upsert": "true"},
    )
    return key


def storage_signed_url(bucket: str, key: str, expires_in: int = 3600) -> str:
    resp = sb_admin.storage.from_(bucket).create_signed_url(key, expires_in)
    if isinstance(resp, dict):
        return resp.get("signedURL") or resp.get("signed_url") or resp.get("signedUrl") or ""
    return getattr(resp, "signed_url", "") or getattr(resp, "signedURL", "")


# ---------- AI ANALYSIS ----------
MAX_ANALYZE_BYTES = 100 * 1024 * 1024
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
- Return 3 to 5 suggestions, never more, never fewer than 3.
- Do not invent content not present in the transcript."""


def _coerce_suggestion(s, duration):
    try:
        start = max(0, int(round(float(s.get("start_seconds", 0)))))
        end = max(start + 1, int(round(float(s.get("end_seconds", start + 30)))))
        if duration:
            end = min(end, int(round(float(duration))))
        out = {
            "id": f"real-{uuid.uuid4().hex[:8]}",
            "start_seconds": start,
            "end_seconds": end,
            "duration_seconds": max(0, end - start),
            "title": (_safe_str(s.get("title"))[:80]) or "Untitled clip idea",
            "hook": (_safe_str(s.get("hook"))[:200]) or "",
            "caption_text": (_safe_str(s.get("caption_text"))[:400]) or "",
            "caption_style": _safe_str(s.get("caption_style"), "Bold"),
            "platform": _safe_str(s.get("platform"), "TikTok"),
            "reason": _safe_str(s.get("reason"))[:240] or "Strong standalone moment.",
            "confidence": max(0, min(100, int(round(float(s.get("confidence", 75)))))),
        }
        if out["caption_style"] not in ALLOWED_CAPTION_STYLES:
            out["caption_style"] = "Bold"
        if out["platform"] not in ALLOWED_PLATFORMS:
            out["platform"] = "TikTok"
        return out
    except Exception:
        return None


def _extract_json(raw_text):
    txt = raw_text.strip()
    if txt.startswith("```"):
        txt = re.sub(r"^```(?:json)?\s*", "", txt)
        txt = re.sub(r"\s*```$", "", txt)
    if not txt.startswith("{"):
        m = re.search(r"\{[\s\S]*\}", txt)
        if m:
            txt = m.group(0)
    return json.loads(txt)


# ---------- ROUTES: AUTH ECHO ----------
@api_router.get("/auth/me")
async def auth_me(user: dict = Depends(get_current_user)):
    return user


# ---------- ROUTES: ANALYZE (upload via storage_key) ----------
class AnalyzeIn(BaseModel):
    source_key: str = Field(..., description="Object key in hookify-sources, e.g. <user_id>/<uuid>.mp4")
    filename: Optional[str] = None
    content_type: Optional[str] = "video/mp4"


@api_router.post("/ai/analyze")
async def ai_analyze(payload: AnalyzeIn, user: dict = Depends(get_current_user)):
    """
    The frontend has already uploaded the file directly to Supabase Storage (hookify-sources).
    Here we download from storage, transcribe with Whisper, ask Claude for clip ideas, persist project.
    """
    if not EMERGENT_KEY:
        raise HTTPException(status_code=503, detail="AI not configured. EMERGENT_LLM_KEY missing on server.")

    # Authorization: the source_key MUST start with the user's id (matches our storage RLS).
    if not payload.source_key.startswith(f"{user['id']}/"):
        raise HTTPException(status_code=403, detail="source_key does not belong to current user.")

    ext = payload.source_key.rsplit(".", 1)[-1].lower() if "." in payload.source_key else "mp4"
    if ext not in ALLOWED_ANALYZE_EXTS:
        raise HTTPException(status_code=400, detail=f"Unsupported format '.{ext}'.")

    try:
        data = storage_download(SOURCES_BUCKET, payload.source_key)
    except Exception as e:
        logger.error(f"Storage fetch failed: {e}")
        raise HTTPException(status_code=502, detail="Could not fetch uploaded file from storage.")

    if not data:
        raise HTTPException(status_code=400, detail="Empty file.")
    if len(data) > MAX_ANALYZE_BYTES:
        raise HTTPException(status_code=413, detail="File too large for analysis (100 MB max).")

    # Whisper
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
        logger.error(f"Whisper failed: {e}")
        emsg = str(e).lower()
        if "budget" in emsg and "exceed" in emsg:
            raise HTTPException(status_code=402, detail=(
                "AI key budget exceeded. The Emergent LLM key on the backend is out of credit. "
                "Top up at Emergent → Profile → Universal Key → Add Balance, or set your own EMERGENT_LLM_KEY in backend/.env."
            ))
        if "rate" in emsg and "limit" in emsg:
            raise HTTPException(status_code=429, detail="OpenAI is rate-limiting transcription right now. Wait 30 seconds and try again.")
        raise HTTPException(status_code=502, detail=f"Transcription failed: {str(e)[:200]}")

    raw_segments = getattr(transcript, "segments", None) or []
    segments = []
    for seg in raw_segments:
        try:
            d = seg if isinstance(seg, dict) else seg.__dict__
            text = _safe_str(d.get("text", ""))
            if text:
                segments.append({"start": float(d.get("start", 0)), "end": float(d.get("end", 0)), "text": text})
        except Exception:
            continue

    full_text = _safe_str(getattr(transcript, "text", "")) or " ".join(s["text"] for s in segments)
    duration = float(getattr(transcript, "duration", 0)) or (segments[-1]["end"] if segments else 0)
    language = _safe_str(getattr(transcript, "language", "en")) or "en"

    if not segments and not full_text:
        raise HTTPException(status_code=422, detail="Transcription returned no usable text. Try a longer or clearer recording.")

    # Claude clip prompt
    if segments:
        ts_lines = [f"[{s['start']:.1f}s-{s['end']:.1f}s] {s['text']}" for s in segments]
        transcript_for_llm = "\n".join(ts_lines)
    else:
        transcript_for_llm = f"[0.0s-{duration:.1f}s] {full_text}"
    if len(transcript_for_llm) > 60000:
        transcript_for_llm = transcript_for_llm[:60000] + "\n\n[…transcript truncated…]"

    user_prompt = (
        f"Source duration: {duration:.1f}s. Language: {language}.\n\n"
        f"TRANSCRIPT (with second-level timestamps):\n\n{transcript_for_llm}\n\n"
        "Generate the JSON now."
    )
    try:
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"hookify-analyze-{user['id']}-{uuid.uuid4().hex[:8]}",
            system_message=CLIP_SYSTEM_PROMPT,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        response_text = await chat.send_message(UserMessage(text=user_prompt))
    except Exception as e:
        logger.error(f"Claude failed: {e}")
        emsg = str(e).lower()
        if "budget" in emsg and "exceed" in emsg:
            raise HTTPException(status_code=402, detail=(
                "AI key budget exceeded mid-analysis. Top up the Emergent LLM key and retry."
            ))
        raise HTTPException(status_code=502, detail=f"AI analysis failed: {str(e)[:200]}")

    try:
        parsed = _extract_json(response_text)
    except Exception:
        raise HTTPException(status_code=502, detail="AI returned an unreadable response.")

    cleaned = []
    for s in (parsed.get("suggestions") or [])[:5]:
        cs = _coerce_suggestion(s, duration)
        if cs:
            cleaned.append(cs)
    cleaned.sort(key=lambda x: x["confidence"], reverse=True)
    if len(cleaned) < 3:
        raise HTTPException(status_code=502, detail="AI returned too few valid suggestions.")

    # Persist project to Supabase Postgres
    project_id = str(uuid.uuid4())
    try:
        sb_admin.table("ai_projects").insert({
            "id": project_id,
            "user_id": user["id"],
            "filename": payload.filename or payload.source_key.split("/")[-1],
            "source_bucket": SOURCES_BUCKET,
            "source_key": payload.source_key,
            "content_type": payload.content_type or "video/mp4",
            "size_bytes": len(data),
            "language": language,
            "duration_seconds": duration,
            "transcript_segments": segments[:200],
            "transcript_text": full_text[:20000],
            "suggestions": cleaned,
            "status": "ready",
        }).execute()

        # Update usage minutes
        try:
            mins = max(1, int(round(duration / 60)))
            sb_admin.rpc("noop", {}).execute() if False else None  # placeholder
            # Read-then-write
            prof = sb_admin.table("profiles").select("minutes_used_month").eq("id", user["id"]).single().execute()
            cur = float((prof.data or {}).get("minutes_used_month") or 0)
            sb_admin.table("profiles").update({"minutes_used_month": cur + mins, "updated_at": _now_iso()}).eq("id", user["id"]).execute()
        except Exception as e:
            logger.warning(f"Usage update skipped: {e}")
    except Exception as e:
        logger.error(f"Project persist failed: {e}")

    return {
        "project_id": project_id,
        "filename": payload.filename or "",
        "mode": "real_ai",
        "render_ready": True,
        "transcript": {
            "language": language,
            "duration": duration,
            "segments": segments,
            "text": full_text,
        },
        "suggestions": cleaned,
    }


# ---------- ROUTES: PROJECTS ----------
@api_router.get("/projects")
async def list_projects(user: dict = Depends(get_current_user)):
    res = sb_admin.table("ai_projects").select("*").eq("user_id", user["id"]).order("created_at", desc=True).limit(100).execute()
    return res.data or []


@api_router.get("/projects/{project_id}")
async def get_project(project_id: str, user: dict = Depends(get_current_user)):
    res = sb_admin.table("ai_projects").select("*").eq("id", project_id).eq("user_id", user["id"]).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Not found")
    return res.data


# ---------- ROUTES: RENDER ----------
class RenderStartIn(BaseModel):
    project_id: str
    start_seconds: float
    end_seconds: float
    title: str = ""
    caption_text: str = ""
    platform: str = "TikTok"


def _write_srt(text: str, duration: float, path: Path):
    def to_ts(s: float) -> str:
        h = int(s // 3600)
        m = int((s % 3600) // 60)
        sec = s - h * 3600 - m * 60
        return f"{h:02d}:{m:02d}:{sec:06.3f}".replace(".", ",")
    safe = (text or "").replace("\r", "").strip() or " "
    safe = safe.replace("\\", " ").replace("{", "(").replace("}", ")")
    end = max(1.0, float(duration))
    with open(path, "w", encoding="utf-8") as f:
        f.write("1\n")
        f.write(f"{to_ts(0)} --> {to_ts(end)}\n")
        f.write(safe + "\n\n")


RENDER_STAGES = [
    ("preparing", 5,    "Preparing clip"),
    ("downloading", 15, "Downloading source"),
    ("cutting", 35,     "Cutting video"),
    ("formatting", 55,  "Formatting 9:16"),
    ("captions", 75,    "Adding captions"),
    ("rendering", 90,   "Rendering MP4"),
    ("uploading", 95,   "Saving to storage"),
    ("ready", 100,      "Ready to download"),
]


def _set_stage(job_id: str, stage_key: str):
    stage = next((s for s in RENDER_STAGES if s[0] == stage_key), None)
    if not stage:
        return
    try:
        sb_admin.table("render_jobs").update({
            "status": stage[0], "progress": stage[1], "stage_label": stage[2],
            "updated_at": _now_iso(),
        }).eq("id", job_id).execute()
    except Exception as e:
        logger.warning(f"Stage update failed: {e}")


async def _run_render_job(job_id: str):
    tmp_dir = Path(tempfile.mkdtemp(prefix=f"hookify-{job_id}-"))
    try:
        job_res = sb_admin.table("render_jobs").select("*").eq("id", job_id).single().execute()
        job = job_res.data
        if not job:
            return
        proj_res = sb_admin.table("ai_projects").select("source_bucket, source_key").eq("id", job["project_id"]).single().execute()
        project = proj_res.data
        if not project:
            sb_admin.table("render_jobs").update({"status": "failed", "error": "Source project missing.", "updated_at": _now_iso()}).eq("id", job_id).execute()
            return

        _set_stage(job_id, "downloading")
        src_ext = (project["source_key"].rsplit(".", 1)[-1] or "mp4").lower()
        src_path = tmp_dir / f"src.{src_ext}"
        try:
            data = storage_download(project["source_bucket"], project["source_key"])
        except Exception as e:
            sb_admin.table("render_jobs").update({"status": "failed", "error": f"Storage fetch failed: {str(e)[:160]}", "updated_at": _now_iso()}).eq("id", job_id).execute()
            return
        src_path.write_bytes(data)

        start = max(0.0, float(job["start_seconds"]))
        end = max(start + 1.0, float(job["end_seconds"]))
        duration = end - start
        caption_text = job.get("caption_text") or job.get("title") or ""

        _set_stage(job_id, "cutting")
        srt_path = tmp_dir / "cap.srt"
        _write_srt(caption_text, duration, srt_path)
        out_path = tmp_dir / "out.mp4"

        # Purple-cyan caption style: PrimaryColour=&HAABBGGRR. Use teal/cyan (#22D3EE -> BGR EED322).
        vf = (
            "crop='min(iw,ih*9/16)':'min(ih,iw*16/9)':"
            "'(iw-min(iw,ih*9/16))/2':'(ih-min(ih,iw*16/9))/2',"
            "scale=1080:1920:force_original_aspect_ratio=increase,"
            "crop=1080:1920,"
            f"subtitles='{srt_path.as_posix()}':force_style='"
            "Fontname=DejaVu Sans,Fontsize=20,Bold=1,"
            "PrimaryColour=&H00EED322,OutlineColour=&H80000000,"
            "BorderStyle=1,Outline=3,Shadow=0,Alignment=2,MarginV=160'"
        )
        cmd = [
            "ffmpeg", "-y", "-ss", f"{start:.3f}", "-to", f"{end:.3f}",
            "-i", str(src_path), "-vf", vf,
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "128k", "-ac", "2",
            "-movflags", "+faststart",
            str(out_path),
        ]
        _set_stage(job_id, "formatting")
        proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        _set_stage(job_id, "captions")
        try:
            _stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=600)
        except asyncio.TimeoutError:
            try:
                proc.kill()
            except Exception:
                pass
            sb_admin.table("render_jobs").update({"status": "failed", "error": "FFmpeg timed out.", "updated_at": _now_iso()}).eq("id", job_id).execute()
            return

        if proc.returncode != 0 or not out_path.exists():
            err = (stderr or b"").decode(errors="ignore")[-300:]
            sb_admin.table("render_jobs").update({"status": "failed", "error": "FFmpeg failed: " + err[-150:], "updated_at": _now_iso()}).eq("id", job_id).execute()
            return

        _set_stage(job_id, "rendering")
        _set_stage(job_id, "uploading")
        out_key = f"{job['user_id']}/{job_id}.mp4"
        out_bytes = out_path.read_bytes()
        try:
            storage_upload(RENDERS_BUCKET, out_key, out_bytes, "video/mp4")
        except Exception as e:
            sb_admin.table("render_jobs").update({"status": "failed", "error": f"Render upload failed: {str(e)[:160]}", "updated_at": _now_iso()}).eq("id", job_id).execute()
            return

        sb_admin.table("render_jobs").update({
            "status": "ready", "progress": 100, "stage_label": "Ready to download",
            "output_key": out_key, "size_bytes": len(out_bytes), "updated_at": _now_iso(),
        }).eq("id", job_id).execute()
        logger.info(f"Render {job_id} done: {len(out_bytes)} bytes -> {out_key}")
    except Exception as e:
        logger.exception(f"Render job {job_id} crashed")
        try:
            sb_admin.table("render_jobs").update({"status": "failed", "error": str(e)[:200], "updated_at": _now_iso()}).eq("id", job_id).execute()
        except Exception:
            pass
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


@api_router.post("/render/start")
async def render_start(payload: RenderStartIn, user: dict = Depends(get_current_user)):
    proj_res = sb_admin.table("ai_projects").select("*").eq("id", payload.project_id).eq("user_id", user["id"]).single().execute()
    if not proj_res.data:
        raise HTTPException(status_code=404, detail="Project not found")
    duration = max(1.0, float(payload.end_seconds) - float(payload.start_seconds))
    if duration > 180:
        raise HTTPException(status_code=400, detail="Clip too long. Max 3 minutes.")

    job_id = str(uuid.uuid4())
    job = {
        "id": job_id,
        "user_id": user["id"],
        "project_id": payload.project_id,
        "title": payload.title or "Hookify clip",
        "caption_text": payload.caption_text or "",
        "platform": payload.platform or "TikTok",
        "start_seconds": float(payload.start_seconds),
        "end_seconds": float(payload.end_seconds),
        "duration_seconds": duration,
        "status": "preparing",
        "stage_label": "Preparing clip",
        "progress": 5,
        "output_bucket": RENDERS_BUCKET,
    }
    sb_admin.table("render_jobs").insert(job).execute()
    asyncio.create_task(_run_render_job(job_id))
    return job


@api_router.get("/render/{job_id}")
async def render_status(job_id: str, user: dict = Depends(get_current_user)):
    res = sb_admin.table("render_jobs").select("*").eq("id", job_id).eq("user_id", user["id"]).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Not found")
    return res.data


@api_router.get("/render/{job_id}/download-url")
async def render_download_url(job_id: str, user: dict = Depends(get_current_user)):
    res = sb_admin.table("render_jobs").select("status, output_key, output_bucket").eq("id", job_id).eq("user_id", user["id"]).single().execute()
    job = res.data
    if not job:
        raise HTTPException(status_code=404, detail="Not found")
    if job.get("status") != "ready" or not job.get("output_key"):
        raise HTTPException(status_code=409, detail="Render not ready")
    url = storage_signed_url(job.get("output_bucket") or RENDERS_BUCKET, job["output_key"], expires_in=3600)
    return {"url": url}


# ---------- ROUTES: SAVED CLIPS ----------
class SavedClipIn(BaseModel):
    project_id: Optional[str] = None
    title: str = ""
    hook: str = ""
    caption_text: str = ""
    caption_style: str = "Bold"
    platform: str = "TikTok"
    status: str = "Idea"
    start_seconds: float = 0
    end_seconds: float = 0
    duration_seconds: float = 0
    confidence: Optional[int] = None
    source_filename: Optional[str] = None
    render_job_id: Optional[str] = None


@api_router.get("/saved-clips")
async def list_saved(user: dict = Depends(get_current_user)):
    res = sb_admin.table("saved_clips").select("*").eq("user_id", user["id"]).eq("is_deleted", False).order("updated_at", desc=True).limit(500).execute()
    return res.data or []


@api_router.post("/saved-clips")
async def create_saved(payload: SavedClipIn, user: dict = Depends(get_current_user)):
    doc = {**payload.model_dump(), "user_id": user["id"], "is_deleted": False}
    res = sb_admin.table("saved_clips").insert(doc).execute()
    return (res.data or [doc])[0]


@api_router.patch("/saved-clips/{clip_id}")
async def update_saved(clip_id: str, payload: SavedClipIn, user: dict = Depends(get_current_user)):
    patch = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    patch["updated_at"] = _now_iso()
    res = sb_admin.table("saved_clips").update(patch).eq("id", clip_id).eq("user_id", user["id"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Not found")
    return res.data[0]


@api_router.delete("/saved-clips/{clip_id}")
async def delete_saved(clip_id: str, user: dict = Depends(get_current_user)):
    sb_admin.table("saved_clips").update({"is_deleted": True, "updated_at": _now_iso()}).eq("id", clip_id).eq("user_id", user["id"]).execute()
    return {"ok": True}


# ---------- ROUTES: SETTINGS ----------
class SettingsIn(BaseModel):
    creator_name: Optional[str] = None
    preferred_platform: Optional[str] = None
    caption_style: Optional[str] = None
    default_clip_length: Optional[int] = None
    brand_tone: Optional[str] = None
    active_template_id: Optional[str] = None


DEFAULT_SETTINGS = {
    "creator_name": "",
    "preferred_platform": "TikTok",
    "caption_style": "Bold",
    "default_clip_length": 30,
    "brand_tone": "Energetic",
    "active_template_id": None,
}


@api_router.get("/settings")
async def get_settings(user: dict = Depends(get_current_user)):
    res = sb_admin.table("user_settings").select("*").eq("user_id", user["id"]).limit(1).execute()
    if res.data:
        row = dict(res.data[0])
        row.pop("user_id", None)
        return row
    return {**DEFAULT_SETTINGS, "creator_name": user.get("name", "")}


@api_router.put("/settings")
async def put_settings(payload: SettingsIn, user: dict = Depends(get_current_user)):
    patch = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    patch["user_id"] = user["id"]
    patch["updated_at"] = _now_iso()
    sb_admin.table("user_settings").upsert(patch, on_conflict="user_id").execute()
    res = sb_admin.table("user_settings").select("*").eq("user_id", user["id"]).single().execute()
    row = dict(res.data or {})
    row.pop("user_id", None)
    return row


# ---------- ROUTES: PROFILE / USAGE ----------
@api_router.get("/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    # Ensure a profile exists (trigger normally handles this; this is a safety net).
    res = sb_admin.table("profiles").select("*").eq("id", user["id"]).limit(1).execute()
    if not res.data:
        sb_admin.table("profiles").upsert({"id": user["id"], "display_name": user.get("name", "")}, on_conflict="id").execute()
        res = sb_admin.table("profiles").select("*").eq("id", user["id"]).single().execute()
    p = dict(res.data[0] if isinstance(res.data, list) else res.data)
    # Recent clips for dashboard
    recent = sb_admin.table("ai_projects").select("id, filename, duration_seconds, created_at, suggestions").eq("user_id", user["id"]).order("created_at", desc=True).limit(5).execute()
    return {"profile": p, "user": user, "recent_projects": recent.data or []}


# ---------- ROOT ----------
@api_router.get("/")
async def root():
    return {"service": "Hookify AI API", "ok": True}


# ---------- STARTUP ----------
@app.on_event("startup")
async def startup():
    try:
        ver = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True, timeout=5)
        logger.info(f"FFmpeg ready: {ver.stdout.splitlines()[0] if ver.stdout else '?'}")
    except Exception as e:
        logger.error(f"FFmpeg unavailable: {e}")
    logger.info(f"Hookify API ready. Sources={SOURCES_BUCKET} Renders={RENDERS_BUCKET}")


# ---------- WIRING ----------
app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "https://clipping-app-five.vercel.app", "https://clipforge-ai-33.preview.emergentagent.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
