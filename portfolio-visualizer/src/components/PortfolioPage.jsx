import PortfolioCharts from './PortfolioCharts';

const PortfolioPage = ({ portfolioData, timeline, onBack }) => (
  <div style={{ width: '100vw', minHeight: '100vh', background: 'black' }}>
    {/* Header Container - Menos margen */}
    <div style={{ padding: '20px 40px', borderBottom: '1px solid #374151' }}>
      <div style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: 'white',
          margin: '0',
          textAlign: 'left',
          fontFamily: 'JetBrains Mono, monospace'
        }}>
          Portfolio Visualizer
        </h1>
        <button
          onClick={onBack}
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '18px',
            fontWeight: 'bold'
          }}
        >
          ← Back to Form
        </button>
      </div>
    </div>
    
    {/* Content Container - Más margen */}
    <div style={{ padding: '40px 400px 0 400px' }}>
      <PortfolioCharts 
        portfolioData={portfolioData}
        timeline={timeline}
      />
    </div>
  </div>
);

export default PortfolioPage;