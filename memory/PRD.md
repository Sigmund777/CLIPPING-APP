# ClipForge AI — Product Requirements Document

## Original Problem Statement
Build a modern SaaS web app called "ClipForge AI" that helps streamers, YouTubers, podcasters, and creators turn long-form content into short-form clips for TikTok, YouTube Shorts, and Instagram Reels.

Dark modern UI, clean startup aesthetic, smooth animations, responsive. Main features: video upload, AI transcript, AI clip timestamps, viral titles/hooks, auto-caption preview, 9:16 vertical preview, export, dashboard, pricing, login/signup. Landing page with hero, how it works, features, testimonials, pricing, FAQ, footer. Realistic copy, premium feel.

## Architecture
- **Frontend**: React 19 + React Router 7 + Tailwind + Shadcn UI components
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Auth**: JWT (httpOnly cookies, bcrypt) + Emergent-managed Google Auth flow
- **Storage**: Emergent Object Storage for video uploads (via `EMERGENT_LLM_KEY`)
- **AI**: Mocked for v1 — pipeline structure ready for Claude Sonnet 4.5 + OpenAI Whisper

## User Personas
- **Marcus (Podcaster)** — wants 60-min episodes → 8 viral shorts auto-extracted
- **Riya (Twitch streamer)** — needs algorithm to surface highlights from 30hr/wk VODs
- **Daniel (YouTuber, 1.2M)** — needs viral-score guidance and brand-safe captions

## Core Requirements (static)
- Premium dark UI (volt yellow #CCFF00 on ink-950 #09090B)
- Outfit (headings) + Manrope (body) typography
- Realistic copywriting (no lorem ipsum)
- Desktop-first dashboard, mobile-responsive landing
- 9:16 vertical preview locked aspect ratio

## What's Implemented (May 2026)
- ✅ Landing page: Hero, How it works (3-step), Features (Bento grid), Testimonials, Pricing, FAQ, Footer, Final CTA strip
- ✅ Auth: JWT email/password (register/login/logout/me/refresh) + Google Auth endpoint (v1 simulated profile post)
- ✅ Seeded admin + test creator with 3 demo clips
- ✅ Dashboard: clip grid, stats row, clip cards with viral score, drafts/exported state
- ✅ Upload flow: drag-and-drop, animated 5-stage AI pipeline mock, real video upload to Emergent object storage
- ✅ Clip editor: 9:16 preview with animated waveform, editable title, 6 viral title suggestions, transcript panel, 7 caption styles, more viral moments panel, export
- ✅ Pricing page with 3 tiers (Free/Creator $24/Studio $79)
- ✅ Protected routes with redirect to /login
- ✅ data-testid coverage on all interactive elements

## Prioritized Backlog
### P0 (next session)
- Wire real Claude Sonnet 4.5 + Whisper for actual transcript + suggestions
- Real video streaming playback in clip editor (currently faux waveform)

### P1
- Stripe checkout for Creator/Studio plan upgrades
- Brand kit settings (fonts, colours, logo) saved per user
- YouTube/Vimeo URL ingestion (currently UI only)
- Real export pipeline (FFmpeg → 1080p 9:16 with burnt captions)

### P2
- Speaker diarisation toggle
- Multi-language captions/translation
- API access for Studio tier
- Team workspaces
- Analytics dashboard (clip performance after posting)

## Test Credentials
See `/app/memory/test_credentials.md`
