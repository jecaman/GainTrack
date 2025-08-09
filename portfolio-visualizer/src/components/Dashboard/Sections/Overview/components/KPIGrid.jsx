import { useState } from 'react';
import { formatEuropeanCurrency, formatEuropeanPercentage } from '../../../../../utils/numberFormatter';

// KPI Card Component
const KPICard = ({ label, value, changePercent, isPositive, theme, showChange = false, tooltip = null }) => {
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  
  return (
    <div 
      style={{
        background: theme.bg,
        borderRadius: '0.75rem',
        padding: '1.25rem',
        border: `2px solid ${theme.borderColor}`,
        boxShadow: 'inset 0 0 10px rgba(0, 255, 136, 0.05)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'visible',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        width: '240px',
        height: '120px'
      }}
      onMouseEnter={(e) => {
        setIsCardHovered(true);
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = '#00ff88';
        e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 136, 0.2), inset 0 0 15px rgba(0, 255, 136, 0.05)';
        e.currentTarget.style.background = 'rgba(0, 255, 136, 0.03)';
        
        const label = e.currentTarget.querySelector('[data-kpi-label]');
        if (label) {
          label.style.color = '#ffffff';
          label.style.fontWeight = '700';
          label.style.textShadow = '0 0 8px rgba(0, 255, 136, 0.6)';
        }
      }}
      onMouseLeave={(e) => {
        setIsCardHovered(false);
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = theme.borderColor;
        e.currentTarget.style.boxShadow = 'inset 0 0 10px rgba(0, 255, 136, 0.05)';
        e.currentTarget.style.background = theme.bg;
        
        const label = e.currentTarget.querySelector('[data-kpi-label]');
        if (label) {
          label.style.color = '#ffffff';
          label.style.fontWeight = '700';
          label.style.textShadow = 'none';
        }
      }}
    >
      {/* Botón info con tooltip */}
      {tooltip && (
        <div 
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: isTooltipHovered ? '#00ff88' : '#666666',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            color: '#ffffff',
            fontFamily: "'Inter', sans-serif",
            transition: 'all 0.2s ease',
            zIndex: 1000,
            transform: isTooltipHovered ? 'scale(1.1)' : 'scale(1)'
          }}
          onMouseEnter={() => setIsTooltipHovered(true)}
          onMouseLeave={() => setIsTooltipHovered(false)}
        >
          i
        </div>
      )}

      {/* Tooltip overlay */}
      {tooltip && isTooltipHovered && (
        <div 
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            border: '2px solid #00ff88',
            borderRadius: '0.75rem',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            zIndex: 999,
            backdropFilter: 'blur(15px)',
            boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)',
            color: '#ffffff',
            fontSize: '1.02rem',
            lineHeight: '1.4',
            fontFamily: "'Inter', sans-serif",
            pointerEvents: 'none'
          }}
        >
          {tooltip}
        </div>
      )}

      {/* Layout con alturas fijas para alineación entre KPIs */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: '0.5rem'
      }}>
        {/* Título - altura fija para alineación */}
        <div 
          data-kpi-label
          style={{
            color: '#ffffff',
            fontSize: '1.08rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: 'all 0.25s ease',
            fontFamily: "'Inter', sans-serif",
            textAlign: 'center',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            whiteSpace: 'nowrap'
          }}
        >
          {label}
        </div>
        
        {/* Valor y porcentaje - altura fija para alineación */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
          height: '40px',
          alignItems: 'center'
        }}>
          <div 
            style={{
              fontSize: '1.32rem',
              fontWeight: '700',
              color: isPositive !== undefined ? (isPositive ? '#00FF99' : '#ef4444') : '#ffffff',
              lineHeight: '1.2',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '-0.02em'
            }}
          >
            {value}
          </div>
          {showChange && (
            <div 
              style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                color: isPositive ? '#00FF99' : '#ef4444',
                fontFamily: "'Inter', sans-serif"
              }}
            >
              ({changePercent})
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main KPI Grid Component (LIMPIO)
const KPIGrid = ({ portfolioData, theme }) => {
  // Process KPI data
  const getKPIData = () => {
    if (!portfolioData?.kpis) {
      return {
        totalInvested: '0,00€',
        currentValue: '0,00€',
        profit: '0,00€',
        profitPercent: '0.00%',
        isPositive: true,
        liquidity: 'N/A',
        fees: '0,00€',
        realizedGains: '0,00€',
        realizedIsPositive: true,
        unrealizedGains: '0,00€',
        unrealizedIsPositive: true,
        unrealizedPercent: '0.00%',
        realizedData: {
          value: '0,00€',
          percent: '0.00%',
          isPositive: true
        },
        unrealizedData: {
          value: '0,00€',
          percent: '0.00%',
          isPositive: true
        }
      };
    }

    const kpis = portfolioData.kpis;
    const isPositive = kpis.profit >= 0;
    
    // Nuevos KPIs mejorados
    const realizedGains = kpis.realized_gains || 0;
    const unrealizedGains = kpis.unrealized_gains || 0;
    const unrealizedPercentage = kpis.unrealized_percentage || 0;
    
    const realizedIsPositive = realizedGains >= 0;
    const unrealizedIsPositive = unrealizedGains >= 0;

    // Calcular porcentajes para el tooltip
    const realizedPercentage = kpis.total_invested > 0 ? (realizedGains / kpis.total_invested) * 100 : 0;
    const realizedPercentText = `${realizedIsPositive ? '+' : ''}${formatEuropeanPercentage(realizedPercentage)}`;
    const unrealizedPercentText = `${unrealizedIsPositive ? '+' : ''}${formatEuropeanPercentage(unrealizedPercentage)}`;

    // Datos estructurados para el hover del Net Profit
    const realizedData = {
      value: `${realizedIsPositive ? '+' : ''}${formatEuropeanCurrency(realizedGains)}`,
      percent: realizedPercentText,
      isPositive: realizedIsPositive
    };

    const unrealizedData = {
      value: `${unrealizedIsPositive ? '+' : ''}${formatEuropeanCurrency(unrealizedGains)}`,
      percent: unrealizedPercentText,
      isPositive: unrealizedIsPositive
    };

    return {
      totalInvested: formatEuropeanCurrency(kpis.total_invested),
      currentValue: formatEuropeanCurrency(kpis.current_value),
      profit: `${isPositive ? '+' : ''}${formatEuropeanCurrency(kpis.profit)}`,
      profitPercent: `${isPositive ? '+' : ''}${formatEuropeanPercentage(kpis.profit_percentage)}`,
      isPositive,
      liquidity: kpis.liquidity > 0 ? formatEuropeanCurrency(kpis.liquidity) : 'N/A',
      fees: formatEuropeanCurrency(kpis.fees),
      // Nuevos KPIs
      realizedGains: `${realizedIsPositive ? '+' : ''}${formatEuropeanCurrency(realizedGains)}`,
      realizedIsPositive,
      unrealizedGains: `${unrealizedIsPositive ? '+' : ''}${formatEuropeanCurrency(unrealizedGains)}`,
      unrealizedIsPositive,
      unrealizedPercent: `${unrealizedIsPositive ? '+' : ''}${formatEuropeanPercentage(unrealizedPercentage)}`,
      realizedData,
      unrealizedData
    };
  };

  const kpiData = getKPIData();

  return (
    <div style={{
      height: "fit-content",
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      margin: '0',
      overflow: 'visible'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '1rem',
        height: 'fit-content',
        padding: '0',
        background: 'transparent',
        border: 'none',
        overflow: 'visible',
        alignItems: 'stretch',
        justifyContent: 'center'
      }}>
        <KPICard
          label="Portfolio Value"
          value={kpiData.currentValue}
          theme={theme}
          tooltip="Current market value of all your holdings calculated with real-time prices"
        />
        
        <KPICard
          label="Total Invested"
          value={kpiData.totalInvested}
          theme={theme}
          tooltip="Total amount invested in fiat purchases only, including all trading fees"
        />
        
        <KPICard
          label="Realized Gains"
          value={kpiData.realizedData?.value || 0}
          changePercent={kpiData.realizedData?.percent || 0}
          isPositive={kpiData.realizedData?.isPositive || false}
          theme={theme}
          showChange={true}
          tooltip="Profit or loss from assets you have sold (locked in gains/losses)"
        />
        
        <KPICard
          label="Unrealized Gains"
          value={kpiData.unrealizedData?.value || 0}
          changePercent={kpiData.unrealizedData?.percent || 0}
          isPositive={kpiData.unrealizedData?.isPositive || false}
          theme={theme}
          showChange={true}
          tooltip="Profit or loss from assets you currently hold (paper gains/losses)"
        />
        
        <KPICard
          label="Net Profit"
          value={kpiData.profit}
          changePercent={kpiData.profitPercent}
          isPositive={kpiData.isPositive}
          theme={theme}
          showChange={true}
          tooltip="Total profit combining realized gains from sales and unrealized gains from current holdings"
        />

        <KPICard
          label="Total Fees"
          value={kpiData.fees}
          theme={theme}
          tooltip="Total trading fees paid to the exchange for all buy and sell transactions"
        />
      </div>
    </div>
  );
};

export default KPIGrid;