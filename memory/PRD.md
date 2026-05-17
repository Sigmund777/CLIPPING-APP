# Hookify AI — Product Requirements Document

## Original Problem Statement
A SaaS web app that turns long-form video into short-form clips (TikTok / YouTube Shorts / Instagram Reels). Real auth, real upload, real Whisper transcription, real Claude clip suggestions, real FFmpeg 9:16 render with burnt captions, downloadable MP4, per-user workspace.

## Architecture (Feb 17, 2026 — v1)
- **Frontend** (Vercel-deployable): React 19 + Tailwind + Shadcn. `frontend/src/`
- **Backend** (Railway/Render-deployable): FastAPI + MongoDB (Motor async) + FFmpeg subprocess. `backend/server.py`
- **Auth**: JWT in httpOnly cookies, bcrypt. Local-session fallback only when backend is literally unreachable.
- **AI**: OpenAI Whisper (transcription) + Claude Sonnet 4.5 (clip ideas) — both via `EMERGENT_LLM_KEY`.
- **Object storage**: Emergent Object Storage. Source videos + rendered MP4s persist across redeploys.
- **Render**: subprocess FFmpeg with centered 9:16 crop → 1080×1920 → burnt SRT captions (volt-yellow). Background asyncio task with DB-backed job state and polling.

## Core User Journey (works end-to-end)
1. Register / log in (real backend, JWT cookie)
2. Upload an mp4/mov/mp3/wav/m4a ≤ 25 MB → backend saves source to object storage
3. Whisper transcribes
4. Claude returns 3–5 honest clip ideas (title, hook, caption, platform, confidence, reason)
5. Open any idea in the editor → edit fields → "Save clip" persists to localStorage workspace
6. "Generate clip" → backend cuts the source, reframes 9:16, burns captions, uploads MP4 to storage
7. "Download MP4" delivers the file (cookie-authed)

## What's Implemented (v1 — Feb 17, 2026)
### Backend endpoints
- `POST /api/auth/register|login|logout`, `GET /api/auth/me` (real JWT)
- `POST /api/ai/analyze` — multipart upload → Whisper → Claude → persists `ai_project` with `storage_path`
- `GET /api/projects`, `GET /api/projects/{id}` — user history
- `POST /api/render/start` — kicks off background FFmpeg
- `GET /api/render/{job_id}` — poll progress (8 stages)
- `GET /api/render/{job_id}/download` — stream MP4 (cookie/header/query auth)
- `GET|POST|PATCH|DELETE /api/saved-clips` — per-user workspace CRUD
- `GET|PUT /api/settings` — per-user preferences

### Frontend
- Landing, Login, Signup, Pricing
- Dashboard with upload card + project list + clip ideas + Join Beta CTA
- Upload page with 6-stage pipeline UI + real `/api/ai/analyze` call + drag-drop
- Editor with editable fields + "Generate clip" + 8-stage render progress + "Download MP4"
- Workspace page (saved clips, platform/status filters, edit/delete)
- Templates + Settings (currently localStorage on FE; backend endpoints ready to wire)
- Beta requests admin page
- Watch Demo + Join Beta dialogs

## What's Fallback / Not Yet
- Google OAuth — endpoint exists, no real callback (clearly labelled demo)
- Email verification on register — not implemented
- Password reset — not implemented
- Stripe checkout — not wired
- FE WorkspacePage/SettingsPage still localStorage (backend ready to swap)
- Smart re-framing (face/speaker tracking)
- Fancy captions (karaoke, animated)

## Test Credentials
See `/app/memory/test_credentials.md`

## Deployment Guide
See `/app/memory/DEPLOYMENT_REPORT.md` — exhaustive env vars, hosting, FFmpeg setup, test steps.

## Prioritized Backlog
### P1 (next session)
- Email verification (SendGrid/Resend) + password reset
- Migrate WorkspacePage + SettingsPage frontend to call `/api/saved-clips` and `/api/settings`
- Inline `<video>` preview of rendered MP4 in the editor (no download required to watch)
- Stripe checkout for paid tiers

### P2
- Smart re-framing (face / speaker tracking)
- Karaoke / animated word-by-word captions
- Multi-language captions / translation
- Team workspaces
- Analytics dashboard (post-publish performance)
- Real Google OAuth
- Direct-to-storage signed-URL uploads (raise the 25 MB cap)
