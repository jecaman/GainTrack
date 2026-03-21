import { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Filler } from 'chart.js';

// Import modular components
import KPIGrid from './components/KPIGrid';
import AssetLeaderboard from './components/AssetLeaderboard';
import DonutChart from './components/DonutChart';
import TimelineChart from './components/TimelineChart';
import PriceTicker from './components/PriceTicker';
import PortfolioBar from './components/PortfolioBar';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Filler);

// ZigzagLogo Component
const ZigzagLogo = ({
  size = 32,
  color = "#00ff88",
  sloganGlow = false,
  isDarkMode = true
}) => {
  const [visible, setVisible] = useState(false);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (sloganGlow) {
      setVisible(true);
      setFade(false);
      const timer = setTimeout(() => {
        setFade(true);
        setTimeout(() => setVisible(false), 400);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
      setFade(false);
    }
  }, [sloganGlow]);

  const path = [
    { x: 2, y: 16 },
    { x: 8, y: 6 },
    { x: 14, y: 12 },
    { x: 20, y: 4 },
    { x: 26, y: 10 },
    { x: 30, y: 2 }
  ];

  const getPointPosition = (progress) => {
    let totalDist = 0;
    const segDists = [];
    for (let i = 0; i < path.length - 1; i++) {
      const dx = path[i + 1].x - path[i].x;
      const dy = path[i + 1].y - path[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      segDists.push(dist);
      totalDist += dist;
    }
    let targetDist = progress * totalDist;
    for (let i = 0; i < segDists.length; i++) {
      if (targetDist > segDists[i]) {
        targetDist -= segDists[i];
      } else {
        const ratio = targetDist / segDists[i];
        const x = path[i].x + (path[i + 1].x - path[i].x) * ratio;
        const y = path[i].y + (path[i + 1].y - path[i].y) * ratio;
        return { x, y };
      }
    }
    return path[path.length - 1];
  };

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!visible) {
      setProgress(0);
      return;
    }
    let start = null;
    let rafId = null;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      let p = Math.min(elapsed / 2000, 1);
      setProgress(p);
      if (p < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };
    rafId = requestAnimationFrame(animate);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [visible]);

  const punto = getPointPosition(progress);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        style={{ display: 'block' }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <path
          d={`M ${path.map(p => `${p.x} ${p.y}`).join(' L ')}`}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={sloganGlow ? "url(#glow)" : "none"}
          style={{
            opacity: sloganGlow ? 0.9 : 0.7,
            transition: 'opacity 0.3s ease'
          }}
        />
        
        {visible && (
          <circle
            cx={punto.x}
            cy={punto.y}
            r="3"
            fill={color}
            filter="url(#glow)"
            style={{
              opacity: fade ? 0 : 1,
              transition: fade ? 'opacity 0.4s ease-out' : 'none'
            }}
          />
        )}
      </svg>
      
      {visible && (
        <div
          style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '9px',
            fontWeight: '600',
            color: color,
            textShadow: `0 0 4px ${color}40`,
            opacity: fade ? 0 : 0.9,
            transition: fade ? 'opacity 0.4s ease-out' : 'none',
            fontFamily: 'monospace',
            letterSpacing: '0.5px',
            whiteSpace: 'nowrap'
          }}
        >
          {isDarkMode ? 'TO THE MOON' : 'HODLING STRONG'}
        </div>
      )}
    </div>
  );
};

const OverviewSection = ({ portfolioData, isLoading, theme, onShowGainTrack, filters = {}, hiddenAssets, excludedOperations, disabledOps = new Set(), showApplyPopup, setShowApplyPopup, startDate, endDate, buttonStartDate, buttonEndDate, setStartDate, setEndDate, onTimelineApplyToAll, showTimelinePopup, showTimelineClickPopup, isInPointClickMode, setIsInPointClickMode, sidebarOpen, timelineUnfreezeTooltipRef, filterSelectedPreset, onFilterReset, isApplyingFromTimeline, timelineViewMode, setTimelineViewMode, timelineShowCostBasis, setTimelineShowCostBasis, timelinePeriodMode, setTimelinePeriodMode, priceTimestamp, userRefreshCount = 0, currency = { symbol: '€', multiplier: 1 } }) => {
  const [sloganGlow, setSloganGlow] = useState(false);
  const lastProfitRef = useRef(null);

  // Trigger glow animation when profit changes significantly
  useEffect(() => {
    if (portfolioData?.kpis?.profit !== undefined) {
      const currentProfit = portfolioData.kpis.profit;
      if (lastProfitRef.current !== null) {
        const profitChange = Math.abs(currentProfit - lastProfitRef.current);
        const percentChange = lastProfitRef.current !== 0 ? 
          (profitChange / Math.abs(lastProfitRef.current)) * 100 : 0;
        
        if (percentChange > 5) {
          setSloganGlow(true);
          setTimeout(() => setSloganGlow(false), 3000);
        }
      }
      lastProfitRef.current = currentProfit;
    }
  }, [portfolioData?.kpis?.profit]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.bg,
        color: theme.textPrimary
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          <ZigzagLogo size={64} color={theme.accentPrimary} sloganGlow={true} />
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            fontFamily: 'monospace'
          }}>
            Loading Portfolio Data...
          </div>
        </div>
      </div>
    );
  }

  if (!portfolioData) {
    return (
      <div style={{
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.textSecondary,
        fontFamily: 'monospace',
        fontSize: '16px'
      }}>
        No portfolio data available
      </div>
    );
  }

  return (
    <section style={{
      minHeight: 'auto',
      background: theme.bg,
      color: theme.textPrimary,
      fontFamily: 'monospace',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      marginTop: '0',
      paddingTop: '0',
      paddingBottom: '0',
      overflow: 'visible', // Permitir que el ticker salga por arriba
      width: '100%', // Ancho normal sin compensación
      marginBottom: '0'
    }}>
      {/* Price Ticker */}
      <PriceTicker portfolioData={portfolioData} theme={theme} priceTimestamp={priceTimestamp} userRefreshCount={userRefreshCount} currency={currency} />
      
      {/* Primera línea: KPIs centrados */}
      <div style={{
        width: '100%',
        marginTop: '40px'
      }}>
        <KPIGrid
          portfolioData={portfolioData}
          theme={theme}
          startDate={startDate}
          endDate={endDate}
          hiddenAssets={hiddenAssets}
          excludedOperations={excludedOperations}
          disabledOps={disabledOps}
          sidebarOpen={sidebarOpen}
          currency={currency}
        />
      </div>

      {/* Segunda línea: Timeline Chart - Full width */}
      <div style={{
        width: '100%',
        marginTop: '3.5rem'
      }}>
        <TimelineChart
          portfolioData={portfolioData}
          theme={theme}
          hiddenAssets={hiddenAssets}
          excludedOperations={excludedOperations}
          disabledOps={disabledOps}
          showApplyPopup={showApplyPopup}
          setShowApplyPopup={setShowApplyPopup}
          startDate={startDate}
          endDate={endDate}
          buttonStartDate={buttonStartDate}
          buttonEndDate={buttonEndDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          onTimelineApplyToAll={onTimelineApplyToAll}
          showTimelinePopup={showTimelinePopup}
          showTimelineClickPopup={showTimelineClickPopup}
          isInPointClickMode={isInPointClickMode}
          setIsInPointClickMode={setIsInPointClickMode}
          sidebarOpen={sidebarOpen}
          timelineUnfreezeTooltipRef={timelineUnfreezeTooltipRef}
          filterSelectedPreset={filterSelectedPreset}
          onFilterReset={onFilterReset}
          isApplyingFromTimeline={isApplyingFromTimeline}
          viewMode={timelineViewMode}
          onViewModeChange={setTimelineViewMode}
          showTotalInvested={timelineShowCostBasis}
          onShowTotalInvestedChange={setTimelineShowCostBasis}
          periodMode={timelinePeriodMode}
          onPeriodModeChange={setTimelinePeriodMode}
        />
      </div>

      {/* Layout del resto de elementos */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
        alignItems: 'flex-start',
        flex: 1
      }}>

        {/* Barra de allocación proporcional por asset */}
        <PortfolioBar
          portfolioData={portfolioData}
          startDate={startDate}
          endDate={endDate}
          hiddenAssets={hiddenAssets}
          excludedOperations={excludedOperations}
          disabledOps={disabledOps}
          sidebarOpen={sidebarOpen}
          currency={currency}
        />

        {/* Tercera línea: Tabla ocupando todo el ancho */}
        <div style={{
          width: '100%',
          marginTop: '1rem',
          marginBottom: '0',
          paddingBottom: '0.5rem'
        }}>
          <AssetLeaderboard
            portfolioData={portfolioData}
            theme={theme}
            startDate={startDate}
            endDate={endDate}
            hiddenAssets={hiddenAssets}
            excludedOperations={excludedOperations}
            disabledOps={disabledOps}
            sidebarOpen={sidebarOpen}
            currency={currency}
          />
        </div>
      </div>
    </section>
  );
};

export default OverviewSection;