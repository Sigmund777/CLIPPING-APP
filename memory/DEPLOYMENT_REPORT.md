# Hookify AI — v1 Production Readiness Report

_Last updated: Feb 17, 2026_

## 1. What is fully working (verified end-to-end)

| Capability | Endpoint / Surface | Status |
|---|---|---|
| Email/password sign-up | `POST /api/auth/register` | ✅ Real, bcrypt-hashed, JWT in httpOnly cookies, session survives refresh |
| Email/password login + logout | `POST /api/auth/login`, `POST /api/auth/logout` | ✅ Real, with friendly local-fallback only if backend literally unreachable |
| Session check on refresh | `GET /api/auth/me` | ✅ Real |
| Protected routes redirect to /login | `App.js Protected` | ✅ Real |
| Long-form video upload (mp4/mov/mp3/wav/m4a, ≤25 MB MVP) | `POST /api/ai/analyze` | ✅ Real (multipart, with progress on the UI) |
| Whisper transcription (segments + timestamps) | OpenAI Whisper via Emergent LLM key | ✅ Real |
| AI clip suggestions (3–5, real fields) | Claude Sonnet 4.5 via Emergent LLM key | ✅ Real |
| Source video persisted across redeploys | Emergent Object Storage at `clipforge/sources/{user}/{project}.{ext}` | ✅ Real |
| 9:16 vertical render with burnt captions | FFmpeg pipeline (centered crop → 1080×1920 + SRT burn-in volt-yellow) | ✅ Real, verified — output is H.264/AAC 1080×1920 |
| Render progress polling (8 stages) | `GET /api/render/{job_id}` | ✅ Real |
| Final MP4 stored back to object storage | `clipforge/renders/{user}/{job}.mp4` | ✅ Real |
| MP4 download | `GET /api/render/{job_id}/download` | ✅ Real (cookie/header/query-token auth) |
| Saved clips workspace (CRUD) | `/api/saved-clips` GET/POST/PATCH/DELETE | ✅ Real, per-user, soft-delete |
| Settings per user | `/api/settings` GET/PUT | ✅ Real |
| Projects list (history) | `/api/projects`, `/api/projects/{id}` | ✅ Real |

## 2. What is still fallback / demo

| Item | Why | Where |
|---|---|---|
| Anonymous "demo" preview when backend unreachable | Intentional graceful fallback so the landing page + editor never break in offline preview mode | `auth.jsx`, `mockData.js` |
| Mocked `/api/ai/transcript` and `/api/ai/suggestions` (legacy endpoints) | Kept only to support old saved clips that don't have a real `project_id`. New uploads go through `/api/ai/analyze` which is fully real. | `server.py` lines 305-314 |
| Google login | Endpoint exists but uses a simulated Google profile post — **no real OAuth callback wired**. Clearly says "demo" in the UI hint. | `server.py /auth/google`, `auth.jsx googleAuth` |
| Email verification on register | **Not implemented** — new users are auto-logged-in without verifying their email. Add SendGrid/Resend before public launch. | n/a |
| Templates / Settings on the frontend | Settings are now backend-persisted via `/api/settings` (server-side), but the **frontend pages still write to localStorage** for instant feedback. Migrating the FE to call the server endpoints is a small follow-up. | `SettingsPage.jsx`, `TemplatesPage.jsx` |
| Workspace pulls localStorage | Backend endpoints exist (`/api/saved-clips`) but the FE WorkspacePage still reads localStorage. Switching it over is a 30-min follow-up. | `WorkspacePage.jsx` |
| Smart re-framing (face/speaker tracking) | Out of v1 scope. v1 uses centered 9:16 crop. | `_run_render_job` in `server.py` |
| Fancy caption styles (karaoke, animated word-by-word) | Out of v1 scope. v1 uses a single burnt-in SRT block, volt-yellow on shadow. | `_run_render_job` |
| Render preview before download | Not yet — user has to download the MP4 to watch. Adding an inline `<video>` from the storage URL is a simple v1.1 add. | `ClipEditorPage.jsx` |

## 3. Where files are stored & persistence

| File type | Where | Persists across redeploys? |
|---|---|---|
| User accounts, sessions, settings | MongoDB | ✅ Yes |
| Saved clips, render jobs, AI projects | MongoDB | ✅ Yes |
| Uploaded source videos | Emergent Object Storage (`clipforge/sources/...`) | ✅ Yes |
| Rendered MP4s | Emergent Object Storage (`clipforge/renders/...`) | ✅ Yes |
| FFmpeg scratch (intermediate frames, SRT) | `tempfile.mkdtemp()` inside the backend container | ❌ Wiped after each render (intended) |

## 4. Required environment variables

| Var | Used by | Required? | Source |
|---|---|---|---|
| `MONGO_URL` | Backend Mongo connection | ✅ Required | Your Mongo Atlas / Railway / Render Mongo |
| `DB_NAME` | Mongo database name | ✅ Required | Any string, e.g. `clipforge_prod` |
| `JWT_SECRET` | Signs auth tokens | ✅ Required | `openssl rand -hex 32` |
| `EMERGENT_LLM_KEY` | Whisper, Claude, Object Storage | ✅ Required | Emergent dashboard → Profile → Universal Key |
| `APP_NAME` | Storage path prefix | ✅ Required | `clipforge` or `hookify` |
| `FRONTEND_URL` | CORS allow-list for browser | ✅ Required | Your Vercel domain (e.g. `https://hookify.vercel.app`) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Seeds an admin on first boot | ⚪ Optional | Default: `admin@clipforge.ai / ClipForge2026!` |
| `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` | Seeds a demo user | ⚪ Optional | Default: `creator@clipforge.ai / Creator2026!` |
| `REACT_APP_BACKEND_URL` | Frontend → backend base URL | ✅ Required (frontend) | Your backend host (Railway/Render), **NOT Vercel** |

## 5. Recommended live hosting setup

**Vercel is fine for the frontend ONLY. It cannot host the backend.** Reasons:
- Vercel serverless has a hard 4.5 MB request body limit (uploads up to 25 MB will 413).
- Vercel functions cannot run FFmpeg jobs that take >10 seconds.
- No persistent local disk between invocations.

### Production stack we recommend

| Layer | Service | Why |
|---|---|---|
| Frontend | **Vercel** | Free, instant deploys, CDN, env-var support. Just point at this repo's `/frontend` with output `build`. |
| Backend (FastAPI + FFmpeg) | **Railway** or **Render** (or **Fly.io**) | Long-lived processes, FFmpeg binary, environment vars, persistent disk if needed |
| Database | **MongoDB Atlas** (free M0) | Already wired via `MONGO_URL` |
| Object storage | **Emergent Object Storage** (already wired) — or migrate to **Cloudflare R2 / S3** when scaling beyond Emergent's quotas | Persists across redeploys, accessed via the backend |

You do **not** need a separate worker for v1 — FFmpeg runs inline as an asyncio task. When you scale past ~10 concurrent renders, move to a Celery/RQ worker on the same Railway service.

## 6. Where to add env vars

### In Emergent preview (what you're using now)
- Backend: `/app/backend/.env` — already populated. Just keep `EMERGENT_LLM_KEY` valid (top up balance via Profile → Universal Key → Add Balance if it 502s).
- Frontend: `/app/frontend/.env` — `REACT_APP_BACKEND_URL` is already set to the preview URL.

### In Vercel (frontend)
- **Project Settings → Environment Variables**:
  - `REACT_APP_BACKEND_URL = https://your-backend-host.railway.app` (no trailing slash)
- After adding, redeploy via the Vercel dashboard (`Deployments → … → Redeploy`).

### In Railway / Render (backend)
- Add every required var from §4 above.
- For Railway: **New Service → Deploy from GitHub repo → /backend root**. Set the **Start Command** to:
  ```
  uvicorn server:app --host 0.0.0.0 --port $PORT
  ```
- Make sure FFmpeg is on the image. Railway/Render auto-detect Python, but **you need to add `ffmpeg` to the apt packages**. Add `nixpacks.toml` or `Aptfile`:
  ```
  # Aptfile (Render / Heroku-buildpack style)
  ffmpeg
  ```
  Or for Railway with Nixpacks, add `nixpacks.toml`:
  ```
  [phases.setup]
  aptPkgs = ["ffmpeg"]
  ```

## 7. Exact test steps (real user flow)

1. Open the deployed frontend URL.
2. Click **Start free** → register with `you@yourname.com` / `TestPass123!` / your name. **Should land on /dashboard.**
3. Refresh the page. **Session must persist** (sidebar still shows your name).
4. Click **Upload** → drop an MP4 ≤ 25 MB with clear English speech (a 30-90 sec podcast/YouTube clip works great).
5. Watch the live pipeline. After 20–40 seconds you'll see **AI ANALYSIS COMPLETE** + 3–5 real clip ideas. Each card shows real title, hook, caption, platform, and confidence.
6. Click **Open in editor** on any idea.
7. The header should show **Generate clip** (active, volt-yellow). Click it.
8. Watch the 8-stage render pipeline. ~3–10 seconds later (depending on duration) the button switches to **Download MP4**.
9. Click **Download MP4**. A 1080×1920 H.264/AAC MP4 with burnt-in volt-yellow captions downloads.
10. Click **Save clip**. Open **Workspace** in the sidebar — your clip appears with platform/status filters.
11. Click **Settings** → change platform / caption style → **Save settings**. Refresh — values persist.
12. Click **Templates** → pick one → it sets active template. Visit **Upload** — context strip shows the active template.
13. Log out. Try to visit `/dashboard` directly. **Should redirect to /login.**

If any of these don't work in your live env, check `/var/log/supervisor/backend.err.log` or your Railway/Render logs first.

## 8. Exact GitHub + Vercel + Railway deployment steps

### a) Save to GitHub
In the Emergent chat input, click **Save to GitHub**, name your repo `hookify`, push to your GitHub.

### b) Deploy backend to Railway
1. https://railway.app → **New Project → Deploy from GitHub** → pick your `hookify` repo.
2. **Root Directory**: `backend`
3. **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
4. Add a `nixpacks.toml` to the repo root or `backend/nixpacks.toml`:
   ```toml
   [phases.setup]
   aptPkgs = ["ffmpeg"]
   ```
5. Variables tab — paste all env vars from §4.
6. Deploy. Note the public domain Railway gives you, e.g. `https://hookify-backend.up.railway.app`.

### c) Deploy frontend to Vercel
1. https://vercel.com → **New → Import** your GitHub repo.
2. **Framework**: Create React App, **Root Directory**: `frontend`.
3. **Build Command**: `yarn build` (or leave as default)
4. **Environment Variables**:
   - `REACT_APP_BACKEND_URL = https://hookify-backend.up.railway.app` (your Railway URL, no trailing slash)
5. Deploy.

### d) MongoDB
- Use **MongoDB Atlas free tier (M0)**. Get the `mongodb+srv://...` connection string and set it as `MONGO_URL` in Railway.

### e) CORS
- Set `FRONTEND_URL` in Railway to your final Vercel domain so the backend allows that origin.

## 9. Known limitations + next steps

- **25 MB upload cap** — matches Whisper's hard limit. To support larger uploads, do client-side audio extraction (using ffmpeg.wasm) and send only the audio. Future v1.5.
- **Render is synchronous on one machine** — fine up to ~10 concurrent. Move to Celery + Redis when you exceed that.
- **No payment / pricing tier enforcement** — Pricing page exists, Stripe is not wired. Future v2.
- **No email verification** — add SendGrid + a short verification link. ~1 hr.
- **No password reset** — same. ~1 hr.
- **Frontend WorkspacePage / SettingsPage still read localStorage** — backend endpoints are ready, just swap the calls. ~30 min each.

---

**Bottom line**: The core promise — upload → transcribe → AI suggestions → real 9:16 MP4 with captions you can post to TikTok — works end-to-end against real services with persistent storage. The preview at `https://clipforge-ai-33.preview.emergentagent.com` is the live test surface. Ready for you to verify before pushing to GitHub.
