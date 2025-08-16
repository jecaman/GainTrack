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
        {/* Tabla con scroll horizontal y vertical con efecto rebote */}
        <div style={{
          overflowX: 'auto',
          overflowY: 'scroll',
          maxHeight: '1200px', // Altura para mostrar hasta 10 filas + header
          scrollBehavior: 'auto', // Scroll normal para mejor control
          overscrollBehavior: 'auto', // Permite over-scroll con efecto rebote natural
          WebkitOverflowScrolling: 'touch', // Scroll suave en dispositivos táctiles
          // Propiedades específicas para efecto rebote
          overscrollBehaviorY: 'auto', // Permite rebote vertical
          overscrollBehaviorX: 'auto', // Permite rebote horizontal
          // Asegurar que siempre se pueda hacer scroll
          scrollSnapType: 'none', // Desactiva snap scrolling para permitir scroll libre
          touchAction: 'auto', // Permite todos los gestos táctiles
          // Reducir sensibilidad del scroll
          scrollPadding: '10px',
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
                    textAlign: 'left', // Alineado a la izquierda para coincidir con el inicio de la barra
                    paddingLeft: '5px', // Reducido para mover el header un poco más a la derecha
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
                  Portfolio Allocation{renderSortArrow('portfolioPercent')}
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
                  Value{renderSortArrow('fiatValue')}
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
                  Price{renderSortArrow('marketPrice')}
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
                  Average Cost{renderSortArrow('avgCost')}
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
                  onClick={() => handleSort('costBasis')}
                >
                  Cost Basis{renderSortArrow('costBasis')}
                </th>
                <th 
                  style={{ 
                    padding: '20px 6px', 
                    textAlign: 'right', 
                    color: '#e5e5e5', 
                    fontWeight: '700', 
                    borderBottom: `1px solid #d0d0d0`, 
                    fontSize: '16px', 
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
                    padding: '20px 35px 20px 20px', // Más padding derecho para separar de scrollbar
                    textAlign: 'right', 
                    color: '#e5e5e5', 
                    fontWeight: '700', 
                    borderBottom: `1px solid #d0d0d0`, 
                    fontSize: '16px', 
                    minWidth: '120px', // Un poco más ancho
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
              {processedData.map((row, index) => (
                <tr key={`${row.asset}-${sortConfig.key}-${sortConfig.direction}`} style={{
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  backgroundColor: 'transparent',
                  transform: 'translateY(0px)',
                  opacity: 1,
                  animation: `slideInRow 0.3s ease-out ${index * 0.05}s both`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
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
                        onLoad={(e) => {
                          console.log(`✅ Logo loaded for ${row.nativeSymbol}`);
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '38px',
                        height: '38px',
                        flexShrink: 0
                      }} />
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
                    {/* Barra de progreso integrada con el porcentaje - todas empiezan a la misma altura */}
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      {/* Contenedor de la barra más largo */}
                      <div style={{
                        position: 'relative',
                        width: '120px', // Barra más larga
                        height: '12px', // Un poco más alta
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        marginRight: '12px' // Separación del porcentaje
                      }}>
                        {/* Barra de progreso */}
                        <div style={{
                          width: `${Math.min(row.portfolioPercent, 100)}%`,
                          height: '100%',
                          backgroundColor: getAssetColor(row.nativeSymbol),
                          borderRadius: '6px',
                          opacity: 0.9
                        }} />
                      </div>
                      {/* Porcentaje pegado a la barra */}
                      <span style={{ 
                        fontSize: '18px',
                        fontWeight: '400',
                        minWidth: '55px',
                        textAlign: 'left',
                        flexShrink: 0 // No se encoge
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
                    {formatEuropeanCurrency(row.marketPrice)}
                  </td>
                  <td style={{ 
                    padding: '24px 4px', 
                    textAlign: 'right', 
                    color: theme.textPrimary, 
                    fontSize: '18px', 
                    fontWeight: '400', 
                    borderBottom: `1px solid rgba(255, 255, 255, 0.2)` 
                  }}>
                    {formatEuropeanCurrency(row.avgCost)}
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
                        fontSize: '19px', // Aumentado de 17px a 19px
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
                    padding: '24px 35px 24px 8px', // Más padding derecho para separar de scrollbar
                    textAlign: 'right', 
                    color: row.netProfit >= 0 ? '#00FF99' : '#ef4444', 
                    fontSize: '18px', // Mismo tamaño que el resto de números
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </>
  );
};

export default AssetLeaderboard;