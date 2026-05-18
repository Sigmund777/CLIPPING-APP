# Hookify AI — Product Requirements Document (v3)

_Last updated: Feb 18, 2026_

## Original problem statement
A SaaS web app that turns long-form video into short-form clips for TikTok, YouTube Shorts, and Instagram Reels. Brand: dark + vibrant purple + teal/cyan neon. Premium feel, OpusClip-grade.

## Architecture (v3)
- **Frontend** (Vercel): React 19 + Tailwind + Shadcn + Supabase JS
- **Backend** (Railway/Render): FastAPI + supabase-py + FFmpeg subprocess
- **Auth**: Supabase Auth (email/password + Google OAuth provider stub)
- **DB**: Supabase Postgres (5 tables, RLS scoped per user)
- **Storage**: Supabase Storage (`hookify-sources`, `hookify-renders` — private, RLS-scoped)
- **AI**: OpenAI Whisper + Claude Sonnet 4.5 via Emergent LLM key

## Core user journey
1. Sign up (email + password) — instant, no verification (toggle-able later)
2. Upload mp4/mov/mp3/wav/m4a up to 100 MB directly to Supabase Storage (XHR with progress)
3. Backend downloads file from storage → Whisper transcribes → Claude returns 3–5 clip ideas
4. Open any idea in the editor → edit title/hook/caption/platform/status
5. "Generate clip" → backend cuts source, applies centered 9:16 crop, burns teal captions, uploads MP4 to storage
6. "Download MP4" hits `/api/render/{id}/download-url` → signed Supabase URL → browser downloads
7. Saved clips workspace, settings, templates persist per user

## What's implemented (v3, Feb 18 2026)
### Backend (`backend/server.py` — rewritten)
- `GET /api/auth/me` — verifies Supabase JWT
- `POST /api/ai/analyze` — body `{source_key, filename, content_type}` → Whisper + Claude
- `GET /api/projects`, `GET /api/projects/{id}`
- `POST /api/render/start`, `GET /api/render/{job_id}`, `GET /api/render/{job_id}/download-url`
- `GET|POST|PATCH|DELETE /api/saved-clips`
- `GET|PUT /api/settings`
- `GET /api/profile` — profile + usage + recent projects (for dashboard)

### Frontend
- Landing, Login, Signup, Pricing, Auth Callback
- Dashboard with usage bar (purple→teal gradient), 3 stat cards, big upload CTA, projects list, clip ideas grid
- Upload page with direct-to-Supabase XHR upload + progress + 6 stages
- Editor with editable fields + 8-stage render pipeline + signed-URL download
- Workspace, Templates, Settings, Beta Requests (still localStorage; backend ready)

## What's fallback / unfinished
- **Google OAuth**: button wired, but provider not enabled in Supabase yet
- **Stripe checkout**: visual tiers only
- **Email verification**: disabled at user's request
- **Password reset**: not implemented
- **WorkspacePage / SettingsPage / TemplatesPage**: localStorage on FE (backend endpoints exist)
- **Smart re-framing**: v1 uses centered crop

## Required env vars
See `/app/memory/DEPLOYMENT_REPORT.md`

## Test credentials
None — Supabase Auth means real signup is required. The previous JWT/Mongo demo creds (`creator@clipforge.ai`) no longer work.

## Prioritized backlog
- **P1**: Backend deploy to Railway (so Vercel frontend has a live API to talk to)
- **P1**: Migrate FE Workspace/Settings/Templates to Supabase
- **P1**: Stripe checkout
- **P2**: Real Google OAuth wiring
- **P2**: Email verification + password reset
- **P2**: Smart re-framing + karaoke captions
- **P3**: Multi-language captions, team workspaces, analytics

## Manual setup remaining
1. Paste `/app/memory/supabase_schema.sql` into Supabase SQL Editor (one click)
2. (Later) Enable Google OAuth provider in Supabase
3. (Later) Deploy backend to Railway / Render
