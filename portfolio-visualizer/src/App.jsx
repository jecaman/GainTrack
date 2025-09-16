import { useState, useEffect } from 'react';
import GainTrackFormPage from './components/GainTrackFormPage';
import Dashboard from './components/Dashboard/Dashboard';
import GainTrackKPIs from './components/GainTrackKPIs';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [apiCredentials, setApiCredentials] = useState(null);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [portfolioData, setPortfolioData] = useState(null);
  const [fullPortfolioData, setFullPortfolioData] = useState(null); // Datos completos del backend
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleApiSubmit = async (apiData) => {
    setIsLoading(true);
    setError('');
    setApiCredentials(apiData);
    
    try {
      let response, data;
      
      // Determinar si es CSV o API
      if (apiData.csvData) {
        // Datos ya procesados del CSV
        data = apiData.csvData;
      } else {
        // Llamada a la API normal
        response = await fetch('http://localhost:8001/api/portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: apiData.apiKey, api_secret: apiData.secretKey })
        });
        data = await response.json();
      }
      
      if (data.error) {
        setError(data.error);
        setIsLoading(false);
        // Auto-hide backend errors after 6 seconds
        setTimeout(() => {
          setError('');
        }, 6000);
        return;
      }
      
      if (!data.portfolio_data || !Array.isArray(data.portfolio_data)) {
        setError('Unexpected response format');
        setIsLoading(false);
        // Auto-hide backend errors after 6 seconds
        setTimeout(() => {
          setError('');
        }, 6000);
        return;
      }
      
      // Guardar datos completos del backend
      setFullPortfolioData(data);
      
      // Usar los datos del nuevo formato del backend directamente
      const adaptedData = data.portfolio_data;
      
      setPortfolioData(adaptedData);
      setTimeline(data.timeline || []);
      
      // Smooth transition
      setIsTransitioning(true);
      setTimeout(() => {
        setShowPortfolio(true);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 100);
      }, 150);
    } catch (err) {
      setError('Failed to fetch portfolio data. Make sure the backend is running.');
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToForm = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowPortfolio(false);
      setApiCredentials(null);
      setPortfolioData(null);
      setFullPortfolioData(null);
      setTimeline([]);
      setError('');
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }, 150);
  };

  return (
    <div style={{ 
      position: 'relative', 
      minHeight: '100vh',
      overflowX: 'hidden', // Solo ocultar scroll horizontal
      overflowY: 'auto' // Permitir scroll vertical
    }}>
      {/* Form Page */}
      <div style={{
        position: showPortfolio ? 'absolute' : 'relative',
        top: 0,
        left: 0,
        width: '100%',
        minHeight: '100vh',
        opacity: (!showPortfolio && !isTransitioning) ? 1 : 0,
        transform: (!showPortfolio && !isTransitioning) ? 'translateX(0)' : 'translateX(-50px)',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: !showPortfolio ? 'auto' : 'none',
        zIndex: !showPortfolio ? 2 : 1
      }}>
        <GainTrackFormPage
          onSubmit={handleApiSubmit}
          isLoading={isLoading}
          error={error}
        />
      </div>

      {/* Portfolio Page */}
      <div style={{
        position: !showPortfolio ? 'absolute' : 'relative',
        top: 0,
        left: 0,
        width: '100%',
        minHeight: '100vh',
        opacity: (showPortfolio && !isTransitioning) ? 1 : 0,
        transform: (showPortfolio && !isTransitioning) ? 'translateX(0)' : 'translateX(50px)',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: showPortfolio ? 'auto' : 'none',
        zIndex: showPortfolio ? 2 : 1
      }}>
        <ErrorBoundary>
          <Dashboard
            portfolioData={fullPortfolioData}
            isLoading={isLoading}
            isVisible={showPortfolio}
            theme={{
              bg: '#000000',
              textPrimary: '#ffffff',
              textSecondary: '#9ca3af',
              textMuted: '#6b7280',
              bgContainer: '#1a1a1a',
              bgElevated: '#2a2a2a',
              borderColor: '#374151',
              borderColorStrong: '#4b5563',
              accentPrimary: '#00ff88',
              accentSecondary: '#8b5cf6',
              greenPrimary: '#22c55e',
              greenSecondary: '#16a34a',
              redPrimary: '#ef4444',
              redSecondary: '#dc2626',
              cardBackground: '#1a1a1a'
            }}
            onShowGainTrack={handleBackToForm}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default App;
