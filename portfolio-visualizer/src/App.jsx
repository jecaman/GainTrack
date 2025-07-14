import { useState } from 'react';
import GainTrackFormPage from './components/GainTrackFormPage';
import PortfolioPage from './components/PortfolioPage';
import GainTrackKPIs from './components/GainTrackKPIs';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [apiCredentials, setApiCredentials] = useState(null);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [portfolioData, setPortfolioData] = useState(null);
  const [fullPortfolioData, setFullPortfolioData] = useState(null); // Datos completos del backend
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState('');

  const handleApiSubmit = async (apiData) => {
    setIsLoading(true);
    setError('');
    setApiCredentials(apiData);
    try {
      const response = await fetch('http://localhost:8000/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiData.apiKey, api_secret: apiData.secretKey })
      });
      const data = await response.json();
      if (data.error) {
        setError(data.error);
        setIsLoading(false);
        return;
      }
      if (!data.portfolio_data || !Array.isArray(data.portfolio_data)) {
        setError('Unexpected response format');
        setIsLoading(false);
        return;
      }
      
      // Guardar datos completos del backend
      setFullPortfolioData(data);
      
      // Usar los datos del nuevo formato del backend directamente
      const adaptedData = data.portfolio_data;
      
      setPortfolioData(adaptedData);
      setTimeline(data.timeline || []);
      setShowPortfolio(true);
    } catch (err) {
      setError('Failed to fetch portfolio data. Make sure the backend is running.');
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToForm = () => {
    setShowPortfolio(false);
    setApiCredentials(null);
    setPortfolioData(null);
    setFullPortfolioData(null);
    setTimeline([]);
    setError('');
  };

  return (
    <>
      {!showPortfolio ? (
        <GainTrackFormPage
          onSubmit={handleApiSubmit}
          isLoading={isLoading}
          error={error}
        />
      ) : (
        <GainTrackKPIs
          portfolioData={fullPortfolioData}
          isLoading={isLoading}
          error={error}
          onBack={handleBackToForm}
        />
      )}
    </>
  );
}

export default App;
