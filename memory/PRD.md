# Hookify AI — Product Requirements Document

## Original Problem Statement
Build a modern SaaS web app called "Hookify AI" (originally "ClipForge AI") that helps streamers, YouTubers, podcasters, and creators turn long-form content into short-form clips for TikTok, YouTube Shorts, and Instagram Reels.

Dark modern UI (#09090B ink, #CCFF00 volt-yellow accents). Real AI: Whisper transcription + Claude Sonnet 4.5 clip suggestions via Emergent LLM key. MVP upload limit 25MB. Graceful demo fallback when backend/AI unavailable.

## Architecture
- **Frontend**: React 19 + React Router 7 + Tailwind + Shadcn UI
- **Backend**: FastAPI + MongoDB (Motor async)
- **Auth**: JWT email/password (with local-demo fallback for beta) + Google Auth stub
- **AI**: OpenAI Whisper (transcript) + Claude Sonnet 4.5 (clip suggestions) — via Emergent LLM key
- **Persistence**: LocalStorage-first for beta UX (saved clips, settings, templates, beta sign-ups); real DB models exist for users + ai_projects

## User Personas
- **Marcus (Podcaster)** — 60-min episodes → 8 viral shorts auto-extracted
- **Riya (Twitch streamer)** — algorithm to surface highlights from 30hr/wk VODs
- **Daniel (YouTuber)** — viral-score guidance and brand-safe captions

## Core Requirements
- Premium dark UI (volt yellow on ink-950)
- Realistic copywriting (no lorem ipsum)
- Graceful offline/demo fallback (no AI key = sample data, no crash)
- 9:16 vertical preview locked aspect ratio
- data-testid coverage on all interactive elements

## What's Implemented (Feb 2026)
- ✅ Landing page (Hero, How it works, Features, Testimonials, Pricing, FAQ, Footer, CTA)
- ✅ Auth: JWT login/register/me/refresh + local-demo session fallback for offline
- ✅ Protected routes redirect unauthenticated users to /login
- ✅ Dashboard with upload card + recent projects + generated clip ideas + Join Beta CTA
- ✅ Upload flow: drag-and-drop, 6-stage animated pipeline, real `/api/ai/analyze`
- ✅ Real AI: Whisper + Claude Sonnet 4.5 via Emergent LLM key
- ✅ Editor: 9:16 preview, editable title/hook/caption/platform/status, saved viral titles, transcript panel, 7 caption styles, "More viral moments" panel (click to load suggestion)
- ✅ **Save clip → workspace flow** with status pipeline (Idea → Editing → Ready to post → Posted)
- ✅ **Workspace page** with platform/status filters, view/edit/delete, empty state
- ✅ Templates page (6 templates) with **active template indicator + Clear button**
- ✅ Settings page (5 fields) with localStorage persist + **Reset to default**
- ✅ **Join Beta dialog** with 6 fields (name, email, type, platform, volume, pain) → persisted locally
- ✅ **Internal Beta Requests page** (`/beta-requests`) showing local submissions
- ✅ **Watch Demo dialog** with 4-step walkthrough (with a11y-friendly hidden title)
- ✅ Sidebar nav: Studio, Upload, Workspace, Templates, Settings, Beta, Logout

## Recent fixes (Feb 17, 2026)
- Fixed runtime crash in ClipEditor "More viral moments" panel (`c.start.toFixed` → safe coercion via `start_seconds`)
- Fixed ReferenceError in JoinBetaDialog (missing `platform`/`volume` state)
- Added Reset button to Settings
- Added Clear-active-template control on Templates
- Added Workspace + Beta sidebar nav entries
- Silenced Radix DialogTitle a11y warning in WatchDemoDialog (hidden title + description)

## Prioritized Backlog
### P1 (next session)
- Real video export pipeline (FFmpeg → 1080p 9:16 with burnt captions). Currently "coming soon" pill.
- Migrate Dashboard/Templates/Settings/Workspace from localStorage → real MongoDB models behind `/api/clips`, `/api/templates`, `/api/settings`
- Direct-to-storage signed-URL uploads (works around Vercel 4.5MB serverless body limit)

### P2
- Stripe checkout for Creator/Studio paid plans
- Real Google OAuth (currently a stub)
- Speaker diarisation, multi-language captions
- Team workspaces
- Analytics dashboard (post-publish clip performance)

## Test Credentials
See `/app/memory/test_credentials.md`
