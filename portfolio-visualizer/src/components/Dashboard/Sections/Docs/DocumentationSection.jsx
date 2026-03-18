import { useState, useEffect, useRef } from 'react';

const TOC_ITEMS = [
  { id: 'about', label: 'About', subs: [
    { id: 'about-problem', label: 'The Problem' },
    { id: 'about-what', label: 'What GainTrack Does' },
    { id: 'about-docs', label: 'This Documentation' },
  ]},
  { id: 'getting-started', label: 'Getting Started', subs: [
    { id: 'gs-form', label: 'Import Method' },
    { id: 'gs-api', label: 'API Connection' },
    { id: 'gs-csv', label: 'CSV Upload' },
  ]},
  { id: 'overview', label: 'Overview', subs: [
    { id: 'ov-kpi', label: 'KPI Grid' },
    { id: 'ov-timeline', label: 'Timeline Chart' },
    { id: 'ov-bar', label: 'Portfolio Bar' },
    { id: 'ov-leaderboard', label: 'Asset Leaderboard' },
    { id: 'ov-ticker', label: 'Price Ticker' },
  ]},
  { id: 'operations', label: 'Trades', subs: [
    { id: 'tr-table', label: 'Trades Table' },
    { id: 'tr-toggle', label: 'Toggle Trades' },
    { id: 'tr-filter', label: 'Type Filter' },
  ]},
  { id: 'filters', label: 'Filters', subs: [
    { id: 'fl-date', label: 'Date Range' },
    { id: 'fl-assets', label: 'Asset Visibility' },
    { id: 'fl-threshold', label: 'Threshold Filters' },
    { id: 'fl-ops', label: 'Operation Type Filters' },
  ]},
  { id: 'how-it-works', label: 'How It Works', subs: [
    { id: 'hw-flow', label: 'Data Flow' },
    { id: 'hw-dates', label: 'Dual Date System' },
    { id: 'hw-kpi', label: 'Frontend-First KPIs' },
    { id: 'hw-fifo', label: 'FIFO Engine' },
    { id: 'hw-cache', label: 'Price Caching' },
    { id: 'hw-summary', label: 'Full Architecture' },
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

const AboutSection = ({ s }) => (
  <div id="about">
    <h2 style={{ ...s.sectionTitle, marginTop: '0.5rem' }}>About</h2>
    <div style={s.greenBar} />

    <p style={s.body}>
      GainTrack is a crypto portfolio analytics tool that gives you an accurate, real-time view
      of your investment performance. Connect your Kraken account or upload your trade history,
      and get instant access to precise P&L calculations, FIFO-based cost tracking, realized
      and unrealized gains, per-asset breakdowns, and interactive charts — all processed
      securely with zero data storage.
    </p>
    <div style={s.callout}>
      <strong>Currently Kraken-only.</strong> GainTrack works exclusively with trade data from Kraken
      (via API connection or CSV export). Support for additional exchanges is on the roadmap.
    </div>

    <h3 id="about-problem" style={s.subsectionTitle}>The Problem with Exchange Data</h3>
    <p style={s.body}>
      GainTrack was born out of a simple frustration: Kraken — and most crypto exchanges — don't
      give you a clear picture of your actual portfolio performance. They show you trades, but not
      the full story: how much you've really gained or lost across all your positions, accounting
      for fees, cost basis, and realized vs unrealized gains.
    </p>
    <p style={s.body}>
      Even Kraken's own reported performance numbers can be significantly off. Their portfolio page uses
      a simplified weighted-average method instead of true FIFO (First In, First Out) accounting, which
      can lead to cost basis discrepancies of up to 20% on real gains — confirmed by their own support
      team. If you've been trading actively, the numbers you see on your exchange dashboard are likely
      not reflecting your actual profit or loss.
    </p>
    <p style={s.body}>
      On top of that, if you've ever moved assets to a private wallet or another exchange, most platforms
      simply lose track of them. Your portfolio view becomes incomplete, and any performance metrics are
      based on partial data. GainTrack solves this: as long as the original purchase was made on Kraken,
      your full trade history is preserved regardless of where those assets live now — giving you a
      complete, accurate picture of your investment performance.
    </p>
    <div style={s.callout}>
      Future roadmap: support for additional exchanges (Binance, Coinbase, etc.), so it won't matter
      where you originally bought — GainTrack will consolidate all your trading history into a single,
      unified analysis.
    </div>

    <h3 id="about-what" style={s.subsectionTitle}>What GainTrack Does</h3>
    <p style={s.body}>
      Import your trade history (CSV or API), and GainTrack processes it through a proper FIFO engine
      to give you accurate, real metrics about your investment. At a glance, you can see the true state
      of your entire portfolio — not approximations. Combine multiple filters (dates, assets, trade
      types) to identify your best and worst performers, spot patterns, and drill down into specific
      time periods. Toggle individual trades on and off to explore "what if" scenarios — what would your
      P&L look like if you hadn't made that one trade?
    </p>

    <p style={s.body}>
      There are no user accounts, no registration, no login. GainTrack is fully stateless — your
      data is processed server-side and never stored. API keys are used for a single request and
      discarded. CSV files are parsed in memory and not saved to disk. When you close the tab,
      everything is gone. This is intentional: there is nothing to hack, nothing to leak, and
      nothing to maintain. You bring your data, you get your analysis, and you leave.
    </p>

    <h3 id="about-docs" style={s.subsectionTitle}>This Documentation</h3>
    <p style={s.body}>
      The following sections walk through each part of the application: how to get started, what each
      dashboard component shows and how it works, the filter system, the underlying architecture
      (dual-date system, frontend-first calculations, FIFO engine, caching layers), and the security
      model. It serves both as a user guide and as a technical deep-dive into the design decisions
      behind the project.
    </p>

    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '1rem' }}>
      {['React 19', 'Vite', 'FastAPI', 'Chart.js', 'Supabase'].map(tech => (
        <span key={tech} style={{
          ...s.inlineCode,
          fontSize: '12px',
          padding: '4px 10px',
        }}>{tech}</span>
      ))}
    </div>
  </div>
);

const GettingStartedSection = ({ s }) => (
  <div id="getting-started">
    <h2 style={s.sectionTitle}>Getting Started</h2>
    <div style={s.greenBar} />

    <h3 id="gs-form" style={s.subsectionTitle}>Choosing Your Import Method</h3>
    <p style={s.body}>
      GainTrack supports two ways to import your trading history, each suited to different use cases:
    </p>
    <div style={{ display: 'flex', gap: '16px', marginBottom: '1.2rem' }}>
      <div style={{ ...s.card, flex: 1 }}>
        <div style={s.label}>API Connection (recommended)</div>
        <p style={{ ...s.body, marginBottom: 0, fontSize: '15px' }}>
          Best if you plan to use GainTrack regularly. Once set up, your data loads automatically
          with up-to-date trades every time — no manual exports needed. Prices refresh in real time
          and your dashboard is always current.
        </p>
      </div>
      <div style={{ ...s.card, flex: 1 }}>
        <div style={s.label}>CSV Upload</div>
        <p style={{ ...s.body, marginBottom: 0, fontSize: '15px' }}>
          Best for a one-time analysis or if you prefer not to share API credentials. You export
          your trade history from Kraken, upload the file, and get instant results. The trade-off
          is that you'll need to re-export a new CSV each time you want fresh data.
        </p>
      </div>
    </div>

    <h3 id="gs-api" style={s.subsectionTitle}>Setting Up API Access</h3>
    <p style={s.body}>
      Head to{' '}
      <a href="https://pro.kraken.com/app/settings/api" target="_blank" rel="noopener noreferrer"
        style={{ color: '#00ff88', textDecoration: 'none', borderBottom: '1px solid rgba(0,255,136,0.3)' }}>
        Kraken API Settings
      </a>{' '}
      and click the <span style={s.inlineCode}>Create API Key</span> button in the top right.
      You'll see a permissions panel — the critical step here is selecting the absolute minimum
      permissions. This way, even in the worst-case scenario where someone obtains your keys,
      they can only read your trade history and nothing else:
    </p>
    <div style={{ ...s.card, marginBottom: '1.2rem' }}>
      <p style={{ ...s.body, marginBottom: '0.6rem', fontSize: '15px' }}>
        1. In the <span style={s.inlineCode}>Funds Permissions</span> section, check only{' '}
        <strong>Query</strong> — leave everything else unchecked
      </p>
      <p style={{ ...s.body, marginBottom: '0.6rem', fontSize: '15px' }}>
        2. In the <span style={s.inlineCode}>Orders and Trades</span> section, check only{' '}
        <strong>Query closed orders & trades</strong> — this gives GainTrack read-only access
        to your completed trades
      </p>
      <p style={{ ...s.body, marginBottom: '0.6rem', fontSize: '15px' }}>
        3. Leave all other permission sections (Staking, WebSockets, etc.) completely unchecked
      </p>
      <p style={{ ...s.body, marginBottom: 0, fontSize: '15px' }}>
        4. Enter a descriptive name (e.g. "GainTrack read-only") and click{' '}
        <span style={s.inlineCode}>Generate Key</span>
      </p>
    </div>
    <p style={s.body}>
      After creating the key, Kraken will display your <strong>API Key</strong> and{' '}
      <strong>Private Key</strong> exactly once — this is the only time you'll ever see them.
      Copy both and paste them into the GainTrack form. If you plan to use GainTrack regularly,
      let your browser's password manager save the credentials when prompted, since Kraken
      provides no way to view the keys again — you'd need to create new ones.
    </p>
    <div style={s.callout}>
      GainTrack never stores, logs, or persists your API keys. They are used for a single read-only
      request to fetch your trade history, then discarded from memory. There is no database, no
      session, no server-side record of your credentials.
    </div>

    <h3 id="gs-csv" style={s.subsectionTitle}>Exporting a CSV from Kraken</h3>
    <p style={s.body}>
      If you prefer the CSV route, go to{' '}
      <a href="https://pro.kraken.com/app/statements" target="_blank" rel="noopener noreferrer"
        style={{ color: '#00ff88', textDecoration: 'none', borderBottom: '1px solid rgba(0,255,136,0.3)' }}>
        Kraken Statements
      </a>{' '}
      and follow these steps:
    </p>
    <div style={{ ...s.card, marginBottom: '1.2rem' }}>
      <p style={{ ...s.body, marginBottom: '0.6rem', fontSize: '15px' }}>
        1. Click the <span style={s.inlineCode}>Export Statement</span> button at the top of the page
      </p>
      <p style={{ ...s.body, marginBottom: '0.6rem', fontSize: '15px' }}>
        2. In the export dialog, set the statement type to <span style={s.inlineCode}>Trades</span>
      </p>
      <p style={{ ...s.body, marginBottom: '0.6rem', fontSize: '15px' }}>
        3. Select the date range you want to analyze — for a full picture, choose the earliest
        available start date through today
      </p>
      <p style={{ ...s.body, marginBottom: '0.6rem', fontSize: '15px' }}>
        4. Leave <strong>All Pairs</strong> and <strong>All Fields</strong> selected — GainTrack
        needs the complete dataset to calculate FIFO correctly
      </p>
      <p style={{ ...s.body, marginBottom: 0, fontSize: '15px' }}>
        5. Set the format to <span style={s.inlineCode}>CSV</span>, then click{' '}
        <span style={s.inlineCode}>Submit</span> to generate and download the file
      </p>
    </div>
    <p style={s.body}>
      Once downloaded, drag and drop the file into the GainTrack form or click to browse. The CSV
      is parsed server-side, processed through the FIFO engine, and immediately discarded — it is
      never written to disk.
    </p>

  </div>
);

const OverviewDocsSection = ({ s }) => (
  <div id="overview">
    <h2 style={s.sectionTitle}>Overview</h2>
    <div style={s.greenBar} />

    <p style={s.body}>
      The Overview is the main dashboard view, showing your portfolio's performance at a glance
      through five interconnected components.
    </p>

    <h3 id="ov-kpi" style={s.subsectionTitle}>KPI Grid</h3>
    <p style={s.body}>
      Four key performance indicators calculated using FIFO (First In, First Out) accounting:
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
      KPIs always show the cumulative state of your portfolio from your very first trade up to the
      selected end date. This ensures your cost basis and realized gains are always accurate, since
      FIFO must process the full history.
    </div>

    <h3 id="ov-timeline" style={s.subsectionTitle}>Timeline Chart</h3>
    <p style={s.body}>
      The centerpiece of the dashboard. An interactive Chart.js line chart with two view modes:
    </p>
    <div style={{ ...s.card, marginBottom: '1.2rem' }}>
      <p style={{ ...s.body, marginBottom: '0.6rem' }}>
        <span style={s.inlineCode}>FULL VIEW</span> — Shows your portfolio's market value over time.
        A <span style={s.inlineCode}>COST BASIS</span> toggle overlays your total invested amount as a
        dashed line, showing where you break even.
      </p>
      <p style={{ ...s.body, marginBottom: '0.6rem' }}>
        <span style={s.inlineCode}>P&L VIEW</span> — Shows cumulative profit/loss over time, with
        the line colored green (profit) or red (loss) as it crosses the zero axis.
      </p>
      <p style={{ ...s.body, marginBottom: 0 }}>
        <span style={s.inlineCode}>FILL</span> — Toggles a gradient area fill under the lines for
        a more visual representation of the data volume.
      </p>
    </div>
    <p style={s.body}>
      <strong>Interactions:</strong> Drag to zoom into a date range. Click a point to freeze the
      tooltip and see the exact snapshot for that day. Use the quick filters (1W, 1M, 3M, 6M, 1Y,
      ALL TIME) to jump to preset ranges. The period aggregation buttons (D/W/M/Y) control data
      granularity. Changes to the end date can be propagated to the rest of the page via the
      "Apply to All" popup.
    </p>

    <h3 id="ov-bar" style={s.subsectionTitle}>Portfolio Bar</h3>
    <p style={s.body}>
      A proportional bar showing each asset's weight in your portfolio by current market value.
      Hover over any segment to see the asset name, value, and percentage. Colors are consistent
      with the Asset Leaderboard.
    </p>

    <h3 id="ov-leaderboard" style={s.subsectionTitle}>Asset Leaderboard</h3>
    <p style={s.body}>
      A sortable table showing per-asset FIFO breakdown: current value, cost basis, unrealized gain,
      realized gain, and allocation percentage. Click column headers to sort. Assets can be
      hidden/shown via the Filters sidebar, which removes them from all calculations and charts.
    </p>

    <h3 id="ov-ticker" style={s.subsectionTitle}>Price Ticker</h3>
    <p style={s.body}>
      A scrolling ticker at the top of the dashboard showing live prices for all your held assets.
      The percentage shown is the change compared to yesterday's closing price. Prices auto-refresh
      every ~5 minutes from the backend cache (which itself refreshes from Kraken's public API).
    </p>
  </div>
);

const OperationsDocsSection = ({ s }) => (
  <div id="operations">
    <h2 style={s.sectionTitle}>Trades</h2>
    <div style={s.greenBar} />

    <p style={s.body}>
      A complete history of every operation in your portfolio. Each trade is classified not only
      as a buy or sell, but also by its execution type — maker, taker, or other order types — giving
      you full visibility into how each position was entered or exited.
    </p>

    <h3 id="tr-table" style={s.subsectionTitle}>Trades Table</h3>
    <p style={s.body}>
      Each row shows: date, asset, type (buy/sell + maker/taker), amount, price, total value, fee,
      and realized P&L (for sells). All columns are sortable.
    </p>

    <h3 id="tr-toggle" style={s.subsectionTitle}>Toggle Trades</h3>
    <p style={s.body}>
      Click any row to toggle that trade on/off. Disabled trades are excluded from all
      KPI calculations, charts, and the asset leaderboard — effectively running a "what if"
      scenario. The trades counter next to the date range shows how many trades are currently active.
    </p>
    <div style={s.callout}>
      This is a local-only feature — toggling operations does NOT call the backend. The FIFO
      recalculation happens entirely in the frontend from the in-memory timeline data.
    </div>

    <h3 id="tr-filter" style={s.subsectionTitle}>Type Filter</h3>
    <p style={s.body}>
      Quick filter buttons (ALL / BUY / SELL) above the table let you focus on specific operation
      types without affecting calculations.
    </p>
  </div>
);

const FiltersDocsSection = ({ s }) => (
  <div id="filters">
    <h2 style={s.sectionTitle}>Filters</h2>
    <div style={s.greenBar} />

    <p style={s.body}>
      The left sidebar (toggled via the filter icon) provides global controls that affect the
      entire dashboard. All filters in this panel apply to every element on the page — KPIs,
      charts, leaderboard, and portfolio bar — and override any existing selections.
    </p>

    <h3 id="fl-date" style={s.subsectionTitle}>Date Range</h3>
    <p style={s.body}>
      Set a custom end date or use time presets (All, This Month, Last 3 Months, etc.).
      Date changes update both the KPIs and the timeline chart simultaneously.
    </p>

    <h3 id="fl-assets" style={s.subsectionTitle}>Asset Visibility</h3>
    <p style={s.body}>
      Toggle individual assets on/off. Hidden assets are completely excluded from all calculations —
      KPIs, charts, leaderboard, and portfolio bar. This lets you analyze subsets of your portfolio.
    </p>

    <h3 id="fl-threshold" style={s.subsectionTitle}>Threshold Filters</h3>
    <p style={s.body}>
      Filter assets by minimum allocation percentage or minimum balance value. Assets that don't
      meet the thresholds are automatically hidden from all calculations and views, helping you
      focus on your most significant positions.
    </p>

    <h3 id="fl-ops" style={s.subsectionTitle}>Operation Type Filters</h3>
    <p style={s.body}>
      Exclude entire operation types (e.g., all sells, all buys). Like the per-operation toggle
      in the Trades tab, excluded operations are filtered client-side from the in-memory timeline
      data — no backend call is needed.
    </p>
  </div>
);

const HowItWorksSection = ({ s }) => (
  <div id="how-it-works">
    <h2 style={s.sectionTitle}>How It Works</h2>
    <div style={s.greenBar} />

    <p style={s.body}>
      GainTrack follows a compute-once, interact-forever approach. The backend does the heavy
      lifting once — parsing trades, running FIFO, building a daily timeline, and fetching prices —
      then hands everything to the frontend. From that point on, every interaction (filtering,
      zooming, toggling assets) happens instantly from cached data, with zero network requests.
    </p>

    <h3 id="hw-flow" style={s.subsectionTitle}>Data Flow</h3>
    <p style={s.body}>
      Regardless of the import method (CSV or API), the processing pipeline is the same:
    </p>
    <div style={s.codeBlock}>{
`CSV / API Keys
      │
      ▼
┌──────────────────────────────────────────────────┐
│  Backend (FastAPI)                               │
│                                                  │
│  1. Parse trades from CSV or Kraken API          │
│  2. Detect crypto-to-crypto trades, convert costs│
│  3. Run FIFO engine over all trades              │
│  4. Fetch historical prices from Supabase cache  │
│  5. Build daily timeline (one snapshot per day)  │
│  6. Fetch current prices from Kraken API         │
│                                                  │
│  Returns: timeline[] + portfolio_data[] + kpis{} │
└───────────────────────┬──────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────┐
│  Frontend (React)                                │
│                                                  │
│  • Stores full timeline in memory (~1000+ days)  │
│  • KPIs recalculated from timeline via useMemo   │
│  • Charts rendered directly from timeline data   │
│  • Prices auto-refresh every ~5 min (cache hit)  │
│  • All filtering happens client-side             │
└──────────────────────────────────────────────────┘`
    }</div>
    <p style={s.body}>
      The daily timeline is the central data structure. Each entry contains a complete portfolio
      snapshot: total value, cost basis, realized and unrealized gains, per-asset breakdowns, and
      every individual operation that occurred that day. This is what makes frontend-only
      recalculation possible — all the raw data is already there.
    </p>

    <h3 id="hw-dates" style={s.subsectionTitle}>Dual Date System</h3>
    <p style={s.body}>
      There are two independent pairs of dates, each controlling a different part of the UI:
    </p>
    <div style={{ display: 'flex', gap: '16px', marginBottom: '1.2rem' }}>
      <div style={{ ...s.card, flex: 1 }}>
        <div style={s.label}>Filter Dates</div>
        <p style={{ ...s.body, marginBottom: 0, fontSize: '15px' }}>
          Control KPI calculations, the asset leaderboard, and the portfolio bar. Changed by the
          sidebar date filter and "Apply to All".
        </p>
      </div>
      <div style={{ ...s.card, flex: 1 }}>
        <div style={s.label}>Timeline Dates</div>
        <p style={{ ...s.body, marginBottom: 0, fontSize: '15px' }}>
          Control the visible zoom range of the timeline chart only. Changed by drag-zoom and
          quick filters (1W, 1M, 3M, etc.).
        </p>
      </div>
    </div>
    <p style={s.body}>
      When you zoom the timeline, only the chart range changes — KPIs stay stable. If the end date
      differs from the current filter, an "Apply to All" popup lets you propagate the change to the
      rest of the page. Point-clicking a date shows a snapshot of the portfolio at that exact point.
    </p>
    <div style={s.callout}>
      This separation exists because zooming is exploratory — you want to look closer at a period
      without your KPIs jumping around. Applying the zoom to KPIs is always an explicit choice.
    </div>

    <h3 id="hw-kpi" style={s.subsectionTitle}>Frontend-First KPIs</h3>
    <p style={s.body}>
      After the initial load, KPIs are never fetched from the backend. The frontend replays FIFO
      logic over the in-memory timeline, filtering by the selected end date, hidden assets, and
      disabled operations. This happens inside a <span style={s.inlineCode}>useMemo</span> hook that
      recalculates only when its dependencies change — making every interaction instant.
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
      The same approach applies to the Asset Leaderboard and Portfolio Bar — they recalculate
      from the same timeline data, ensuring all components stay perfectly in sync without any
      backend coordination.
    </p>

    <h3 id="hw-fifo" style={s.subsectionTitle}>FIFO Engine</h3>
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

    <h3 id="hw-cache" style={s.subsectionTitle}>Price Caching</h3>
    <p style={s.body}>
      Three independent caching layers keep the app fast, accurate, and cheap to run:
    </p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '1.2rem' }}>
      <div style={s.card}>
        <div style={s.label}>Layer 1 — Supabase (Historical Prices)</div>
        <p style={{ ...s.body, marginBottom: '0.4rem', fontSize: '15px' }}>
          A PostgreSQL database hosted on Supabase stores daily closing prices for every asset,
          permanently. When the backend builds the timeline, it fetches all historical prices in a
          single batch query instead of calling Kraken for each day.
        </p>
        <p style={{ ...s.body, marginBottom: 0, fontSize: '15px' }}>
          Populated by a daily cron job (runs at 01:00 AM, stores yesterday's closing price) and
          a one-time backfill script for initial setup. Today's price is never cached here — it
          always comes from the real-time layer.
        </p>
      </div>
      <div style={s.card}>
        <div style={s.label}>Layer 2 — In-Memory Cache (Current Prices)</div>
        <p style={{ ...s.body, marginBottom: '0.4rem', fontSize: '15px' }}>
          A simple Python dict in server RAM, shared across all requests. A background task
          refreshes it every ~5 minutes by calling the Kraken public API — keeping it warm so user
          requests never hit Kraken directly.
        </p>
        <p style={{ ...s.body, marginBottom: 0, fontSize: '15px' }}>
          No Redis, Memcached, or external services needed. Total Kraken API usage: ~288 calls/day,
          well under any rate limit. The cache is lost on server restart, but the first request
          rebuilds it automatically.
        </p>
      </div>
      <div style={s.card}>
        <div style={s.label}>Layer 3 — Frontend Timeline (In-Browser)</div>
        <p style={{ ...s.body, marginBottom: 0, fontSize: '15px' }}>
          The complete daily timeline (~1000+ snapshots) lives in React state after the initial
          load. Every KPI, chart, and table renders from this data. Prices for the last day are
          updated via an auto-refresh cycle (~5 min) that hits the in-memory cache — historical
          days keep their original Supabase prices.
        </p>
      </div>
    </div>
    <div style={s.codeBlock}>{
`
┌───────────────────────────────────────────────────-─┐
│  Supabase (PostgreSQL)         Permanent storage    │
│                                                     │
│  Daily cron → Kraken API → INSERT closing price     │
│  Timeline build → batch SELECT by asset + dates     │
│  Protection: today's price never written here       │
└──────────────────────────┬──────────────────────────┘
                           │ historical prices
                           ▼
┌─────────────────────────────────────────────────────┐
│  Backend RAM Cache         TTL: 300s (5 min)        │
│                                                     │
│  BG Task (295s) → Kraken API → _price_cache{}       │ 
│  GET /api/prices → read cache → respond             │
│  (never calls Kraken if cache is fresh)             │
└──────────────────────────┬──────────────────────────┘
                           │ current prices
                           ▼
┌─────────────────────────────────────────────────────┐
│  Frontend (React State)    Session lifetime         │
│                                                     │
│  Auto-refresh (310s) → GET /api/prices/current      │
│  Updates last day of timeline with fresh prices     │
│  All KPIs/charts recalculate from this data         │
└─────────────────────────────────────────────────────┘`
    }</div>

    <h3 id="hw-summary" style={s.subsectionTitle}>Full Architecture</h3>
    <p style={s.body}>
      Putting it all together — the complete system with every component and data flow:
    </p>
    <div style={s.codeBlock}>{
`
┌─────────┐    CSV/API     ┌───────────────────────────────────-┐
│  User   │ ──────────────→│  Backend (FastAPI, port 8001)      │
│  Input  │                │                                    │
└─────────┘                │  Parse trades                      │
                           │       ↓                            │
                           │  FIFO engine (full history)        │
                           │       ↓                            │
                           │  Build daily timeline              │
                           │    ├─ Supabase ← historical prices │
                           │    └─ Kraken API ← today's price   │
                           │       ↓                            │
                           │  Return: timeline[] + portfolio[]  │
                           └───────────────-┬───────────────────┘
                                            │
                    ┌──────────────────────┐│┌──────────────────┐
                    │  Supabase            │││  Kraken API      │
                    │  (PostgreSQL)        │││  (public)        │
                    │                      │││                  │
                    │  Historical prices   │││  Current prices  │
                    │  Daily cron update   │││  BG refresh ~5m  │
                    │  Permanent storage   │││  ~288 calls/day  │
                    └──────────────────────┘│└──────────────────┘
                                            │
                                            ▼
                           ┌───────────────────────────────────┐
                           │  Frontend (React + Vite)          │
                           │                                   │
                           │  Timeline stored in memory        │
                           │  KPIs via useMemo (FIFO replay)   │
                           │  Charts from timeline snapshots   │
                           │  Price refresh every ~5 min       │
                           │  All filtering is client-side     │
                           └───────────────────────────────────┘`
    }</div>
    <div style={s.callout}>
      The backend is stateless — it doesn't store your data, API keys, or CSV files. Every
      request is processed independently and the response contains everything the frontend needs.
      The only persistent storage is the Supabase price cache, which contains only public market
      prices, not user data.
    </div>
  </div>
);

const SecuritySection = ({ s }) => (
  <div id="security">
    <h2 style={s.sectionTitle}>Security</h2>
    <div style={s.greenBar} />

    <p style={s.body}>
      GainTrack is designed with a privacy-first approach. Here's how your data is protected:
    </p>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1.2rem' }}>
      {[
        { name: 'API Keys', desc: 'Used for a single Kraken API call, then discarded. Never stored in any database, log, or file.' },
        { name: 'CSV Files', desc: 'Parsed in server memory and never saved to disk. The raw file is not accessible after processing.' },
        { name: 'No User Accounts', desc: 'There are no accounts, sessions, or cookies. Each visit is stateless — your data exists only while the browser tab is open.' },
        { name: 'Client-Side State', desc: 'All portfolio data lives in React state (browser memory). Closing the tab erases everything. Nothing persists.' },
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
  const [activeTocId, setActiveTocId] = useState('about');
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
        <AboutSection s={s} />
        <GettingStartedSection s={s} />
        <OverviewDocsSection s={s} />
        <OperationsDocsSection s={s} />
        <FiltersDocsSection s={s} />
        <HowItWorksSection s={s} />
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
