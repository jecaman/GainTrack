import ApiForm from './ApiForm';

const ApiFormPage = ({ onSubmit, isLoading, error }) => (
  <div style={{ minHeight: '100vh', backgroundColor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
    <div style={{ maxWidth: '1000px', width: '100%' }}>
      {/* Cabecera */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <img 
          src="/logo.png"
          alt="Portfolio Visualizer Logo"
          style={{
            display: 'block',
            height: '260px',
            width: 'auto',
            maxWidth: '280px',
            objectFit: 'contain',
            margin: '-20px auto -20px' // Reducido el margen inferior
          }}
        />
        <h1 style={{ 
          fontSize: '42px',
          fontWeight: 'bold',
          color: 'white',
          margin: '5px 0 8px', // Reducido el margen superior
          fontFamily: 'JetBrains Mono, monospace'
        }}>
          Portfolio Visualizer
        </h1>
        <p style={{ 
          color: '#aa00fe',
          fontSize: '18px',
          margin: '0',
          fontFamily: 'JetBrains Mono, monospace',
          textShadow: '0 0 10px rgba(170, 0, 254, 0.6)'
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