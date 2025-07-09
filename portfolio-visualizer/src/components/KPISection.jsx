  import { calculateKPIs } from '../utils/chartUtils';

const KPISection = ({ portfolioData }) => {
  if (!portfolioData) return null;

  const kpis = calculateKPIs(portfolioData);
  const { symbol, totalInvested, totalCurrent, profit, profitPercent, liquidity } = kpis;

  const kpiCards = [
    {
      title: 'Total Invested',
      value: `${symbol}${totalInvested.toFixed(2)}`,
      color: '#ffffff',
      titleColor: '#ffffff'
    },
    {
      title: 'Current Value',
      value: `${symbol}${totalCurrent.toFixed(2)}`,
      color: '#ffffff',
      titleColor: '#ffffff'
    },
    {
      title: 'Liquidity',
      value: `${symbol}${liquidity.toFixed(2)}`,
      color: '#ffffff',
      titleColor: '#ffffff'
    },
    {
      title: 'Profit',
      value: `${symbol}${profit.toFixed(2)}`,
      color: profit >= 0 ? '#22c55e' : '#ef4444',
      titleColor: '#ffffff'
    },
    {
      title: 'Profit %',
      value: `${profitPercent.toFixed(2)}%`,
      color: profitPercent >= 0 ? '#22c55e' : '#ef4444',
      titleColor: '#ffffff'
    }
  ];

  return (
    <section style={{ marginBottom: '48px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '16px',
          fontFamily: 'JetBrains Mono, monospace'
        }}>
          Global Portfolio Summary
        </h2>
        <div style={{
          width: '128px',
          height: '4px',
          background: 'linear-gradient(to right, #8b5cf6, #06b6d4)',
          margin: '0 auto',
          borderRadius: '9999px'
        }}></div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '24px',
        width: '100%'
      }}>
        {kpiCards.map((kpi, index) => (
          <div 
            key={index}
            style={{ position: 'relative' }}
          >
            {/* Background glow effect */}
            <div style={{
              position: 'absolute',
              inset: '-2px',
              background: 'linear-gradient(to right, #9333ea, #0891b2)',
              borderRadius: '12px',
              filter: 'blur(4px)',
              opacity: 0.2,
              transition: 'opacity 0.3s ease'
            }}></div>
            
            {/* Card content */}
            <div style={{
              position: 'relative',
              backgroundColor: '#111827',
              border: '1px solid #374151',
              borderRadius: '12px',
              padding: '20px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#8b5cf6';
              e.target.style.boxShadow = '0 10px 25px rgba(139, 92, 246, 0.2)';
              e.target.previousSibling.style.opacity = '0.4';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#374151';
              e.target.style.boxShadow = 'none';
              e.target.previousSibling.style.opacity = '0.2';
            }}>
              <h3 style={{
                color: kpi.titleColor,
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: 'JetBrains Mono, monospace'
              }}>
                {kpi.title}
              </h3>
              
              <p style={{
                fontSize: '32px',
                fontWeight: 'bold',
                fontFamily: 'JetBrains Mono, monospace',
                color: kpi.color,
                transition: 'color 0.3s ease',
                margin: '0'
              }}>
                {kpi.value}
              </p>
              
              {/* Animated border */}
              <div style={{
                position: 'absolute',
                bottom: '0',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '0',
                height: '2px',
                background: 'linear-gradient(to right, #8b5cf6, #06b6d4)',
                transition: 'width 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.width = '75%';
              }}
              onMouseLeave={(e) => {
                e.target.style.width = '0';
              }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance indicator */}
      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '12px 24px',
          borderRadius: '9999px',
          fontSize: '18px',
          fontWeight: '600',
          backgroundColor: profit >= 0 ? 'rgba(22, 163, 74, 0.3)' : 'rgba(239, 68, 68, 0.3)',
          color: 'white',
          border: `1px solid ${profit >= 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`
        }}>
          <span>
            Portfolio Performance: {profit >= 0 ? 'Positive' : 'Negative'}
          </span>
        </div>
      </div>
    </section>
  );
};

export default KPISection;