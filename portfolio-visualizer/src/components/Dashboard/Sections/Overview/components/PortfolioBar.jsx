import { useState, useRef } from 'react';
import { assetLabelMap, makeOpId } from '../../../../../utils/chartUtils';
import { KRAKEN_ASSETS } from '../../../../../utils/krakenAssets';
import { formatEuropeanCurrency, formatEuropeanNumber, formatEuropeanPercentage } from '../../../../../utils/numberFormatter';

const mapFrontendToBackend = (asset) => {
  const mapping = { BTC: 'XXBT', ETH: 'XETH', BITCOIN: 'XXBT', ETHEREUM: 'XETH' };
  return mapping[asset] || asset;
};

const getAssetColor = (backendSymbol) => {
  const display = assetLabelMap[backendSymbol] || backendSymbol;
  return KRAKEN_ASSETS[display]?.color || '#95A5A6';
};

const getAssetDisplayName = (backendSymbol) => {
  const display = assetLabelMap[backendSymbol] || backendSymbol;
  return { ticker: display, name: KRAKEN_ASSETS[display]?.name || display };
};

const PortfolioBar = ({
  portfolioData,
  startDate,
  endDate,
  hiddenAssets = new Set(),
  excludedOperations = new Set(),
  disabledOps = new Set(),
  sidebarOpen = false,
}) => {
  const [hovered, setHovered] = useState(null);
  // X relativo al contenedor (no al viewport) para position:absolute
  const [relativeX, setRelativeX] = useState(0);
  const containerRef = useRef(null);

  const computeAllocations = () => {
    if (!portfolioData?.timeline || portfolioData.timeline.length === 0) return [];

    const hiddenBackend = new Set(Array.from(hiddenAssets).map(mapFrontendToBackend));

    let timelineToProcess = portfolioData.timeline;
    if (startDate && endDate) {
      timelineToProcess = portfolioData.timeline.filter(
        (e) => e.date.split('T')[0] <= endDate
      );
    }
    if (timelineToProcess.length === 0) return [];

    const holdings = {};
    timelineToProcess.forEach((dayData) => {
      (dayData.operations || []).forEach((op) => {
        if (hiddenBackend.has(op.asset) || excludedOperations.has(op.operation_key) || disabledOps.has(makeOpId(op, dayData.date))) return;
        const asset = op.asset;
        if (!(asset in holdings)) holdings[asset] = 0;
        const qty = parseFloat(op.cantidad) || 0;
        if (op.type === 'buy') holdings[asset] += qty;
        else if (op.type === 'sell') holdings[asset] -= qty;
      });
    });

    const latestData = timelineToProcess[timelineToProcess.length - 1];
    let totalValue = 0;
    const segments = [];

    Object.keys(holdings).forEach((asset) => {
      const qty = holdings[asset];
      if (qty <= 0) return;
      const priceData = latestData.assets_con_valor?.[asset];
      if (!priceData) return;
      const value = qty * (priceData.precio || 0);
      if (value <= 0) return;
      totalValue += value;
      segments.push({ asset, qty, value });
    });

    if (totalValue === 0) return [];

    return segments
      .map((s) => ({ ...s, percent: (s.value / totalValue) * 100 }))
      .sort((a, b) => b.value - a.value);
  };

  const allocations = computeAllocations();
  if (allocations.length === 0) return null;

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // X relativo al contenedor, centrado para el tooltip
    setRelativeX(e.clientX - rect.left);
  };

  const handleMouseLeave = () => setHovered(null);

  return (
    // position:relative para anclar el tooltip con position:absolute
    <div
      ref={containerRef}
      style={{
        width: sidebarOpen ? 'calc(100% - 40px)' : 'calc(100% - 120px)',
        marginLeft: '60px',
        marginRight: sidebarOpen ? '-20px' : '60px',
        marginTop: '2rem',
        marginBottom: '0.25rem',
        position: 'relative',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Barra */}
      <div
        style={{
          display: 'flex',
          height: '20px',
          borderRadius: '10px',
          overflow: 'hidden',
          width: '100%',
          gap: '2px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
          cursor: 'crosshair',
          position: 'relative',
        }}
      >
        {allocations.map((seg) => {
          const color = getAssetColor(seg.asset);
          const isHov = hovered?.asset === seg.asset;
          return (
            <div
              key={seg.asset}
              title=""
              style={{
                flex: `${seg.percent} 0 0`,
                background: `linear-gradient(180deg, ${color}ee 0%, ${color} 100%)`,
                opacity: hovered && !isHov ? 0.55 : 1,
                transition: 'opacity 0.18s ease, filter 0.18s ease',
                filter: isHov ? 'brightness(1.15)' : 'none',
                minWidth: seg.percent > 1 ? undefined : '3px',
              }}
              onMouseEnter={() => setHovered(seg)}
            />
          );
        })}

        {/* Gloss overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Tooltip — position:absolute, bottom:100% = siempre justo encima de la barra */}
      {hovered && (() => {
        const { ticker, name } = getAssetDisplayName(hovered.asset);
        const color = getAssetColor(hovered.asset);
        return (
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 10px)',
              left: relativeX,
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(18,18,20,0.98)',
              border: `1px solid ${color}`,
              borderRadius: '12px',
              padding: '14px 18px',
              pointerEvents: 'none',
              zIndex: 99999,
              minWidth: '200px',
              fontFamily: 'monospace',
              boxShadow: `0 12px 32px rgba(0,0,0,0.7), 0 0 0 1px ${color}33`,
              whiteSpace: 'nowrap',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '12px', height: '12px', borderRadius: '50%',
                backgroundColor: color, flexShrink: 0,
                boxShadow: `0 0 8px ${color}`,
              }} />
              <span style={{ color: '#ffffff', fontWeight: '700', fontSize: '16px' }}>{ticker}</span>
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', fontWeight: '400' }}>{name}</span>
            </div>

            <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.12)', marginBottom: '12px' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Row label="Allocation" value={formatEuropeanPercentage(hovered.percent)} valueColor={color} bold />
              <Row label="Value"      value={formatEuropeanCurrency(hovered.value)} />
              <Row label="Holdings"   value={`${formatEuropeanNumber(hovered.qty, 4)} ${ticker}`} dim />
            </div>
          </div>
        );
      })()}
    </div>
  );
};

const Row = ({ label, value, valueColor, bold, dim }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '500' }}>
      {label}
    </span>
    <span style={{
      color: valueColor || (dim ? 'rgba(255,255,255,0.75)' : '#ffffff'),
      fontSize: '14px',
      fontWeight: bold ? '700' : '600',
    }}>
      {value}
    </span>
  </div>
);

export default PortfolioBar;
