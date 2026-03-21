const PortfolioSection = ({ portfolioData, theme, filters = {} }) => {
  return (
    <section style={{
      minHeight: '100vh',
      background: theme.bg,
      color: theme.textPrimary,
      padding: 'clamp(1rem, 4vw, 2rem)',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        textAlign: 'center',
        color: theme.textSecondary
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: '600',
          color: theme.textPrimary,
          fontFamily: "'Space Grotesk', sans-serif",
          marginBottom: '1rem'
        }}>
          Portfolio Section
        </h2>
        <p>Detailed portfolio breakdown and holdings coming soon...</p>
      </div>
    </section>
  );
};

export default PortfolioSection;