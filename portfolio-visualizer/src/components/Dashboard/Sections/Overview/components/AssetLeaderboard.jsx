import { useState, useLayoutEffect, useEffect } from 'react';
import { assetLabelMap } from '../../../../../utils/chartUtils';
import { formatEuropeanNumber, formatEuropeanCurrency, formatEuropeanPercentage, formatEuropeanPrice } from '../../../../../utils/numberFormatter';
import { getAssetLogo, KRAKEN_ASSETS } from '../../../../../utils/krakenAssets';

const AssetLeaderboard = ({ portfolioData, theme, startDate, endDate, hiddenAssets = new Set(), excludedOperations = new Set(), sidebarOpen = false }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'portfolioPercent', direction: 'desc' });
  const getFiatSymbol = () => '€';

  // Map frontend asset names to backend asset names (same as KPIGrid)
  const mapFrontendToBackend = (frontendAsset) => {
    const mapping = {
      'BTC': 'XXBT',
      'ETH': 'XETH',
      'BITCOIN': 'XXBT',
      'ETHEREUM': 'XETH'
    };
    return mapping[frontendAsset] || frontendAsset;
  };
  
  // Convert hiddenAssets to use backend names
  const hiddenAssetsBackend = new Set(
    Array.from(hiddenAssets).map(asset => mapFrontendToBackend(asset))
  );

  // Get full asset name from KRAKEN_ASSETS database
  const getAssetFullName = (assetSymbol) => {
    const cleanSymbol = assetLabelMap[assetSymbol] || assetSymbol;
    return KRAKEN_ASSETS[cleanSymbol]?.name || cleanSymbol;
  };

  // Get official asset color from KRAKEN_ASSETS database
  const getAssetColor = (assetSymbol) => {
    const cleanSymbol = assetLabelMap[assetSymbol] || assetSymbol;
    return KRAKEN_ASSETS[cleanSymbol]?.color || '#95A5A6'; // Default neutral gray if not found
  };

  // Calculate filtered portfolio data based on date range and operations (similar to KPIGrid)
  const processPortfolioData = () => {
    // Fallback to original data if timeline is not available
    if (!portfolioData?.timeline || portfolioData.timeline.length === 0) {
      if (!portfolioData?.portfolio_data) return [];
      
      const totalPortfolioValue = portfolioData.portfolio_data.reduce((sum, asset) => sum + (asset.current_value || 0), 0);
      
      return portfolioData.portfolio_data
        .filter(asset => !hiddenAssetsBackend.has(asset.asset)) // Apply hidden assets filter
        .map(asset => {
          const realizedGains = asset.realized_gains || 0;
          const unrealizedGains = asset.unrealized_gains || 0;
          const netProfit = asset.net_profit || (realizedGains + unrealizedGains);
          const netProfitPercent = asset.net_profit_percent || 0;
          
          return {
            asset: assetLabelMap[asset.asset] || asset.asset,
            portfolioPercent: totalPortfolioValue > 0 ? ((asset.current_value || 0) / totalPortfolioValue * 100) : 0,
            fiatValue: asset.current_value || 0,
            marketPrice: asset.current_price || 0,
            avgCost: (asset.amount || 0) > 0 ? (asset.total_invested || 0) / (asset.amount || 0) : 0,
            nativeValue: asset.amount || 0,
            nativeSymbol: assetLabelMap[asset.asset] || asset.asset,
            netProfit: netProfit,
            netProfitPercent: netProfitPercent,
            realizedGains: realizedGains,
            unrealizedGains: unrealizedGains,
            originalAsset: asset
          };
        });
    }
    
    // Process timeline data with date filtering (same logic as KPIGrid)
    let timelineToProcess = portfolioData.timeline;
    const isPointClick = startDate === endDate; // Detect if it's a specific date (point click)
    
    // Apply date filtering if specified
    if (startDate && endDate) {
      const endDateStr = endDate; // YYYY-MM-DD — use string comparison like KPIGrid to avoid timezone issues
      // Always process all data up to endDate (same as KPIGrid).
      // startDate only controls the timeline zoom — not which operations are included.
      timelineToProcess = portfolioData.timeline.filter(entry => {
        return entry.date.split('T')[0] <= endDateStr;
      });
    }
    
    if (timelineToProcess.length === 0) {
      return [];
    }
    
    // Calculate per-asset holdings using FIFO cost basis
    let assetHoldings = {}; // Asset -> current quantity
    let assetCostBasis = {}; // Asset -> FIFO queue for cost basis
    let assetTotalInvested = {}; // Asset -> cost basis of current holdings (decreases on sell)
    let assetTotalEverInvested = {}; // Asset -> total ever invested (never decreases, for ROI%)
    let assetRealizedGains = {}; // Asset -> realized gains
    
    timelineToProcess.forEach(dayData => {
      const operations = dayData.operations || [];
      operations.forEach(operation => {
        // Skip operations for hidden assets or excluded operations
        if (hiddenAssetsBackend.has(operation.asset) || excludedOperations.has(operation.operation_key)) {
          return;
        }
        
        const asset = operation.asset;
        const tipo = operation.type;
        const cantidad = parseFloat(operation.cantidad) || 0;
        const cost = parseFloat(operation.cost) || 0;
        const fee = parseFloat(operation.fee) || 0;
        
        // Initialize asset tracking if not exists (use 'in' to avoid reinit when holdings reach 0)
        if (!(asset in assetHoldings)) {
          assetHoldings[asset] = 0;
          assetCostBasis[asset] = [];
          assetTotalInvested[asset] = 0;
          assetTotalEverInvested[asset] = 0;
          assetRealizedGains[asset] = 0;
        }

        if (tipo === 'buy') {
          assetHoldings[asset] += cantidad;
          const costConFee = cost + fee;
          assetCostBasis[asset].push({
            volumen: cantidad,
            cost: costConFee
          });
          assetTotalInvested[asset] += costConFee;
          assetTotalEverInvested[asset] += costConFee;
        } else if (tipo === 'sell') {
          assetHoldings[asset] -= cantidad;
          // Process sale using FIFO
          let volumenRestante = cantidad;
          let totalCostVendido = 0;

          while (volumenRestante > 0 && assetCostBasis[asset].length > 0) {
            const lote = assetCostBasis[asset][0];

            if (lote.volumen <= volumenRestante) {
              volumenRestante -= lote.volumen;
              totalCostVendido += lote.cost;
              assetCostBasis[asset].shift();
            } else {
              const proporcion = volumenRestante / lote.volumen;
              totalCostVendido += lote.cost * proporcion;
              lote.volumen -= volumenRestante;
              lote.cost -= lote.cost * proporcion;
              volumenRestante = 0;
            }
          }

          // Remove the cost basis of sold units so totalInvested always reflects
          // only current holdings, not all-time purchases.
          assetTotalInvested[asset] = Math.max(0, assetTotalInvested[asset] - totalCostVendido);

          const saleProceeds = cost - fee;
          assetRealizedGains[asset] += (saleProceeds - totalCostVendido);
        }
      });
    });
    
    // Get latest prices from the timeline
    const latestData = timelineToProcess[timelineToProcess.length - 1];
    const assetsData = [];
    let totalPortfolioValue = 0;
    let closedPositionsTotalGains = 0; // realized gains from fully-sold assets

    // Process each asset
    Object.keys(assetHoldings).forEach(asset => {
      const holdings = assetHoldings[asset];
      const realizedGains = assetRealizedGains[asset] || 0;
      const totalEverInvested = assetTotalEverInvested[asset] || 0;

      if (holdings <= 0) {
        // Asset fully sold — accumulate its realized gains for the closed-positions row
        closedPositionsTotalGains += realizedGains;
        return;
      }

      const assetData = latestData.assets_con_valor?.[asset];
      if (!assetData) return;

      const currentPrice = assetData.precio || 0;
      const currentValue = holdings * currentPrice;
      const totalInvested = assetTotalInvested[asset] || 0;
      const unrealizedGains = currentValue - totalInvested;
      const netProfit = realizedGains + unrealizedGains;
      const netProfitPercent = totalEverInvested > 0 ? (netProfit / totalEverInvested) * 100 : 0;
      const avgCost = totalInvested / holdings;

      totalPortfolioValue += currentValue;

      assetsData.push({
        asset: assetLabelMap[asset] || asset,
        portfolioPercent: 0,
        fiatValue: currentValue,
        marketPrice: currentPrice,
        avgCost: avgCost,
        nativeValue: holdings,
        nativeSymbol: assetLabelMap[asset] || asset,
        netProfit: netProfit,
        netProfitPercent: netProfitPercent,
        realizedGains: realizedGains,
        unrealizedGains: unrealizedGains,
        isClosed: false,
        originalAsset: { asset, current_value: currentValue, current_price: currentPrice, amount: holdings }
      });
    });

    // Add a summary row for fully-closed positions if there are any
    if (closedPositionsTotalGains !== 0) {
      assetsData.push({
        asset: 'Closed Positions',
        portfolioPercent: 0,
        fiatValue: 0,
        marketPrice: null,
        avgCost: null,
        nativeValue: null,
        nativeSymbol: null,
        netProfit: closedPositionsTotalGains,
        netProfitPercent: null,
        realizedGains: closedPositionsTotalGains,
        unrealizedGains: 0,
        isClosed: true,
        originalAsset: null
      });
    }
    
    // Calculate portfolio percentages
    assetsData.forEach(assetData => {
      assetData.portfolioPercent = totalPortfolioValue > 0 ? (assetData.fiatValue / totalPortfolioValue * 100) : 0;
    });
    
    // Debug: log per-asset breakdown
    const totalTablePnL = assetsData.reduce((sum, r) => sum + r.netProfit, 0);
    console.log('[AssetLeaderboard] P&L breakdown:', {
      totalTablePnL: totalTablePnL.toFixed(4),
      perAsset: assetsData.map(r => ({
        asset: r.asset,
        isClosed: r.isClosed,
        netProfit: r.netProfit?.toFixed(4),
        realizedGains: r.realizedGains?.toFixed(4),
        unrealizedGains: r.unrealizedGains?.toFixed(4),
        currentValue: r.fiatValue?.toFixed(4),
      })),
      closedPositionsTotalGains: closedPositionsTotalGains.toFixed(4),
    });

    // Apply sorting — closed positions row always stays last
    const openRows = assetsData.filter(r => !r.isClosed);
    const closedRows = assetsData.filter(r => r.isClosed);

    openRows.sort((a, b) => {
      const { key, direction } = sortConfig;
      let aValue = a[key];
      let bValue = b[key];

      if (key === 'asset') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return [...openRows, ...closedRows];
  };

  const processedData = processPortfolioData();
  const symbol = getFiatSymbol();

  // Fix: when visible assets change, the table shrinks but the browser can keep a stale
  // scroll position beyond the new content bounds. Force layout recalc + clamp scroll.
  useLayoutEffect(() => {
    void document.documentElement.getBoundingClientRect();
  }, [processedData.length]);

  useEffect(() => {
    requestAnimationFrame(() => {
      const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      if (window.scrollY > maxScrollY) {
        window.scrollTo({ top: maxScrollY });
      }
    });
  }, [processedData.length]);

  // Handle column sorting
  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  // Color for column header — active sort column gets green accent, others white
  const thColor = (key) => sortConfig.key === key ? '#00ff99' : '#ffffff';

  // Render sort arrow — only shown for the active column
  const renderSortArrow = (columnKey) => {
    if (sortConfig.key !== columnKey) return null;
    return (
      <span style={{
        color: '#00ff99',
        fontSize: '18px',
        marginLeft: '6px',
        fontWeight: '900',
        textShadow: '0 0 8px rgba(0,255,153,0.8)',
        verticalAlign: 'middle',
        lineHeight: '1'
      }}>
        {sortConfig.direction === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  return (
    <>
      <style>{`
        @keyframes slideInRow {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0px);
          }
        }
      `}</style>
      <div style={{
        backgroundColor: 'transparent',
        border: 'none',
        padding: '0',
        margin: '0',
        width: '100%',
        height: 'fit-content',
        position: 'relative',
        zIndex: 10000,
        overflow: 'visible'
      }}>
      {/* Botón de información — alineado con el borde derecho de la tabla */}
      <div style={{
        position: 'absolute',
        top: '-2px',
        right: sidebarOpen ? '-16px' : '62px',
        zIndex: 1000
      }}>
        <div 
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: '#666666',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            color: '#ffffff',
            fontFamily: "'Inter', sans-serif",
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            setShowTooltip(true);
            e.currentTarget.style.backgroundColor = '#00ff88';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            setShowTooltip(false);
            e.currentTarget.style.backgroundColor = '#666666';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          i
          
          {/* Tooltip */}
          {showTooltip && (
            <div style={{
              position: 'absolute',
              top: '22px',
              right: '10px',
              backgroundColor: 'rgba(0, 0, 0, 0.95)',
              border: `2px solid ${theme.borderColor}`,
              borderRadius: '0.75rem',
              padding: '1rem',
              minWidth: '260px',
              fontSize: '0.85rem',
              lineHeight: '1.4',
              color: '#ffffff',
              fontFamily: "'Inter', sans-serif",
              backdropFilter: 'blur(10px)',
              zIndex: 10000,
              whiteSpace: 'normal'
            }}>
              <div style={{ fontWeight: '700', marginBottom: '0.5rem' }}>
                Asset Leaderboard
              </div>
              <div style={{ fontWeight: '400' }}>
                Comprehensive portfolio breakdown with market prices, average costs, and detailed P&L analysis for each asset including realized and unrealized gains.
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Contenedor tabla — sin scroll, altura auto */}
      <div style={{
        background: 'transparent',
        border: 'none',
        width: '100%',
        margin: '0',
        padding: '0'
      }}>
        {/* Mismos márgenes que el timeline (responsive a sidebarOpen) */}
        <div style={{
          overflow: 'visible',
          width: sidebarOpen ? 'calc(100% - 40px)' : 'calc(100% - 120px)',
          marginLeft: '60px',
          marginRight: sidebarOpen ? '-20px' : '60px',
          padding: '0',
          boxSizing: 'border-box'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            margin: 0,
            padding: 0,
            fontSize: '15px',
            fontFamily: "'Inter', sans-serif"
          }}>
            <thead style={{
              position: 'sticky',
              top: 0,
              backgroundColor: 'rgba(0, 0, 0, 1)', // Fondo sólido sin transparencia
              backdropFilter: 'none',
              zIndex: 10
            }}>
              <tr>
                <th
                  style={{
                    padding: '20px 12px',
                    textAlign: 'left',
                    color: thColor('asset'),
                    fontWeight: '700',
                    borderBottom: `1px solid #d0d0d0`,
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', monospace",
                    minWidth: '180px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    borderTopLeftRadius: '0'
                  }}
                  onClick={() => handleSort('asset')}
                >
                  Asset{renderSortArrow('asset')}
                </th>
                <th
                  style={{
                    padding: '20px 6px',
                    textAlign: 'left',
                    paddingLeft: '5px',
                    color: thColor('portfolioPercent'),
                    fontWeight: '700',
                    borderBottom: `1px solid #d0d0d0`,
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', monospace",
                    minWidth: '100px',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => handleSort('portfolioPercent')}
                >
                  Portfolio Allocation{renderSortArrow('portfolioPercent')}
                </th>
                <th
                  style={{
                    padding: '20px 6px',
                    textAlign: 'right',
                    color: thColor('fiatValue'),
                    fontWeight: '700',
                    borderBottom: `1px solid #d0d0d0`,
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', monospace",
                    minWidth: '110px',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => handleSort('fiatValue')}
                >
                  Value{renderSortArrow('fiatValue')}
                </th>
                <th
                  style={{
                    padding: '20px 6px',
                    textAlign: 'right',
                    color: thColor('nativeValue'),
                    fontWeight: '700',
                    borderBottom: `1px solid #d0d0d0`,
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', monospace",
                    minWidth: '100px',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => handleSort('nativeValue')}
                >
                  Holdings{renderSortArrow('nativeValue')}
                </th>
                <th
                  style={{
                    padding: '20px 6px',
                    textAlign: 'right',
                    color: thColor('marketPrice'),
                    fontWeight: '700',
                    borderBottom: `1px solid #d0d0d0`,
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', monospace",
                    minWidth: '110px',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => handleSort('marketPrice')}
                >
                  Price{renderSortArrow('marketPrice')}
                </th>
                <th
                  style={{
                    padding: '20px 6px',
                    textAlign: 'right',
                    color: thColor('avgCost'),
                    fontWeight: '700',
                    borderBottom: `1px solid #d0d0d0`,
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', monospace",
                    minWidth: '100px',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => handleSort('avgCost')}
                >
                  Average Cost{renderSortArrow('avgCost')}
                </th>
                <th
                  style={{
                    padding: '20px 6px',
                    textAlign: 'right',
                    color: thColor('costBasis'),
                    fontWeight: '700',
                    borderBottom: `1px solid #d0d0d0`,
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', monospace",
                    minWidth: '100px',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => handleSort('costBasis')}
                >
                  Cost Basis{renderSortArrow('costBasis')}
                </th>
                <th
                  style={{
                    padding: '20px 6px',
                    textAlign: 'right',
                    color: thColor('netProfit'),
                    fontWeight: '700',
                    borderBottom: `1px solid #d0d0d0`,
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', monospace",
                    minWidth: '200px',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => handleSort('netProfit')}
                >
                  P&L{renderSortArrow('netProfit')}
                </th>
                <th
                  style={{
                    padding: '20px 35px 20px 20px',
                    textAlign: 'right',
                    color: thColor('netProfitPercent'),
                    fontWeight: '700',
                    borderBottom: `1px solid #d0d0d0`,
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', monospace",
                    minWidth: '120px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    borderTopRightRadius: '0'
                  }}
                  onClick={() => handleSort('netProfitPercent')}
                >
                  ROI %{renderSortArrow('netProfitPercent')}
                </th>
              </tr>
            </thead>
            <tbody>
              {processedData.map((row, index) => {
                // ── Closed positions summary row ──────────────────────────────
                if (row.isClosed) {
                  const plColor = row.netProfit >= 0 ? '#00FF99' : '#ef4444';
                  return (
                    <tr key="closed-positions" style={{ opacity: 0.55 }}>
                      <td style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '38px', height: '38px', flexShrink: 0,
                            borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '16px' }}>✕</div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '15px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
                              Closed Positions
                            </span>
                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                              Fully sold assets
                            </span>
                          </div>
                        </div>
                      </td>
                      {/* Portfolio % — empty */}
                      <td style={{ borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none' }} />
                      {/* Value — €0 */}
                      <td style={{ padding: '16px 4px', textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontSize: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none' }}>
                        —
                      </td>
                      {/* Holdings */}
                      <td style={{ padding: '16px 4px', textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontSize: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none' }}>—</td>
                      {/* Price */}
                      <td style={{ padding: '16px 4px', textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontSize: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none' }}>—</td>
                      {/* Avg Cost */}
                      <td style={{ padding: '16px 4px', textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontSize: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none' }}>—</td>
                      {/* Cost Basis */}
                      <td style={{ padding: '16px 4px', textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontSize: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none' }}>—</td>
                      {/* P&L */}
                      <td style={{ padding: '16px 10px', textAlign: 'right', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none' }}>
                        <span style={{ color: plColor, fontSize: '17px', fontWeight: '700' }}>
                          {row.netProfit >= 0 ? '+' : ''}{formatEuropeanCurrency(row.netProfit)}
                        </span>
                      </td>
                      {/* ROI% */}
                      <td style={{ padding: '16px 35px 16px 8px', textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontSize: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none' }}>—</td>
                    </tr>
                  );
                }

                // ── Normal asset row ──────────────────────────────────────────
                return (
                  <tr key={`${row.asset}-${sortConfig.key}-${sortConfig.direction}`} style={{
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    backgroundColor: 'transparent',
                    transform: 'translateY(0px)',
                    opacity: 1,
                    animation: `slideInRow 0.3s ease-out ${index * 0.05}s both`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(252, 252, 252, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0px)';
                  }}
                  >
                  <td style={{
                    padding: '24px 12px',
                    color: theme.accentPrimary,
                    fontWeight: '700',
                    fontSize: '17px',
                    borderBottom: `1px solid rgba(255, 255, 255, 0.2)`
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                    {getAssetLogo(row.nativeSymbol) ? (
                      <img
                        src={getAssetLogo(row.nativeSymbol, 'small')}
                        alt={row.asset}
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          flexShrink: 0
                        }}
                        onError={(e) => {
                          console.log(`❌ Error loading logo for ${row.nativeSymbol}:`, e.target.src);
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div style={{ width: '38px', height: '38px', flexShrink: 0 }} />
                    )}
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '18px', fontWeight: '700' }}>{row.asset}</span>
                        <span style={{
                          fontSize: '17px',
                          fontWeight: '500',
                          color: 'rgba(255, 255, 255, 0.8)',
                          marginTop: '2px'
                        }}>
                          {getAssetFullName(row.nativeSymbol)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td style={{
                    padding: '24px 2px 24px 4px',
                    textAlign: 'right',
                    color: theme.textPrimary,
                    fontSize: '18px',
                    fontWeight: '400',
                    borderBottom: `1px solid rgba(255, 255, 255, 0.2)`,
                    position: 'relative',
                    minWidth: '120px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <div style={{
                        position: 'relative',
                        width: '120px',
                        height: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        marginRight: '12px'
                      }}>
                        <div style={{
                          width: `${Math.min(row.portfolioPercent, 100)}%`,
                          height: '100%',
                          backgroundColor: getAssetColor(row.nativeSymbol),
                          borderRadius: '6px',
                          opacity: 0.9
                        }} />
                      </div>
                      <span style={{
                        fontSize: '18px',
                        fontWeight: '400',
                        minWidth: '55px',
                        textAlign: 'left',
                        flexShrink: 0
                      }}>
                        {formatEuropeanPercentage(row.portfolioPercent)}
                      </span>
                    </div>
                  </td>
                  <td style={{
                    padding: '24px 4px',
                    textAlign: 'right',
                    color: theme.textPrimary,
                    fontSize: '19px',
                    fontWeight: '700',
                    borderBottom: `1px solid rgba(255, 255, 255, 0.2)`
                  }}>
                    {formatEuropeanCurrency(row.fiatValue)}
                  </td>
                  <td style={{
                    padding: '24px 4px',
                    textAlign: 'right',
                    color: theme.textPrimary,
                    fontSize: '18px',
                    fontWeight: '400',
                    borderBottom: `1px solid rgba(255, 255, 255, 0.2)`
                  }}>
                    {formatEuropeanNumber(row.nativeValue, 6)}
                  </td>
                  <td style={{
                    padding: '24px 4px',
                    textAlign: 'right',
                    color: theme.textPrimary,
                    fontSize: '18px',
                    fontWeight: '400',
                    borderBottom: `1px solid rgba(255, 255, 255, 0.2)`
                  }}>
                    {row.marketPrice != null ? formatEuropeanPrice(row.marketPrice) : '—'}
                  </td>
                  <td style={{
                    padding: '24px 4px',
                    textAlign: 'right',
                    color: theme.textPrimary,
                    fontSize: '18px',
                    fontWeight: '400',
                    borderBottom: `1px solid rgba(255, 255, 255, 0.2)`
                  }}>
                    {row.avgCost != null ? formatEuropeanPrice(row.avgCost) : '—'}
                  </td>
                  <td style={{
                    padding: '24px 4px',
                    textAlign: 'right',
                    color: theme.textPrimary,
                    fontSize: '18px',
                    fontWeight: '400',
                    borderBottom: `1px solid rgba(255, 255, 255, 0.2)`
                  }}>
                    {formatEuropeanCurrency(row.avgCost * row.nativeValue)}
                  </td>
                  <td style={{
                    padding: '20px 10px',
                    textAlign: 'right',
                    color: theme.textPrimary,
                    fontSize: '14px',
                    fontWeight: '400',
                    borderBottom: `1px solid rgba(255, 255, 255, 0.2)`,
                    lineHeight: '1.5'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{
                        color: row.netProfit >= 0 ? '#00FF99' : '#ef4444',
                        fontSize: '19px',
                        fontWeight: '700'
                      }}>
                        {row.netProfit >= 0 ? '+' : ''}{formatEuropeanCurrency(row.netProfit)}
                      </div>
                      <div style={{
                        color: row.realizedGains >= 0 ? '#00FF99' : '#ef4444',
                        fontSize: '14px',
                        opacity: 0.9
                      }}>
                        R: {row.realizedGains >= 0 ? '+' : ''}{formatEuropeanCurrency(row.realizedGains)}
                      </div>
                      <div style={{
                        color: row.unrealizedGains >= 0 ? '#00FF99' : '#ef4444',
                        fontSize: '14px',
                        opacity: 0.9
                      }}>
                        U: {row.unrealizedGains >= 0 ? '+' : ''}{formatEuropeanCurrency(row.unrealizedGains)}
                      </div>
                    </div>
                  </td>
                  <td style={{
                    padding: '24px 35px 24px 8px',
                    textAlign: 'right',
                    color: row.netProfit >= 0 ? '#00FF99' : '#ef4444',
                    fontSize: '18px',
                    fontWeight: '700',
                    borderBottom: `1px solid rgba(255, 255, 255, 0.2)`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      <span style={{
                        fontSize: '16px',
                        transform: row.netProfitPercent >= 0 ? 'rotate(0deg)' : 'rotate(180deg)',
                        display: 'inline-block'
                      }}>▲</span>
                      <span>{formatEuropeanPercentage(Math.abs(row.netProfitPercent))}</span>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </>
  );
};

export default AssetLeaderboard;