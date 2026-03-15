import { useState, useEffect, useRef } from 'react';
import { formatEuropeanPrice, formatEuropeanPercentage } from '../../../../../utils/numberFormatter';
import { getAssetLogo } from '../../../../../utils/krakenAssets';
import { assetLabelMap } from '../../../../../utils/chartUtils';

const PriceTicker = ({ portfolioData, theme, priceTimestamp, userRefreshCount = 0, currency = { symbol: '€', multiplier: 1 } }) => {
  const [flash, setFlash] = useState(false);
  const prevRefreshCount = useRef(0);

  // Solo flash cuando el usuario hace refresh explícito (userRefreshCount cambia)
  useEffect(() => {
    if (userRefreshCount === 0) return; // Ignorar estado inicial
    if (userRefreshCount === prevRefreshCount.current) return;
    prevRefreshCount.current = userRefreshCount;
    setFlash(true);
    const timer = setTimeout(() => setFlash(false), 1000);
    return () => clearTimeout(timer);
  }, [userRefreshCount]);
  const professionalQuotes = [
    "Diversification is the only free lunch in investing",
    "Time in the market beats timing the market",
    "Risk comes from not knowing what you're doing",
    "The best investment you can make is in yourself",
    "Compound interest is the eighth wonder of the world",
    "Don't put all your eggs in one basket",
    "An investment in knowledge pays the best interest",
    "Price is what you pay, value is what you get",
    "The market is a voting machine in the short run, but a weighing machine in the long run",
    "Be fearful when others are greedy, greedy when others are fearful",
    "The stock market is designed to transfer money from the impatient to the patient",
    "Bulls make money, bears make money, but pigs get slaughtered",
    "Cut your losses and let your profits run",
    "Never invest money you cannot afford to lose",
    "The market can remain irrational longer than you can remain solvent",
    "Volatility is the price of returns",
    "Patience is a virtue in investing",
    "Dollar-cost averaging smooths volatility",
    "Long-term thinking creates lasting wealth",
    "Market timing is a fool's game",
  ];

  const popularAssets = [
    { symbol: 'BTC' },
    { symbol: 'ETH' },
    { symbol: 'SOL' },
    { symbol: 'ADA' },
    { symbol: 'DOT' },
    { symbol: 'AVAX' },
    { symbol: 'ATOM' },
    { symbol: 'LINK' },
  ];

  // Map display symbol → backend symbol for timeline lookups
  const displayToBackend = (sym) => {
    const map = { BTC: 'XXBT', ETH: 'XETH' };
    return map[sym] || sym;
  };

  // Compute real 24h % change from the last two timeline entries
  const getChange = (backendSymbol) => {
    const timeline = portfolioData?.timeline;
    if (!timeline || timeline.length < 2) return null;
    const curr = timeline[timeline.length - 1]?.assets_con_valor?.[backendSymbol]?.precio;
    const prev = timeline[timeline.length - 2]?.assets_con_valor?.[backendSymbol]?.precio;
    if (!curr || !prev || prev === 0) return null;
    return ((curr - prev) / prev) * 100;
  };

  const getTickerData = () => {
    const latestEntry = portfolioData?.timeline?.[portfolioData.timeline.length - 1];

    let ownedAssets = [];
    if (portfolioData?.portfolio_data) {
      ownedAssets = portfolioData.portfolio_data
        .filter(asset => asset.current_value > 0)
        .sort((a, b) => (b.current_value || 0) - (a.current_value || 0))
        .map(asset => {
          // Normalize: asset.asset may be a backend key (XXBT) or display key (BTC)
          const displaySymbol = assetLabelMap[asset.asset] || asset.asset;
          const backendSymbol = displayToBackend(displaySymbol);
          return {
            symbol: displaySymbol,
            backendSymbol,
            price: asset.current_price || 0,
            isOwned: true,
            changePercent24h: getChange(backendSymbol),
          };
        });
    }

    // Deduplicate by display symbol (avoids backend/display name mismatch issues)
    const ownedDisplaySymbols = new Set(ownedAssets.map(a => a.symbol));
    const missingCount = Math.max(0, 8 - ownedAssets.length);

    const popularToAdd = popularAssets
      .filter(asset => !ownedDisplaySymbols.has(asset.symbol))
      .slice(0, missingCount)
      .map(asset => {
        const backendSymbol = displayToBackend(asset.symbol);
        const price = latestEntry?.assets_con_valor?.[backendSymbol]?.precio || 0;
        return {
          symbol: asset.symbol,
          backendSymbol,
          price,
          isOwned: false,
          changePercent24h: getChange(backendSymbol),
        };
      })
      .filter(a => a.price > 0);

    return [...popularToAdd, ...ownedAssets];
  };

  const tickerData = getTickerData();

  const renderQuote = (index) => {
    const quote = professionalQuotes[index % professionalQuotes.length];
    return (
      <div
        key={`quote-${index}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          marginRight: '80px',
          whiteSpace: 'nowrap',
          fontSize: '14px',
          fontFamily: 'monospace',
          fontStyle: 'italic',
          color: '#d0d0d0',
        }}
      >
        <span>"{quote}"</span>
      </div>
    );
  };

  const renderAllAssets = () => {
    return tickerData.map((asset, index) => {
      const change = asset.changePercent24h;
      const isPositive = change !== null && change >= 0;

      return (
        <div
          key={`asset-${index}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginRight: '60px',
            whiteSpace: 'nowrap',
            fontSize: '14px',
            fontFamily: 'monospace',
          }}
        >
          {/* Logo */}
          {getAssetLogo(asset.symbol) ? (
            <img
              src={getAssetLogo(asset.symbol, 'small')}
              alt={asset.symbol}
              style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div style={{ width: '22px', height: '22px', flexShrink: 0 }} />
          )}

          {/* Symbol */}
          <span style={{
            fontWeight: '600',
            color: asset.isOwned ? theme.accentPrimary : '#d0d0d0',
            textTransform: 'uppercase',
            opacity: asset.isOwned ? 1 : 0.7,
          }}>
            {asset.symbol}:
          </span>

          {/* Price */}
          <span style={{
            fontWeight: '700',
            fontFamily: 'monospace',
            color: asset.isOwned ? theme.textPrimary : '#d0d0d0',
            opacity: asset.isOwned ? 1 : 0.8,
          }}>
            {formatEuropeanPrice(asset.price * currency.multiplier, currency.symbol)}
          </span>

          {/* 24h Change — only shown if real data available */}
          {change !== null && (
            <span style={{
              fontWeight: '400',
              color: isPositive ? '#00FF99' : '#ef4444',
            }}>
              {isPositive ? '▲' : '▼'}{formatEuropeanPercentage(Math.abs(change))}
            </span>
          )}
        </div>
      );
    });
  };

  // Render one full set of content (quotes + assets)
  const renderContent = () => (
    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
          {renderQuote(i)}
          {renderAllAssets()}
        </div>
      ))}
    </div>
  );

  return (
    <>
    {flash && <style>{`
      @keyframes ticker-flash {
        0%   { background: rgba(0,255,136,0.05); }
        100% { background: linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.03) 100%); }
      }
    `}</style>}
    <div style={{
      height: '50px',
      width: 'calc(100% + 16rem)',
      overflow: 'hidden',
      background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.03) 100%)',
      // No borderTop — la línea del header sirve de límite superior
      borderBottom: `1px solid ${theme.borderColor}`,
      position: 'absolute',
      top: '0px',
      left: '-8rem',
      right: '-8rem',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      animation: flash ? 'ticker-flash 1.0s ease-out forwards' : 'none',
    }}>
      {/* Fade en los bordes */}
      <div style={{
        position: 'absolute', left: 0, top: 0, width: '50px', height: '100%',
        background: `linear-gradient(90deg, ${theme.bg}, transparent)`,
        zIndex: 2, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', right: 0, top: 0, width: '50px', height: '100%',
        background: `linear-gradient(90deg, transparent, ${theme.bg})`,
        zIndex: 2, pointerEvents: 'none',
      }} />

      {/* Contenido desplazándose — patrón correcto: 2 copias, -50% loop */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        animation: 'scroll-ticker 220s linear infinite',
        willChange: 'transform',
      }}>
        {renderContent()}
        {renderContent()}
      </div>

      <style>{`
        @keyframes scroll-ticker {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
    </>
  );
};

export default PriceTicker;
