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

    // Create point colors based on profit/loss at each point
    const pointColors = portfolioValues.map((value, index) => {
      const invested = investedValues[index] || 0;
      return value >= invested ? '#22c55e' : '#ef4444'; // Green if profit, red if loss
    });

    // Construir datasets según el modo de vista
    let datasets = [];
    
    // Si estamos en modo balance, solo mostrar la línea de balance
    if (viewMode === 'balance') {
      datasets.push({
        label: 'Balance (P&L)',
        data: balanceValues,
        borderColor: function(context) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return '#22c55e';
          
          // Crear gradiente para la línea de balance
          const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
          
          const lastBalance = balanceValues[balanceValues.length - 1];
          
          if (lastBalance >= 0) {
            gradient.addColorStop(0, '#10b981');
            gradient.addColorStop(0.5, '#22c55e');
            gradient.addColorStop(1, '#34d399');
          } else {
            gradient.addColorStop(0, '#dc2626');
            gradient.addColorStop(0.5, '#ef4444');
            gradient.addColorStop(1, '#f87171');
          }
          
          return gradient;
        },
        backgroundColor: function(context) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return 'transparent';
          
          // Crear gradiente de fondo
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          
          // Determinar si hay más ganancias o pérdidas
          let positivePoints = 0;
          for (let i = 0; i < balanceValues.length; i++) {
            if (balanceValues[i] >= 0) positivePoints++;
          }
          
          const isOverallPositive = positivePoints > balanceValues.length / 2;
          
          if (isOverallPositive) {
            gradient.addColorStop(0, 'rgba(34, 197, 94, 0.3)');
            gradient.addColorStop(0.3, 'rgba(34, 197, 94, 0.15)');
            gradient.addColorStop(0.7, 'rgba(34, 197, 94, 0.05)');
            gradient.addColorStop(1, 'rgba(34, 197, 94, 0.01)');
          } else {
            gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
            gradient.addColorStop(0.3, 'rgba(239, 68, 68, 0.15)');
            gradient.addColorStop(0.7, 'rgba(239, 68, 68, 0.05)');
            gradient.addColorStop(1, 'rgba(239, 68, 68, 0.01)');
          }
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
        pointStyle: 'line'
      });
    } else {
      // Modo normal: mostrar ambas líneas (con opción de ocultar Total Invested)
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
      
      datasets.push(
        {
          label: 'Market Value',
          data: portfolioValues,
          borderColor: function(context) {
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) return '#22c55e';
            
            // Crear gradiente para la línea
            const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
            
            const lastValue = portfolioValues[portfolioValues.length - 1];
            const lastInvested = investedValues[investedValues.length - 1] || 0;
            
            if (lastValue >= lastInvested) {
              gradient.addColorStop(0, '#10b981');
              gradient.addColorStop(0.5, '#22c55e');
              gradient.addColorStop(1, '#34d399');
            } else {
              gradient.addColorStop(0, '#dc2626');
              gradient.addColorStop(0.5, '#ef4444');
              gradient.addColorStop(1, '#f87171');
            }
            
            return gradient;
          },
          backgroundColor: function(context) {
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) return 'transparent';
            
            // Crear gradiente más suave y visible
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            
            // Determinar si hay más ganancias o pérdidas en el portfolio
            let profitablePoints = 0;
            for (let i = 0; i < portfolioValues.length; i++) {
              const value = portfolioValues[i];
              const invested = investedValues[i] || 0;
              if (value >= invested) profitablePoints++;
            }
            
            const isOverallProfitable = profitablePoints > portfolioValues.length / 2;
            
            if (isOverallProfitable) {
              gradient.addColorStop(0, 'rgba(34, 197, 94, 0.3)');
              gradient.addColorStop(0.3, 'rgba(34, 197, 94, 0.15)');
              gradient.addColorStop(0.7, 'rgba(34, 197, 94, 0.05)');
              gradient.addColorStop(1, 'rgba(34, 197, 94, 0.01)');
            } else {
              gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
              gradient.addColorStop(0.3, 'rgba(239, 68, 68, 0.15)');
              gradient.addColorStop(0.7, 'rgba(239, 68, 68, 0.05)');
              gradient.addColorStop(1, 'rgba(239, 68, 68, 0.01)');
            }
            return gradient;
          },
          fill: '+1', // Fill to the previous dataset (Total Invested)
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
              const startValue = portfolioValues[startIndex];
              const startInvested = investedValues[startIndex] || 0;
              return startValue >= startInvested ? '#22c55e' : '#ef4444';
            }
          }
        }
      );
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
      duration: 2000,
      easing: 'easeInOutCubic',
      animateScale: true,
      animateRotate: true
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
          color: '#d0d0d0',
          font: {
            size: 14,
            family: "'Inter', sans-serif",
            weight: '600'
          },
          maxTicksLimit: 8,
          padding: 12
        },
        grid: {
          display: true,
          color: 'rgba(208, 208, 208, 0.1)',
          lineWidth: 1
        },
        border: {
          display: true,
          color: 'rgba(208, 208, 208, 0.3)',
          width: 2
        },
        title: {
          display: false
        }
      },
      y: {
        ticks: {
          color: '#d0d0d0',
          font: {
            size: 14,
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
          display: true,
          color: 'rgba(208, 208, 208, 0.1)',
          lineWidth: 1
        },
        border: {
          display: true,
          color: 'rgba(208, 208, 208, 0.3)',
          width: 2
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
        marginBottom: '1rem'
      }}>
        {/* Controles y Leyenda */}
        <div style={{
          position: 'absolute',
          top: '0',
          right: '60px', // Espacio para el eje Y
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          fontSize: '14px',
          fontFamily: "'Inter', sans-serif",
          fontWeight: '600',
          zIndex: 10
        }}>
          {/* Botones de control */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginRight: '1rem'
          }}>
            {/* Toggle para mostrar/ocultar Total Invested */}
            {viewMode === 'both' && (
              <button
                onClick={() => setShowTotalInvested(!showTotalInvested)}
                style={{
                  background: showTotalInvested ? 'rgba(208, 208, 208, 0.2)' : 'transparent',
                  border: `1px solid rgba(208, 208, 208, 0.4)`,
                  borderRadius: '4px',
                  padding: '4px 8px',
                  color: '#e5e5e5',
                  fontSize: '11px',
                  fontFamily: "'Inter', sans-serif",
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = '1';
                }}
              >
                {showTotalInvested ? 'Hide' : 'Show'} Invested
              </button>
            )}
            
            {/* Toggle para cambiar entre modos */}
            <button
              onClick={() => setViewMode(viewMode === 'both' ? 'balance' : 'both')}
              style={{
                background: viewMode === 'balance' ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                border: `1px solid ${viewMode === 'balance' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(208, 208, 208, 0.4)'}`,
                borderRadius: '4px',
                padding: '4px 8px',
                color: viewMode === 'balance' ? '#22c55e' : '#e5e5e5',
                fontSize: '11px',
                fontFamily: "'Inter', sans-serif",
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (viewMode === 'balance') {
                  e.target.style.background = 'rgba(34, 197, 94, 0.3)';
                  e.target.style.borderColor = 'rgba(34, 197, 94, 0.6)';
                } else {
                  e.target.style.background = 'rgba(208, 208, 208, 0.3)';
                  e.target.style.borderColor = 'rgba(208, 208, 208, 0.6)';
                }
              }}
              onMouseLeave={(e) => {
                if (viewMode === 'balance') {
                  e.target.style.background = 'rgba(34, 197, 94, 0.2)';
                  e.target.style.borderColor = 'rgba(34, 197, 94, 0.4)';
                } else {
                  e.target.style.background = 'transparent';
                  e.target.style.borderColor = 'rgba(208, 208, 208, 0.4)';
                }
              }}
            >
              {viewMode === 'both' ? 'Balance Only' : 'Full View'}
            </button>
          </div>
          
          {/* Leyenda dinámica según el modo */}
          {viewMode === 'balance' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '20px',
                height: '2px',
                background: 'linear-gradient(90deg, #10b981, #22c55e, #34d399)',
                borderRadius: '1px',
                boxShadow: '0 0 6px rgba(34, 197, 94, 0.3)'
              }}></div>
              <span style={{ 
                color: '#e5e5e5', 
                fontWeight: '600',
                fontSize: '13px'
              }}>Balance (P&L)</span>
            </div>
          ) : (
            <>
              {showTotalInvested && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '20px',
                    height: '2px',
                    background: 'repeating-linear-gradient(to right, rgba(200, 200, 200, 0.8) 0px, rgba(200, 200, 200, 0.8) 3px, transparent 3px, transparent 6px)',
                    borderRadius: '1px'
                  }}></div>
                  <span style={{ 
                    color: '#e5e5e5', 
                    fontWeight: '600',
                    fontSize: '13px'
                  }}>Total Invested</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '20px',
                  height: '2px',
                  background: 'linear-gradient(90deg, #10b981, #22c55e, #34d399)',
                  borderRadius: '1px',
                  boxShadow: '0 0 6px rgba(34, 197, 94, 0.3)'
                }}></div>
                <span style={{ 
                  color: '#e5e5e5', 
                  fontWeight: '600',
                  fontSize: '13px'
                }}>Market Value</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Contenedor del gráfico expandido */}
      <div style={{ 
        width: '100%', // Mismo ancho que la tabla
        marginLeft: '0', // Sin extensión lateral
        height: '700px',
        minHeight: '700px', 
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