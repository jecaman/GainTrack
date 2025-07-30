import { useState } from 'react';

// Sub KPI Component for Net Profit breakdown
const NetProfitCard = ({ netValue, netPercent, realizedValue, unrealizedValue, unrealizedPercent, isPositive, realizedIsPositive, unrealizedIsPositive, theme }) => {
  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        padding: '0.5rem',
        backgroundColor: theme.bgContainer,
        borderRadius: '0.5rem',
        border: `1px solid ${theme.borderColorStrong}`,
        width: '100%'
      }}
    >
      {/* Main Net Profit Value */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{
          color: theme.textSecondary,
          fontSize: '0.75rem',
          fontWeight: '500'
        }}>
          Net Profit
        </span>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '0.1rem'
        }}>
          <span style={{
            color: isPositive ? theme.greenPrimary : theme.redPrimary,
            fontSize: '1rem',
            fontWeight: '700',
            fontFamily: "'Inter', sans-serif"
          }}>
            {netValue}
          </span>
          <span style={{
            color: isPositive ? theme.greenPrimary : theme.redPrimary,
            fontSize: '0.7rem',
            fontWeight: '600'
          }}>
            {netPercent}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={{
        height: '1px',
        backgroundColor: theme.borderColor,
        opacity: 0.5,
        margin: '0.3rem 0'
      }}></div>

      {/* Sub KPIs */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '0.5rem'
      }}>
        {/* Realized Gains */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1
        }}>
          <span style={{
            color: theme.textMuted,
            fontSize: '0.65rem',
            fontWeight: '500',
            marginBottom: '0.2rem'
          }}>
            Realized
          </span>
          <span style={{
            color: realizedIsPositive ? theme.greenSecondary : theme.redSecondary,
            fontSize: '0.8rem',
            fontWeight: '600',
            fontFamily: "'Inter', sans-serif"
          }}>
            {realizedValue}
          </span>
        </div>

        {/* Separator */}
        <div style={{
          width: '1px',
          backgroundColor: theme.borderColor,
          opacity: 0.3,
          alignSelf: 'stretch'
        }}></div>

        {/* Unrealized Gains */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1
        }}>
          <span style={{
            color: theme.textMuted,
            fontSize: '0.65rem',
            fontWeight: '500',
            marginBottom: '0.2rem'
          }}>
            Unrealized
          </span>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.1rem'
          }}>
            <span style={{
              color: unrealizedIsPositive ? theme.greenSecondary : theme.redSecondary,
              fontSize: '0.8rem',
              fontWeight: '600',
              fontFamily: "'Inter', sans-serif"
            }}>
              {unrealizedValue}
            </span>
            <span style={{
              color: unrealizedIsPositive ? theme.greenSecondary : theme.redSecondary,
              fontSize: '0.65rem',
              fontWeight: '500'
            }}>
              {unrealizedPercent}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Net Profit KPI Card Component with hover split
const NetProfitKPICard = ({ label, value, changePercent, isPositive, theme, showChange = false, realizedData, unrealizedData }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      style={{
        background: theme.bgElevated,
        borderRadius: '0.75rem',
        padding: '1.25rem',
        border: `1px solid ${theme.borderColor}`,
        boxShadow: theme.bg === '#000000' ? 'none' : '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        height: 'auto',
        minHeight: '120px'
      }}
      onMouseEnter={(e) => {
        setIsHovered(true);
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = '#00ff88';
        e.currentTarget.style.boxShadow = '0 -0.5rem 0.5rem rgba(0, 255, 136, 0.15), 0 0.5rem 0.5rem rgba(0, 255, 136, 0.15), 0.25rem 0 0.5rem rgba(0, 255, 136, 0.15)';
        e.currentTarget.style.background = theme.bgContainer;
        
        const label = e.currentTarget.querySelector('[data-kpi-label]');
        if (label) {
          label.style.color = '#ffffff';
          label.style.fontWeight = '700';
          label.style.textShadow = '0 0 8px rgba(0, 255, 136, 0.6)';
        }
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = theme.borderColor;
        e.currentTarget.style.boxShadow = theme.bg === '#000000' ? 'none' : '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.02)';
        e.currentTarget.style.background = theme.bgElevated;
        
        const label = e.currentTarget.querySelector('[data-kpi-label]');
        if (label) {
          label.style.color = '#ffffff';
          label.style.fontWeight = '700';
          label.style.textShadow = 'none';
        }
      }}
    >
      {!isHovered ? (
        // Normal view - Net Profit only
        <>
          <div 
            data-kpi-label
            style={{
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: '700',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              transition: 'all 0.25s ease',
              fontFamily: "'Inter', sans-serif"
            }}
          >
            {label}
          </div>
          <div 
            style={{
              fontSize: '1.875rem',
              fontWeight: '700',
              color: isPositive ? theme.greenPrimary : theme.redPrimary,
              lineHeight: '1.2',
              marginBottom: '0.25rem',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '-0.02em'
            }}
          >
            {value}
          </div>
          {showChange && (
            <div 
              style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: isPositive ? theme.greenSecondary : theme.redSecondary,
                fontFamily: "'Inter', sans-serif"
              }}
            >
              {changePercent}
            </div>
          )}
        </>
      ) : (
        // Hover view - Breakdown
        <NetProfitCard
          netValue={value}
          netPercent={changePercent}
          realizedValue={realizedData?.value || '0.00€'}
          unrealizedValue={unrealizedData?.value || '0.00€'}
          unrealizedPercent={unrealizedData?.percent || '0.00%'}
          isPositive={isPositive}
          realizedIsPositive={realizedData?.isPositive || false}
          unrealizedIsPositive={unrealizedData?.isPositive || false}
          theme={theme}
        />
      )}
    </div>
  );
};

// KPI Card Component
const KPICard = ({ label, value, changePercent, isPositive, theme, showChange = false, tooltip = null }) => {
  return (
    <div 
      style={{
        background: theme.bgElevated,
        borderRadius: '0.75rem',
        padding: '1.25rem',
        border: `1px solid ${theme.borderColor}`,
        boxShadow: theme.bg === '#000000' ? 'none' : '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = '#00ff88';
        e.currentTarget.style.boxShadow = '0 -0.5rem 0.5rem rgba(0, 255, 136, 0.15), 0 0.5rem 0.5rem rgba(0, 255, 136, 0.15), 0.25rem 0 0.5rem rgba(0, 255, 136, 0.15)';
        e.currentTarget.style.background = theme.bgContainer;
        
        const label = e.currentTarget.querySelector('[data-kpi-label]');
        if (label) {
          label.style.color = '#ffffff';
          label.style.fontWeight = '700';
          label.style.textShadow = '0 0 8px rgba(0, 255, 136, 0.6)';
        }
        
        // Show tooltip if present
        if (tooltip) {
          const tooltipEl = e.currentTarget.querySelector('.kpi-tooltip');
          if (tooltipEl) {
            tooltipEl.style.opacity = '1';
          }
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = theme.borderColor;
        e.currentTarget.style.boxShadow = theme.bg === '#000000' ? 'none' : '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.02)';
        e.currentTarget.style.background = theme.bgElevated;
        
        const label = e.currentTarget.querySelector('[data-kpi-label]');
        if (label) {
          label.style.color = '#ffffff';
          label.style.fontWeight = '700';
          label.style.textShadow = 'none';
        }
        
        // Hide tooltip if present
        if (tooltip) {
          const tooltipEl = e.currentTarget.querySelector('.kpi-tooltip');
          if (tooltipEl) {
            tooltipEl.style.opacity = '0';
          }
        }
      }}
    >
      <div 
        data-kpi-label
        style={{
          color: '#ffffff',
          fontSize: '0.75rem',
          fontWeight: '700',
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          transition: 'all 0.25s ease',
          fontFamily: "'Inter', sans-serif"
        }}
      >
        {label}
      </div>
      <div 
        style={{
          fontSize: '1.875rem',
          fontWeight: '700',
          color: isPositive !== undefined ? (isPositive ? theme.greenPrimary : theme.redPrimary) : '#ffffff',
          lineHeight: '1.2',
          marginBottom: showChange ? '0.25rem' : '0',
          fontFamily: "'Inter', sans-serif",
          letterSpacing: '-0.02em'
        }}
      >
        {value}
      </div>
      {showChange && (
        <div 
          style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: isPositive ? theme.greenSecondary : theme.redSecondary,
            fontFamily: "'Inter', sans-serif"
          }}
        >
          {changePercent}
        </div>
      )}
      
      {/* Tooltip */}
      {tooltip && (
        <div 
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            right: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: '#ffffff',
            padding: '8px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            opacity: '0',
            pointerEvents: 'none',
            transition: 'opacity 0.2s ease',
            marginTop: '8px'
          }}
          className="kpi-tooltip"
        >
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>Profit Breakdown:</div>
          <div>Realized: {tooltip.realizedGains} ({tooltip.realizedPercent})</div>
          <div>Unrealized: {tooltip.unrealizedGains} ({tooltip.unrealizedPercent})</div>
        </div>
      )}
    </div>
  );
};

// Main KPI Grid Component
const KPIGrid = ({ portfolioData, theme }) => {
  // Process KPI data
  const getKPIData = () => {
    if (!portfolioData?.kpis) {
      return {
        totalInvested: '0.00€',
        currentValue: '0.00€',
        profit: '0.00€',
        profitPercent: '0.00%',
        isPositive: true,
        liquidity: 'N/A',
        fees: '0.00€',
        realizedGains: '0.00€',
        realizedIsPositive: true,
        unrealizedGains: '0.00€',
        unrealizedIsPositive: true,
        unrealizedPercent: '0.00%',
        realizedData: {
          value: '0.00€',
          percent: '0.00%',
          isPositive: true
        },
        unrealizedData: {
          value: '0.00€',
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
    const realizedPercentText = `${realizedIsPositive ? '+' : ''}${realizedPercentage.toFixed(2)}%`;
    const unrealizedPercentText = `${unrealizedIsPositive ? '+' : ''}${unrealizedPercentage.toFixed(2)}%`;

    // Datos estructurados para el hover del Net Profit
    const realizedData = {
      value: `${realizedIsPositive ? '+' : ''}${realizedGains.toFixed(2)}€`,
      percent: realizedPercentText,
      isPositive: realizedIsPositive
    };

    const unrealizedData = {
      value: `${unrealizedIsPositive ? '+' : ''}${unrealizedGains.toFixed(2)}€`,
      percent: unrealizedPercentText,
      isPositive: unrealizedIsPositive
    };

    return {
      totalInvested: `${kpis.total_invested.toFixed(2)}€`,
      currentValue: `${kpis.current_value.toFixed(2)}€`,
      profit: `${isPositive ? '+' : ''}${kpis.profit.toFixed(2)}€`,
      profitPercent: `${isPositive ? '+' : ''}${kpis.profit_percentage.toFixed(2)}%`,
      isPositive,
      liquidity: kpis.liquidity > 0 ? `${kpis.liquidity.toFixed(2)}€` : 'N/A',
      fees: `${kpis.fees.toFixed(2)}€`,
      // Nuevos KPIs
      realizedGains: `${realizedIsPositive ? '+' : ''}${realizedGains.toFixed(2)}€`,
      realizedIsPositive,
      unrealizedGains: `${unrealizedIsPositive ? '+' : ''}${unrealizedGains.toFixed(2)}€`,
      unrealizedIsPositive,
      unrealizedPercent: `${unrealizedIsPositive ? '+' : ''}${unrealizedPercentage.toFixed(2)}%`,
      realizedData,
      unrealizedData
    };
  };

  const kpiData = getKPIData();

  return (
    <div style={{
      height: "300px",
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: '1rem',
        height: '100%',
        padding: '1rem',
        background: theme.bgContainer,
        borderRadius: '1rem',
        border: `1px solid ${theme.borderColor}`,
        ...(theme.bg === '#000000' ? {} : {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        })
      }}>
        <KPICard
          label="Portfolio Value"
          value={kpiData.currentValue}
          theme={theme}
        />
        
        <KPICard
          label="Total Invested"
          value={kpiData.totalInvested}
          theme={theme}
        />
        
        <NetProfitKPICard
          label="Net Profit"
          value={kpiData.profit}
          changePercent={kpiData.profitPercent}
          isPositive={kpiData.isPositive}
          theme={theme}
          showChange={true}
          realizedData={kpiData.realizedData}
          unrealizedData={kpiData.unrealizedData}
        />
        
        <KPICard
          label="Total Fees"
          value={kpiData.fees}
          theme={theme}
        />
      </div>
    </div>
  );
};

export default KPIGrid;