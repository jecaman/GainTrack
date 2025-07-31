import { Line } from 'react-chartjs-2';

const TimelineChart = ({ portfolioData, theme }) => {
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

    // Create point colors based on profit/loss at each point
    const pointColors = portfolioValues.map((value, index) => {
      const invested = investedValues[index] || 0;
      return value >= invested ? '#22c55e' : '#ef4444'; // Green if profit, red if loss
    });

    return {
      labels,
      datasets: [
        {
          label: 'Total Invested',
          data: investedValues,
          borderColor: theme.textSecondary + 'C0',
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 5,
          pointBackgroundColor: theme.textSecondary,
          pointBorderColor: theme.bgContainer,
          pointBorderWidth: 2,
          pointHoverBorderWidth: 3,
          borderDash: [8, 4],
          borderWidth: 2.5,
          pointStyle: 'circle'
        },
        {
          label: 'Market Value',
          data: portfolioValues,
          borderColor: function(context) {
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) return '#22c55e';
            
            const lastValue = portfolioValues[portfolioValues.length - 1];
            const lastInvested = investedValues[investedValues.length - 1] || 0;
            return lastValue >= lastInvested ? '#22c55e' : '#ef4444';
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
              gradient.addColorStop(0, 'rgba(34, 197, 94, 0.2)');   // Verde más visible
              gradient.addColorStop(0.6, 'rgba(34, 197, 94, 0.08)');
              gradient.addColorStop(1, 'rgba(34, 197, 94, 0.02)');
            } else {
              gradient.addColorStop(0, 'rgba(239, 68, 68, 0.2)');   // Rojo más visible
              gradient.addColorStop(0.6, 'rgba(239, 68, 68, 0.08)');
              gradient.addColorStop(1, 'rgba(239, 68, 68, 0.02)');
            }
            return gradient;
          },
          fill: '+1', // Fill to the previous dataset (Total Invested)
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: pointColors,
          pointBorderColor: theme.bgContainer,
          pointBorderWidth: 2,
          pointHoverBorderWidth: 3,
          borderWidth: 3.5,
          pointStyle: 'circle',
          segment: {
            borderColor: function(ctx) {
              const startIndex = ctx.p0DataIndex;
              const startValue = portfolioValues[startIndex];
              const startInvested = investedValues[startIndex] || 0;
              return startValue >= startInvested ? '#22c55e' : '#ef4444';
            }
          }
        }
      ]
    };
  };

  // Timeline Chart options
  const timelineOptions = {
    responsive: true,
    maintainAspectRatio: false,
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
        backgroundColor: theme.bgContainer,
        titleColor: theme.textPrimary,
        bodyColor: theme.textSecondary,
        borderColor: theme.border,
        borderWidth: 1,
        cornerRadius: 12,
        padding: 16,
        titleFont: {
          size: 14,
          family: "'Space Grotesk', sans-serif",
          weight: '600'
        },
        bodyFont: {
          size: 13,
          family: "'Inter', sans-serif",
          weight: '500'
        },
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        displayColors: true,
        usePointStyle: true,
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
          color: theme.textSecondary + 'B0',
          font: {
            size: 11,
            family: "'Inter', sans-serif",
            weight: '500'
          },
          maxTicksLimit: 6,
          padding: 8
        },
        grid: {
          display: false // Quitar grid horizontal
        },
        border: {
          display: false
        }
      },
      y: {
        ticks: {
          color: theme.textSecondary + 'B0',
          font: {
            size: 11,
            family: "'Inter', sans-serif",
            weight: '500'
          },
          padding: 12,
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
          display: false // Quitar grid vertical también
        },
        border: {
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
      height: "500px",
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      marginBottom: 'clamp(1.375rem, 4.4vw, 2.2rem)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontSize: 'clamp(11px, 2.2vw, 12px)',
          fontFamily: "'Inter', sans-serif",
          fontWeight: '500'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '12px',
              height: '2px',
              background: theme.textSecondary,
              opacity: 0.7,
              borderRadius: '1px'
            }}></div>
            <span style={{ color: theme.textSecondary, opacity: 0.8 }}>Total Invested</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '12px',
              height: '2px',
              background: '#22c55e',
              borderRadius: '1px'
            }}></div>
            <span style={{ color: theme.textSecondary, opacity: 0.8 }}>Market Value</span>
          </div>
        </div>
      </div>
      
      <div style={{ 
        flex: 1, 
        minHeight: 0, 
        position: 'relative',
        background: theme.bgContainer,
        borderRadius: '1rem',
        border: `1px solid ${theme.borderColor}`,
        padding: '1.5rem'
      }}>
        <Line data={timelineData} options={timelineOptions} />
      </div>
    </div>
  );
};

export default TimelineChart;