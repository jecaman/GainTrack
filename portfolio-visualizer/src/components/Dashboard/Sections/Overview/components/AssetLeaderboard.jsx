import { useState } from 'react';
import { assetLabelMap } from '../../../../../utils/chartUtils';
import { formatEuropeanNumber, formatEuropeanCurrency, formatEuropeanPercentage } from '../../../../../utils/numberFormatter';
import { getAssetLogo, KRAKEN_ASSETS } from '../../../../../utils/krakenAssets';

const AssetLeaderboard = ({ portfolioData, theme }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'portfolioPercent', direction: 'desc' });
  const getFiatSymbol = () => '€';

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

  // Process portfolio data for leaderboard
  const processPortfolioData = () => {
    if (!portfolioData?.portfolio_data) return [];

    const totalPortfolioValue = portfolioData.portfolio_data.reduce((sum, asset) => sum + (asset.current_value || 0), 0);
    
    return portfolioData.portfolio_data
      .map(asset => {
        // Use the new fields from backend
        const realizedGains = asset.realized_gains || 0;
        const unrealizedGains = asset.unrealized_gains || 0;
        const netProfit = asset.net_profit || (realizedGains + unrealizedGains);
        const netProfitPercent = asset.net_profit_percent || 0;
        
        return {
          asset: assetLabelMap[asset.asset] || asset.asset,
          portfolioPercent: totalPortfolioValue > 0 ? ((asset.current_value || 0) / totalPortfolioValue * 100) : 0,
          fiatValue: asset.current_value || 0,
          marketPrice: asset.current_price || 0, // Precio actual de mercado
          avgCost: (asset.amount || 0) > 0 ? (asset.total_invested || 0) / (asset.amount || 0) : 0, // Precio medio de compra
          nativeValue: asset.amount || 0,
          nativeSymbol: asset.asset,
          netProfit: netProfit,
          netProfitPercent: netProfitPercent,
          realizedGains: realizedGains,
          unrealizedGains: unrealizedGains,
          originalAsset: asset
        };
      })
      .sort((a, b) => {
        // Apply current sort configuration
        const { key, direction } = sortConfig;
        let aValue = a[key];
        let bValue = b[key];
        
        // Handle string sorting for asset names
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
  };

  const processedData = processPortfolioData();
  const symbol = getFiatSymbol();

  // Handle column sorting
  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  // Render sort arrow
  const renderSortArrow = (columnKey) => {
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

  return (
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
                Asset Leaderboard
              </div>
              <div style={{ fontWeight: '400' }}>
                Comprehensive portfolio breakdown with market prices, average costs, and detailed P&L analysis for each asset including realized and unrealized gains.
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Contenedor con scroll horizontal y vertical */}
      <div style={{
        background: 'transparent',
        border: 'none',
        borderRadius: '0',
        overflow: 'hidden'
      }}>
        {/* Tabla con scroll horizontal */}
        <div style={{
          overflowX: 'auto',
          overflowY: 'auto',
          maxHeight: '580px', // Altura aumentada para llegar debajo del header
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
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              zIndex: 10
            }}>
              <tr>
                <th 
                  style={{ 
                    padding: '20px 12px', 
                    textAlign: 'left', 
                    color: '#e5e5e5', 
                    fontWeight: '700', 
                    borderBottom: `1px solid #d0d0d0`, 
                    fontSize: '17px', 
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
                    textAlign: 'right', 
                    color: '#e5e5e5', 
                    fontWeight: '700', 
                    borderBottom: `1px solid #d0d0d0`, 
                    fontSize: '16px', 
                    minWidth: '100px',
                    cursor: 'pointer', 
                    userSelect: 'none' 
                  }}
                  onClick={() => handleSort('portfolioPercent')}
                >
                  Portfolio %{renderSortArrow('portfolioPercent')}
                </th>
                <th 
                  style={{ 
                    padding: '20px 6px', 
                    textAlign: 'right', 
                    color: '#e5e5e5', 
                    fontWeight: '700', 
                    borderBottom: `1px solid #d0d0d0`, 
                    fontSize: '16px', 
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
                    color: '#e5e5e5', 
                    fontWeight: '700', 
                    borderBottom: `1px solid #d0d0d0`, 
                    fontSize: '16px', 
                    minWidth: '110px',
                    cursor: 'pointer', 
                    userSelect: 'none' 
                  }}
                  onClick={() => handleSort('marketPrice')}
                >
                  Current Price{renderSortArrow('marketPrice')}
                </th>
                <th 
                  style={{ 
                    padding: '20px 6px', 
                    textAlign: 'right', 
                    color: '#e5e5e5', 
                    fontWeight: '700', 
                    borderBottom: `1px solid #d0d0d0`, 
                    fontSize: '16px', 
                    minWidth: '100px',
                    cursor: 'pointer', 
                    userSelect: 'none' 
                  }}
                  onClick={() => handleSort('avgCost')}
                >
                  Avg Cost{renderSortArrow('avgCost')}
                </th>
                <th 
                  style={{ 
                    padding: '20px 6px', 
                    textAlign: 'right', 
                    color: '#e5e5e5', 
                    fontWeight: '700', 
                    borderBottom: `1px solid #d0d0d0`, 
                    fontSize: '16px', 
                    minWidth: '110px',
                    cursor: 'pointer', 
                    userSelect: 'none' 
                  }}
                  onClick={() => handleSort('fiatValue')}
                >
                  Current Value{renderSortArrow('fiatValue')}
                </th>
                <th 
                  style={{ 
                    padding: '20px 6px', 
                    textAlign: 'right', 
                    color: '#e5e5e5', 
                    fontWeight: '700', 
                    borderBottom: `1px solid #d0d0d0`, 
                    fontSize: '16px', 
                    minWidth: '120px',
                    cursor: 'pointer', 
                    userSelect: 'none' 
                  }}
                  onClick={() => handleSort('realizedGains')}
                >
                  Realized P&L{renderSortArrow('realizedGains')}
                </th>
                <th 
                  style={{ 
                    padding: '20px 6px', 
                    textAlign: 'right', 
                    color: '#e5e5e5', 
                    fontWeight: '700', 
                    borderBottom: `1px solid #d0d0d0`, 
                    fontSize: '16px', 
                    minWidth: '130px',
                    cursor: 'pointer', 
                    userSelect: 'none' 
                  }}
                  onClick={() => handleSort('unrealizedGains')}
                >
                  Unrealized P&L{renderSortArrow('unrealizedGains')}
                </th>
                <th 
                  style={{ 
                    padding: '20px 6px', 
                    textAlign: 'right', 
                    color: '#e5e5e5', 
                    fontWeight: '700', 
                    borderBottom: `1px solid #d0d0d0`, 
                    fontSize: '16px', 
                    minWidth: '100px',
                    cursor: 'pointer', 
                    userSelect: 'none' 
                  }}
                  onClick={() => handleSort('netProfit')}
                >
                  Total P&L{renderSortArrow('netProfit')}
                </th>
                <th 
                  style={{ 
                    padding: '20px 20px', 
                    textAlign: 'right', 
                    color: '#e5e5e5', 
                    fontWeight: '700', 
                    borderBottom: `1px solid #d0d0d0`, 
                    fontSize: '16px', 
                    minWidth: '100px',
                    cursor: 'pointer', 
                    userSelect: 'none',
                    borderTopRightRadius: '0'
                  }}
                  onClick={() => handleSort('netProfitPercent')}
                >
                  P&L %{renderSortArrow('netProfitPercent')}
                </th>
              </tr>
            </thead>
            <tbody>
              {processedData.map((row, index) => (
                <tr key={row.asset} style={{
                  transition: 'all 0.2s ease',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                >
                  <td style={{ 
                    padding: '18px 12px', 
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
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          flexShrink: 0
                        }}
                        onError={(e) => {
                          console.log(`❌ Error loading logo for ${row.nativeSymbol}:`, e.target.src);
                          e.target.style.display = 'none';
                        }}
                        onLoad={(e) => {
                          console.log(`✅ Logo loaded for ${row.nativeSymbol}`);
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '28px',
                        height: '28px',
                        flexShrink: 0
                      }} />
                    )}
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '17px', fontWeight: '700' }}>{row.asset}</span>
                        <span style={{ 
                          fontSize: '15px', 
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
                    padding: '18px 2px 18px 4px', 
                    textAlign: 'right', 
                    color: theme.textPrimary, 
                    fontSize: '16px', 
                    fontWeight: '400', 
                    borderBottom: `1px solid rgba(255, 255, 255, 0.2)`,
                    position: 'relative',
                    minWidth: '120px'
                  }}>
                    {/* Barra de progreso visual para el porcentaje */}
                    <div style={{
                      position: 'absolute',
                      left: '-10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '120px', // Más ancha y centrada
                      height: '8px', // Más gruesa
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      zIndex: 0
                    }} />
                    <div style={{
                      position: 'absolute',
                      left: '-10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: `${Math.min(row.portfolioPercent, 100) * 1.2}px`, // Máximo 120px (100%)
                      height: '8px', // Más gruesa
                      backgroundColor: getAssetColor(row.nativeSymbol),
                      borderRadius: '4px',
                      opacity: 0.8, // Mucho más visible
                      zIndex: 0
                    }} />
                    <span style={{ position: 'relative', zIndex: 1, marginLeft: '115px' }}>
                      {formatEuropeanPercentage(row.portfolioPercent)}
                    </span>
                  </td>
                  <td style={{ 
                    padding: '18px 4px', 
                    textAlign: 'right', 
                    color: theme.textPrimary, 
                    fontSize: '16px', 
                    fontWeight: '400', 
                    borderBottom: `1px solid rgba(255, 255, 255, 0.2)` 
                  }}>
                    {formatEuropeanNumber(row.nativeValue, 6)}
                  </td>
                  <td style={{ 
                    padding: '18px 4px', 
                    textAlign: 'right', 
                    color: theme.textPrimary, 
                    fontSize: '16px', 
                    fontWeight: '400', 
                    borderBottom: `1px solid rgba(255, 255, 255, 0.2)` 
                  }}>
                    {formatEuropeanCurrency(row.marketPrice)}
                  </td>
                  <td style={{ 
                    padding: '18px 4px', 
                    textAlign: 'right', 
                    color: theme.textPrimary, 
                    fontSize: '16px', 
                    fontWeight: '400', 
                    borderBottom: `1px solid rgba(255, 255, 255, 0.2)` 
                  }}>
                    {formatEuropeanCurrency(row.avgCost)}
                  </td>
                  <td style={{ 
                    padding: '18px 4px', 
                    textAlign: 'right', 
                    color: theme.textPrimary, 
                    fontSize: '16px', 
                    fontWeight: '700', 
                    borderBottom: `1px solid rgba(255, 255, 255, 0.2)` 
                  }}>
                    {formatEuropeanCurrency(row.fiatValue)}
                  </td>
                  <td style={{ 
                    padding: '18px 4px', 
                    textAlign: 'right', 
                    color: row.realizedGains >= 0 ? '#00FF99' : '#ef4444', 
                    fontSize: '16px', 
                    fontWeight: '400', 
                    borderBottom: `1px solid rgba(255, 255, 255, 0.2)` 
                  }}>
                    {row.realizedGains >= 0 ? '+' : ''}{formatEuropeanCurrency(row.realizedGains)}
                  </td>
                  <td style={{ 
                    padding: '18px 4px', 
                    textAlign: 'right', 
                    color: row.unrealizedGains >= 0 ? '#00FF99' : '#ef4444', 
                    fontSize: '16px', 
                    fontWeight: '400', 
                    borderBottom: `1px solid rgba(255, 255, 255, 0.2)` 
                  }}>
                    {row.unrealizedGains >= 0 ? '+' : ''}{formatEuropeanCurrency(row.unrealizedGains)}
                  </td>
                  <td style={{ 
                    padding: '18px 4px', 
                    textAlign: 'right', 
                    color: row.netProfit >= 0 ? '#00FF99' : '#ef4444', 
                    fontSize: '16px', 
                    fontWeight: '700', 
                    borderBottom: `1px solid rgba(255, 255, 255, 0.2)` 
                  }}>
                    {row.netProfit >= 0 ? '+' : ''}{formatEuropeanCurrency(row.netProfit)}
                  </td>
                  <td style={{ 
                    padding: '20px 8px', 
                    textAlign: 'right', 
                    color: row.netProfit >= 0 ? '#00FF99' : '#ef4444', 
                    fontSize: '16px', 
                    fontWeight: '700', 
                    fontStyle: 'italic', 
                    borderBottom: `1px solid rgba(255, 255, 255, 0.2)` 
                  }}>
                    {row.netProfitPercent >= 0 ? '+' : ''}{formatEuropeanPercentage(row.netProfitPercent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AssetLeaderboard;