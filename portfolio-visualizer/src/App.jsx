import { useState } from 'react';
import ApiFormPage from './components/ApiFormPage';
import PortfolioPage from './components/PortfolioPage';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [apiCredentials, setApiCredentials] = useState(null);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [portfolioData, setPortfolioData] = useState(null);
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
      if (!data.summary || !Array.isArray(data.summary)) {
        setError('Unexpected response format');
        setIsLoading(false);
        return;
      }
      
      // Adaptar los datos del nuevo formato del backend al formato que espera el frontend
      const adaptedData = data.summary.map(asset => ({
        asset: asset.asset,
        amount: asset.amount,
        average_cost: asset.is_fiat ? null : (asset.current_price_eur || null),
        current_price: asset.current_price_eur || 1.0,
        total_invested: asset.is_fiat ? null : (asset.current_value_eur || null),
        current_value: asset.current_value_eur || asset.amount,
        pnl_eur: asset.is_fiat ? null : 0, // No tenemos datos de P&L en el nuevo formato
        pnl_percent: asset.is_fiat ? null : 0 // No tenemos datos de P&L en el nuevo formato
      }));
      
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
    setTimeline([]);
    setError('');
  };

  return (
    <>
      {!showPortfolio ? (
        <ApiFormPage
          onSubmit={handleApiSubmit}
          isLoading={isLoading}
          error={error}
        />
      ) : (
        <PortfolioPage
          portfolioData={portfolioData}
          timeline={timeline}
          onBack={handleBackToForm}
        />
      )}
    </>
  );
}

export default App;
