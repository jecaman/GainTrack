# Deployment — GainTrack

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

## Services Setup

### 1. Vercel (Frontend)

1. Import Git Repository → set **Root Directory** to `.` (repo root), **Framework Preset** to Vite
2. Add env var: `VITE_API_URL` = `https://<your-render-backend>.onrender.com`
3. Deploy

### 2. Render (Backend)

1. New Web Service → connect repo
2. Render detects `render.yaml`, or set manually: **Root Directory** `backend`, **Runtime** Docker, **Plan** Free
3. Add env vars: `SUPABASE_URL`, `SUPABASE_KEY`, `CORS_ORIGINS`, `ENV=production`, `FORCE_HTTPS=true`
4. Deploy

### 3. GitHub Actions

Secrets in the **Production** environment (repo → Settings → Environments → Production):

| Secret | Used by |
|--------|---------|
| `SUPABASE_URL`, `SUPABASE_KEY` | Daily Price Update (00:05 UTC) |
| `BACKEND_URL` | Refresh Demo Portfolio (00:15 UTC) |

---

## Environment Variables

### Frontend (Vercel)

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Render backend URL |

### Backend (Render)

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase anon key |
| `CORS_ORIGINS` | Vercel frontend URL |
| `ENV` | `production` |
| `FORCE_HTTPS` | `true` |
