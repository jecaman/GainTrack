import { useState, useEffect, useRef } from 'react';

const TOC_ITEMS = [
  // ── Technical ──
  { id: 'tldr', label: 'TL;DR', subs: [] },
  { id: 'about', label: 'About', subs: [
    { id: 'about-problem', label: 'The Problem' },
    { id: 'about-what', label: 'What GainTrack Does' },
  ]},
  { id: 'architecture', label: 'Architecture', subs: [
    { id: 'arch-flow', label: 'Data Flow' },
    { id: 'arch-diagram', label: 'System Diagram' },
  ]},
  { id: 'pipeline', label: 'Data Pipeline', subs: [
    { id: 'pl-ingestion', label: 'Data Ingestion' },
    { id: 'pl-fifo', label: 'FIFO Engine' },
    { id: 'pl-storage', label: 'Storage Layer' },
    { id: 'pl-cache', label: 'Caching System' },
    { id: 'pl-serving', label: 'Serving Layer' },
  ]},
  { id: 'performance', label: 'Performance', subs: [] },
  { id: 'decisions', label: 'Design Decisions', subs: [] },
  { id: 'tradeoffs', label: 'Trade-offs', subs: [] },
  // ── Functional ──
  { id: 'getting-started', label: 'Getting Started', subs: [
    { id: 'gs-api', label: 'API Connection' },
    { id: 'gs-csv', label: 'CSV Upload' },
  ]},
  { id: 'dashboard', label: 'Dashboard Guide', subs: [
    { id: 'db-kpi', label: 'KPI Grid' },
    { id: 'db-timeline', label: 'Timeline Chart' },
    { id: 'db-components', label: 'Other Components' },
    { id: 'db-trades', label: 'Trades & Filters' },
  ]},
  { id: 'security', label: 'Security', subs: [] },
  { id: 'contact', label: 'Contact', subs: [] },
];

// ─── Reusable style builders ───────────────────────────────────────────────────

const makeStyles = (theme) => ({
  sectionTitle: {
    fontSize: '1.6rem',
    fontWeight: 700,
    fontFamily: "'Inter', sans-serif",
    color: theme.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    marginBottom: '0.4rem',
    marginTop: '5rem',
  },
  greenBar: {
    width: '40px',
    height: '2px',
    background: '#00ff88',
    boxShadow: '0 0 10px rgba(0,255,153,0.5)',
    borderRadius: '1px',
    marginBottom: '1.8rem',
  },
  subsectionTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif",
    color: theme.textPrimary,
    marginTop: '2rem',
    marginBottom: '0.8rem',
  },
  body: {
    fontSize: '16px',
    lineHeight: 1.75,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: "'Inter', sans-serif",
    marginBottom: '1rem',
  },
  codeBlock: {
    fontFamily: 'monospace',
    fontSize: '14px',
    lineHeight: 1.6,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '10px',
    padding: '1.2rem 1.4rem',
    overflowX: 'auto',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: '1.2rem',
    whiteSpace: 'pre',
  },
  inlineCode: {
    fontFamily: 'monospace',
    fontSize: '14px',
    padding: '2px 7px',
    borderRadius: '4px',
    background: 'rgba(0,255,136,0.08)',
    color: '#00ff88',
  },
  callout: {
    borderLeft: '3px solid #00ff88',
    paddingLeft: '16px',
    marginLeft: '0',
    marginBottom: '1.2rem',
    fontSize: '15px',
    lineHeight: 1.7,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: "'Inter', sans-serif",
    fontStyle: 'italic',
  },
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '13px',
    padding: '1.4rem 1.6rem',
    marginBottom: '1.2rem',
  },
  label: {
    fontSize: '12px',
    fontFamily: 'monospace',
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: '#00ff88',
    marginBottom: '0.4rem',
  },
});

// ─── Section Components ────────────────────────────────────────────────────────

const TldrSection = ({ s }) => (
  <div id="tldr">
    <h2 style={{ ...s.sectionTitle, marginTop: '0.5rem' }}>TL;DR</h2>
    <div style={s.greenBar} />

    <div style={{
      ...s.card,
      borderLeft: '3px solid #00ff88',
      paddingLeft: '1.6rem',
    }}>
      <ul style={{
        ...s.body,
        fontSize: '15px',
        margin: 0,
        paddingLeft: '1.2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <li><strong>Ingestion:</strong> Trade data via Kraken API (HMAC-SHA512 auth) or CSV upload, with crypto-to-crypto EUR conversion</li>
        <li><strong>Processing:</strong> Full-history FIFO engine computes accurate cost basis, realized/unrealized gains per asset</li>
        <li><strong>Storage:</strong> Daily time-series built from Supabase (PostgreSQL) historical prices — batch queries, not per-day lookups</li>
        <li><strong>Caching:</strong> 3-layer system — persistent Supabase, volatile in-memory (shared across all users, ~288 Kraken calls/day), browser-side timeline</li>
        <li><strong>Serving:</strong> Backend returns complete timeline once; frontend recomputes all KPIs/charts client-side via <span style={s.inlineCode}>useMemo</span> (~50ms)</li>
        <li><strong>Privacy:</strong> User data is stateless (never stored). Only public market prices are persisted</li>
      </ul>
    </div>

    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '1.2rem', marginBottom: '0.5rem' }}>
      {['Python', 'FastAPI', 'PostgreSQL', 'React 19', 'Chart.js', 'Vite'].map(tech => (
        <span key={tech} style={{
          ...s.inlineCode,
          fontSize: '12px',
          padding: '4px 10px',
        }}>{tech}</span>
      ))}
    </div>
  </div>
);

const AboutSection = ({ s }) => (
  <div id="about">
    <h2 style={s.sectionTitle}>About</h2>
    <div style={s.greenBar} />

    <p style={s.body}>
      GainTrack is a data pipeline that processes cryptocurrency trade history through a
      FIFO (First In, First Out) accounting engine, reconstructs daily portfolio state as a
      time-series, and serves pre-computed snapshots to an interactive frontend.
    </p>
    <p style={s.body}>
      The backend ingests raw trade data (via CSV or authenticated API), runs a full-history FIFO
      pass, fetches historical prices from a persistent Supabase cache, and returns a complete
      daily timeline. The frontend then operates entirely from this in-memory dataset — all
      filtering, date changes, and KPI recalculations happen client-side with zero network requests.
    </p>
    <div style={s.callout}>
      <strong>Currently Kraken-only.</strong> GainTrack works exclusively with trade data from Kraken
      (via API connection or CSV export). Support for additional exchanges is on the roadmap.
    </div>

    <h3 id="about-problem" style={s.subsectionTitle}>The Problem with Exchange Data</h3>
    <p style={s.body}>
      Kraken — and most crypto exchanges — don't give you an accurate picture of portfolio
      performance. They show trades, but not the full story: true cost basis, realized vs
      unrealized gains, and proper FIFO accounting. Kraken's own portfolio page uses a
      simplified weighted-average method instead of FIFO, leading to cost basis discrepancies
      of up to 20% on real gains — confirmed by their support team. If you've been trading
      actively, the numbers on your exchange dashboard are likely wrong.
    </p>
    <p style={s.body}>
      On top of that, assets moved to private wallets or other exchanges simply disappear from
      the exchange's view. GainTrack solves this: as long as the original purchase was on Kraken,
      the full trade history is preserved regardless of where those assets live now.
    </p>

    <h3 id="about-what" style={s.subsectionTitle}>What GainTrack Does</h3>
    <p style={s.body}>
      Import your trade history (CSV or API), and GainTrack processes it through a proper FIFO engine
      to give you accurate, real metrics about your investment. Combine filters (dates, assets, trade
      types) to identify your best and worst performers, spot patterns, and drill down into specific
      time periods. Toggle individual trades on and off to explore "what if" scenarios — what would your
      P&L look like if you hadn't made that one trade?
    </p>
    <p style={s.body}>
      There are no user accounts, no registration, no login. User data is fully stateless — trade
      history and API keys are processed in memory and never stored. The only persistent storage
      is a Supabase PostgreSQL database containing public market prices (daily closing prices for
      each asset), which is independent of any user data.
    </p>

  </div>
);

const ArchitectureSection = ({ s }) => (
  <div id="architecture">
    <h2 style={s.sectionTitle}>Architecture</h2>
    <div style={s.greenBar} />

    <p style={s.body}>
      The system separates into two phases: a <strong>batch processing phase</strong> (backend
      computes the full timeline once per request) and a <strong>near real-time phase</strong> (background
      price refresh every ~5 minutes). User interactions after the initial load are entirely
      client-side — no backend round-trips for filtering, zooming, or KPI recalculation.
    </p>

    <h3 id="arch-flow" style={s.subsectionTitle}>Data Flow</h3>
    <p style={s.body}>
      Regardless of the import method (CSV or API), the processing pipeline is the same:
    </p>
    <div style={s.codeBlock}>{
`CSV / API Keys
      │
      ▼                                        ┌─────────────────┐
┌──────────────────────────────────────────────┤   BATCH         │
│  Backend (FastAPI)                           │   (per request) │
│                                              └─────────────────┘
│  1. Parse trades from CSV or Kraken API
│  2. Detect crypto-to-crypto trades, convert costs
│  3. Run FIFO engine over full trade history
│  4. Fetch historical prices from Supabase    ← PERSISTENT
│  5. Build daily timeline (one snapshot/day)
│  6. Fetch current prices from Kraken API
│
│  Returns: timeline[] + portfolio_data[] + kpis{}
└────────────────────────┬─────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────┐
│  Frontend (React)                            │
│                                              │
│  • Stores full timeline in memory (~1000+ d) │
│  • KPIs recalculated via useMemo (~50ms)     │
│  • Charts rendered from timeline data        │
│  • All filtering happens client-side         │
│  • Prices auto-refresh every ~5 min          │  ← NEAR REAL-TIME
│    (hits backend RAM cache, not Kraken)      │
└──────────────────────────────────────────────┘`
    }</div>
    <p style={s.body}>
      The daily timeline is the central data structure. Each entry contains a complete portfolio
      snapshot: total value, cost basis, realized and unrealized gains, per-asset breakdowns, and
      every individual operation that occurred that day. This is what makes frontend-only
      recalculation possible — all the raw data is already there.
    </p>

    <h3 id="arch-diagram" style={s.subsectionTitle}>System Diagram</h3>
    <p style={s.body}>
      The complete system with every component, data flow, and storage persistence:
    </p>
    <div style={s.codeBlock}>{
`
┌─────────┐    CSV/API     ┌───-─────────────────────────────────┐
│  User   │ ──────────────→│  Backend (FastAPI, port 8001)       │
│  Input  │                │                                     │
└─────────┘                │  Parse trades                       │
                           │       ↓                             │
                           │  FIFO engine (full history)         │
                           │       ↓                             │
                           │  Build daily timeline               │
                           │    ├─ Supabase ← historical prices  │
                           │    └─ Kraken API ← today's price    │
                           │       ↓                             │
                           │  Return: timeline[] + portfolio[]   │
                           └──────────────── ┬───────────────────┘
                                             │ 
                    ┌──────────────────────┐ │ ┌──────────────────┐
                    │  Supabase            │ │ │  Kraken API      │
                    │  (PostgreSQL)        │ │ │  (public)        │
                    │                      │ │ │                  │
                    │  Historical prices   │ │ │  Current prices  │
                    │  Daily cron update   │ │ │  BG refresh ~5m  │
                    │  PERSISTENT          │ │ │  ~288 calls/day  │
                    └──────────────────────┘ │ └──────────────────┘
                                             │
                                             ▼
                           ┌────────────────────────────────────┐
                           │  Frontend (React + Vite)            │
                           │                                     │
                           │  Timeline stored in memory          │
                           │  KPIs via useMemo (FIFO replay)     │
                           │  Charts from timeline snapshots     │
                           │  Price refresh every ~5 min         │
                           │  All filtering is client-side       │
                           │  VOLATILE (session lifetime)        │
                           └────────────────────────────────────┘`
    }</div>
    <div style={s.callout}>
      The backend is stateless for user data — it doesn't store trades, API keys, or CSV files.
      The only persistent storage is the Supabase price cache, which contains public market prices
      (not user data) and is shared across all requests.
    </div>
  </div>
);

const PipelineSection = ({ s }) => (
  <div id="pipeline">
    <h2 style={s.sectionTitle}>Data Pipeline</h2>
    <div style={s.greenBar} />

    <h3 id="pl-ingestion" style={s.subsectionTitle}>Data Ingestion</h3>
    <p style={s.body}>
      Trade data enters the system through two paths, both producing the same normalized format:
    </p>
    <div style={{ display: 'flex', gap: '16px', marginBottom: '1.2rem' }}>
      <div style={{ ...s.card, flex: 1 }}>
        <div style={s.label}>CSV Import</div>
        <p style={{ ...s.body, marginBottom: 0, fontSize: '15px' }}>
          Kraken's standard trade export. Parsed in memory — never written to disk. Supports
          the full Kraken CSV schema including all pair formats and order types.
        </p>
      </div>
      <div style={{ ...s.card, flex: 1 }}>
        <div style={s.label}>Kraken API</div>
        <p style={{ ...s.body, marginBottom: 0, fontSize: '15px' }}>
          Authenticated via HMAC-SHA512. Read-only keys fetch the complete trade history in a
          single paginated request. Keys are used once and discarded from memory.
        </p>
      </div>
    </div>
    <p style={s.body}>
      During ingestion, the system detects <strong>crypto-to-crypto trades</strong> (e.g. BTC→ETH)
      and converts costs through EUR equivalents using the historical price at the trade date. Kraken
      uses internal asset names (XXBT for BTC, XETH for ETH, XDG for DOGE) — the backend normalizes
      these before processing.
    </p>

    <h3 id="pl-fifo" style={s.subsectionTitle}>FIFO Engine</h3>
    <p style={s.body}>
      The core of GainTrack's accuracy. All trades are processed chronologically using First In,
      First Out accounting — the same method used for tax reporting in most jurisdictions. When you
      sell crypto, the cost basis comes from the oldest unsold buy lots:
    </p>
    <div style={s.codeBlock}>{
`Buy 1.0 BTC @ €10,000  ──┐
Buy 0.5 BTC @ €12,000  ──┤  FIFO Queue (oldest first)
Buy 0.3 BTC @ €11,000  ──┘

Sell 1.2 BTC @ €15,000
  → Consumes: 1.0 lot @ €10,000 + 0.2 from lot @ €12,000
  → Cost basis: €10,000 + €2,400 = €12,400
  → Realized gain: (1.2 × €15,000) - €12,400 = €5,600
  → Remaining: 0.3 BTC @ €12,000 + 0.3 BTC @ €11,000`
    }</div>
    <p style={s.body}>
      The engine also handles crypto-to-crypto trades by converting costs through EUR equivalents,
      and includes fees in the cost basis calculation for accurate tax reporting.
    </p>
    <div style={s.callout}>
      FIFO always processes from the very first trade in history, never from a filtered date.
      Starting mid-history would produce incorrect cost basis values because earlier buys that
      should have been consumed by sells would still appear as held positions. This is exactly
      where most exchanges get it wrong — and why their numbers can differ by up to 20%.
    </div>

    <h3 id="pl-storage" style={s.subsectionTitle}>Storage Layer</h3>
    <p style={s.body}>
      Historical prices are stored in a <strong>Supabase PostgreSQL</strong> database — the only
      persistent storage in the system. This is not a cache in the traditional sense; it's the
      authoritative source for all historical price data used in timeline construction.
    </p>
    <div style={s.card}>
      <div style={s.label}>Supabase — PostgreSQL</div>
      <p style={{ ...s.body, marginBottom: '0.6rem', fontSize: '15px' }}>
        <strong>Schema:</strong> One table with (asset, date, price) rows. Daily closing prices
        for every tracked asset, from 2020 to present.
      </p>
      <p style={{ ...s.body, marginBottom: '0.6rem', fontSize: '15px' }}>
        <strong>Population:</strong> A daily cron job runs at 00:05 AM and writes yesterday's closing
        price. The job is idempotent (uses upsert) and includes exponential backoff for transient
        failures.
      </p>
      <p style={{ ...s.body, marginBottom: '0.6rem', fontSize: '15px' }}>
        <strong>Batch optimization:</strong> When building a timeline spanning 1,000 days across
        10 assets, the backend issues ~4 batch queries (grouped by asset) instead of 36,500
        individual lookups — reducing query count by 99.99%.
      </p>
      <p style={{ ...s.body, marginBottom: 0, fontSize: '15px' }}>
        <strong>Today's price protection:</strong> The cron job never writes today's price to
        Supabase. Today's price comes exclusively from the real-time Kraken API layer, ensuring
        that partially-formed daily candles don't contaminate the historical record.
      </p>
    </div>
    <p style={s.body}>
      User data (trades, API keys, CSV files) is never persisted — it exists only in server
      memory during a single request lifecycle.
    </p>

    <h3 id="pl-cache" style={s.subsectionTitle}>Caching System</h3>
    <p style={s.body}>
      Three independent caching layers keep the app fast, accurate, and cheap to run:
    </p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '1.2rem' }}>
      <div style={s.card}>
        <div style={s.label}>Layer 1 — Supabase (Historical Prices) — PERSISTENT</div>
        <p style={{ ...s.body, marginBottom: '0.4rem', fontSize: '15px' }}>
          PostgreSQL database storing daily closing prices permanently. When the backend builds
          the timeline, it fetches all historical prices in a single batch query instead of calling
          Kraken for each day. Populated by a daily cron job and a one-time backfill script.
        </p>
        <p style={{ ...s.body, marginBottom: 0, fontSize: '15px' }}>
          Today's price is never cached here — it always comes from the real-time layer.
        </p>
      </div>
      <div style={s.card}>
        <div style={s.label}>Layer 2 — In-Memory Cache (Current Prices) — VOLATILE</div>
        <p style={{ ...s.body, marginBottom: '0.4rem', fontSize: '15px' }}>
          A Python dict in server RAM, shared across every user and request. A background task
          is the only component that ever calls the Kraken API — it refreshes the cache
          every ~5 minutes. User requests always read from this cache, never from Kraken
          directly. This means 100 concurrent users generate zero additional Kraken API calls.
        </p>
        <p style={{ ...s.body, marginBottom: 0, fontSize: '15px' }}>
          No Redis, Memcached, or external services. Total Kraken API usage: ~288 calls/day
          regardless of user count, well under any rate limit. The cache is volatile (lost on
          restart), but the first request rebuilds it automatically.
        </p>
      </div>
      <div style={s.card}>
        <div style={s.label}>Layer 3 — Frontend Timeline (In-Browser) — VOLATILE</div>
        <p style={{ ...s.body, marginBottom: 0, fontSize: '15px' }}>
          The complete daily timeline (~1000+ snapshots) lives in React state after the initial
          load. Every KPI, chart, and table renders from this data. Prices for the last day are
          updated via an auto-refresh cycle (~5 min) that hits the in-memory cache — historical
          days keep their original Supabase prices.
        </p>
      </div>
    </div>
    <div style={s.codeBlock}>{
`┌────────────────────────────────────────────────────┐
│  Supabase (PostgreSQL)         PERSISTENT          │
│                                                    │
│  Daily cron → Kraken API → INSERT closing price    │  ← BATCH
│  Timeline build → batch SELECT by asset + dates    │
│  Protection: today's price never written here      │
└──────────────────────────┬─────────────────────────┘
                           │ historical prices
                           ▼
┌────────────────────────────────────────────────────┐
│  Backend RAM Cache         TTL: 300s (5 min)       │
│                            VOLATILE                │
│                                                    │
│  BG Task (295s) → Kraken API → _price_cache{}      │  ← NEAR REAL-TIME
│  GET /api/prices → read cache → respond            │
│  (never calls Kraken if cache is fresh)            │
└──────────────────────────┬─────────────────────────┘
                           │ current prices
                           ▼
┌────────────────────────────────────────────────────┐
│  Frontend (React State)    VOLATILE                │
│                            Session lifetime        │
│                                                    │
│  Auto-refresh (310s) → GET /api/prices/current     │
│  Updates last day of timeline with fresh prices    │
│  All KPIs/charts recalculate from this data        │
└────────────────────────────────────────────────────┘`
    }</div>

    <h3 id="pl-serving" style={s.subsectionTitle}>Serving Layer</h3>
    <p style={s.body}>
      After the initial load, the frontend never calls the backend for KPI recalculation. Instead,
      it replays FIFO logic over the in-memory timeline, filtering by the selected end date, hidden
      assets, and disabled operations. This happens inside
      a <span style={s.inlineCode}>useMemo</span> hook that recalculates only when its dependencies
      change:
    </p>
    <div style={s.codeBlock}>{
`User changes end date / hides an asset / toggles a trade
      │
      ▼
Dashboard.jsx updates state
      │
      ▼
KPIGrid.jsx useMemo recalculates:
      │  • Iterates timeline entries up to endDate
      │  • Replays FIFO over each day's operations
      │  • Skips hidden assets and disabled trades
      │  • Computes: value, cost basis, unrealized, realized
      │  • No HTTP request — pure in-memory computation
      ▼
UI updates instantly (~50ms)`
    }</div>
    <p style={s.body}>
      <strong>Why this works:</strong> the dataset is naturally bounded. A daily-granularity timeline
      for a multi-year portfolio is ~1,000–2,000 entries — small enough for a browser to iterate in
      under 50ms. This makes client-side recomputation faster than a backend round-trip would be,
      while eliminating server load for every user interaction after the initial request.
    </p>
    <p style={s.body}>
      The same approach applies to the Asset Leaderboard and Portfolio Bar — all components
      derive from the same in-memory timeline, staying in sync without backend coordination.
    </p>
  </div>
);

const PerformanceSection = ({ s }) => (
  <div id="performance">
    <h2 style={s.sectionTitle}>Performance & Scale</h2>
    <div style={s.greenBar} />

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1.2rem' }}>
      {[
        {
          metric: '~50ms',
          label: 'Frontend recomputation',
          desc: 'Full FIFO replay + KPI recalculation over ~1,000 daily snapshots, triggered by any filter/date change. Pure in-memory, zero network.',
        },
        {
          metric: '4 queries',
          label: 'vs ~36,500 individual lookups',
          desc: 'Historical prices fetched in batch by asset+date range from Supabase. A 1,000-day timeline across 10 assets uses 4 grouped queries instead of one per asset-day.',
        },
        {
          metric: '288 calls/day',
          label: 'Total Kraken API usage',
          desc: 'Background task refreshes every ~5 min. This rate is constant regardless of user count — 100 concurrent users generate zero additional API calls.',
        },
        {
          metric: '~1,000–2,000',
          label: 'Daily timeline entries',
          desc: 'Bounded dataset: one snapshot per day over a multi-year portfolio. Small enough for browser-side iteration, large enough for meaningful analysis.',
        },
      ].map(item => (
        <div key={item.label} style={s.card}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#00ff88', fontFamily: 'monospace', marginBottom: '2px' }}>
            {item.metric}
          </div>
          <div style={s.label}>{item.label}</div>
          <p style={{ ...s.body, marginBottom: 0, fontSize: '14px', marginTop: '0.4rem' }}>{item.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

const DecisionsSection = ({ s }) => (
  <div id="decisions">
    <h2 style={s.sectionTitle}>Design Decisions</h2>
    <div style={s.greenBar} />

    <p style={s.body}>
      Key architectural choices and the reasoning behind each:
    </p>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.2rem' }}>
      {[
        {
          title: 'FIFO processes full history',
          why: 'Partial history produces incorrect cost basis — earlier buys that should have been consumed by sells still appear as held positions. The entire trade log must be replayed from day one to get accurate numbers.',
        },
        {
          title: 'Daily time-series snapshots',
          why: 'The backend computes one snapshot per day and returns the full series. This allows the frontend to answer any date range query, zoom, or filter instantly without backend round-trips — compute once, interact forever.',
        },
        {
          title: 'Frontend recomputation over re-fetching',
          why: 'KPIs, leaderboards, and charts all derive from the in-memory timeline via useMemo. This eliminates network latency for every user interaction after the initial load, keeping the UI at ~50ms response time.',
        },
        {
          title: 'Batch price lookup (4 queries vs 36,500)',
          why: 'Historical prices are fetched in bulk by asset+date range from Supabase, not individually per day. For a 1,000-day timeline with 10 assets, this reduces database queries by 99.99%.',
        },
        {
          title: 'Stateless user data + persistent price storage',
          why: 'User trades and credentials are never stored — privacy by design. Public market prices are persisted in Supabase because they\'re expensive to re-fetch and identical for all users.',
        },
        {
          title: 'In-memory cache over Redis',
          why: 'Current prices refresh every ~5 minutes from a Python dict in RAM. No Redis, no external services, no ops overhead. The trade-off (lost on restart) is acceptable — the first request rebuilds it.',
        },
        {
          title: 'Dual date system',
          why: 'Timeline zoom (exploratory) and KPI dates (analytical) are independent. Zooming into a chart range shouldn\'t make KPIs jump — applying the zoom to KPIs is always an explicit user action.',
        },
      ].map(item => (
        <div key={item.title} style={s.card}>
          <div style={s.label}>{item.title}</div>
          <p style={{ ...s.body, marginBottom: 0, fontSize: '15px' }}>{item.why}</p>
        </div>
      ))}
    </div>
  </div>
);

const TradeoffsSection = ({ s }) => (
  <div id="tradeoffs">
    <h2 style={s.sectionTitle}>Limitations & Trade-offs</h2>
    <div style={s.greenBar} />

    <p style={s.body}>
      Every architectural choice has costs. These are the conscious trade-offs in the current design:
    </p>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.2rem' }}>
      {[
        {
          title: 'Single-exchange ingestion',
          tradeoff: 'Currently Kraken-only. The ingestion layer is tightly coupled to Kraken\'s API and CSV schema. Adding exchanges requires new parsers and asset-name normalization per source — not a flag flip, but a well-scoped extension point.',
        },
        {
          title: 'Full recomputation per request',
          tradeoff: 'Every request replays FIFO over the entire trade history instead of using incremental computation or pre-materialized views. This keeps the backend stateless (no user data stored), but means initial load scales linearly with trade count. Acceptable for individual portfolios (~seconds); would need an incremental pipeline for institutional-scale data.',
        },
        {
          title: 'No persistent user state',
          tradeoff: 'Toggled trades, hidden assets, and filter preferences exist only in browser memory. Closing the tab loses everything. This is a deliberate privacy choice — no user database means nothing to breach — but sacrifices continuity between sessions.',
        },
        {
          title: 'Frontend computation ceiling',
          tradeoff: 'Client-side FIFO replay works because the dataset is bounded (~1,000–2,000 daily snapshots). For portfolios spanning 10+ years or sub-daily granularity, this approach would hit browser memory and CPU limits. The mitigation path is server-side pre-aggregation with cached results.',
        },
        {
          title: 'Volatile price cache',
          tradeoff: 'Current prices live in a Python dict — lost on server restart. First request after restart has higher latency (~2–3s cold start vs ~50ms warm). Acceptable for a single-server deployment; a Redis layer would be needed for multi-instance horizontal scaling.',
        },
      ].map(item => (
        <div key={item.title} style={s.card}>
          <div style={s.label}>{item.title}</div>
          <p style={{ ...s.body, marginBottom: 0, fontSize: '15px' }}>{item.tradeoff}</p>
        </div>
      ))}
    </div>
  </div>
);

const GettingStartedSection = ({ s }) => (
  <div id="getting-started">
    <h2 style={s.sectionTitle}>Getting Started</h2>
    <div style={s.greenBar} />

    <h3 id="gs-api" style={s.subsectionTitle}>API Connection</h3>
    <p style={s.body}>
      Go to{' '}
      <a href="https://pro.kraken.com/app/settings/api" target="_blank" rel="noopener noreferrer"
        style={{ color: '#00ff88', textDecoration: 'none', borderBottom: '1px solid rgba(0,255,136,0.3)' }}>
        Kraken API Settings
      </a>{' '}
      and create a read-only API key with minimum permissions:
    </p>
    <div style={{ ...s.card, marginBottom: '1.2rem' }}>
      <p style={{ ...s.body, marginBottom: '0.6rem', fontSize: '15px' }}>
        1. <span style={s.inlineCode}>Funds Permissions</span> → check only <strong>Query</strong>
      </p>
      <p style={{ ...s.body, marginBottom: '0.6rem', fontSize: '15px' }}>
        2. <span style={s.inlineCode}>Orders and Trades</span> → check only{' '}
        <strong>Query closed orders & trades</strong> (read-only access to completed trades)
      </p>
      <p style={{ ...s.body, marginBottom: '0.6rem', fontSize: '15px' }}>
        3. Leave all other permissions unchecked (Staking, WebSockets, etc.)
      </p>
      <p style={{ ...s.body, marginBottom: 0, fontSize: '15px' }}>
        4. Copy both keys — Kraken shows them only once. Paste them into the GainTrack form.
      </p>
    </div>
    <div style={s.callout}>
      GainTrack never stores or logs your API keys. They are used for a single read-only
      request to fetch your trade history, then discarded from memory.
    </div>

    <h3 id="gs-csv" style={s.subsectionTitle}>CSV Upload</h3>
    <p style={s.body}>
      Go to{' '}
      <a href="https://pro.kraken.com/app/statements" target="_blank" rel="noopener noreferrer"
        style={{ color: '#00ff88', textDecoration: 'none', borderBottom: '1px solid rgba(0,255,136,0.3)' }}>
        Kraken Statements
      </a>{' '}
      and export your trade history:
    </p>
    <div style={{ ...s.card, marginBottom: '1.2rem' }}>
      <p style={{ ...s.body, marginBottom: '0.6rem', fontSize: '15px' }}>
        1. Set statement type to <span style={s.inlineCode}>Trades</span>, select the full date
        range available
      </p>
      <p style={{ ...s.body, marginBottom: '0.6rem', fontSize: '15px' }}>
        2. Keep <strong>All Pairs</strong> and <strong>All Fields</strong> selected — FIFO needs
        the complete dataset
      </p>
      <p style={{ ...s.body, marginBottom: 0, fontSize: '15px' }}>
        3. Export as <span style={s.inlineCode}>CSV</span>, then drag and drop the file into GainTrack
      </p>
    </div>
    <p style={s.body}>
      The CSV is parsed server-side, processed through the FIFO engine, and immediately discarded —
      it is never written to disk.
    </p>
  </div>
);

const DashboardGuideSection = ({ s }) => (
  <div id="dashboard">
    <h2 style={s.sectionTitle}>Dashboard Guide</h2>
    <div style={s.greenBar} />

    <h3 id="db-kpi" style={s.subsectionTitle}>KPI Grid</h3>
    <p style={s.body}>
      Four key performance indicators calculated using FIFO accounting:
    </p>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1.2rem' }}>
      {[
        { name: 'Total Invested', desc: 'Sum of all buy costs minus sell proceeds (your net cash outflow)' },
        { name: 'Portfolio Value', desc: 'Current market value of all held positions at live prices' },
        { name: 'Total P&L', desc: 'Combined realized gains (from sells) + unrealized gains (from current holdings)' },
        { name: 'Realized P&L', desc: 'Profit/loss from completed sell transactions, calculated via FIFO cost basis' },
      ].map(kpi => (
        <div key={kpi.name} style={s.card}>
          <div style={s.label}>{kpi.name}</div>
          <p style={{ ...s.body, marginBottom: 0, fontSize: '15px' }}>{kpi.desc}</p>
        </div>
      ))}
    </div>
    <div style={s.callout}>
      KPIs always show the cumulative state from your very first trade up to the selected end date.
      FIFO must process the full history, so partial-range KPIs are never fetched — they're
      recalculated in the frontend from the in-memory timeline.
    </div>

    <h3 id="db-timeline" style={s.subsectionTitle}>Timeline Chart</h3>
    <p style={s.body}>
      An interactive Chart.js line chart with two view modes:{' '}
      <span style={s.inlineCode}>FULL VIEW</span> (portfolio value over time, with optional
      cost basis overlay) and <span style={s.inlineCode}>P&L VIEW</span> (cumulative profit/loss,
      green/red as it crosses zero). A <span style={s.inlineCode}>FILL</span> toggle adds gradient
      area fill under the lines.
    </p>
    <p style={s.body}>
      <strong>Interactions:</strong> Drag to zoom into a date range. Click a point to freeze the
      tooltip for that day's snapshot. Quick filters (1W, 1M, 3M, 6M, 1Y, ALL TIME) jump to preset
      ranges. Period buttons (D/W/M/Y) control data granularity. The chart has its own date range
      (timeline dates) independent from the KPI dates — zooming the chart doesn't change KPIs unless
      you explicitly click "Apply to All".
    </p>

    <h3 id="db-components" style={s.subsectionTitle}>Other Components</h3>
    <p style={s.body}>
      <strong>Portfolio Bar:</strong> A proportional bar showing each asset's weight by current market
      value. Hover for asset name, value, and percentage.{' '}
      <strong>Asset Leaderboard:</strong> A sortable table with per-asset FIFO breakdown — current value,
      cost basis, unrealized and realized gains, and allocation percentage.{' '}
      <strong>Price Ticker:</strong> A scrolling ticker showing live prices for held assets, with
      percentage change from yesterday's close. Auto-refreshes every ~5 minutes from the backend cache.
    </p>

    <h3 id="db-trades" style={s.subsectionTitle}>Trades & Filters</h3>
    <p style={s.body}>
      The <strong>Trades tab</strong> shows every operation in your portfolio. Click any row to
      toggle that trade on/off — disabled trades are excluded from all KPI calculations, charts,
      and the leaderboard, running a "what if" scenario entirely client-side. Quick filter buttons
      (ALL / BUY / SELL) focus on specific operation types.
    </p>
    <p style={s.body}>
      The <strong>Filters sidebar</strong> (left panel) provides global controls: date range,
      asset visibility (toggle individual assets on/off), threshold filters (minimum allocation or
      balance), and operation type filters. All filters apply to every dashboard element and operate
      on the in-memory timeline — no backend calls.
    </p>
  </div>
);

const SecuritySection = ({ s }) => (
  <div id="security">
    <h2 style={s.sectionTitle}>Security</h2>
    <div style={s.greenBar} />

    <p style={s.body}>
      GainTrack is designed with a privacy-first approach. User data is never persisted — the
      only storage is a Supabase database containing public market prices (daily closing prices),
      which is independent of any user information.
    </p>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1.2rem' }}>
      {[
        { name: 'API Keys', desc: 'Used for a single Kraken API call, then discarded. Never stored in any database, log, or file.' },
        { name: 'CSV Files', desc: 'Parsed in server memory and never saved to disk. The raw file is not accessible after processing.' },
        { name: 'No User Accounts', desc: 'There are no accounts, sessions, or cookies. Each visit is stateless — your data exists only while the browser tab is open.' },
        { name: 'Persistent Storage', desc: 'Only public market prices are stored (Supabase PostgreSQL). No user data, trade history, or credentials are ever persisted.' },
      ].map(item => (
        <div key={item.name} style={s.card}>
          <div style={s.label}>{item.name}</div>
          <p style={{ ...s.body, marginBottom: 0, fontSize: '15px' }}>{item.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

const ContactSection = ({ s }) => (
  <div id="contact">
    <h2 style={s.sectionTitle}>Contact</h2>
    <div style={s.greenBar} />

    <p style={s.body}>
      GainTrack is built and maintained by Jes&uacute;s Campos. If you have questions, feedback,
      or want to collaborate, feel free to reach out:
    </p>
    <div style={{ display: 'flex', gap: '16px', marginBottom: '1.2rem' }}>
      {[
        {
          label: 'Email',
          value: 'jesuscamposmanjon@gmail.com',
          href: 'mailto:jesuscamposmanjon@gmail.com',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 4l-10 8L2 4" />
            </svg>
          ),
        },
        {
          label: 'GitHub',
          value: 'jecaman',
          href: 'https://github.com/jecaman',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          ),
        },
        {
          label: 'LinkedIn',
          value: 'jecaman',
          href: 'https://www.linkedin.com/in/jecaman/',
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          ),
        },
      ].map(item => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...s.card,
            flex: 1,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            cursor: 'pointer',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0,255,136,0.4)';
            e.currentTarget.style.boxShadow = '0 0 16px rgba(0,255,136,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ color: '#00ff88', flexShrink: 0 }}>{item.icon}</div>
          <div>
            <div style={{ ...s.label, marginBottom: '2px' }}>{item.label}</div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontFamily: "'Inter', sans-serif" }}>
              {item.value}
            </div>
          </div>
        </a>
      ))}
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const DocumentationSection = ({ theme, sidebarOpen }) => {
  const [activeTocId, setActiveTocId] = useState('tldr');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const sectionRefs = useRef({});

  // Collect only main section IDs for observation (not subsections)
  const allObservableIds = TOC_ITEMS.map(item => item.id);

  // Find which parent section an id belongs to
  const getParentSection = (id) => {
    for (const item of TOC_ITEMS) {
      if (item.id === id) return item.id;
      if (item.subs.some(s => s.id === id)) return item.id;
    }
    return TOC_ITEMS[0].id;
  };

  const activeParent = getParentSection(activeTocId);

  const isAtBottom = useRef(false);

  // IntersectionObserver to highlight the active TOC item
  useEffect(() => {
    const observedEls = [];
    const handleIntersect = (entries) => {
      if (isAtBottom.current) return; // Don't override when scrolled to bottom
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveTocId(entry.target.id);
        }
      });
    };

    const observerOptions = {
      root: document.getElementById('main-scroll'),
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    allObservableIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
        observedEls.push(el);
      }
    });

    return () => {
      observedEls.forEach(el => observer.unobserve(el));
    };
  }, []);

  // Scroll-to-top button visibility + activate last TOC item at bottom
  useEffect(() => {
    const container = document.getElementById('main-scroll');
    if (!container) return;
    const onScroll = () => {
      setShowScrollTop(container.scrollTop > 400);
      // Activate last TOC section when scrolled to bottom
      const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 80;
      isAtBottom.current = atBottom;
      if (atBottom) {
        setActiveTocId(TOC_ITEMS[TOC_ITEMS.length - 1].id);
      }
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    const scrollContainer = document.getElementById('main-scroll');
    if (el && scrollContainer) {
      const top = el.offsetTop - 120;
      scrollContainer.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const s = makeStyles(theme);

  return (
    <div style={{
      display: 'flex',
      gap: '3rem',
      paddingLeft: '24px',
      paddingRight: '40px',
      paddingBottom: '6rem',
      minHeight: '100vh',
    }}>
      {/* Sticky TOC */}
      {!sidebarOpen && (
        <nav style={{
          position: 'sticky',
          top: '110px',
          alignSelf: 'flex-start',
          minWidth: '240px',
          maxWidth: '240px',
          paddingTop: '0.5rem',
          flexShrink: 0,
        }}>
          {TOC_ITEMS.map(item => {
            const isActiveSection = activeTocId === item.id;
            const isActiveExact = activeTocId === item.id;
            return (
              <div key={item.id}>
                <div
                  onClick={() => scrollToSection(item.id)}
                  style={{
                    padding: '8px 14px',
                    marginBottom: '2px',
                    fontSize: '16px',
                    fontFamily: 'monospace',
                    fontWeight: isActiveSection ? 700 : 400,
                    color: isActiveSection ? '#00ff88' : 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    borderLeft: isActiveExact ? '2px solid #00ff88' : '2px solid transparent',
                    transition: 'all 0.2s ease',
                    letterSpacing: '0.3px',
                  }}
                  onMouseEnter={e => {
                    if (!isActiveSection) e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                  }}
                  onMouseLeave={e => {
                    if (!isActiveSection) e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                  }}
                >
                  {item.label}
                </div>
                {/* Subsections — only visible when this is the active parent */}
                {isActiveSection && item.subs.length > 0 && (
                  <div style={{
                    overflow: 'hidden',
                    marginBottom: '4px',
                  }}>
                    {item.subs.map((sub, idx) => {
                      return (
                        <div
                          key={sub.id}
                          onClick={() => scrollToSection(sub.id)}
                          style={{
                            padding: '5px 14px 5px 30px',
                            fontSize: '14px',
                            fontFamily: 'monospace',
                            fontWeight: 400,
                            color: 'rgba(255,255,255,0.45)',
                            cursor: 'pointer',
                            borderLeft: '2px solid transparent',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
                          }}
                        >
                          {idx + 1}. {sub.label}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      )}

      {/* Content */}
      <div style={{
        flex: 1,
        paddingBottom: '5vh',
      }}>
        <TldrSection s={s} />
        <AboutSection s={s} />
        <ArchitectureSection s={s} />
        <PipelineSection s={s} />
        <PerformanceSection s={s} />
        <DecisionsSection s={s} />
        <TradeoffsSection s={s} />
        <GettingStartedSection s={s} />
        <DashboardGuideSection s={s} />
        <SecuritySection s={s} />
        <ContactSection s={s} />
      </div>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={() => document.getElementById('main-scroll')?.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            position: 'fixed',
            bottom: '36px',
            right: '36px',
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.7)',
            border: '1.5px solid rgba(255,255,255,0.25)',
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(12px)',
            zIndex: 9999,
            transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0,255,136,0.15)';
            e.currentTarget.style.borderColor = '#00ff88';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,136,0.35), 0 4px 20px rgba(0,0,0,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.7)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default DocumentationSection;
