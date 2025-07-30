import { assetLabelMap } from '../../../utils/chartUtils';

const AssetLeaderboard = ({ portfolioData, theme }) => {
  const getFiatSymbol = () => '€';

  // Process portfolio data for leaderboard
  const processPortfolioData = () => {
    if (!portfolioData?.portfolio_data) return [];

    const totalPortfolioValue = portfolioData.portfolio_data.reduce((sum, asset) => sum + (asset.current_value || 0), 0);
    
    return portfolioData.portfolio_data
      .filter(asset => (asset.current_value || 0) > 0.5) // Filter very small assets
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
          nativeValue: asset.amount || 0,
          nativeSymbol: asset.asset,
          netProfit: netProfit,
          netProfitPercent: netProfitPercent,
          realizedGains: realizedGains,
          unrealizedGains: unrealizedGains,
          originalAsset: asset
        };
      })
      .sort((a, b) => b.fiatValue - a.fiatValue); // Sort by total value descending
  };

  const processedData = processPortfolioData();
  const symbol = getFiatSymbol();

  return (
    <div style={{
      backgroundColor: theme.bgContainer,
      borderRadius: '12px',
      border: `1px solid ${theme.borderColor}`,
      padding: '16px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: '300px'
    }}>
      <h3 style={{
        color: theme.textPrimary,
        fontFamily: "'Inter', sans-serif",
        fontSize: '16px',
        fontWeight: '600',
        margin: '0 0 16px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        🏆 Asset Leaderboard
      </h3>
      
      <div style={{
        overflow: 'auto',
        flex: 1,
        maxHeight: '240px'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: "'Inter', sans-serif",
          fontSize: '11px'
        }}>
          <thead style={{
            position: 'sticky',
            top: 0,
            backgroundColor: theme.bgContainer,
            zIndex: 1
          }}>
            <tr>
              <th style={{ padding: '8px 4px', textAlign: 'left', color: theme.textSecondary, fontWeight: '500', borderBottom: `1px solid ${theme.borderColor}` }}>Asset</th>
              <th style={{ padding: '8px 4px', textAlign: 'right', color: theme.textSecondary, fontWeight: '500', borderBottom: `1px solid ${theme.borderColor}` }}>%</th>
              <th style={{ padding: '8px 4px', textAlign: 'right', color: theme.textSecondary, fontWeight: '500', borderBottom: `1px solid ${theme.borderColor}` }}>Valor</th>
              <th style={{ padding: '8px 4px', textAlign: 'right', color: theme.textSecondary, fontWeight: '500', borderBottom: `1px solid ${theme.borderColor}` }}>Cantidad</th>
              <th style={{ padding: '8px 4px', textAlign: 'right', color: theme.textSecondary, fontWeight: '500', borderBottom: `1px solid ${theme.borderColor}` }}>Net P&L</th>
              <th style={{ padding: '8px 4px', textAlign: 'right', color: theme.textSecondary, fontWeight: '500', borderBottom: `1px solid ${theme.borderColor}` }}>%</th>
            </tr>
          </thead>
          <tbody>
            {processedData.map((row, index) => (
              <tr key={row.asset} style={{
                borderBottom: `1px solid ${theme.borderColor}20`,
                transition: 'background-color 0.2s ease'
              }}>
                <td style={{ padding: '6px 4px', color: theme.accentPrimary, fontWeight: '500' }}>
                  {row.asset}
                </td>
                <td style={{ padding: '6px 4px', textAlign: 'right', color: theme.textPrimary }}>
                  {row.portfolioPercent.toFixed(1)}%
                </td>
                <td style={{ padding: '6px 4px', textAlign: 'right', color: theme.textPrimary }}>
                  {symbol}{row.fiatValue.toFixed(0)}
                </td>
                <td style={{ padding: '6px 4px', textAlign: 'right', color: theme.textSecondary, fontSize: '10px' }}>
                  {row.nativeValue.toFixed(2)}
                </td>
                <td style={{ 
                  padding: '6px 4px', 
                  textAlign: 'right', 
                  color: row.netProfit >= 0 ? theme.greenPrimary : theme.redPrimary,
                  fontWeight: '500'
                }}>
                  {row.netProfit >= 0 ? '+' : ''}{symbol}{row.netProfit.toFixed(0)}
                </td>
                <td style={{ 
                  padding: '6px 4px', 
                  textAlign: 'right', 
                  color: row.netProfitPercent >= 0 ? theme.greenPrimary : theme.redPrimary,
                  fontWeight: '500'
                }}>
                  {row.netProfitPercent >= 0 ? '+' : ''}{row.netProfitPercent.toFixed(1)}%
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