import { useState } from 'react';
import { assetLabelMap } from '../../../../../utils/chartUtils';
import { formatEuropeanNumber, formatEuropeanCurrency, formatEuropeanPercentage } from '../../../../../utils/numberFormatter';

const AssetLeaderboard = ({ portfolioData, theme }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'portfolioPercent', direction: 'desc' });
  const getFiatSymbol = () => '€';

  // Process portfolio data for leaderboard
  const processPortfolioData = () => {
    if (!portfolioData?.portfolio_data) return [];

    const totalPortfolioValue = portfolioData.portfolio_data.reduce((sum, asset) => sum + (asset.current_value || 0), 0);
    
    return portfolioData.portfolio_data
      // Removemos el filtro para mostrar incluso assets con 0 valor
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
          marketPrice: (asset.current_value || 0) / (asset.amount || 1), // Precio por unidad
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
      backgroundColor: 'transparent', // Invisible
      border: 'none', // Sin borde
      padding: '0', // Sin padding interno
      margin: '0 0 1rem 1rem', // Reducir margen izquierdo para ganar más espacio
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: 'fit-content',
      minHeight: 'auto',
      transform: 'translateY(-8px)', // Subir 7 pixeles
      width: 'calc(100% - 1rem)', // Ancho completo menos el margen izquierdo
      position: 'relative' // Para posicionar el botón de info
    }}>
      
      {/* Botón de información */}
      <div style={{
        position: 'absolute',
        top: '6px',
        right: '7px',
        zIndex: 1000
      }}>
        <div 
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: '#666666',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '10px',
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
                Detailed breakdown of your cryptocurrency holdings sorted by portfolio value, showing market performance and profit analysis for each asset.
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div style={{
        overflow: 'visible',
        maxHeight: '300px', // Permitir que llegue más abajo
        overflowY: 'auto' // Scroll si hay muchos assets
      }}>
        <table style={{
          width: '100%', // Expandir tabla al máximo
          borderCollapse: 'separate',
          borderSpacing: '0', // Sin spacing para evitar gaps
          fontFamily: "'Inter', sans-serif",
          fontSize: '14px', // Fuente más pequeña
          borderTopLeftRadius: '0.75rem',
          borderTopRightRadius: '0.75rem',
          overflow: 'hidden'
        }}>
          <thead style={{
            position: 'sticky',
            top: 0,
            backgroundColor: theme.bgContainer,
            zIndex: 1
          }}>
            <tr>
              <th 
                style={{ padding: '20px 85px 20px 30px', textAlign: 'left', color: 'white', fontWeight: '600', borderBottom: `2px solid ${theme.borderColor}`, fontSize: '16px', width: '18%', borderTopLeftRadius: '0.75rem', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('asset')}
              >
                Asset{renderSortArrow('asset')}
              </th>
              <th 
                style={{ padding: '20px 8px', textAlign: 'right', color: 'white', fontWeight: '600', borderBottom: `2px solid ${theme.borderColor}`, fontSize: '16px', width: '13%', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('marketPrice')}
              >
                Market Price{renderSortArrow('marketPrice')}
              </th>
              <th 
                style={{ padding: '20px 8px', textAlign: 'right', color: 'white', fontWeight: '600', borderBottom: `2px solid ${theme.borderColor}`, fontSize: '16px', width: '13%', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('portfolioPercent')}
              >
                Portfolio %{renderSortArrow('portfolioPercent')}
              </th>
              <th 
                style={{ padding: '20px 8px', textAlign: 'right', color: 'white', fontWeight: '600', borderBottom: `2px solid ${theme.borderColor}`, fontSize: '16px', width: '13%', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('fiatValue')}
              >
                Value{renderSortArrow('fiatValue')}
              </th>
              <th 
                style={{ padding: '20px 8px', textAlign: 'right', color: 'white', fontWeight: '600', borderBottom: `2px solid ${theme.borderColor}`, fontSize: '16px', width: '13%', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('nativeValue')}
              >
                Holdings{renderSortArrow('nativeValue')}
              </th>
              <th 
                style={{ padding: '20px 8px', textAlign: 'right', color: 'white', fontWeight: '600', borderBottom: `2px solid ${theme.borderColor}`, fontSize: '16px', width: '12%', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('netProfit')}
              >
                Net P&L{renderSortArrow('netProfit')}
              </th>
              <th 
                style={{ padding: '20px 35px 20px 8px', textAlign: 'right', color: 'white', fontWeight: '600', borderBottom: `2px solid ${theme.borderColor}`, fontSize: '16px', width: '13%', borderTopRightRadius: '0.75rem', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('netProfitPercent')}
              >
                P&L %{renderSortArrow('netProfitPercent')}
              </th>
            </tr>
          </thead>
          <tbody>
            {processedData.map((row, index) => (
              <tr key={row.asset} style={{
                transition: 'background-color 0.2s ease'
              }}>
                <td style={{ padding: '12px 85px 12px 30px', color: theme.accentPrimary, fontWeight: '500', fontSize: '15px', borderBottom: `1px solid rgba(255, 255, 255, 0.3)` }}>
                  {row.asset}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: theme.textPrimary, fontSize: '15px', fontWeight: '500', borderBottom: `1px solid rgba(255, 255, 255, 0.3)` }}>
                  {formatEuropeanCurrency(row.fiatValue / row.nativeValue)}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: theme.textPrimary, fontSize: '15px', fontWeight: '500', borderBottom: `1px solid rgba(255, 255, 255, 0.3)` }}>
                  {formatEuropeanPercentage(row.portfolioPercent)}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: theme.textPrimary, fontSize: '15px', fontWeight: '500', borderBottom: `1px solid rgba(255, 255, 255, 0.3)` }}>
                  {formatEuropeanCurrency(row.fiatValue)}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: theme.textPrimary, fontSize: '15px', fontWeight: '500', borderBottom: `1px solid rgba(255, 255, 255, 0.3)` }}>
                  {formatEuropeanNumber(row.nativeValue, 6)}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: row.netProfit >= 0 ? '#00FF99' : '#ef4444', fontSize: '15px', fontWeight: '500', borderBottom: `1px solid rgba(255, 255, 255, 0.3)` }}>
                  {row.netProfit >= 0 ? '+' : ''}{formatEuropeanCurrency(row.netProfit)}
                </td>
                <td style={{ padding: '12px 35px', textAlign: 'right', color: row.netProfit >= 0 ? '#22c55e' : '#dc2626', fontSize: '15px', fontWeight: '500', borderBottom: `1px solid rgba(255, 255, 255, 0.3)` }}>
                  {row.netProfitPercent >= 0 ? '+' : ''}{formatEuropeanPercentage(row.netProfitPercent)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssetLeaderboard;