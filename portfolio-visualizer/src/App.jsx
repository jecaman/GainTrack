import { useState } from 'react';
import ApiForm from './components/ApiForm';
import PortfolioCharts from './components/PortfolioCharts';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [apiCredentials, setApiCredentials] = useState(null);
  const [showPortfolio, setShowPortfolio] = useState(false);

  const handleApiSubmit = async (apiData) => {
    setIsLoading(true);
    console.log('Datos de API recibidos:', apiData);

    // Store API credentials and show portfolio
    setApiCredentials(apiData);
    setShowPortfolio(true);
    setIsLoading(false);
  };

  const handleBackToForm = () => {
    setShowPortfolio(false);
    setApiCredentials(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'black',
      display: 'flex',
      alignItems: showPortfolio ? 'flex-start' : 'center',
      justifyContent: 'center',
      padding: showPortfolio ? '0' : '24px'
    }}>
      {!showPortfolio ? (
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
                '@media (max-width: 768px)': {
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
              '@media (max-width: 768px)': {
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
              '@media (max-width: 768px)': {
                fontSize: '18px'
              }
            }}>
              Track your crypto performance
            </p>
          </div>

          {/* Formulario de API */}
          <ApiForm onSubmit={handleApiSubmit} isLoading={isLoading} />
        </div>
      ) : (
        <div style={{ width: '100vw', maxWidth: '100vw', margin: '0', padding: '0' }}>
          {/* Header with back button */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '20px',
            padding: '20px 40px',
            backgroundColor: 'black'
          }}>
            <h1 style={{ 
              fontSize: '36px',
              fontWeight: 'bold',
              color: 'white',
              margin: '0',
              fontFamily: 'JetBrains Mono, monospace'
            }}>
              Portfolio Visualizer
            </h1>
            <button
              onClick={handleBackToForm}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace'
              }}
            >
              ← Back to Form
            </button>
          </div>

          {/* Portfolio Charts Component */}
          <PortfolioCharts 
            apiKey={apiCredentials?.apiKey} 
            apiSecret={apiCredentials?.apiSecret} 
          />
        </div>
      )}
    </div>
  );
}

export default App;
