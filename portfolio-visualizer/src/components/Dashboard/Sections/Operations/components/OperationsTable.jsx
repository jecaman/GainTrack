import { useState, useMemo } from 'react';
import { formatEuropeanCurrency, formatEuropeanNumber, formatEuropeanPercentage } from '../../../../../utils/numberFormatter';
import { getAssetLogo, KRAKEN_ASSETS } from '../../../../../utils/krakenAssets';

const OperationsTable = ({ 
  portfolioData, 
  theme, 
  filters = {}, 
  hiddenAssets = new Set(), 
  excludedOperations = new Set(), 
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
  isApplyingFromTimeline 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

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

  // Get asset logo
  const getAssetFullName = (assetSymbol) => {
    return KRAKEN_ASSETS[assetSymbol]?.name || assetSymbol;
  };

  // Process operations from timeline data with enhanced temporal filtering
  const processOperationsData = () => {
    if (!portfolioData?.timeline || portfolioData.timeline.length === 0) {
      return [];
    }

    let operations = [];
    let timelineToProcess = portfolioData.timeline;
    
    // Apply enhanced date filtering
    const effectiveStartDate = startDate;
    const effectiveEndDate = endDate;
    
    if (effectiveStartDate && effectiveEndDate) {
      const isPointClick = effectiveStartDate === effectiveEndDate || isInPointClickMode;
      const startDateObj = new Date(effectiveStartDate + 'T00:00:00');
      const endDateObj = new Date(effectiveEndDate + 'T23:59:59');
      
      if (isPointClick) {
        // Point-in-time: show all operations up to the selected date
        timelineToProcess = portfolioData.timeline.filter(entry => {
          const entryDate = new Date(entry.date + 'T00:00:00');
          return entryDate <= endDateObj;
        });
      } else {
        // Date range: show only operations within the range
        timelineToProcess = portfolioData.timeline.filter(entry => {
          const entryDate = new Date(entry.date + 'T00:00:00');
          return entryDate >= startDateObj && entryDate <= endDateObj;
        });
      }
    }

    // Extract all operations from timeline
    timelineToProcess.forEach(dayData => {
      const dayOperations = dayData.operations || [];
      dayOperations.forEach(operation => {
        // Skip hidden assets and excluded operations
        if (hiddenAssetsBackend.has(operation.asset) || excludedOperations.has(operation.operation_key)) {
          return;
        }

        operations.push({
          date: dayData.date,
          asset: operation.asset,
          type: operation.type,
          amount: parseFloat(operation.cantidad) || 0,
          cost: parseFloat(operation.cost) || 0,
          fee: parseFloat(operation.fee) || 0,
          price: operation.price ? parseFloat(operation.price) : 0,
          realizedGain: operation.realized_gain ? parseFloat(operation.realized_gain) : null,
          operationKey: operation.operation_key,
          timestamp: operation.timestamp || dayData.date
        });
      });
    });

    return operations;
  };

  // Sort operations
  const sortedOperations = useMemo(() => {
    const operations = processOperationsData();
    
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
  }, [portfolioData, startDate, endDate, hiddenAssetsBackend, excludedOperations, sortConfig, isInPointClickMode, filters]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return (
        <span style={{ 
          color: '#666666', 
          fontSize: '12px', 
          marginLeft: '4px',
          opacity: 0.5
        }}>
          ↕
        </span>
      );
    }
    return (
      <span style={{ 
        color: theme.accentPrimary, 
        fontSize: '12px', 
        marginLeft: '4px'
      }}>
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format date range for display
  const formatDateRange = () => {
    if (!startDate || !endDate) return 'All Operations';
    
    if (startDate === endDate || isInPointClickMode) {
      return `Operations up to ${new Date(endDate).toLocaleDateString('en-GB')}`;
    }
    
    return `Operations: ${new Date(startDate).toLocaleDateString('en-GB')} - ${new Date(endDate).toLocaleDateString('en-GB')}`;
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
      
      {/* Date Range Indicator */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        paddingLeft: '60px',
        paddingRight: '60px'
      }}>
        <div style={{
          fontSize: '24px',
          fontWeight: '700',
          color: theme.textPrimary,
          fontFamily: "'Inter', sans-serif"
        }}>
          Operations History
        </div>
        <div style={{
          fontSize: '14px',
          color: isInPointClickMode ? '#00ff88' : theme.textSecondary,
          fontFamily: "'Inter', sans-serif",
          fontWeight: isInPointClickMode ? '600' : '400'
        }}>
          {formatDateRange()}
        </div>
      </div>
      {/* Botón de información */}
      <div style={{
        position: 'absolute',
        top: '-2px',
        right: '2px',
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
                Operations History
              </div>
              <div style={{ fontWeight: '400' }}>
                Complete history of all buy and sell operations with detailed information including fees, realized gains, and transaction timestamps.
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Contenedor con scroll horizontal y vertical - Alineado exactamente con timeline */}
      <div style={{
        background: 'transparent',
        border: 'none',
        borderRadius: '0',
        overflow: 'hidden',
        width: '100%',
        margin: '0',
        padding: '0'
      }}>
        {/* Tabla con scroll horizontal solamente - Alineada exactamente con timeline */}
        <div style={{
          overflowX: 'auto',
          overflowY: 'visible',
          maxHeight: 'none',
          scrollBehavior: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'auto',
          overscrollBehaviorX: 'auto',
          scrollSnapType: 'none',
          touchAction: 'auto',
          scrollPadding: '10px',
          // MISMOS márgenes que el timeline
          width: 'calc(100% - 120px)',
          marginLeft: '60px',
          marginRight: '60px',
          margin: '0',
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
              backgroundColor: 'rgba(0, 0, 0, 1)',
              backdropFilter: 'none',
              zIndex: 10
            }}>
              <tr>
                <th 
                  style={{ 
                    padding: '20px 12px', 
                    textAlign: 'left', 
                    color: '#ffffff', 
                    fontWeight: '700',
                    cursor: 'pointer',
                    userSelect: 'none',
                    fontSize: '13px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                  }}
                  onClick={() => handleSort('date')}
                  onMouseEnter={(e) => e.target.style.color = '#00ff88'}
                  onMouseLeave={(e) => e.target.style.color = '#ffffff'}
                >
                  Date {getSortIcon('date')}
                </th>
                <th 
                  style={{ 
                    padding: '20px 12px', 
                    textAlign: 'left', 
                    color: '#ffffff', 
                    fontWeight: '700',
                    cursor: 'pointer',
                    userSelect: 'none',
                    fontSize: '13px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                  }}
                  onClick={() => handleSort('asset')}
                  onMouseEnter={(e) => e.target.style.color = '#00ff88'}
                  onMouseLeave={(e) => e.target.style.color = '#ffffff'}
                >
                  Asset {getSortIcon('asset')}
                </th>
                <th 
                  style={{ 
                    padding: '20px 12px', 
                    textAlign: 'center', 
                    color: '#ffffff', 
                    fontWeight: '700',
                    cursor: 'pointer',
                    userSelect: 'none',
                    fontSize: '13px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                  }}
                  onClick={() => handleSort('type')}
                  onMouseEnter={(e) => e.target.style.color = '#00ff88'}
                  onMouseLeave={(e) => e.target.style.color = '#ffffff'}
                >
                  Type {getSortIcon('type')}
                </th>
                <th 
                  style={{ 
                    padding: '20px 12px', 
                    textAlign: 'right', 
                    color: '#ffffff', 
                    fontWeight: '700',
                    cursor: 'pointer',
                    userSelect: 'none',
                    fontSize: '13px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                  }}
                  onClick={() => handleSort('amount')}
                  onMouseEnter={(e) => e.target.style.color = '#00ff88'}
                  onMouseLeave={(e) => e.target.style.color = '#ffffff'}
                >
                  Amount {getSortIcon('amount')}
                </th>
                <th 
                  style={{ 
                    padding: '20px 12px', 
                    textAlign: 'right', 
                    color: '#ffffff', 
                    fontWeight: '700',
                    cursor: 'pointer',
                    userSelect: 'none',
                    fontSize: '13px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                  }}
                  onClick={() => handleSort('price')}
                  onMouseEnter={(e) => e.target.style.color = '#00ff88'}
                  onMouseLeave={(e) => e.target.style.color = '#ffffff'}
                >
                  Price {getSortIcon('price')}
                </th>
                <th 
                  style={{ 
                    padding: '20px 12px', 
                    textAlign: 'right', 
                    color: '#ffffff', 
                    fontWeight: '700',
                    cursor: 'pointer',
                    userSelect: 'none',
                    fontSize: '13px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                  }}
                  onClick={() => handleSort('cost')}
                  onMouseEnter={(e) => e.target.style.color = '#00ff88'}
                  onMouseLeave={(e) => e.target.style.color = '#ffffff'}
                >
                  Total Value {getSortIcon('cost')}
                </th>
                <th 
                  style={{ 
                    padding: '20px 12px', 
                    textAlign: 'right', 
                    color: '#ffffff', 
                    fontWeight: '700',
                    cursor: 'pointer',
                    userSelect: 'none',
                    fontSize: '13px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                  }}
                  onClick={() => handleSort('fee')}
                  onMouseEnter={(e) => e.target.style.color = '#00ff88'}
                  onMouseLeave={(e) => e.target.style.color = '#ffffff'}
                >
                  Fee {getSortIcon('fee')}
                </th>
                <th 
                  style={{ 
                    padding: '20px 12px', 
                    textAlign: 'right', 
                    color: '#ffffff', 
                    fontWeight: '700',
                    cursor: 'pointer',
                    userSelect: 'none',
                    fontSize: '13px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                  }}
                  onClick={() => handleSort('realizedGain')}
                  onMouseEnter={(e) => e.target.style.color = '#00ff88'}
                  onMouseLeave={(e) => e.target.style.color = '#ffffff'}
                >
                  Realized P&L {getSortIcon('realizedGain')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedOperations.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: theme.textSecondary,
                    fontStyle: 'italic'
                  }}>
                    No operations found for the selected period
                  </td>
                </tr>
              ) : (
                sortedOperations.map((operation, index) => (
                  <tr 
                    key={`${operation.operationKey}-${index}`}
                    style={{
                      backgroundColor: 'transparent',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      animation: `slideInRow 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.05}s backwards`,
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {/* Date */}
                    <td style={{ 
                      padding: '16px 12px', 
                      color: theme.textSecondary,
                      fontSize: '14px',
                      fontFamily: 'monospace'
                    }}>
                      {formatDate(operation.date)}
                    </td>
                    
                    {/* Asset */}
                    <td style={{ padding: '16px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img 
                          src={getAssetLogo(operation.asset)} 
                          alt={operation.asset}
                          style={{ 
                            width: '24px', 
                            height: '24px', 
                            borderRadius: '50%',
                            flexShrink: 0 
                          }}
                        />
                        <div>
                          <div style={{ 
                            color: theme.textPrimary, 
                            fontWeight: '600',
                            fontSize: '14px'
                          }}>
                            {operation.asset}
                          </div>
                          <div style={{ 
                            color: theme.textSecondary, 
                            fontSize: '12px',
                            marginTop: '2px'
                          }}>
                            {getAssetFullName(operation.asset)}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Type */}
                    <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                      <span style={{
                        backgroundColor: operation.type === 'buy' ? 'rgba(0, 255, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: operation.type === 'buy' ? '#00FF99' : '#ef4444',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {operation.type}
                      </span>
                    </td>
                    
                    {/* Amount */}
                    <td style={{ 
                      padding: '16px 12px', 
                      textAlign: 'right',
                      color: theme.textPrimary,
                      fontFamily: 'monospace',
                      fontSize: '14px'
                    }}>
                      {formatEuropeanNumber(operation.amount, 8)} {operation.asset}
                    </td>
                    
                    {/* Price */}
                    <td style={{ 
                      padding: '16px 12px', 
                      textAlign: 'right',
                      color: theme.textSecondary,
                      fontFamily: 'monospace',
                      fontSize: '14px'
                    }}>
                      {operation.price > 0 ? formatEuropeanCurrency(operation.price) : '-'}
                    </td>
                    
                    {/* Total Value */}
                    <td style={{ 
                      padding: '16px 12px', 
                      textAlign: 'right',
                      color: theme.textPrimary,
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      {formatEuropeanCurrency(operation.cost)}
                    </td>
                    
                    {/* Fee */}
                    <td style={{ 
                      padding: '16px 12px', 
                      textAlign: 'right',
                      color: theme.textSecondary,
                      fontFamily: 'monospace',
                      fontSize: '14px'
                    }}>
                      {formatEuropeanCurrency(operation.fee)}
                    </td>
                    
                    {/* Realized P&L */}
                    <td style={{ 
                      padding: '16px 12px', 
                      textAlign: 'right',
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      {operation.realizedGain !== null ? (
                        <span style={{
                          color: operation.realizedGain >= 0 ? '#00FF99' : '#ef4444'
                        }}>
                          {operation.realizedGain >= 0 ? '+' : ''}{formatEuropeanCurrency(operation.realizedGain)}
                        </span>
                      ) : (
                        <span style={{ color: theme.textSecondary }}>-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </>
  );
};

export default OperationsTable;