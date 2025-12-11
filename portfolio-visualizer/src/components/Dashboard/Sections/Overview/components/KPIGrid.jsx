import { useState, useMemo } from 'react';
import { formatEuropeanCurrency, formatEuropeanPercentage } from '../../../../../utils/numberFormatter';

// KPI Card Component
const KPICard = ({ label, value, changePercent, isPositive, theme, showChange = false, tooltip = null, sidebarOpen = false }) => {
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  
  // Función para determinar el tamaño responsivo basado en sidebar y contenido
  const getResponsiveSize = () => {
    const valueLength = value.length;
    
    // TAMAÑO FIJO RECTANGULAR MÁS ALARGADO
    const cardWidth = sidebarOpen ? '160px' : '180px';
    const cardHeight = sidebarOpen ? '100px' : '110px';
    
    // Calcular tamaño de fuente más grande para cuadrados grandes
    const getValueFontSize = () => {
      const baseSize = sidebarOpen ? 1.4 : 1.6;
      
      if (valueLength > 18) return `${baseSize * 0.6}rem`; // Números muy largos
      else if (valueLength > 15) return `${baseSize * 0.7}rem`; 
      else if (valueLength > 12) return `${baseSize * 0.8}rem`;
      else if (valueLength > 9) return `${baseSize * 0.9}rem`;
      else if (valueLength > 6) return `${baseSize * 0.95}rem`;
      else return `${baseSize}rem`; // Números cortos
    };
    
    return {
      cardWidth: cardWidth,
      cardHeight: cardHeight,
      titleFont: sidebarOpen ? '0.9rem' : '0.95rem',
      titleHeight: '26px',
      valueFont: getValueFontSize(),
      contentHeight: '50px',
      padding: '1.2rem'
    };
  };
  
  const getPercentageFontSize = () => {
    const valueLength = value.length;
    const percentLength = changePercent ? changePercent.replace('+', '').replace('-', '').length : 0;
    const totalContentLength = valueLength + percentLength;
    
    // Base más grande para porcentajes en cuadrados grandes
    let baseSize = sidebarOpen ? 0.9 : 1.0;
    
    // Reducir si el contenido total es muy largo
    if (totalContentLength > 20) baseSize *= 0.7;
    else if (totalContentLength > 15) baseSize *= 0.8;
    else if (totalContentLength > 10) baseSize *= 0.9;
    
    return `${baseSize}rem`;
  };
  
  const responsiveSize = getResponsiveSize();
  
  return (
    <div 
      style={{
        background: theme.bg,
        borderRadius: '0.5rem',
        padding: responsiveSize.padding,
        border: `2px solid ${theme.borderColor}`,
        boxShadow: 'inset 0 0 10px rgba(0, 255, 136, 0.05)',
        transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        textAlign: 'center',
        width: responsiveSize.cardWidth,
        height: responsiveSize.cardHeight,
        minWidth: responsiveSize.cardWidth,
        maxWidth: responsiveSize.cardWidth,
        flex: '0 0 auto'
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
            top: '4px',
            right: '4px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: isTooltipHovered ? '#00ff88' : '#666666',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '11px',
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
            fontSize: '0.85rem',
            lineHeight: '1.3',
            fontFamily: "'Inter', sans-serif",
            pointerEvents: 'none'
          }}
        >
          {tooltip}
        </div>
      )}

      {/* Layout simple con padding fijo */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: '16px'
      }}>
        {/* Título arriba */}
        <div 
          data-kpi-label
          style={{
            color: theme.textSecondary,
            fontSize: responsiveSize.titleFont,
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontFamily: 'SF Mono, Monaco, monospace',
            textAlign: 'center',
            lineHeight: '1.2'
          }}
        >
          {label}
        </div>
        
        {/* Números en el centro */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <div 
            style={{
              fontSize: responsiveSize.valueFont,
              fontWeight: '700',
              color: '#ffffff',
              fontFamily: 'SF Mono, Monaco, monospace',
              whiteSpace: 'nowrap'
            }}
          >
            {value}
          </div>
          {showChange && changePercent && (
            <div style={{
              fontSize: getPercentageFontSize(),
              fontWeight: '600',
              color: isPositive ? '#00FF99' : '#ef4444',
              fontFamily: 'SF Mono, Monaco, monospace',
              whiteSpace: 'nowrap'
            }}>
              {changePercent}
            </div>
          )}
        </div>
        
        {/* Espacio vacío abajo para balance */}
        <div></div>
      </div>
    </div>
  );
};

// Main KPI Grid Component (LIMPIO)
const KPIGrid = ({ portfolioData, theme, startDate, endDate, hiddenAssets = new Set(), excludedOperations = new Set(), sidebarOpen = false }) => {
  
  // Map frontend asset names to backend asset names
  const mapFrontendToBackend = (frontendAsset) => {
    const mapping = {
      'BTC': 'XXBT',
      'ETH': 'XETH',
      'BITCOIN': 'XXBT',
      'ETHEREUM': 'XETH'
    };
    return mapping[frontendAsset] || frontendAsset;
  };
  
  // Convert hiddenAssets to use backend names (memoized)
  const hiddenAssetsBackend = useMemo(() => new Set(
    Array.from(hiddenAssets).map(asset => mapFrontendToBackend(asset))
  ), [hiddenAssets]);

  // Calculate filtered KPIs based on date range and operations (memoized)
  const filteredKPIs = useMemo(() => {
    if (!portfolioData?.timeline || portfolioData.timeline.length === 0) {
      return portfolioData?.kpis || {};
    }
    
    // Determine the timeline to process based on date filters
    let timelineToProcess = portfolioData.timeline;
    const isPointClick = startDate === endDate; // Detect if it's a specific date (point click)
    
    // Apply date filtering if specified
    if (startDate && endDate) {
      // Use string comparison to avoid timezone issues
      const startDateStr = startDate;
      const endDateStr = endDate;
      
      // ALWAYS use "Portfolio State" view: process all data up to the end date
      // This shows the accumulated portfolio state as of the end date
      timelineToProcess = portfolioData.timeline.filter(entry => {
        const entryDateStr = entry.date.split('T')[0];
        return entryDateStr <= endDateStr; // All data up to end date
      });
    }
    
    if (timelineToProcess.length === 0) {
      return {
        current_value: 0,
        total_invested: 0,
        profit: 0,
        profit_percentage: 0,
        fees: 0,
        liquidity: 0,
        realized_gains: 0,
        unrealized_gains: 0,
        unrealized_percentage: 0
      };
    }
    
    // Calculate cost basis excluding hidden assets and excluded operations
    let holdings_acumulados = {}; // Asset -> current quantity
    let cost_basis_fifo = {}; // Asset -> FIFO queue for cost basis
    let calculatedTotalInvested = 0;
    let calculatedRealizedGains = 0;
    
    // Process all operations up to the end date to get portfolio state
    timelineToProcess.forEach(dayData => {
      const operations = dayData.operations || [];
      
      operations.forEach(operation => {
        // Skip operations for hidden assets or excluded operations (use operation_key like TimelineChart)
        if (hiddenAssetsBackend.has(operation.asset) || excludedOperations.has(operation.operation_key)) {
          return;
        }
        
        const asset = operation.asset;
        const tipo = operation.type;
        const cantidad = parseFloat(operation.cantidad) || 0;
        const cost = parseFloat(operation.cost) || 0;
        const fee = parseFloat(operation.fee) || 0;
        
        // Initialize asset tracking if not exists
        if (!holdings_acumulados[asset]) {
          holdings_acumulados[asset] = 0;
          cost_basis_fifo[asset] = [];
        }
        
        if (tipo === 'buy') {
          holdings_acumulados[asset] += cantidad;
          // Add purchase to FIFO queue
          const cost_con_fee = cost + fee;
          cost_basis_fifo[asset].push({
            volumen: cantidad,
            cost: cost_con_fee
          });
          calculatedTotalInvested += cost_con_fee;
        } else if (tipo === 'sell') {
          holdings_acumulados[asset] -= cantidad;
          // Process sale using FIFO
          let volumen_restante = cantidad;
          let total_cost_vendido = 0;
          
          while (volumen_restante > 0 && cost_basis_fifo[asset].length > 0) {
            const lote = cost_basis_fifo[asset][0];
            
            if (lote.volumen <= volumen_restante) {
              // Sell entire batch
              volumen_restante -= lote.volumen;
              total_cost_vendido += lote.cost;
              cost_basis_fifo[asset].shift();
            } else {
              // Partial sale
              const proporcion = volumen_restante / lote.volumen;
              total_cost_vendido += lote.cost * proporcion;
              lote.volumen -= volumen_restante;
              lote.cost -= lote.cost * proporcion;
              volumen_restante = 0;
            }
          }
          
          // Calculate realized gains (all gains up to end date)
          const saleProceeds = cost - fee;
          const realizedGain = saleProceeds - total_cost_vendido;
          calculatedRealizedGains += realizedGain;
        }
      });
    });
    
    // Get the latest data from the filtered timeline
    const latestData = timelineToProcess[timelineToProcess.length - 1];
    
    // Calculate current value and cost basis consistently for the filtered period
    let currentValue = 0;
    let totalInvested = calculatedTotalInvested;
    
    // Calculate current value using holdings as of the end date and latest prices
    if (latestData.assets_con_valor) {
      Object.keys(latestData.assets_con_valor).forEach(asset => {
        const isHidden = hiddenAssetsBackend.has(asset);
        if (!isHidden && holdings_acumulados[asset]) {
          const currentPrice = latestData.assets_con_valor[asset].precio || 0;
          currentValue += holdings_acumulados[asset] * currentPrice;
        }
      });
    }
    
    // If no operations were excluded and we have proportional data, use it for better accuracy
    if (excludedOperations.size === 0 && !isPointClick) {
      const totalValueIncludingHidden = latestData.value || 0;
      if (totalValueIncludingHidden > 0) {
        totalInvested = (latestData.cost || 0) * (currentValue / totalValueIncludingHidden);
      }
    }
    
    const profit = currentValue - totalInvested;
    const profitPercentage = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;
    
    // Calculate fees for the filtered period, excluding hidden assets and excluded operations
    let calculatedTotalFees = 0;
    timelineToProcess.forEach(dayData => {
      const operations = dayData.operations || [];
      operations.forEach(operation => {
        // Only count fees for operations of visible assets and non-excluded operations
        if (!hiddenAssetsBackend.has(operation.asset) && !excludedOperations.has(operation.operation_key)) {
          calculatedTotalFees += parseFloat(operation.fee) || 0;
        }
      });
    });
    
    // Calculate unrealized gains using all realized gains up to end date
    const calculatedUnrealizedGains = profit - calculatedRealizedGains;
    const calculatedUnrealizedPercentage = totalInvested > 0 ? (calculatedUnrealizedGains / totalInvested) * 100 : 0;
    
    console.log('KPI Calculation:', {
      dateRange: startDate && endDate ? `${startDate} to ${endDate}` : 'All dates',
      excludedOps: Array.from(excludedOperations),
      currentValue,
      totalInvested,
      profit,
      calculatedRealizedGains,
      calculatedUnrealizedGains,
      calculatedTotalFees,
      check: `Realized + Unrealized = ${calculatedRealizedGains + calculatedUnrealizedGains}, should equal profit = ${profit}`
    });
    
    return {
      current_value: currentValue,
      total_invested: totalInvested,
      profit: profit,
      profit_percentage: profitPercentage,
      fees: calculatedTotalFees, // Always use calculated fees for the filtered period
      liquidity: portfolioData.kpis?.liquidity || 0, // Keep original liquidity
      realized_gains: calculatedRealizedGains, // All realized gains up to end date
      unrealized_gains: calculatedUnrealizedGains, // Always use calculated unrealized gains
      unrealized_percentage: calculatedUnrealizedPercentage // Always use calculated unrealized percentage
    };
  }, [portfolioData, startDate, endDate, hiddenAssetsBackend, excludedOperations]);

  // Process KPI data
  const getKPIData = () => {
    const kpis = filteredKPIs;
    if (!kpis) {
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

    // kpis ya está definido arriba por calculateFilteredKPIs()
    // Total gains should be current_value - total_invested (simple calculation)
    const totalGains = kpis.current_value - kpis.total_invested;
    const totalGainsPercentage = kpis.total_invested > 0 ? (totalGains / kpis.total_invested) * 100 : 0;
    const isPositive = totalGains >= 0;
    
    // Individual gains
    const realizedGains = kpis.realized_gains || 0;
    const unrealizedGains = kpis.unrealized_gains || 0;
    const unrealizedPercentage = kpis.unrealized_percentage || 0;
    
    const realizedIsPositive = realizedGains >= 0;
    const unrealizedIsPositive = unrealizedGains >= 0;
    const totalGainsIsPositive = totalGains >= 0;

    // Calcular porcentajes para el tooltip
    const realizedPercentage = kpis.total_invested > 0 ? (realizedGains / kpis.total_invested) * 100 : 0;
    const realizedPercentText = `${realizedIsPositive ? '+' : ''}${formatEuropeanPercentage(realizedPercentage, 1)}`;
    const unrealizedPercentText = `${unrealizedIsPositive ? '+' : ''}${formatEuropeanPercentage(unrealizedPercentage, 1)}`;
    const totalGainsPercentText = `${totalGainsIsPositive ? '+' : ''}${formatEuropeanPercentage(totalGainsPercentage, 1)}`;

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
      profit: `${totalGainsIsPositive ? '+' : ''}${formatEuropeanCurrency(totalGains)}`, // Use totalGains instead of kpis.profit
      profitPercent: totalGainsPercentText, // Use calculated total gains percentage
      isPositive: totalGainsIsPositive,
      liquidity: kpis.liquidity > 0 ? formatEuropeanCurrency(kpis.liquidity) : 'N/A',
      fees: formatEuropeanCurrency(kpis.fees),
      // Nuevos KPIs
      realizedGains: `${realizedIsPositive ? '+' : ''}${formatEuropeanCurrency(realizedGains)}`,
      realizedIsPositive,
      unrealizedGains: `${unrealizedIsPositive ? '+' : ''}${formatEuropeanCurrency(unrealizedGains)}`,
      unrealizedIsPositive,
      unrealizedPercent: `${unrealizedIsPositive ? '+' : ''}${formatEuropeanPercentage(unrealizedPercentage, 1)}`,
      totalGains: `${totalGainsIsPositive ? '+' : ''}${formatEuropeanCurrency(totalGains)}`,
      totalGainsIsPositive,
      realizedData,
      unrealizedData
    };
  };

  const kpiData = getKPIData();

  // Helper function to format date display
  const getDateRangeDisplay = () => {
    if (!startDate || !endDate) {
      return "All Time";
    }
    
    const formatDate = (dateStr) => {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      }).replace(/\//g, '/');
    };
    
    if (startDate === endDate) {
      return `As of ${formatDate(endDate)}`;
    } else {
      return `As of ${formatDate(endDate)}`;
    }
  };

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
        gap: sidebarOpen ? '0.5rem' : '0.6rem',
        height: 'fit-content',
        padding: '0',
        background: 'transparent',
        border: 'none',
        overflow: 'visible',
        alignItems: 'stretch',
        justifyContent: 'center',
        flexWrap: 'wrap',
        width: '100%',
        transition: 'gap 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }}>
        <KPICard
          label="Portfolio Value"
          value={kpiData.currentValue}
          theme={theme}
          tooltip="Current market value of all your holdings calculated with real-time prices"
          sidebarOpen={sidebarOpen}
        />
        
        <KPICard
          label="Cost Basis"
          value={kpiData.totalInvested}
          theme={theme}
          tooltip="Total amount invested in fiat purchases only, including all trading fees"
          sidebarOpen={sidebarOpen}
        />
        
        <KPICard
          label="Realized Gains"
          value={kpiData.realizedData?.value || '0,00€'}
          changePercent={kpiData.realizedData?.percent || '0.00%'}
          isPositive={kpiData.realizedData?.isPositive || false}
          theme={theme}
          showChange={true}
          tooltip="Profit or loss from assets you have sold (locked in gains/losses)"
          sidebarOpen={sidebarOpen}
        />
        
        <KPICard
          label="Unrealized Gains"
          value={kpiData.unrealizedData?.value || '0,00€'}
          changePercent={kpiData.unrealizedData?.percent || '0.00%'}
          isPositive={kpiData.unrealizedData?.isPositive || false}
          theme={theme}
          showChange={true}
          tooltip="Profit or loss from assets you currently hold (paper gains/losses)"
          sidebarOpen={sidebarOpen}
        />
        
        <KPICard
          label="Total Gains"
          value={kpiData.totalGains}
          changePercent={kpiData.profitPercent}
          isPositive={kpiData.totalGainsIsPositive}
          theme={theme}
          showChange={true}
          tooltip="Combined realized and unrealized gains/losses - your total profit or loss"
          sidebarOpen={sidebarOpen}
        />
        
        <KPICard
          label="Total Fees"
          value={kpiData.fees}
          theme={theme}
          tooltip="Total trading fees paid to the exchange for all buy and sell transactions"
          sidebarOpen={sidebarOpen}
        />
      </div>
    </div>
  );
};

export default KPIGrid;