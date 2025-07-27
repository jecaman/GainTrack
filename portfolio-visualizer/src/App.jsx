import { useState, useEffect } from 'react';
import GainTrackFormPage from './components/GainTrackFormPage';
import OverviewSection from './components/OverviewSection';
import GainTrackKPIs from './components/GainTrackKPIs';

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
        response = await fetch('http://localhost:8000/api/portfolio', {
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
      overflow: 'hidden'
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
        <OverviewSection
          portfolioData={fullPortfolioData}
          isLoading={isLoading}
          error={error}
          onBack={handleBackToForm}
        />
      </div>
    </div>
  );
}

export default App;
