import { Line } from 'react-chartjs-2';
import { useState } from 'react';

const TimelineChart = ({ portfolioData, theme }) => {
  const [showTotalInvested, setShowTotalInvested] = useState(true);
  const [viewMode, setViewMode] = useState('both'); // 'both', 'balance'
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
            
            // Color base según el valor, con opacidad reducida para suavidad
            const baseColor = value > 0 ? '34, 197, 94' : '239, 68, 68';
            const color = `rgba(${baseColor}, 0.15)`;
            
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
        pointHoverRadius: 0,
        pointBackgroundColor: 'transparent',
        pointBorderColor: 'transparent',
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        borderWidth: 4,
        pointStyle: 'line',
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
      
      // Si mostrar Total Invested
      if (showTotalInvested) {
        datasets.push({
          label: 'Total Invested',
          data: investedValues,
          borderColor: 'rgba(208, 208, 208, 0.8)',
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
          borderWidth: 3,
          pointStyle: 'line'
        });
      }
      
      // Market Value con sombreado
      datasets.push({
        label: 'Market Value',
        data: portfolioValues,
        borderColor: '#22c55e', // Color base, se sobrescribe con segment
        backgroundColor: function(context) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return marketAreaColor;
          
          // Área se colorea SOLO donde la línea ya se ha dibujado (de izquierda a derecha)
          const isAnimating = chart._animator && chart._animator.running;
          if (showTotalInvested && isAnimating) {
            // Calcular hasta qué punto del gráfico ha llegado la animación
            const progress = Math.min((chart._animator.progress || 0), 1);
            const revealedWidth = progress; // 0 = nada, 1 = todo
            
            // Crear gradiente que va de coloreado a transparente
            const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
            
            if (revealedWidth === 0) {
              // Al inicio: todo transparente
              gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
              gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
              return gradient;
            }
            
            // Parte ya revelada: colorear según corresponde
            const segmentSize = 1 / portfolioValues.length;
            let currentPos = 0;
            
            while (currentPos < revealedWidth && currentPos < 1) {
              const segmentIndex = Math.floor(currentPos / segmentSize);
              if (segmentIndex < portfolioValues.length) {
                const marketValue = portfolioValues[segmentIndex];
                const investedValue = investedValues[segmentIndex] || 0;
                const baseColor = marketValue > investedValue ? '34, 197, 94' : '239, 68, 68';
                const color = `rgba(${baseColor}, 0.15)`;
                
                const segmentStart = segmentIndex * segmentSize;
                const segmentEnd = Math.min((segmentIndex + 1) * segmentSize, revealedWidth);
                
                gradient.addColorStop(segmentStart, color);
                gradient.addColorStop(segmentEnd, color);
                
                currentPos = segmentEnd;
              } else {
                break;
              }
            }
            
            // Transición suave en el borde
            if (revealedWidth < 1) {
              gradient.addColorStop(revealedWidth, 'rgba(0, 0, 0, 0.02)');
              gradient.addColorStop(Math.min(revealedWidth + 0.05, 1), 'rgba(0, 0, 0, 0)');
            }
            
            // Resto: completamente transparente
            if (revealedWidth < 1) {
              gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            }
            
            return gradient;
          }
          
          if (!showTotalInvested) {
            // Sin invested = gradiente verde suave
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(34, 197, 94, 0.25)');
            gradient.addColorStop(0.5, 'rgba(34, 197, 94, 0.12)');
            gradient.addColorStop(1, 'rgba(34, 197, 94, 0.03)');
            return gradient;
          }
          
          // Crear gradiente horizontal segmentado punto por punto
          const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
          
          // Dividir en segmentos según los puntos de datos
          const segmentSize = 1 / portfolioValues.length;
          
          for (let i = 0; i < portfolioValues.length; i++) {
            const position = i * segmentSize;
            const nextPosition = (i + 1) * segmentSize;
            const marketValue = portfolioValues[i];
            const investedValue = investedValues[i] || 0;
            
            // Color según si market gana o pierde en este punto
            const baseColor = marketValue > investedValue ? '34, 197, 94' : '239, 68, 68';
            const color = `rgba(${baseColor}, 0.15)`;
            
            gradient.addColorStop(position, color);
            if (i < portfolioValues.length - 1) {
              gradient.addColorStop(nextPosition - 0.001, color);
            }
          }
          
          return gradient;
        },
        fill: showTotalInvested ? '-1' : 'origin', // Fill to previous dataset or origin
        tension: 0.5,
        pointRadius: 0,
        pointHoverRadius: 0,
        pointBackgroundColor: 'transparent',
        pointBorderColor: 'transparent',
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        borderWidth: 4,
        pointStyle: 'line',
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
      duration: 420,
      easing: 'easeOutCubic',
      animateScale: false,
      animateRotate: false,
      delay: function(context) {
        return context.dataIndex * 5;
      }
    },
    animations: {
      // Animación simple y fluida
      y: {
        type: 'number',
        easing: 'easeOutQuart',
        duration: 500,
        delay: function(context) {
          // Retrasar ligeramente la línea invested para efecto escalonado
          if (context.chart.data.datasets[context.datasetIndex].label === 'Total Invested') {
            return context.dataIndex * 8;
          }
          return context.dataIndex * 4;
        }
      }
    },
    transitions: {
      active: {
        animation: {
          duration: 100
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
            duration: 400,
            easing: 'easeInQuart'
          },
          backgroundColor: {
            to: 'rgba(0, 0, 0, 0)',
            duration: 300,
            easing: 'easeInSine'
          }
        }
      }
    },
    layout: {
      padding: {
        left: 40,
        right: 20,
        top: 20,
        bottom: 20
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    },
    elements: {
      point: {
        radius: 2,
        hoverRadius: 6,
        borderWidth: 2,
        hoverBorderWidth: 3
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
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#e5e5e5',
        bodyColor: '#e5e7eb',
        borderColor: 'rgba(208, 208, 208, 0.2)',
        borderWidth: 1,
        cornerRadius: 16,
        padding: 20,
        titleFont: {
          size: 16,
          family: "'Space Grotesk', sans-serif",
          weight: '700'
        },
        bodyFont: {
          size: 14,
          family: "'Inter', sans-serif",
          weight: '600'
        },
        footerFont: {
          size: 13,
          family: "'Inter', sans-serif",
          weight: '500',
          style: 'italic'
        },
        displayColors: true,
        usePointStyle: true,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
        caretSize: 8,
        multiKeyBackground: 'transparent',
        callbacks: {
          title: function(tooltipItems) {
            // El label viene en formato dd/mm/yy, necesitamos convertirlo correctamente
            const labelText = tooltipItems[0].label;
            
            // Buscar la fecha original en los datos
            const dataIndex = tooltipItems[0].dataIndex;
            const originalDate = portfolioData?.timeline[dataIndex]?.date;
            
            if (originalDate) {
              const date = new Date(originalDate);
              return date.toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              });
            }
            
            // Fallback: intentar parsear el label
            return labelText;
          },
          label: function(context) {
            const value = context.parsed.y;
            const formatted = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'EUR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(value);
            return `${context.dataset.label}: ${formatted}`;
          },
          afterBody: function(tooltipItems) {
            if (tooltipItems.length === 2) {
              const invested = tooltipItems[0].parsed.y;
              const market = tooltipItems[1].parsed.y;
              const profit = market - invested;
              const profitPct = invested > 0 ? ((profit / invested) * 100) : 0;
              const profitFormatted = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(Math.abs(profit));
              
              return [
                '',
                `${profit >= 0 ? '📈' : '📉'} P&L: ${profit >= 0 ? '+' : '-'}${profitFormatted} (${profitPct >= 0 ? '+' : ''}${profitPct.toFixed(1)}%)`
              ];
            }
            return [];
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#b5b5b5',
          font: {
            size: 16,
            family: "'Inter', sans-serif",
            weight: '600'
          },
          maxTicksLimit: 12,
          padding: 12
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
        {/* Controles y Leyenda */}
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0', // Mover a la izquierda
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          fontSize: '14px',
          fontFamily: "'Inter', sans-serif",
          fontWeight: '600',
          zIndex: 10
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
                  fontSize: '13px',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: viewMode === 'both' ? 'scale(1.02)' : 'scale(1)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: viewMode === 'both' 
                    ? '0 4px 20px rgba(34, 197, 94, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.2)' 
                    : '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  if (viewMode !== 'both') {
                    e.target.style.color = '#ffffff';
                    e.target.style.transform = 'scale(1.03)';
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.target.style.boxShadow = '0 4px 16px rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (viewMode !== 'both') {
                    e.target.style.color = 'rgba(245, 245, 245, 0.8)';
                    e.target.style.transform = 'scale(1)';
                    e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
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
                  fontSize: '13px',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: viewMode === 'balance' ? 'scale(1.02)' : 'scale(1)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: viewMode === 'balance' 
                    ? '0 4px 20px rgba(34, 197, 94, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.2)' 
                    : '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  if (viewMode !== 'balance') {
                    e.target.style.color = '#ffffff';
                    e.target.style.transform = 'scale(1.03)';
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.target.style.boxShadow = '0 4px 16px rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (viewMode !== 'balance') {
                    e.target.style.color = 'rgba(245, 245, 245, 0.8)';
                    e.target.style.transform = 'scale(1)';
                    e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
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
                  onClick={() => setShowTotalInvested(!showTotalInvested)}
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
                    fontSize: '12px',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
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
                      ? 'rgba(255, 255, 255, 0.2)' 
                      : 'rgba(255, 255, 255, 0.12)';
                    e.target.style.color = '#ffffff';
                    e.target.style.transform = 'scale(1.02)';
                    e.target.style.boxShadow = '0 4px 16px rgba(255, 255, 255, 0.15)';
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
                gap: '8px',
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
                gap: '8px',
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
                gap: '8px',
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
        </div>
      </div>
      
      {/* Contenedor del gráfico expandido */}
      <div style={{ 
        width: 'calc(100% + 140px)', // Extender más para mejor alineación
        marginLeft: '-50px', // Ajustado para evitar que se corten los números
        height: '800px', // Aumentar altura
        minHeight: '800px', 
        position: 'relative',
        background: 'transparent',
        borderRadius: '0',
        padding: '0',
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