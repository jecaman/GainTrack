import { useState } from 'react';
import { formatEuropeanCurrency, formatEuropeanPercentage } from '../../../../../utils/numberFormatter';

// Tooltip Component
const NetProfitTooltip = ({ realizedValue, unrealizedValue, unrealizedPercent, realizedPercent, realizedIsPositive, unrealizedIsPositive, theme, isVisible, tooltip, direction = 'up' }) => {
  return (
    <div 
      style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        border: `2px solid ${theme.borderColor}`,
        borderRadius: '0.75rem',
        padding: '0.75rem',
        opacity: isVisible ? 1 : 0,
        visibility: isVisible ? 'visible' : 'hidden',
        transition: 'all 0.2s ease',
        pointerEvents: 'none',
        zIndex: 99999,
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >

      {/* Información básica */}
      {tooltip && (
        <div style={{
          color: '#ffffff',
          fontSize: '0.75rem',
          lineHeight: '1.3',
          marginBottom: '0.5rem',
          paddingBottom: '0.5rem',
          borderBottom: `1px solid ${theme.borderColor}`,
          fontFamily: "'Inter', sans-serif",
          textAlign: 'center'
        }}>
          {tooltip}
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '0.5rem',
        width: '100%'
      }}>
        {/* Realized */}
        <div style={{
          textAlign: 'center',
          flex: 1
        }}>
          <div style={{
            color: '#ffffff',
            fontSize: '0.6rem',
            fontWeight: '600',
            marginBottom: '0.2rem',
            fontFamily: "'Inter', sans-serif"
          }}>
            Realized
          </div>
          <div style={{
            color: realizedIsPositive ? '#00FF99' : '#ef4444',
            fontSize: '0.75rem',
            fontWeight: '700',
            fontFamily: "'Inter', sans-serif",
            marginBottom: '0.1rem'
          }}>
            {realizedValue}
          </div>
          <div style={{
            color: realizedIsPositive ? '#00FF99' : '#ef4444',
            fontSize: '0.55rem',
            fontWeight: '600'
          }}>
            {realizedPercent}
          </div>
        </div>

        {/* Unrealized */}
        <div style={{
          textAlign: 'center',
          flex: 1
        }}>
          <div style={{
            color: '#ffffff',
            fontSize: '0.6rem',
            fontWeight: '600',
            marginBottom: '0.2rem',
            fontFamily: "'Inter', sans-serif"
          }}>
            Unrealized
          </div>
          <div style={{
            color: unrealizedIsPositive ? '#00FF99' : '#ef4444',
            fontSize: '0.75rem',
            fontWeight: '700',
            fontFamily: "'Inter', sans-serif",
            marginBottom: '0.1rem'
          }}>
            {unrealizedValue}
          </div>
          <div style={{
            color: unrealizedIsPositive ? '#00FF99' : '#ef4444',
            fontSize: '0.55rem',
            fontWeight: '600'
          }}>
            {unrealizedPercent}
          </div>
        </div>
      </div>
    </div>
  );
};

// Net Profit KPI Card Component with tooltip
const NetProfitKPICard = ({ label, value, changePercent, isPositive, theme, showChange = false, realizedData, unrealizedData, tooltip, tooltipDirection = 'up' }) => {
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [isCardHovered, setIsCardHovered] = useState(false);

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
        overflow: 'visible',
        zIndex: 10001, // Mayor que el contenedor para tooltips
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center'
      }}
      onMouseEnter={(e) => {
        setIsCardHovered(true);
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
        setIsCardHovered(false);
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
      {/* Info icon en esquina superior derecha */}
      <div 
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          backgroundColor: '#666666',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: '600',
          color: '#ffffff',
          fontFamily: "'Inter', sans-serif",
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          setShowInfoTooltip(true);
          e.currentTarget.style.backgroundColor = '#00ff88';
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          setShowInfoTooltip(false);
          e.currentTarget.style.backgroundColor = '#666666';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        i
      </div>
      
      {/* Normal view - always visible */}
      <div 
        data-kpi-label
        style={{
          color: '#ffffff',
          fontSize: '0.9rem',
          fontWeight: '700',
          marginBottom: '0.75rem',
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
          fontSize: '1.5rem',
          fontWeight: '700',
          color: isPositive ? '#00FF99' : '#ef4444',
          lineHeight: '1.2',
          marginBottom: showChange ? '0.25rem' : '0',
          fontFamily: "'Inter', sans-serif",
          letterSpacing: '-0.02em'
        }}
      >
{value} {isPositive !== undefined ? (isPositive ? '↗' : '↘') : ''}
      </div>
      {showChange && (
        <div 
          style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: isPositive ? '#22c55e' : '#dc2626',
            fontFamily: "'Inter', sans-serif"
          }}
        >
{changePercent}
        </div>
      )}

      {/* Tooltip completo (solo hover en el ícono) */}
      <NetProfitTooltip
        realizedValue={realizedData?.value || '0,00€'}
        unrealizedValue={unrealizedData?.value || '0,00€'}
        unrealizedPercent={unrealizedData?.percent || '0.00%'}
        realizedPercent={realizedData?.percent || '0.00%'}
        realizedIsPositive={realizedData?.isPositive || false}
        unrealizedIsPositive={unrealizedData?.isPositive || false}
        theme={theme}
        tooltip={tooltip}
        isVisible={showInfoTooltip}
        direction={tooltipDirection}
      />
    </div>
  );
};

// Info Tooltip Component
const InfoTooltip = ({ content, theme, isVisible, direction = 'up' }) => {
  return (
    <div 
      className="kpi-tooltip"
      style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        border: `2px solid ${theme.borderColor}`,
        borderRadius: '0.75rem',
        padding: '0.75rem',
        opacity: isVisible ? 1 : 0,
        visibility: isVisible ? 'visible' : 'hidden',
        transition: 'all 0.2s ease',
        pointerEvents: 'none',
        zIndex: 99999,
        backdropFilter: 'blur(10px)',
        fontSize: '0.85rem',
        lineHeight: '1.4',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}
    >
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
};

// KPI Card Component
const KPICard = ({ label, value, changePercent, isPositive, theme, showChange = false, tooltip = null, tooltipDirection = 'up' }) => {
  const [isInfoHovered, setIsInfoHovered] = useState(false);
  const [isCardHovered, setIsCardHovered] = useState(false);
  
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
        overflow: 'visible',
        zIndex: 10001, // Mayor que el contenedor para tooltips
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center'
      }}
      onMouseEnter={(e) => {
        setIsCardHovered(true);
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
        setIsCardHovered(false);
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
      {/* Info icon en esquina superior derecha */}
      {tooltip && (
        <div 
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: '#666666',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: '600',
            color: '#ffffff',
            fontFamily: "'Inter', sans-serif",
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            setIsInfoHovered(true);
            e.currentTarget.style.backgroundColor = '#00ff88';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            setIsInfoHovered(false);
            e.currentTarget.style.backgroundColor = '#666666';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          i
        </div>
      )}
      
      <div 
        data-kpi-label
        style={{
          color: '#ffffff',
          fontSize: '0.9rem',
          fontWeight: '700',
          marginBottom: '0.75rem',
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
          fontSize: '1.5rem',
          fontWeight: '700',
          color: isPositive !== undefined ? (isPositive ? '#00FF99' : '#ef4444') : '#ffffff',
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
      
      {/* Info Tooltip */}
      {tooltip && (
        <InfoTooltip 
          content={tooltip}
          theme={theme}
          isVisible={isInfoHovered}
          direction={tooltipDirection}
        />
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
      margin: '0 0 1rem 1rem', // Margen izquierdo y abajo para alineación
      zIndex: 10000, // Asegurar que el contenedor completo esté al frente
      overflow: 'visible' // Permitir que los tooltips salgan del contenedor
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: '1rem',
        height: 'fit-content',
        padding: '0', // Sin padding interno
        background: 'transparent', // Invisible
        border: 'none', // Sin borde
        overflow: 'visible' // Permitir que los tooltips salgan del grid
      }}>
        <KPICard
          label="Portfolio Value"
          value={kpiData.currentValue}
          theme={theme}
          tooltip="Current market value of all your holdings calculated with real-time prices"
          tooltipDirection="down"
        />
        
        <KPICard
          label="Total Invested"
          value={kpiData.totalInvested}
          theme={theme}
          tooltip="Total amount invested in fiat purchases only, including all trading fees"
          tooltipDirection="down"
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
          tooltip="Total profit combining realized gains from sales and unrealized gains from current holdings"
          tooltipDirection="up"
        />
        
        <KPICard
          label="Total Fees"
          value={kpiData.fees}
          theme={theme}
          tooltip="Total trading fees paid to the exchange for all buy and sell transactions"
          tooltipDirection="up"
        />
      </div>
    </div>
  );
};

export default KPIGrid;