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
        background: theme.bg,
        borderRadius: '0.75rem',
        padding: '1.25rem',
        border: `2px solid ${theme.borderColor}`,
        boxShadow: 'inset 0 0 10px rgba(0, 255, 136, 0.05)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'visible',
        zIndex: 10001, // Mayor que el contenedor para tooltips
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        width: '240px', // Anchura más larga para todos los KPIs
        height: '120px' // Altura reducida para alineación perfecta
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
      {/* Área hover expandida que incluye todo el KPI */}
      <div 
        style={{
          position: 'absolute',
          top: '0',
          right: '0',
          width: '40px',
          height: '40px',
          zIndex: 100000,
          pointerEvents: 'auto'
        }}
        onMouseEnter={() => setShowInfoTooltip(true)}
        onMouseLeave={() => setShowInfoTooltip(false)}
      >
        {/* Icono visible en la esquina */}
        <div 
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: showInfoTooltip ? '#00ff88' : '#666666',
            transform: showInfoTooltip ? 'scale(1.1)' : 'scale(1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            color: '#ffffff',
            fontFamily: "'Inter', sans-serif",
            transition: 'all 0.2s ease',
            pointerEvents: 'none'
          }}
        >
          i
        </div>
        
        {/* Tooltip que tapa todo el KPI */}
        {showInfoTooltip && tooltip && (
          <div 
            style={{
              position: 'absolute',
              top: '0',
              left: '-232px',
              width: '240px',
              height: '120px',
              backgroundColor: 'rgba(0, 0, 0, 0.95)',
              border: '2px solid #00ff88',
              borderRadius: '0.75rem',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              backdropFilter: 'blur(15px)',
              boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)',
              color: '#ffffff',
              fontSize: '0.85rem',
              lineHeight: '1.4',
              fontFamily: "'Inter', sans-serif",
              pointerEvents: 'none'
            }}
          >
            {tooltip}
          </div>
        )}
      </div>
      
      {/* Layout horizontal: título, valor y % en la misma línea */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        gap: '0.5rem'
      }}>
        <div 
          data-kpi-label
          style={{
            color: '#ffffff',
            fontSize: '0.9rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: 'all 0.25s ease',
            fontFamily: "'Inter', sans-serif",
            textAlign: 'center',
            whiteSpace: 'nowrap'
          }}
        >
          {label}
        </div>
        
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          <div 
            style={{
              fontSize: '1.1rem',
              fontWeight: '700',
              color: isPositive ? '#00FF99' : '#ef4444',
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
                fontSize: '0.75rem',
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

      {/* Tooltip simplificado (solo explicación) */}
      {showInfoTooltip && tooltip && (
        <div 
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            border: `2px solid #00ff88`,
            borderRadius: '0.75rem',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100001,
            backdropFilter: 'blur(15px)',
            boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)'
          }}
        >
          <div style={{
            color: '#ffffff',
            fontSize: '0.85rem',
            lineHeight: '1.4',
            fontFamily: "'Inter', sans-serif",
            textAlign: 'center'
          }}>
            {tooltip}
          </div>
        </div>
      )}
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
        textAlign: 'center',
        width: '240px', // Anchura más larga para todos los KPIs
        height: '120px' // Altura reducida para alineación perfecta
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
        background: theme.bg,
        borderRadius: '0.75rem',
        padding: '1.25rem',
        border: `2px solid ${theme.borderColor}`,
        boxShadow: 'inset 0 0 10px rgba(0, 255, 136, 0.05)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'visible',
        zIndex: 10001, // Mayor que el contenedor para tooltips
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        width: '240px', // Anchura más larga para todos los KPIs
        height: '120px' // Altura reducida para alineación perfecta
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
      {/* Área hover expandida que incluye todo el KPI */}
      {tooltip && (
        <div 
          style={{
            position: 'absolute',
            top: '0',
            right: '0',
            width: '100%',
            height: '100%',
            zIndex: 100000,
            pointerEvents: 'auto'
          }}
          onMouseEnter={() => setIsInfoHovered(true)}
          onMouseLeave={() => setIsInfoHovered(false)}
        >
          {/* Icono visible en la esquina */}
          <div 
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: isInfoHovered ? '#00ff88' : '#666666',
              transform: isInfoHovered ? 'scale(1.1)' : 'scale(1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              color: '#ffffff',
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.2s ease',
              pointerEvents: 'none'
            }}
          >
            i
          </div>
          
          {/* Tooltip que tapa todo el KPI */}
          {isInfoHovered && (
            <div 
              style={{
                position: 'absolute',
                top: '0',
                left: '-232px',
                width: '240px',
                height: '120px',
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                border: '2px solid #00ff88',
                borderRadius: '0.75rem',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                backdropFilter: 'blur(15px)',
                boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)',
                color: '#ffffff',
                fontSize: '0.85rem',
                lineHeight: '1.4',
                fontFamily: "'Inter', sans-serif",
                pointerEvents: 'none'
              }}
            >
              <div dangerouslySetInnerHTML={{ __html: tooltip }} />
            </div>
          )}
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
            fontSize: '0.9rem',
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
              fontSize: '1.1rem',
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
                fontSize: '0.75rem',
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
      
      {/* Info Tooltip */}
      {tooltip && isInfoHovered && (
        <div 
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            border: `2px solid #00ff88`,
            borderRadius: '0.75rem',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            zIndex: 100001,
            backdropFilter: 'blur(15px)',
            boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)',
            color: '#ffffff',
            fontSize: '0.85rem',
            lineHeight: '1.4',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          <div dangerouslySetInnerHTML={{ __html: tooltip }} />
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
      margin: '0', // Sin márgenes para centrado
      zIndex: 10000, // Asegurar que el contenedor completo esté al frente
      overflow: 'visible' // Permitir que los tooltips salgan del contenedor
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
        alignItems: 'stretch', // Mismo tamaño en altura
        justifyContent: 'center' // Centrar los KPIs
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
        
        <KPICard
          label="Realized Gains"
          value={kpiData.realizedData?.value || 0}
          changePercent={kpiData.realizedData?.percent || 0}
          isPositive={kpiData.realizedData?.isPositive || false}
          theme={theme}
          showChange={true}
          tooltip="Profit or loss from assets you have sold (locked in gains/losses)"
          tooltipDirection="down"
        />
        
        <KPICard
          label="Unrealized Gains"
          value={kpiData.unrealizedData?.value || 0}
          changePercent={kpiData.unrealizedData?.percent || 0}
          isPositive={kpiData.unrealizedData?.isPositive || false}
          theme={theme}
          showChange={true}
          tooltip="Profit or loss from assets you currently hold (paper gains/losses)"
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