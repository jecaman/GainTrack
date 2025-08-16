import { Line } from 'react-chartjs-2';
import { useState, useEffect } from 'react';
import { Chart } from 'chart.js';

// Plugin de brillo personalizado con color dinámico
const glowPlugin = {
  id: 'customGlow',
  afterDraw(chart) {
    const { ctx } = chart;
    
    // Obtener elementos activos en hover
    const activeElements = chart.getActiveElements();
    
    if (activeElements.length > 0) {
      // Buscar el dataset con el order más alto (Market Value)
      let targetElement = activeElements[0];
      let highestOrder = -1;
      
      activeElements.forEach(el => {
        const dataset = chart.data.datasets[el.datasetIndex];
        const order = dataset.order || 0;
        
        if (order > highestOrder) {
          highestOrder = order;
          targetElement = el;
        }
      });
      
      const x = targetElement.element.x;
      const y = targetElement.element.y;
      const dataIndex = targetElement.index;
      
      // Determinar el color basado en los datos
      let pointColor = '#22c55e'; // Verde por defecto
      
      // Acceder a los datos para determinar profit/loss
      if (chart.config._config && chart.config._config.data && chart.config._config.data.datasets) {
        const datasets = chart.config._config.data.datasets;
        
        // Buscar dataset de Market Value y Total Invested
        const marketDataset = datasets.find(d => d.label === 'Market Value');
        const investedDataset = datasets.find(d => d.label === 'Total Invested');
        
        if (marketDataset && investedDataset && dataIndex < marketDataset.data.length) {
          const marketValue = marketDataset.data[dataIndex];
          const investedValue = investedDataset.data[dataIndex];
          
          // Verde si market > invested, rojo si market < invested
          pointColor = marketValue >= investedValue ? '#22c55e' : '#ef4444';
        }
      }
      
      ctx.save();
      
      // Línea punteada vertical blanca desde el punto hacia arriba 
      const lineTop = Math.max(45, y - 95); // 95px arriba del punto, mínimo 45px del top
      
      ctx.setLineDash([4, 4]); // Patrón de línea punteada
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y - 25); // Empezar un poco arriba del punto
      ctx.lineTo(x, lineTop);
      ctx.stroke();
      ctx.setLineDash([]); // Resetear línea punteada
      
      // Mostrar fecha arriba de la línea (más grande)
      if (chart.data.labels && chart.data.labels[dataIndex]) {
        const label = chart.data.labels[dataIndex];
        
        ctx.font = 'bold 18px Inter, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        // Fondo semi-transparente para la fecha (más grande)
        const textWidth = ctx.measureText(label).width;
        const padding = 12;
        const textY = lineTop - 10;
        
        // Ajustar posición X para evitar que se corte en los bordes
        const canvasWidth = chart.canvas.width;
        const safetyMargin = 30; // Margen de seguridad adicional
        const minX = textWidth/2 + padding + safetyMargin;
        const maxX = canvasWidth - textWidth/2 - padding - safetyMargin;
        const adjustedX = Math.max(minX, Math.min(maxX, x));
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(adjustedX - textWidth/2 - padding, textY - 22, textWidth + padding*2, 26);
        
        // Texto de la fecha
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, adjustedX, textY);
      }
      
      // Crear punto central sólido más visible
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = pointColor;
      ctx.fill();
      
      // Añadir borde blanco para contraste
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Crear gradiente radial para el brillo externo más intenso
      const gradient = ctx.createRadialGradient(x, y, 6, x, y, 20);
      const rgb = pointColor === '#22c55e' ? '34, 197, 94' : '239, 68, 68';
      
      gradient.addColorStop(0, `rgba(${rgb}, 0.6)`);
      gradient.addColorStop(0.4, `rgba(${rgb}, 0.4)`);
      gradient.addColorStop(0.7, `rgba(${rgb}, 0.2)`);
      gradient.addColorStop(1, `rgba(${rgb}, 0)`);
      
      // Dibujar el halo de brillo
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      ctx.restore();
    }
  }
};

// Registrar el plugin
Chart.register(glowPlugin);

const TimelineChart = ({ portfolioData, theme }) => {
  const [showTotalInvested, setShowTotalInvested] = useState(true);
  const [viewMode, setViewMode] = useState('both'); // 'both', 'balance'
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Inicializar fechas
  useEffect(() => {
    if (portfolioData?.timeline && portfolioData.timeline.length > 0) {
      const firstDate = new Date(portfolioData.timeline[0].date);
      const lastDate = new Date(portfolioData.timeline[portfolioData.timeline.length - 1].date);
      
      // Formatear fechas como DD/MM/YYYY
      const formatDate = (date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };
      
      setStartDate(formatDate(firstDate));
      setEndDate(formatDate(lastDate));
    }
    
    // Ocultar iconos de calendario de manera agresiva
    const hideCalendarIcon = () => {
      if (!document.querySelector('#date-picker-style')) {
        const style = document.createElement('style');
        style.id = 'date-picker-style';
        style.textContent = `
          input[type="date"]::-webkit-calendar-picker-indicator {
            display: none !important;
            -webkit-appearance: none !important;
            background: transparent !important;
            color: transparent !important;
            width: 0 !important;
            height: 0 !important;
            position: absolute !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
          input[type="date"]::-webkit-inner-spin-button,
          input[type="date"]::-webkit-outer-spin-button {
            -webkit-appearance: none !important;
            margin: 0 !important;
            display: none !important;
          }
          input[type="date"]::-moz-calendar-picker-indicator {
            display: none !important;
          }
        `;
        document.head.appendChild(style);
      }
    };
    
    hideCalendarIcon();
    // Ejecutar múltiples veces para asegurar que se aplique
    setTimeout(hideCalendarIcon, 100);
    setTimeout(hideCalendarIcon, 500);
  }, [portfolioData]);
  
  // Inicializar tooltip estático
  useEffect(() => {
    const tooltipArea = document.querySelector('#tooltip-area');
    if (tooltipArea && portfolioData?.timeline) {
      tooltipArea.innerHTML = renderTooltipContent();
    }
  }, [portfolioData, showTotalInvested, viewMode]);
  
  // Manejar transición cuando cambia showTotalInvested
  const handleInvestedToggle = () => {
    setShowTotalInvested(!showTotalInvested);
  };
  
  // Función para renderizar tooltip con datos específicos
  const renderTooltipContent = (dataIndex = null) => {
    if (!portfolioData?.timeline || portfolioData.timeline.length === 0) return '';
    
    // Usar el último punto si no se especifica índice
    const index = dataIndex !== null ? dataIndex : portfolioData.timeline.length - 1;
    const entry = portfolioData.timeline[index];
    
    if (!entry) return '';
    
    const date = new Date(entry.date);
    const marketValue = entry.value || 0;
    const investedValue = entry.cost || 0;
    const profit = marketValue - investedValue;
    const profitPct = investedValue > 0 ? ((profit / investedValue) * 100) : 0;
    
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    };
    
    // Construir el contenido en una sola línea con estilos específicos y buen espaciado
    const profitColor = profit >= 0 ? '#22c55e' : '#ef4444';
    const profitTriangle = profit >= 0 ? '▲' : '▼';
    
    const formatCurrencyEuroAfter = (value) => {
      const absValue = Math.abs(value);
      return new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(absValue) + '€';
    };
    
    let content = `<span style="color: #ffffff; font-size: 18px; vertical-align: baseline;">${date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })}</span>&nbsp;&nbsp;&nbsp;<span style="color: rgba(160, 160, 160, 0.8); font-size: 22px; vertical-align: baseline;">PORTFOLIO VALUE</span>&nbsp;&nbsp;<span style="font-size: 26px; vertical-align: baseline;">${formatCurrencyEuroAfter(marketValue)}</span>`;
    
    if (showTotalInvested && viewMode === 'both') {
      content += `&nbsp;&nbsp;&nbsp;<span style="color: rgba(160, 160, 160, 0.8); font-size: 22px; vertical-align: baseline;">COST BASIS</span>&nbsp;&nbsp;<span style="font-size: 26px; vertical-align: baseline;">${formatCurrencyEuroAfter(investedValue)}</span>&nbsp;&nbsp;&nbsp;<span style="color: rgba(160, 160, 160, 0.8); font-size: 22px; vertical-align: baseline;">PROFIT</span>&nbsp;&nbsp;<span style="color: ${profitColor}; font-size: 26px; vertical-align: baseline;">${profit >= 0 ? '+' : '-'}${formatCurrencyEuroAfter(profit)}</span><span style="color: ${profitColor}; font-size: 18px; vertical-align: top; position: relative; top: -2px;">&nbsp;${profitTriangle}</span><span style="color: ${profitColor}; font-size: 18px; vertical-align: baseline; position: relative; top: 0px;">${Math.abs(profitPct).toFixed(1)}%</span>`;
    } else if (viewMode === 'balance') {
      content += `&nbsp;&nbsp;&nbsp;<span style="color: rgba(160, 160, 160, 0.8); font-size: 22px; vertical-align: baseline;">PROFIT</span>&nbsp;&nbsp;<span style="color: ${profitColor}; font-size: 26px; vertical-align: baseline;">${profit >= 0 ? '+' : '-'}${formatCurrencyEuroAfter(profit)}</span>`;
    }
    
    return `
      <div class="custom-tooltip" style="
        position: relative;
        pointer-events: none;
        background: none !important;
        background-color: transparent !important;
        border: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        color: #ffffff;
        padding: 0;
        margin: 0;
        width: 100%;
        display: flex;
        align-items: baseline;
        font-family: 'Inter', sans-serif;
        font-size: 22px;
        font-weight: 700;
        opacity: 1;
        transform: scale(1);
        letter-spacing: 0.3px;
        line-height: 1;
      ">
        ${content}
      </div>
    `;
  };
  
  // Create Timeline Chart Data with conditional coloring
  const createTimelineData = () => {
    console.log('DEBUG - portfolioData.timeline:', portfolioData?.timeline);
    
    if (!portfolioData?.timeline || portfolioData.timeline.length === 0) {
      console.log('DEBUG - No timeline data available');
      return null;
    }

    const timelineData = portfolioData.timeline;
    const labels = timelineData.map(entry => {
      const date = new Date(entry.date);
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit',
        year: '2-digit'
      });
    });

    const investedValues = timelineData.map(entry => entry.cost || 0);
    const portfolioValues = timelineData.map(entry => entry.value || 0);
    
    // Calcular balance (profit/loss) para cada punto
    const balanceValues = timelineData.map(entry => (entry.value || 0) - (entry.cost || 0));
    
    // DEBUG: Ver los datos
    console.log('📊 DATOS DEBUG:');
    console.log('Portfolio values:', portfolioValues.slice(0, 3), '...');
    console.log('Invested values:', investedValues.slice(0, 3), '...');
    console.log('Balance values:', balanceValues.slice(0, 3), '...');
    console.log('View mode:', viewMode);
    console.log('Show invested:', showTotalInvested);

    // Create point colors based on profit/loss at each point
    const pointColors = portfolioValues.map((value, index) => {
      const invested = investedValues[index] || 0;
      return value >= invested ? '#22c55e' : '#ef4444'; // Green if profit, red if loss
    });

    // PRE-CALCULAR COLORES PARA EVITAR PROBLEMAS
    
    // Para P&L: calcular si hay mayoría positiva
    const positiveBalanceCount = balanceValues.filter(val => val > 0).length;
    const balanceIsPositive = positiveBalanceCount > balanceValues.length / 2;
    const balanceAreaColor = balanceIsPositive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';
    
    console.log('🎯 BALANCE COLOR CALC:', positiveBalanceCount, '/', balanceValues.length, '-> isPositive:', balanceIsPositive, '-> color:', balanceAreaColor);
    
    // Para Full View: calcular si market gana
    let marketWinsCount = 0;
    if (showTotalInvested) {
      for (let i = 0; i < portfolioValues.length; i++) {
        if (portfolioValues[i] > investedValues[i]) {
          marketWinsCount++;
        }
      }
    } else {
      marketWinsCount = portfolioValues.length; // Sin invested = siempre gana
    }
    
    const marketIsWinning = marketWinsCount > portfolioValues.length / 2;
    const marketAreaColor = marketIsWinning ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';
    
    console.log('🎯 MARKET COLOR CALC:', marketWinsCount, '/', portfolioValues.length, '-> isWinning:', marketIsWinning, '-> color:', marketAreaColor);
    
    // Construir datasets según el modo de vista
    let datasets = [];
    
    // Si estamos en modo balance, solo mostrar la línea de balance
    if (viewMode === 'balance') {
      datasets.push({
        label: 'Balance (P&L)',
        data: balanceValues,
        borderColor: function(context) {
          // Contar cuántos valores están por encima de 0
          const aboveZero = balanceValues.filter(val => val > 0).length;
          const totalPoints = balanceValues.length;
          const isPositive = aboveZero > totalPoints / 2;
          
          console.log('P&L: ' + aboveZero + '/' + totalPoints + ' above zero = ' + (isPositive ? 'GREEN' : 'RED'));
          
          return isPositive ? '#22c55e' : '#ef4444';
        },
        backgroundColor: function(context) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return balanceAreaColor;
          
          // Crear gradiente horizontal segmentado que cambie según los valores
          const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
          
          // Dividir en segmentos según los puntos de datos
          const segmentSize = 1 / balanceValues.length;
          
          for (let i = 0; i < balanceValues.length; i++) {
            const position = i * segmentSize;
            const nextPosition = (i + 1) * segmentSize;
            const value = balanceValues[i];
            
            // Color base según el valor, con opacidad más intensa
            const baseColor = value > 0 ? '34, 197, 94' : '239, 68, 68';
            const color = `rgba(${baseColor}, 0.3)`;
            
            gradient.addColorStop(position, color);
            if (i < balanceValues.length - 1) {
              gradient.addColorStop(nextPosition - 0.001, color);
            }
          }
          
          return gradient;
          
          return gradient;
        },
        fill: 'origin', // Rellenar hasta el eje X (línea de 0)
        tension: 0.5,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgba(255, 255, 255, 1)',
        pointBorderColor: 'rgba(255, 255, 255, 0.3)',
        pointBorderWidth: 0,
        pointHoverBorderWidth: 20,
        borderWidth: 4,
        pointStyle: 'circle',
        segment: {
          borderColor: function(ctx) {
            const startIndex = ctx.p0DataIndex;
            const endIndex = ctx.p1DataIndex;
            const startValue = balanceValues[startIndex];
            const endValue = balanceValues[endIndex];
            
            // Si ambos puntos están del mismo lado de 0, usar ese color
            if (startValue > 0 && endValue > 0) return '#22c55e';
            if (startValue <= 0 && endValue <= 0) return '#ef4444';
            
            // Si cruzan el 0, determinar qué color domina el segmento
            const zeroLine = 0;
            const startDistance = Math.abs(startValue - zeroLine);
            const endDistance = Math.abs(endValue - zeroLine);
            
            // Si el punto final está más lejos de 0, su color domina
            if (endDistance > startDistance) {
              return endValue > 0 ? '#22c55e' : '#ef4444';
            } else {
              return startValue > 0 ? '#22c55e' : '#ef4444';
            }
          }
        }
      });
    } else {
      // Modo normal: líneas con sombreado simple pero visible
      
      // Total Invested - siempre presente, pero con transparencia condicional
      datasets.push({
        label: 'Total Invested',
        data: investedValues,
        borderColor: showTotalInvested ? 'rgba(208, 208, 208, 0.8)' : 'rgba(208, 208, 208, 0)',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.5,
        pointRadius: 0,
        pointHoverRadius: 0,
        pointBackgroundColor: 'transparent',
        pointBorderColor: 'transparent',
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        borderDash: [10, 5],
        borderWidth: showTotalInvested ? 3 : 0,
        pointStyle: 'line',
        order: 1,
        hidden: false // Siempre visible para Chart.js, controlamos con transparencia
      });
      
      // Dataset para el área entre las líneas (siempre presente, controlado por transparencia)
      datasets.push({
        label: 'P&L Area',
        data: portfolioValues,
        backgroundColor: function(context) {
          if (!showTotalInvested) return 'transparent';
          
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return 'transparent';
          
          // Crear gradiente horizontal segmentado que cambie según profit/loss
          const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
          
          // Dividir en segmentos según los puntos de datos
          const segmentSize = 1 / Math.max(portfolioValues.length - 1, 1);
          
          for (let i = 0; i < portfolioValues.length; i++) {
            const position = i * segmentSize;
            const marketValue = portfolioValues[i];
            const investedValue = investedValues[i] || 0;
            
            // Determinar color: rojo si market < invested, verde si market > invested
            const isProfit = marketValue > investedValue;
            const color = isProfit 
              ? 'rgba(34, 197, 94, 0.35)' // Verde para ganancia (más intenso)
              : 'rgba(239, 68, 68, 0.35)'; // Rojo para pérdida (más intenso)
            
            gradient.addColorStop(position, color);
            
            // Suavizar transiciones añadiendo el mismo color al siguiente punto
            if (i < portfolioValues.length - 1) {
              const nextPosition = Math.min((i + 1) * segmentSize, 1);
              gradient.addColorStop(nextPosition - 0.001, color);
            }
          }
          
          return gradient;
        },
        fill: '-1', // Rellenar hasta el dataset anterior (Total Invested)
        borderColor: 'transparent',
        borderWidth: 0,
        pointRadius: 0,
        pointHoverRadius: 0,
        pointBackgroundColor: 'transparent',
        pointBorderColor: 'transparent',
        tension: 0.5,
        order: 2
      });
      
      // Market Value con sombreado
      datasets.push({
        label: 'Market Value',
        data: portfolioValues,
        borderColor: '#22c55e', // Color base, se sobrescribe con segment
        backgroundColor: function(context) {
          if (!showTotalInvested) {
            // Sin invested = gradiente verde suave
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) return 'transparent';
            
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(34, 197, 94, 0.4)');
            gradient.addColorStop(0.5, 'rgba(34, 197, 94, 0.25)');
            gradient.addColorStop(1, 'rgba(34, 197, 94, 0.08)');
            return gradient;
          }
          
          // Con invested, no backgroundColor en este dataset
          return 'transparent';
        },
        fill: !showTotalInvested ? 'origin' : false, // Solo fill cuando no hay invested
        tension: 0.5,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgba(255, 255, 255, 1)',
        pointBorderColor: 'rgba(255, 255, 255, 0.3)',
        pointBorderWidth: 0,
        pointHoverBorderWidth: 20,
        borderWidth: 4,
        pointStyle: 'circle',
        order: showTotalInvested ? 3 : 1,
        segment: {
          borderColor: function(ctx) {
            if (!showTotalInvested) {
              return '#22c55e'; // Sin invested = siempre verde
            }
            
            const startIndex = ctx.p0DataIndex;
            const endIndex = ctx.p1DataIndex;
            const startMarket = portfolioValues[startIndex];
            const startInvested = investedValues[startIndex] || 0;
            const endMarket = portfolioValues[endIndex];
            const endInvested = investedValues[endIndex] || 0;
            
            const startIsWinning = startMarket > startInvested;
            const endIsWinning = endMarket > endInvested;
            
            // Si ambos puntos están del mismo lado, usar ese color
            if (startIsWinning && endIsWinning) return '#22c55e';
            if (!startIsWinning && !endIsWinning) return '#ef4444';
            
            // Si hay cambio, determinar qué domina el segmento
            const startGap = Math.abs(startMarket - startInvested);
            const endGap = Math.abs(endMarket - endInvested);
            
            // El que tenga mayor diferencia (gap) domina el color del segmento
            if (endGap > startGap) {
              return endIsWinning ? '#22c55e' : '#ef4444';
            } else {
              return startIsWinning ? '#22c55e' : '#ef4444';
            }
          }
        }
      });
    }

    return {
      labels,
      datasets
    };
  };

  // Timeline Chart options
  const timelineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 250,
      easing: 'easeOutCubic',
      animateScale: false,
      animateRotate: false,
      delay: function(context) {
        // Dibujar de izquierda a derecha
        return context.dataIndex * 6;
      }
    },
    animations: {
      // Animación de dibujo de izquierda a derecha
      y: {
        type: 'number',
        easing: 'easeOutCubic',
        duration: 250,
        delay: function(context) {
          return context.dataIndex * 6;
        }
      }
    },
    transitions: {
      active: {
        animation: {
          duration: 50
        }
      },
      resize: {
        animation: {
          duration: 0
        }
      },
      show: {
        animations: {
          y: {
            from: 0,
            duration: 600,
            easing: 'easeOutQuart'
          }
        }
      },
      hide: {
        animations: {
          y: {
            to: function(ctx) {
              return ctx.chart.chartArea ? ctx.chart.chartArea.bottom : 0;
            },
            duration: 600,
            easing: 'easeInOutCubic'
          },
          backgroundColor: {
            to: 'rgba(0, 0, 0, 0)',
            duration: 500,
            easing: 'easeInOutSine'
          },
          borderColor: {
            to: 'rgba(0, 0, 0, 0)',
            duration: 500,
            easing: 'easeInOutSine'
          }
        }
      },
      // Transición personalizada para el cambio de fill
      mode: {
        animation: {
          duration: 500,
          easing: 'easeOutQuart'
        }
      }
    },
    layout: {
      padding: {
        left: 40,
        right: 40,
        top: 20,
        bottom: 30
      }
    },
    interaction: {
      mode: 'nearest',
      intersect: false,
      axis: 'x'
    },
    hover: {
      mode: 'nearest',
      intersect: false,
      animationDuration: 0
    },
    onHover: (event, activeElements) => {
      const tooltipArea = document.querySelector('#tooltip-area');
      if (tooltipArea) {
        if (activeElements.length > 0) {
          // Actualizar tooltip con el punto hover
          const dataIndex = activeElements[0].index;
          tooltipArea.innerHTML = renderTooltipContent(dataIndex);
        } else {
          // Volver al último punto cuando no hay hover
          tooltipArea.innerHTML = renderTooltipContent();
        }
      }
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 0,
        borderWidth: 0,
        hoverBorderWidth: 0,
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        hoverBackgroundColor: 'transparent',
        hoverBorderColor: 'transparent'
      },
      line: {
        tension: 0.4
      }
    },
    plugins: {
      legend: {
        display: false // Ocultamos la leyenda porque ya tenemos nuestra propia leyenda personalizada
      },
      tooltip: {
        enabled: false
      }
    },
    scales: {
      x: {
        display: false
      },
      y: {
        ticks: {
          color: '#b5b5b5',
          font: {
            size: 16,
            family: "'Inter', sans-serif",
            weight: '600'
          },
          padding: 15,
          callback: function(value) {
            if (value >= 1000000) {
              return '€' + (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
              return '€' + (value / 1000).toFixed(1) + 'K';
            }
            return '€' + Math.round(value);
          }
        },
        grid: {
          display: false
        },
        border: {
          display: false
        },
        title: {
          display: false
        }
      }
    }
  };

  const timelineData = createTimelineData();

  if (!timelineData) {
    return (
      <div style={{
        height: "500px",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.textSecondary,
        fontFamily: "'Inter', sans-serif"
      }}>
        No timeline data available
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: "fit-content",
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      margin: '0',
      padding: '0',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '0',
      boxSizing: 'border-box'
    }}>
      {/* Contenedor igual que AssetLeaderboard */}
      <div style={{
        background: 'transparent',
        border: 'none',
        borderRadius: '0',
        overflow: 'hidden'
      }}>
      <div style={{
        position: 'relative',
        marginBottom: '3.5rem',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Contenedor principal para controles */}
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0', // Hasta el borde derecho real
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px',
          fontFamily: "'Inter', sans-serif",
          fontWeight: '600',
          zIndex: 10
        }}>
          {/* Controles izquierda */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
          {/* Botones de control mejorados */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginRight: '1.5rem',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '14px',
            padding: '6px',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
          }}>
            {/* Selector de modo de vista con toggle fluido */}
            <div style={{
              position: 'relative',
              display: 'flex',
              background: 'transparent',
              borderRadius: '10px',
              padding: '0'
            }}>
              <button
                onClick={() => setViewMode('both')}
                style={{
                  background: viewMode === 'both' 
                    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.5), rgba(16, 185, 129, 0.6))' 
                    : 'rgba(255, 255, 255, 0.08)',
                  border: viewMode === 'both' 
                    ? '2px solid rgba(34, 197, 94, 0.7)' 
                    : '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  color: viewMode === 'both' ? '#ffffff' : 'rgba(245, 245, 245, 0.8)',
                  fontSize: '15px',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease-out',
                  transform: viewMode === 'both' ? 'scale(1.02)' : 'scale(1)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: viewMode === 'both' 
                    ? '0 4px 20px rgba(34, 197, 94, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.2)' 
                    : '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  if (viewMode !== 'both') {
                    e.target.style.color = '#ffffff';
                    e.target.style.transform = 'scale(1.02)';
                    e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                    e.target.style.boxShadow = '0 3px 12px rgba(255, 255, 255, 0.08)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (viewMode !== 'both') {
                    e.target.style.color = 'rgba(245, 245, 245, 0.8)';
                    e.target.style.transform = 'scale(1)';
                    e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  }
                }}
              >
                Full View
              </button>
              
              <button
                onClick={() => setViewMode('balance')}
                style={{
                  background: viewMode === 'balance' 
                    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.5), rgba(16, 185, 129, 0.6))' 
                    : 'rgba(255, 255, 255, 0.08)',
                  border: viewMode === 'balance' 
                    ? '2px solid rgba(34, 197, 94, 0.7)' 
                    : '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  color: viewMode === 'balance' ? '#ffffff' : 'rgba(245, 245, 245, 0.8)',
                  fontSize: '15px',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease-out',
                  transform: viewMode === 'balance' ? 'scale(1.02)' : 'scale(1)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: viewMode === 'balance' 
                    ? '0 4px 20px rgba(34, 197, 94, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.2)' 
                    : '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  if (viewMode !== 'balance') {
                    e.target.style.color = '#ffffff';
                    e.target.style.transform = 'scale(1.02)';
                    e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                    e.target.style.boxShadow = '0 3px 12px rgba(255, 255, 255, 0.08)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (viewMode !== 'balance') {
                    e.target.style.color = 'rgba(245, 245, 245, 0.8)';
                    e.target.style.transform = 'scale(1)';
                    e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  }
                }}
              >
                P&L View
              </button>
            </div>
            
            {/* Botón para mostrar/ocultar Total Invested - solo en modo 'both' */}
            {viewMode === 'both' && (
              <>
                <div style={{
                  width: '1px',
                  height: '20px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  margin: '0 4px'
                }}></div>
                <button
                  onClick={handleInvestedToggle}
                  style={{
                    background: showTotalInvested 
                      ? 'rgba(255, 255, 255, 0.15)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    border: showTotalInvested 
                      ? '1px solid rgba(255, 255, 255, 0.3)' 
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '7px 12px',
                    color: showTotalInvested ? '#ffffff' : 'rgba(245, 245, 245, 0.6)',
                    fontSize: '15px',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease-out',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backdropFilter: 'blur(10px)',
                    boxShadow: showTotalInvested 
                      ? '0 3px 12px rgba(255, 255, 255, 0.1)' 
                      : '0 1px 4px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = showTotalInvested 
                      ? 'rgba(255, 255, 255, 0.18)' 
                      : 'rgba(255, 255, 255, 0.1)';
                    e.target.style.color = '#ffffff';
                    e.target.style.transform = 'scale(1.01)';
                    e.target.style.boxShadow = '0 3px 12px rgba(255, 255, 255, 0.12)';
                    e.target.style.borderColor = showTotalInvested 
                      ? 'rgba(255, 255, 255, 0.4)' 
                      : 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = showTotalInvested 
                      ? 'rgba(255, 255, 255, 0.15)' 
                      : 'rgba(255, 255, 255, 0.05)';
                    e.target.style.color = showTotalInvested ? '#ffffff' : 'rgba(245, 245, 245, 0.6)';
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = showTotalInvested 
                      ? '0 3px 12px rgba(255, 255, 255, 0.1)' 
                      : '0 1px 4px rgba(0, 0, 0, 0.1)';
                    e.target.style.borderColor = showTotalInvested 
                      ? 'rgba(255, 255, 255, 0.3)' 
                      : 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: showTotalInvested 
                      ? 'linear-gradient(45deg, rgba(200, 200, 200, 1), rgba(255, 255, 255, 0.9))' 
                      : 'rgba(120, 120, 120, 0.5)',
                    transition: 'all 0.3s ease',
                    boxShadow: showTotalInvested 
                      ? '0 2px 8px rgba(255, 255, 255, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.5)' 
                      : 'none'
                  }}></span>
                  Invested
                </button>
              </>
            )}
          </div>
          
          {/* Leyenda dinámica - solo muestra elementos activos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {viewMode === 'both' && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  width: '20px',
                  height: '2px',
                  background: 'linear-gradient(90deg, #10b981, #22c55e, #34d399)',
                  borderRadius: '1px',
                  boxShadow: '0 0 6px rgba(34, 197, 94, 0.3)'
                }}></div>
                <span style={{ 
                  color: '#f5f5f5', 
                  fontWeight: '600',
                  fontSize: '15px'
                }}>Market Value</span>
              </div>
            )}
            
            {viewMode === 'both' && showTotalInvested && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  width: '20px',
                  height: '2px',
                  background: 'repeating-linear-gradient(to right, rgba(200, 200, 200, 0.8) 0px, rgba(200, 200, 200, 0.8) 3px, transparent 3px, transparent 6px)',
                  borderRadius: '1px'
                }}></div>
                <span style={{ 
                  color: '#f5f5f5', 
                  fontWeight: '600',
                  fontSize: '15px'
                }}>Total Invested</span>
              </div>
            )}
            
            {viewMode === 'balance' && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  width: '20px',
                  height: '2px',
                  background: 'linear-gradient(90deg, #10b981, #22c55e, #34d399)',
                  borderRadius: '1px',
                  boxShadow: '0 0 6px rgba(34, 197, 94, 0.3)'
                }}></div>
                <span style={{ 
                  color: '#f5f5f5', 
                  fontWeight: '600',
                  fontSize: '15px'
                }}>Balance (P&L)</span>
              </div>
            )}
          </div>
          
          {/* Botones de fechas a la derecha */}
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '0px'
          }}>
            {/* Botón fecha inicio */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              padding: '12px 13px',
              color: '#ffffff',
              fontSize: '14px',
              fontFamily: "'Inter', sans-serif",
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.25s ease-out',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.02)';
              e.target.style.background = 'rgba(255, 255, 255, 0.12)';
              e.target.style.boxShadow = '0 3px 12px rgba(255, 255, 255, 0.08)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
            onClick={() => {
              const input = document.getElementById('start-date-input');
              input.focus();
              input.select();
            }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(145, 145, 145, 0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <input
                id="start-date-input"
                type="text"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  fontSize: 'inherit',
                  fontFamily: 'inherit',
                  fontWeight: 'inherit',
                  outline: 'none',
                  minWidth: '0',
                  width: `${startDate.length * 0.66}em`,
                  textAlign: 'left',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none',
                  pointerEvents: 'none'
                }}
              />
            </div>
            
            {/* Línea divisora */}
            <div style={{
              width: '2px',
              height: '24px',
              background: 'rgba(255, 255, 255, 0.4)',
              margin: '0 8px',
              borderRadius: '1px'
            }}></div>
            
            {/* Botón fecha fin */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              padding: '12px 13px',
              color: '#ffffff',
              fontSize: '14px',
              fontFamily: "'Inter', sans-serif",
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.25s ease-out',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.02)';
              e.target.style.background = 'rgba(255, 255, 255, 0.12)';
              e.target.style.boxShadow = '0 3px 12px rgba(255, 255, 255, 0.08)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
            onClick={() => {
              const input = document.getElementById('end-date-input');
              input.focus();
              input.select();
            }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(145, 145, 145, 0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <input
                id="end-date-input"
                type="text"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  fontSize: 'inherit',
                  fontFamily: 'inherit',
                  fontWeight: 'inherit',
                  outline: 'none',
                  minWidth: '0',
                  width: `${endDate.length * 0.66}em`,
                  textAlign: 'left'
                }}
              />
            </div>
          </div>
        </div>
        </div>
      </div>
      
      {/* Línea del tooltip estático */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginTop: '2.5rem',
        marginBottom: '0.2rem'
      }}>
        {/* Área dedicada para tooltip estático */}
        <div id="tooltip-area" style={{ 
          minHeight: '80px', 
          flex: 1,
          position: 'relative',
          padding: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start'
        }}>
          {/* El tooltip se inicializará con el último día */}
        </div>
        
        {/* Espacio reservado para tooltip */}
        <div></div>
      </div>
      
      {/* Contenedor del gráfico expandido */}
      <div style={{ 
        width: 'calc(100% + 70px)', // Expandir hasta cubrir desde tooltip hasta botones
        marginLeft: '-50px', // Empezar desde el tooltip
        marginRight: '-20px', // Extender hasta los botones de fecha
        height: '800px', // Aumentar altura
        minHeight: '800px', 
        position: 'relative',
        background: 'transparent',
        borderRadius: '0',
        padding: '0', // Sin padding para usar todo el espacio
        margin: '1rem 0',
        boxSizing: 'border-box',
        border: 'none',
        overflow: 'visible'
      }}>
        <Line data={timelineData} options={timelineOptions} />
      </div>
      </div>
    </div>
  );
};

export default TimelineChart;