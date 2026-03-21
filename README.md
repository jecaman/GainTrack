# GainTrack — Crypto Portfolio Analyzer

A personal crypto portfolio tracker that processes your Kraken trade history with FIFO accounting and displays real-time analytics in an interactive dashboard.

**Live demo**: [gain-track-kappa.vercel.app](https://gain-track-kappa.vercel.app/) — the app includes detailed technical documentation in the Docs section.

## Features

- **FIFO-based P&L** — Accurate cost basis, realized and unrealized gains using First-In-First-Out
- **Interactive timeline** — Zoom, pan, and click any day to see portfolio state at that point
- **Live prices** — Auto-refreshing prices from Kraken API (5-min cache)
- **Per-asset breakdown** — Leaderboard, donut chart, and proportional bar
- **Operation filtering** — Toggle individual trades on/off to see "what if" scenarios
- **Date range analysis** — KPIs adapt to show period gains or cumulative state
- **Demo mode** — Try instantly with pre-computed sample data, no backend needed
- **Multi-currency** — EUR and USD support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Chart.js |
| Backend | Python, FastAPI, Pandas |
| Price Cache | Supabase (PostgreSQL) |
| Deployment | Vercel + Render + GitHub Actions |

---

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
python3 main.py
# → http://localhost:8001
```

Requires a `.env` file with Supabase credentials (see `scripts/setup-supabase.sql` for schema).

### Frontend

```bash
npm install
npm run dev
# → http://localhost:5173
```

Set `VITE_API_URL` in `.env.development` to point to the backend (defaults to `http://localhost:8001`).

---

## How It Works

```
Kraken CSV export
       ↓
  Backend (FastAPI)
  ├── Parses CSV
  ├── Processes FIFO across full history
  ├── Fetches historical prices from Supabase cache
  └── Returns timeline + portfolio data
       ↓
  Frontend (React)
  ├── Renders dashboard with KPIs, charts, tables
  ├── Recalculates KPIs client-side on date/filter changes
  └── Fetches live prices from backend (Kraken API → 5-min cache)
```

The backend only needs to be called once on load (or when operation exclusions change). All date filtering and KPI recalculation happens in the browser from the full timeline data.

---

## Project Structure

```
├── backend/
│   ├── main.py               # FastAPI server (port 8001)
│   ├── supabase_cache.py     # Historical price cache via Supabase
│   ├── requirements.txt
│   ├── Dockerfile             # For Render deployment
│   ├── scripts/
│   │   ├── actualizar_historicos.py  # Daily cron: update yesterday's prices
│   │   ├── poblar_historico.py       # Backfill price cache (last N days)
│   │   ├── recarga_historica.py      # Reload specific date range
│   │   ├── generate_demo_csv.py      # Generate demo dataset
│   │   ├── setup_cron.sh             # Local cron setup
│   │   └── setup-supabase.sql        # Supabase table schema
│   └── tests/
│       └── test_portfolio.py
├── src/
│   ├── App.jsx               # Entry point; fetches data, manages state
│   ├── components/
│   │   ├── Filters.jsx       # Sidebar filters (date, assets, operations)
│   │   └── Dashboard/
│   │       ├── Dashboard.jsx         # Central date/filter state manager
│   │       ├── Header.jsx
│   │       └── Sections/
│   │           ├── Overview/         # KPIs, timeline, asset table, charts
│   │           ├── Operations/       # Trade history with toggle
│   │           └── Portfolio/        # Portfolio breakdown
│   └── utils/
│       ├── krakenAssets.js    # Asset name/color/logo mapping
│       ├── chartUtils.js     # Chart.js helpers
│       └── numberFormatter.js # European number formatting
├── public/
│   ├── demo_portfolio.json   # Pre-computed demo data
│   └── demo_trades.csv       # Demo trade history
└── DEPLOYMENT.md             # Deployment guide (Vercel + Render + Actions)
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/portfolio` | Process trades from API keys (returns timeline + KPIs) |
| `POST` | `/api/portfolio/csv` | Process trades from CSV upload |
| `GET` | `/api/prices/current` | Live prices for tracked assets (5-min cache) |
| `GET` | `/docs` | Interactive API documentation (Swagger) |

---

## Maintenance Scripts

```bash
cd backend

# Update yesterday's prices in Supabase cache (runs daily via GitHub Actions)
python3 scripts/actualizar_historicos.py

# Backfill historical prices for the last N days
python3 scripts/poblar_historico.py

# Reload prices for a specific asset and date range
python3 scripts/recarga_historica.py 2025-09-01 2025-10-01 XXBT
```

---

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for full setup guide. TL;DR:

- **Frontend**: Vercel (auto-deploy on push)
- **Backend**: Render free tier (Docker)
- **Price cron**: GitHub Actions (daily at 00:05 UTC)
- **Demo refresh**: GitHub Actions (daily at 00:15 UTC)

Total cost: **$0/month**

---

## License

Personal project. Not open for contributions at this time.
