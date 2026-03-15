import { useState, useMemo, useEffect } from 'react';
import { formatEuropeanCurrency, formatEuropeanNumber, formatEuropeanPercentage, formatEuropeanPrice } from '../../../../../utils/numberFormatter';
import { getAssetLogo, KRAKEN_ASSETS } from '../../../../../utils/krakenAssets';
import { assetLabelMap, makeOpId } from '../../../../../utils/chartUtils';

const OperationsTable = ({ 
  portfolioData, 
  theme, 
  filters = {}, 
  hiddenAssets = new Set(), 
  excludedOperations = new Set(),
  disabledOps = new Set(),
  showApplyPopup, 
  setShowApplyPopup, 
  startDate, 
  endDate, 
  buttonStartDate, 
  buttonEndDate, 
  setStartDate, 
  setEndDate, 
  onTimelineApplyToAll, 
  showTimelinePopup, 
  showTimelineClickPopup, 
  isInPointClickMode, 
  setIsInPointClickMode, 
  sidebarOpen, 
  timelineUnfreezeTooltipRef, 
  filterSelectedPreset,
  onFilterReset,
  isApplyingFromTimeline,
  onToggleAsset,
  onToggleAllAssets,
  onToggleOperation,
  onToggleAllOperations,
  currency = { symbol: '€', multiplier: 1 },
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'buy' | 'sell'

  useEffect(() => {
    const container = document.getElementById('main-scroll');
    if (!container) return;
    const onScroll = () => setShowScrollTop(container.scrollTop > 400);
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  const fmtDisplay = (dateStr) => {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  // Map frontend asset names to backend asset names (same as AssetLeaderboard)
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

  // Normaliza nombre backend → display (XXBT→BTC, XETH→ETH)
  const getDisplaySymbol = (asset) => assetLabelMap[asset] || asset;

  // Get asset logo
  const getAssetFullName = (assetSymbol) => {
    const display = getDisplaySymbol(assetSymbol);
    return KRAKEN_ASSETS[display]?.name || display;
  };

  // Process operations from timeline data filtered by the selected date range
  const processOperationsData = () => {
    if (!portfolioData?.timeline || portfolioData.timeline.length === 0) {
      return [];
    }

    let operations = [];
    let timelineToProcess = portfolioData.timeline;

    // Filter timeline entries to the selected date range
    if (startDate && endDate) {
      const startDateObj = new Date(startDate + 'T00:00:00');
      const endDateObj = new Date(endDate + 'T23:59:59');
      timelineToProcess = portfolioData.timeline.filter(entry => {
        const entryDate = new Date(entry.date + 'T00:00:00');
        return entryDate >= startDateObj && entryDate <= endDateObj;
      });
    }

    // Extract all operations from filtered timeline
    timelineToProcess.forEach(dayData => {
      const dayOperations = dayData.operations || [];
      dayOperations.forEach(operation => {
        const opId = makeOpId(operation, dayData.date);
        operations.push({
          date: dayData.date,
          asset: operation.asset,
          type: operation.type,
          ordertype: operation.ordertype || '',
          amount: parseFloat(operation.cantidad) || 0,
          cost: parseFloat(operation.cost) || 0,
          fee: parseFloat(operation.fee) || 0,
          price: operation.price ? parseFloat(operation.price) : 0,
          realizedGain: operation.realized_gain ? parseFloat(operation.realized_gain) : null,
          operationKey: operation.operation_key,
          opId,
          timestamp: operation.timestamp || dayData.date
        });
      });
    });

    return operations;
  };

  // Sort operations
  const sortedOperations = useMemo(() => {
    const operations = processOperationsData().filter(op =>
      typeFilter === 'all' || op.type === typeFilter
    );

    if (!sortConfig.key) return operations;

    return [...operations].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle date sorting
      if (sortConfig.key === 'date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [portfolioData, startDate, endDate, hiddenAssetsBackend, excludedOperations, sortConfig, filters, typeFilter]);

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ key, direction });
  };

  // Todos los opId del dataset visible (para toggle all)
  const allVisibleOpIds = useMemo(() => {
    const ops = processOperationsData();
    return ops
      .filter(op => typeFilter === 'all' || op.type === typeFilter)
      .map(op => op.opId);
  }, [portfolioData, startDate, endDate, typeFilter]);

  const toggleAll = () => {
    if (!onToggleAllOperations) return;
    const allDisabledNow = allVisibleOpIds.length > 0 &&
      allVisibleOpIds.every(k => disabledOps.has(k));
    onToggleAllOperations(allVisibleOpIds, allDisabledNow);
  };

  const allIncluded = allVisibleOpIds.length > 0 &&
    !allVisibleOpIds.some(k => disabledOps.has(k));
  const allExcluded = allVisibleOpIds.length > 0 &&
    allVisibleOpIds.every(k => disabledOps.has(k));

  // Cabecera: columna activa en verde, resto en blanco
  const thColor = (key) => sortConfig.key === key ? '#00ff99' : '#ffffff';

  // Flecha de orden — solo para la columna activa, con glow verde
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    // Kraken format: "2024-01-15 12:34:56.1234" — normalizar a ISO para compatibilidad cross-browser
    const normalized = dateString.replace(' ', 'T').split('.')[0];
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const defaultStartDate = portfolioData?.timeline?.[0]?.date ?? '';
  const defaultEndDate   = portfolioData?.timeline?.[portfolioData?.timeline?.length - 1]?.date ?? '';
  const startModified    = startDate && startDate !== defaultStartDate;
  const endModified      = endDate   && endDate   !== defaultEndDate;

  const greenDotStyle = {
    position: 'absolute',
    top: '50%',
    right: '8px',
    transform: 'translateY(-50%)',
    width: '8px',
    height: '8px',
    background: '#00ff88',
    borderRadius: '50%',
    border: '1px solid rgba(15,15,15,0.8)',
    boxShadow: '0 0 8px rgba(0,255,136,0.6)',
    pointerEvents: 'none',
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
      
      {/* Título */}
      <div style={{
        paddingLeft: '60px',
        paddingRight: '60px',
        marginBottom: '0.6rem',
      }}>
        <div style={{
          fontSize: '24px',
          fontWeight: '700',
          color: theme.textPrimary,
          fontFamily: 'monospace',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          Operations History
        </div>
      </div>

      {/* Fechas + columna derecha (i arriba, toggle abajo) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingLeft: '60px',
        paddingRight: '60px',
        marginBottom: '1.5rem',
      }}>
        {/* Badges de fecha — solo visualización */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: startModified ? '4px 22px 4px 10px' : '4px 10px', color: '#ffffff', fontSize: '13px', fontFamily: 'monospace', fontWeight: '600' }}>
            {fmtDisplay(startDate)}
            {startModified && <div style={greenDotStyle} />}
          </div>
          <span style={{ color: '#ffffff', fontSize: '11px', fontFamily: 'monospace', letterSpacing: '1.5px', fontWeight: '600' }}>TO</span>
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: endModified ? '4px 22px 4px 10px' : '4px 10px', color: '#ffffff', fontSize: '13px', fontFamily: 'monospace', fontWeight: '600' }}>
            {fmtDisplay(endDate)}
            {endModified && <div style={greenDotStyle} />}
          </div>
        </div>

        {/* Columna derecha: botón i arriba, toggle abajo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>

        {/* Botón i */}
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
            fontFamily: 'monospace',
            transition: 'all 0.2s ease',
            position: 'relative',
            flexShrink: 0,
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
              top: '26px',
              right: '0',
              backgroundColor: 'rgba(0, 0, 0, 0.95)',
              border: `2px solid ${theme.borderColor}`,
              borderRadius: '0.75rem',
              padding: '1rem',
              minWidth: '260px',
              fontSize: '0.85rem',
              lineHeight: '1.4',
              color: '#ffffff',
              fontFamily: 'monospace',
              backdropFilter: 'blur(10px)',
              zIndex: 10000,
              whiteSpace: 'normal',
            }}>
              <div style={{ fontWeight: '700', marginBottom: '0.5rem' }}>
                Operations History
              </div>
              <div style={{ fontWeight: '400' }}>
                Complete history of all buy and sell operations with detailed information including fees, realized gains, and transaction timestamps.
              </div>
            </div>
          )}
        </div>

        {/* Toggle All / Buy / Sell */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {[
            { key: 'all',  label: 'All',  color: '#ffffff' },
            { key: 'buy',  label: 'Buy',  color: '#00ff88' },
            { key: 'sell', label: 'Sell', color: '#ef4444' },
          ].map(({ key, label, color }) => {
            const active = typeFilter === key;
            return (
              <button
                key={key}
                onClick={() => setTypeFilter(key)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: active ? `2px solid ${color}` : '2px solid transparent',
                  padding: '2px 0 4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  fontWeight: '700',
                  letterSpacing: '1px',
                  color: active ? color : 'rgba(255,255,255,0.3)',
                  transition: 'color 0.15s ease, border-color 0.15s ease',
                  textTransform: 'uppercase',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
              >
                {label}
              </button>
            );
          })}
        </div>

        </div> {/* fin columna derecha */}
      </div>

      <div style={{ background: 'transparent', border: 'none', width: '100%', margin: '0', padding: '0' }}>
        <div style={{
          overflow: 'visible',
          width: 'calc(100% - 120px)',
          marginLeft: '60px',
          marginRight: '60px',
          padding: '0',
          boxSizing: 'border-box'
        }}>
          <table style={{
            width: '100%',
            tableLayout: 'fixed',
            borderCollapse: 'separate',
            borderSpacing: 0,
            margin: 0,
            padding: 0,
            fontSize: '15px',
            fontFamily: 'monospace'
          }}>
            <thead>
              <tr>
                {/* Columna toggle — primera, con botón "toggle all" en cabecera */}
                <th style={{
                  width: '5%',
                  padding: '20px 12px 20px 8px',
                  textAlign: 'center',
                  borderBottom: '1px solid #d0d0d0',
                }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleAll(); }}
                    title={allIncluded ? 'Excluir todos' : 'Incluir todos'}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: allIncluded ? '#00ff99' : allExcluded ? 'rgba(255,255,255,0.25)' : '#f59e0b',
                      transition: 'color 0.15s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.7'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                  >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                      {allIncluded ? (
                        <>
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <path d="M7 12l4 4 6-6" stroke="#000" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </>
                      ) : allExcluded ? (
                        <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
                      ) : (
                        <>
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <path d="M7 12h10" stroke="#000" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
                        </>
                      )}
                    </svg>
                  </button>
                </th>
                {[
                  { key: 'date',         label: 'Date',          align: 'left',   width: '12%' },
                  { key: 'asset',        label: 'Asset',         align: 'left',   width: '15%' },
                  { key: 'type',         label: 'Type',          align: 'center', width: '9%'  },
                  { key: 'amount',       label: 'Amount',        align: 'right',  width: '10%' },
                  { key: 'price',        label: 'Price',         align: 'right',  width: '11%' },
                  { key: 'cost',         label: 'Total Value',   align: 'right',  width: '12%' },
                  { key: 'fee',          label: 'Fee',           align: 'right',  width: '10%' },
                  { key: 'realizedGain', label: 'Realized P&L',  align: 'right',  width: '17%' },
                ].map(({ key, label, align, width }) => (
                  <th
                    key={key}
                    style={{
                      padding: '20px 12px',
                      textAlign: align,
                      color: thColor(key),
                      fontWeight: '700',
                      cursor: 'pointer',
                      userSelect: 'none',
                      fontSize: '14px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                      fontFamily: 'monospace',
                      borderBottom: '1px solid #d0d0d0',
                      transition: 'color 0.15s ease',
                      width,
                    }}
                    onClick={() => handleSort(key)}
                  >
                    {label}{renderSortArrow(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedOperations.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: theme.textSecondary,
                    fontStyle: 'italic'
                  }}>
                    No operations found for the selected period
                  </td>
                </tr>
              ) : (
                sortedOperations.map((operation, index) => {
                    const sym = getDisplaySymbol(operation.asset);
                    const excluded = disabledOps.has(operation.opId);
                    return (
                  <tr
                    key={`${operation.operationKey}-${index}`}
                    onClick={() => onToggleOperation && onToggleOperation(operation.opId)}
                    style={{
                      backgroundColor: 'transparent',
                      opacity: excluded ? 0.18 : 1,
                      filter: excluded ? 'brightness(0.5)' : 'none',
                      animation: `slideInRow 0.3s ease-out ${index * 0.03}s both`,
                      transition: 'background-color 0.2s ease, transform 0.15s ease, opacity 0.2s ease, filter 0.2s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(252,252,252,0.06)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateY(0px)';
                    }}
                  >
                    {/* Toggle incluir/excluir */}
                    <td style={{ padding: '16px 12px 16px 8px', textAlign: 'center' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleOperation && onToggleOperation(operation.opId); }}
                        title={excluded ? `Incluir operación` : `Excluir operación`}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: excluded ? 'rgba(255,255,255,0.25)' : '#00ff99',
                          transition: 'color 0.15s ease',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.7'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                      >
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                          {excluded ? (
                            <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
                          ) : (
                            <>
                              <rect x="3" y="3" width="18" height="18" rx="2"/>
                              <path d="M7 12l4 4 6-6" stroke="#000" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                            </>
                          )}
                        </svg>
                      </button>
                    </td>

                    {/* Date */}
                    <td style={{
                      padding: '16px 12px',
                      color: theme.textSecondary,
                      fontSize: '15px',
                      fontFamily: 'monospace'
                    }}>
                      {formatDate(operation.timestamp)}
                    </td>

                    {/* Asset */}
                    <td style={{ padding: '16px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {getAssetLogo(getDisplaySymbol(operation.asset)) ? (
                          <img
                            src={getAssetLogo(getDisplaySymbol(operation.asset))}
                            alt={getDisplaySymbol(operation.asset)}
                            style={{ width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0 }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div style={{ width: '26px', height: '26px', flexShrink: 0 }} />
                        )}
                        <div>
                          <div style={{ color: theme.textPrimary, fontWeight: '600', fontSize: '15px', fontFamily: 'monospace' }}>
                            {getDisplaySymbol(operation.asset)}
                          </div>
                          <div style={{ color: theme.textSecondary, fontSize: '13px', marginTop: '2px', fontFamily: 'monospace' }}>
                            {getAssetFullName(operation.asset)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Type — "BUY LIMIT" / "SELL MARKET" en una sola etiqueta */}
                    <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                      <span style={{
                        backgroundColor: operation.type === 'buy' ? 'rgba(0, 255, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: operation.type === 'buy' ? '#00FF99' : '#ef4444',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        fontFamily: 'monospace',
                        letterSpacing: '0.5px',
                        whiteSpace: 'nowrap',
                      }}>
                        {operation.type}{operation.ordertype ? ` ${operation.ordertype}` : ''}
                      </span>
                    </td>

                    {/* Amount */}
                    <td style={{
                      padding: '16px 12px',
                      textAlign: 'right',
                      color: theme.textPrimary,
                      fontFamily: 'monospace',
                      fontSize: '15px'
                    }}>
                      {formatEuropeanNumber(operation.amount, 8)} {getDisplaySymbol(operation.asset)}
                    </td>

                    {/* Price */}
                    <td style={{
                      padding: '16px 12px',
                      textAlign: 'right',
                      color: theme.textSecondary,
                      fontFamily: 'monospace',
                      fontSize: '15px'
                    }}>
                      {operation.price > 0 ? formatEuropeanPrice(operation.price * currency.multiplier, currency.symbol) : '-'}
                    </td>

                    {/* Total Value */}
                    <td style={{
                      padding: '16px 12px',
                      textAlign: 'right',
                      color: theme.textPrimary,
                      fontFamily: 'monospace',
                      fontSize: '15px',
                      fontWeight: '600'
                    }}>
                      {formatEuropeanCurrency(operation.cost * currency.multiplier, currency.symbol)}
                    </td>

                    {/* Fee */}
                    <td style={{
                      padding: '16px 12px',
                      textAlign: 'right',
                      color: theme.textSecondary,
                      fontFamily: 'monospace',
                      fontSize: '15px'
                    }}>
                      {formatEuropeanPrice(operation.fee * currency.multiplier, currency.symbol)}
                    </td>

                    {/* Realized P&L */}
                    <td style={{
                      padding: '16px 12px',
                      textAlign: 'right',
                      fontFamily: 'monospace',
                      fontSize: '15px',
                      fontWeight: '600'
                    }}>
                      {operation.realizedGain !== null ? (
                        <span style={{ color: operation.realizedGain >= 0 ? '#00FF99' : '#ef4444' }}>
                          {operation.realizedGain >= 0 ? '+' : ''}{formatEuropeanCurrency(operation.realizedGain * currency.multiplier, currency.symbol)}
                        </span>
                      ) : (
                        <span style={{ color: theme.textSecondary }}>-</span>
                      )}
                    </td>

                  </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {/* Botón scroll to top */}
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
    </>
  );
};

export default OperationsTable;