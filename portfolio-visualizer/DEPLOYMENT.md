# Deployment — GainTrack Portfolio Visualizer

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌───────────┐
│   Vercel    │────▶│    Render    │────▶│  Supabase  │
│  (Frontend) │     │  (Backend)   │     │  (Cache)   │
│  React/Vite │     │   FastAPI    │     │ PostgreSQL │
│    FREE     │     │    FREE      │     │    FREE    │
└─────────────┘     └──────────────┘     └───────────┘
                          ▲
                    ┌─────┴──────┐
                    │  GitHub    │
                    │  Actions   │
                    │ (Daily     │
                    │  cron)     │
                    │   FREE     │
                    └────────────┘
```

**Total cost: $0/month**

---

## Decisions & Trade-offs

### Why Render free tier?
- Low traffic (personal use + occasional visitors)
- Backend sleeps after 15 min of inactivity
- Cold start ~30-50s on first request (acceptable trade-off for $0)
- If problematic, easy to migrate to Railway ($5/mo) — just change the URL

### Why GitHub Actions for cron?
- Render free tier sleeps — can't run reliable cron jobs
- GitHub Actions runs independently, free for public repos
- Runs `actualizar_historicos.py` daily at 00:05 UTC

### Why Vercel for frontend?
- Auto-detects Vite, zero config
- Global CDN — instant page load
- Auto-deploy on git push

---

## Services Setup

### 1. Vercel (Frontend)

1. Go to [vercel.com](https://vercel.com) → Import Git Repository
2. Select the repo, set:
   - **Framework Preset**: Vite
   - **Root Directory**: `portfolio-visualizer`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add environment variable:
   - `VITE_API_URL` = `https://<your-render-backend>.onrender.com`
4. Deploy

### 2. Render (Backend)

1. Go to [render.com](https://render.com) → New Web Service
2. Connect the repo
3. Render will detect `render.yaml` automatically, or configure manually:
   - **Root Directory**: `portfolio-visualizer/backend`
   - **Runtime**: Docker
   - **Plan**: Free
4. Add environment variables:
   - `SUPABASE_URL` = your Supabase project URL
   - `SUPABASE_KEY` = your Supabase anon key
   - `CORS_ORIGINS` = `https://<your-vercel-frontend>.vercel.app`
   - `ENV` = `production`
   - `FORCE_HTTPS` = `true`
5. Deploy

### 3. GitHub Actions (Daily Cron)

1. Go to repo → Settings → Secrets and variables → Actions
2. Add repository secrets:
   - `SUPABASE_URL` = your Supabase project URL
   - `SUPABASE_KEY` = your Supabase anon key
3. The workflow (`.github/workflows/daily-price-update.yml`) runs automatically at 00:05 UTC
4. To test: Actions tab → "Daily Price Update" → "Run workflow"

---

## Environment Variables Reference

### Frontend (Vercel)

| Variable | Value | Required |
|----------|-------|----------|
| `VITE_API_URL` | `https://<render-service>.onrender.com` | Yes |

### Backend (Render)

| Variable | Value | Required |
|----------|-------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_KEY` | Supabase anon key | Yes |
| `CORS_ORIGINS` | Vercel frontend URL | Yes |
| `ENV` | `production` | Yes |
| `FORCE_HTTPS` | `true` | Recommended |
| `PORT` | Auto-assigned by Render | Automatic |

### GitHub Actions Secrets

| Secret | Value | Required |
|--------|-------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_KEY` | Supabase anon key | Yes |

---

## Render Cold Start

Render free tier spins down after 15 min of inactivity. First request after sleep takes ~30-50s.

**Mitigation ideas:**
- Show "Starting server..." message in the frontend when backend is slow to respond
- Demo mode works without backend (instant, pre-computed data)

---

## Files Added for Deployment

| File | Purpose |
|------|---------|
| `backend/Dockerfile` | Container image for Render |
| `backend/.dockerignore` | Excludes .env, trades.csv, logs from image |
| `render.yaml` | Render service definition (IaC) |
| `.github/workflows/daily-price-update.yml` | Daily cron for Supabase price cache |
| `.env.development` | Frontend dev API URL |
| `.env.production` | Frontend prod API URL (template) |

---

## Useful Commands

```bash
# Build frontend locally
cd portfolio-visualizer && npm run build

# Test backend Docker image locally
cd portfolio-visualizer/backend
docker build -t gaintrack-api .
docker run -p 8001:8001 --env-file .env gaintrack-api

# Test cron script manually
cd portfolio-visualizer/backend
python3 scripts/actualizar_historicos.py

# Check Render logs
# → render.com dashboard → your service → Logs

# Trigger GitHub Action manually
# → GitHub repo → Actions → Daily Price Update → Run workflow
```

---

## Migration (if Render doesn't work out)

To switch backend to Railway ($5/mo):
1. Create Railway project, connect repo
2. Set root directory to `portfolio-visualizer/backend`
3. Copy env vars from Render
4. Update `VITE_API_URL` in Vercel to the new Railway URL
5. Redeploy frontend
