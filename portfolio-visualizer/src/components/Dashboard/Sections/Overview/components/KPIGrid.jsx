import { useState, useMemo, useEffect } from 'react';
import { formatEuropeanCurrency, formatEuropeanPercentage } from '../../../../../utils/numberFormatter';

// KPI Card Component - Diseño limpio sin rectangulos
const KPICard = ({ label, value, changePercent, isPositive, theme, showChange = false, tooltip = null, sidebarOpen = false, windowWidth = 1200, isSmaller = false, isVerySmall = false }) => {
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  const [isCardHovered, setIsCardHovered] = useState(false);
  
  // Tamaño de fuente ADAPTADO al ancho disponible INDIVIDUAL de cada KPI
  const getValueFontSize = () => {
    const containerWidth = getCardWidthPixels(); // Ancho fijo del contenedor
    const margin = 14; // Margen lateral mínimo de 14px
    const availableWidth = containerWidth - margin;
    
    // Usar el contenido REAL de este KPI específico
    const thisValueLength = value ? value.toString().length : 0;
    const thisPercentLength = changePercent ? changePercent.toString().length : 0;
    const thisContentChars = thisValueLength + thisPercentLength + (showChange ? 2 : 0); // +2 solo si hay porcentaje
    
    // Debug: Log para ver qué está pasando
    if (label?.includes('Gains')) {
      console.log(`${label}: value="${value}" (${thisValueLength} chars), percent="${changePercent}" (${thisPercentLength} chars), total=${thisContentChars}`);
    }
    
    if (thisContentChars === 0) return '1.8rem'; // Default si no hay contenido
    
    // Calcular tamaño de fuente para que EL CONTENIDO DE ESTE KPI quepa
    const pixelsPerChar = availableWidth / thisContentChars;
    const fontSize = Math.min(pixelsPerChar / 12, 1.8); // Cambiado de 16 a 12 para permitir fuentes más grandes
    
    // Mínimo legible
    const minFontSize = windowWidth < 768 ? 0.9 : 1.0;
    
    const finalSize = Math.max(fontSize, minFontSize);
    
    if (label?.includes('Gains')) {
      console.log(`${label}: fontSize calculated = ${finalSize}rem`);
    }
    
    return `${finalSize}rem`;
  };
  
  // Tamaño de fuente para porcentajes PROPORCIONAL al valor
  const getPercentageFontSize = () => {
    const valueFontSize = parseFloat(getValueFontSize());
    return `${valueFontSize * 0.85}rem`; // 15% más pequeño que el valor
  };
  
  // Ancho FIJO con margen constante - la letra se adapta
  const getCardWidthPixels = () => {
    // Ancho aumentado por dispositivo
    if (windowWidth < 768) return 220; // Móvil +20px
    if (windowWidth < 1024) return 250; // Tablet +30px
    return 270; // Desktop +30px
  };
  
  const getCardWidth = () => {
    return `${getCardWidthPixels()}px`;
  };
  
  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center', // Centrar verticalmente todo el contenido
        textAlign: 'center',
        position: 'relative',
        width: getCardWidth(),
        minWidth: getCardWidth(),
        maxWidth: getCardWidth(),
        height: '110px', // Altura reducida para menos margen inferior
        overflow: 'hidden', // Contener el contenido dentro del KPI
        border: `1px solid ${isCardHovered ? '#00ff88' : 'transparent'}`, // Borde verde fosforito en hover
        borderRadius: '12px', // Bordes redondeados
        padding: '6px', // Padding aún más reducido
        transition: 'all 0.3s ease', // Transición suave para efectos hover
        boxShadow: isCardHovered ? '0 0 20px rgba(0, 255, 136, 0.3)' : 'none', // Resplandor verde en hover
        cursor: tooltip ? 'pointer' : 'default' // Cursor pointer si hay tooltip
      }}
      onMouseEnter={() => setIsCardHovered(true)}
      onMouseLeave={() => setIsCardHovered(false)}
    >

      {/* Tooltip overlay - exactamente encuadrado en el KPI */}
      {tooltip && isTooltipHovered && (
        <div 
          style={{
            position: 'absolute',
            top: '0px', // Alineado con el top del KPI
            left: '0px', // Alineado con el left del KPI
            width: '100%', // Mismo ancho que el KPI
            height: '100%', // Misma altura que el KPI
            backgroundColor: 'rgba(0, 0, 0, 0.95)', // Fondo negro
            border: '1px solid rgba(0, 255, 136, 0.4)',
            borderRadius: '12px', // Mismos bordes redondeados que el KPI
            padding: '8px', // Mismo padding que el KPI
            zIndex: 999,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            color: '#ffffff',
            fontSize: '0.8rem', // Letra más grande
            lineHeight: '1.3',
            fontFamily: 'SF Mono, Monaco, monospace', // Misma fuente que el título
            pointerEvents: 'none',
            textAlign: 'center', // Centrado como el resto del contenido
            whiteSpace: 'pre-line',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {tooltip}
        </div>
      )}

      {/* Título del KPI con botón tooltip integrado */}
      <div 
        style={{
          color: '#ffffff',
          fontSize: '1.0rem', // Título un poco más grande
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontFamily: 'SF Mono, Monaco, monospace',
          textAlign: 'center',
          marginBottom: '8px', // Menos espacio entre título y contenido
          minHeight: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          whiteSpace: 'nowrap',
          position: 'relative',
          width: '100%' // Asegurar que ocupe todo el ancho
        }}
      >
        {/* Título centrado */}
        <span style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)', // Centrar exactamente
          whiteSpace: 'nowrap'
        }}>
          {label}
        </span>
        
        {/* Tooltip esquinado arriba derecha */}
        {tooltip && (
          <div 
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: isTooltipHovered ? '#00ff88' : 'rgba(255, 255, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: '700',
              color: isTooltipHovered ? '#000000' : '#ffffff',
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.2s ease',
              opacity: isTooltipHovered ? 1 : 0.7,
              transform: isTooltipHovered ? 'scale(1.1)' : 'scale(1)',
              position: 'absolute',
              top: '-1px', // 3 píxeles más arriba
              right: '2px', // Esquina derecha
              zIndex: 1000 // Por encima del tooltip overlay
            }}
            onMouseEnter={() => setIsTooltipHovered(true)}
            onMouseLeave={() => setIsTooltipHovered(false)}
          >
            <span style={{marginTop: '-1px'}}>?</span>
          </div>
        )}
      </div>
      
      {/* Valores en una sola línea */}
      <div style={{
        display: 'flex',
        flexDirection: 'row', // Volver a fila
        alignItems: 'baseline',
        justifyContent: 'center',
        gap: '4px', // Gap entre valor y porcentaje
        minHeight: '50px',
        width: '100%',
        textAlign: 'center',
        flexWrap: 'nowrap'
      }}>
        {/* Valor principal */}
        <span 
          style={{
            fontSize: getValueFontSize(),
            fontWeight: '700',
            color: (label === 'Portfolio Value' || label === 'Cost Basis') ? '#ffffff' : (isPositive ? '#00FF99' : '#ef4444'),
            fontFamily: 'SF Mono, Monaco, monospace',
            lineHeight: '1',
            maxWidth: showChange && changePercent ? '65%' : '100%', // Espacio compartido con porcentaje
            flexShrink: 1, // Permitir reducirse si es necesario
            whiteSpace: 'nowrap' // Mantener en una línea
          }}
        >
          {value}
        </span>
        
        {/* Porcentaje si existe */}
        {showChange && changePercent && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0px', // Sin espacio entre triángulo y porcentaje
            flexShrink: 0, // No permitir que se reduzca
            minWidth: 'fit-content' // Mantener tamaño mínimo
          }}>
            {/* Triángulo indicador */}
            <span style={{
              fontSize: getPercentageFontSize(),
              fontWeight: '600',
              color: isPositive ? '#00FF99' : '#ef4444',
              lineHeight: '1'
            }}>
              {isPositive ? '▲' : '▼'}
            </span>
            
            {/* Porcentaje */}
            <span style={{
              fontSize: getPercentageFontSize(),
              fontWeight: '600',
              color: isPositive ? '#00FF99' : '#ef4444',
              fontFamily: 'SF Mono, Monaco, monospace',
              lineHeight: '1',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%'
            }}>
              {changePercent}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Main KPI Grid Component (LIMPIO)
const KPIGrid = ({ portfolioData, theme, startDate, endDate, hiddenAssets = new Set(), excludedOperations = new Set(), sidebarOpen = false }) => {
  
  // Estado para controlar el tamaño de la ventana
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
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
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      paddingTop: '40px' // Espacio arriba de los KPIs
    }}>
      
      <div style={{
        display: 'flex',
        flexDirection: windowWidth < 768 ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center', // Centrado en lugar de space-evenly
        width: '100%',
        maxWidth: `${windowWidth - (windowWidth < 768 ? 20 : 40)}px`, // Contenedor más ancho
        padding: windowWidth < 768 ? '0 20px' : '0 40px',
        flexWrap: 'nowrap', // Siempre en línea para los 5 KPIs
        margin: '0 auto',
        gap: `${windowWidth < 768 ? 15 : 20}px` // Gap más pequeño para usar más espacio
      }}>
        <KPICard
          label="Portfolio Value"
          value={kpiData.currentValue}
          theme={theme}
          tooltip="Current market value of all your holdings calculated with real-time prices"
          sidebarOpen={sidebarOpen}
          windowWidth={windowWidth}
        />
        
        <KPICard
          label="Cost Basis"
          value={kpiData.totalInvested}
          theme={theme}
          tooltip={`Total amount invested in purchases\n\nOf this amount, ${kpiData.fees} went to trading fees`}
          sidebarOpen={sidebarOpen}
          windowWidth={windowWidth}
        />
        
        <KPICard
          label="Total Gains"
          value={kpiData.profit}
          changePercent={kpiData.profitPercent}
          isPositive={kpiData.isPositive}
          theme={theme}
          showChange={true}
          tooltip="Combined realized and unrealized gains/losses - your total profit or loss"
          sidebarOpen={sidebarOpen}
          windowWidth={windowWidth}
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
          windowWidth={windowWidth}
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
          windowWidth={windowWidth}
        />
      </div>
    </div>
  );
};

export default KPIGrid;