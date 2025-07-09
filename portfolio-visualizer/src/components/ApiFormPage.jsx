import ApiForm from './ApiForm';

const ApiFormPage = ({ onSubmit, isLoading, error }) => (
  <div style={{ minHeight: '100vh', backgroundColor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
    <div style={{ maxWidth: '1000px', width: '100%' }}>
      {/* Cabecera */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <img 
          src="public/logo.png"
          alt="Portfolio Visualizer Logo"
          style={{
            display: 'block',
            height: '300px',
            width: 'auto',
            maxWidth: '360px',
            objectFit: 'contain',
            margin: '-150px auto 0px',
            '@media (maxWidth: 768px)': {
              height: '200px',
              maxWidth: '280px'
            }
          }}
        />
        <h1 style={{ 
          fontSize: '60px',
          fontWeight: 'bold',
          color: 'white',
          margin: '-50px 0 10px',
          fontFamily: 'JetBrains Mono, monospace',
          '@media (maxWidth: 768px)': {
            fontSize: '40px',
            margin: '-35px 0 8px'
          }
        }}>
          Portfolio Visualizer
        </h1>
        <p style={{ 
          color: '#aa00fe',
          fontSize: '24px',
          margin: '0',
          fontFamily: 'JetBrains Mono, monospace',
          textShadow: '0 0 10px rgba(170, 0, 254, 0.6), 0 0 20px rgba(170, 0, 254, 0.4), 0 0 30px rgba(170, 0, 254, 0.2)',
          animation: 'neonPulse 2s ease-in-out infinite alternate',
          '@media (maxWidth: 768px)': {
            fontSize: '18px'
          }
        }}>
          Track your crypto performance
        </p>
      </div>
      {/* Formulario de API */}
      <ApiForm onSubmit={onSubmit} isLoading={isLoading} error={error} />
    </div>
  </div>
);

export default ApiFormPage; 