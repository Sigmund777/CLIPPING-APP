# Hookify v3 — Vercel/Supabase Deployment Report

_Built Feb 18, 2026_

## Status snapshot

✅ **Frontend rebranded** to dark + vibrant purple/cyan neon. Premium feel, OpusClip-grade visuals on the landing, login, pricing, and dashboard.
✅ **Auth migrated** to Supabase Auth (email/password + Google OAuth stub).
✅ **Storage migrated** to Supabase Storage with direct-from-browser uploads (no Vercel body limit).
✅ **Backend Supabase-aware**: validates Supabase JWTs, reads/writes Supabase Postgres + Storage, runs FFmpeg locally and uploads renders back to storage.
✅ **Pricing tiers updated**: Free 60min / Starter $12 / Pro $29 / Business $79.
✅ **Dashboard rebuilt** with real usage stats, clip history, prominent upload CTA.

⚠️ **ONE MANUAL STEP LEFT BEFORE FULL E2E**: paste the SQL schema in your Supabase SQL Editor. See "Next step" below.

## What's fully working (verified in preview)

- Landing page, pricing page, login page, signup page — purple/cyan rebrand looks premium ✅
- Supabase JS client initialized, auth state persists across refresh
- Backend boots cleanly with Supabase + FFmpeg
- Frontend builds with zero runtime errors
- Storage buckets `hookify-sources` and `hookify-renders` exist (confirmed via API)
- All visual contrast, button states, and CTA gradients live

## What's still pending (one action from you)

### 🚨 Paste the SQL schema

The Supabase Postgres tables that hold profiles, ai_projects, saved_clips, render_jobs, and user_settings don't exist yet. I can verify the schema file via the service-role API, but I cannot create tables programmatically without your DB password (which Supabase never exposes via API).

**Action**:
1. Open https://supabase.com/dashboard/project/raaxstgbhpgdlszkalfc/sql/new
2. Open the file `/app/memory/supabase_schema.sql` in this Emergent workspace.
3. Copy its **entire contents** (~120 lines).
4. Paste into the SQL Editor and click **Run**.
5. Expected output: "Success. No rows returned."
6. Reply here with "schema is in" and I'll run a full E2E test (signup → upload → analyze → render → download).

The SQL is idempotent (safe to re-run) and creates:
- 5 tables with RLS scoped to the authenticated user
- A trigger that auto-creates a `profiles` row on every new signup
- 2 storage policies that scope source/render objects to each user's UID folder

### Other things still flagged as fallback

- **Google OAuth UI**: button present, but you haven't enabled the Google provider in Supabase yet. It'll show a friendly error when clicked. Enable later under Supabase → Auth → Providers → Google.
- **Stripe checkout**: pricing tiers are visual only; every signup starts on Free. Stripe is documented as P1 next.
- **Email verification**: you disabled it on signup, which is fine for beta but turn it on before public launch.

## Architecture (post-migration)

```
Frontend (Vercel)                           Backend (Railway / Render / Emergent preview)
─────────────────                           ──────────────────────────────────────────────
React + Supabase JS                         FastAPI + supabase-py + FFmpeg
- supabase.auth (email/Google)              - /api/auth/me            verify Supabase JWT
- supabase.storage (direct upload)          - /api/ai/analyze         download from storage,
                                                                       Whisper → Claude → DB
                                            - /api/render/start       FFmpeg 9:16 + captions
                                            - /api/render/{id}        poll status
                                            - /api/render/{id}/download-url  signed URL
                                            - /api/saved-clips CRUD
                                            - /api/settings           upsert
                                            - /api/projects           list

Storage (Supabase)                          Database (Supabase Postgres)
──────────────────                          ────────────────────────────
hookify-sources/{uid}/{file}                profiles, ai_projects, saved_clips,
hookify-renders/{uid}/{job}.mp4             render_jobs, user_settings
```

## Required env vars

### Backend (`backend/.env` — already populated in preview)
```
SUPABASE_URL=https://raaxstgbhpgdlszkalfc.supabase.co
SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
SUPABASE_JWT_SECRET=(reserved; not used for verification in this build)
EMERGENT_LLM_KEY=sk-emergent-...
SOURCES_BUCKET=hookify-sources
RENDERS_BUCKET=hookify-renders
FRONTEND_URL=https://clipping-app-five.vercel.app
```

### Frontend (`frontend/.env` — already populated)
```
REACT_APP_BACKEND_URL=<your backend host>
REACT_APP_SUPABASE_URL=https://raaxstgbhpgdlszkalfc.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sb_publishable_...
REACT_APP_SOURCES_BUCKET=hookify-sources
REACT_APP_RENDERS_BUCKET=hookify-renders
```

## Hosting reality (unchanged from last build)

| Layer | Host | Reason |
|---|---|---|
| Frontend | **Vercel** | Already at https://clipping-app-five.vercel.app |
| Backend | **Railway / Render / Fly.io** | FFmpeg + long-running render jobs ≠ Vercel |
| DB | **Supabase Postgres** | ✅ already set up |
| Auth | **Supabase Auth** | ✅ already set up |
| Storage | **Supabase Storage** | ✅ already set up |

### To deploy backend to Railway (recommended)

1. Push this repo to GitHub.
2. https://railway.app → New Project → Deploy from GitHub → pick this repo.
3. Root: `backend`. Start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`.
4. Add `nixpacks.toml` at repo root:
   ```toml
   [phases.setup]
   aptPkgs = ["ffmpeg"]
   ```
5. Add **every** env var from the backend section above.
6. After deploy, copy the Railway public URL.
7. In Vercel → Project Settings → Environment Variables, set `REACT_APP_BACKEND_URL` to that URL and **redeploy** the frontend.
8. In Supabase → Authentication → URL Configuration, add your Railway URL to **Additional Redirect URLs** if you wire Google later.

## Exact test steps (after SQL is in)

1. Open https://clipping-app-five.vercel.app/signup → create a new account with a real email.
2. You should land on `/dashboard`. Sidebar shows your initial + email.
3. Refresh — session persists.
4. Click "Choose a file" → drop a 30–90 sec mp4/mp3 with English speech (up to 100 MB).
5. Upload progress bar fills in real time (direct-to-Supabase XHR with `.upload.onprogress`).
6. Stages animate: Uploading → Extracting → Transcribing → Finding moments → Generating hooks → Complete.
7. After 20–60 seconds, see 3–5 real clip cards with title/hook/caption/confidence.
8. Click any "Open in editor" card.
9. In the editor: hit "Generate clip" (top right) → render-pipeline panel shows 8 stages.
10. After ~3–10 seconds, button becomes "Download MP4". Click → real 1080×1920 H.264/AAC MP4 with burnt cyan captions downloads.
11. "Save clip" → visit Workspace from the sidebar → clip appears.
12. Log out from the sidebar — `/dashboard` redirects to `/login`.

## Files changed this build

- `backend/server.py` — full rewrite for Supabase auth/storage/db
- `backend/.env` — Supabase keys
- `backend/requirements.txt` — added `supabase==2.30.0`
- `frontend/.env` — Supabase keys + bucket names
- `frontend/src/lib/supabase.js` — new (Supabase JS client)
- `frontend/src/lib/auth.jsx` — Supabase AuthProvider
- `frontend/src/lib/api.js` — attaches Supabase access token to every request
- `frontend/src/pages/LoginPage.jsx` — purple/cyan brand, Supabase login
- `frontend/src/pages/SignupPage.jsx` — purple/cyan brand, Supabase signup
- `frontend/src/pages/UploadPage.jsx` — direct-to-Supabase upload with progress bar, 100 MB cap
- `frontend/src/pages/DashboardPage.jsx` — real `/api/profile` + `/api/projects`, usage bar, upgrade CTA
- `frontend/src/pages/AuthCallbackPage.jsx` — new (Google OAuth landing)
- `frontend/src/pages/ClipEditorPage.jsx` — download via signed Supabase URL
- `frontend/src/components/PricingCards.jsx` — Free/Starter/Pro/Business tiers
- `frontend/src/components/Hero.jsx`, `Navbar.jsx`, `DashboardLayout.jsx` — gradient CTAs
- `frontend/tailwind.config.js` — purple palette added, `volt` remapped to teal
- `frontend/src/index.css` — new brand utilities (`btn-brand`, `ring-brand`, `shimmer`)
- `frontend/src/App.js` — `/auth/callback` route
- `memory/supabase_schema.sql` — SQL to paste in Supabase

## Cost of next steps

| Task | Time | Priority |
|---|---|---|
| Paste SQL (you) | 30 sec | 🔴 blocker |
| Deploy backend to Railway | ~10 min | 🔴 for production |
| Enable Google OAuth in Supabase + Google Cloud | ~15 min | 🟡 nice to have |
| Stripe checkout for paid tiers | ~3 hrs | 🟡 revenue |
| Email verification on signup | ~30 min | 🟡 before public launch |
| Migrate WorkspacePage / SettingsPage from localStorage → Supabase | ~45 min | 🟢 polish |
