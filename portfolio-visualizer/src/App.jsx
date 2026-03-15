import { useState, useEffect } from 'react';
import GainTrackForm from './components/GainTrackForm';
import Dashboard from './components/Dashboard/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { assetLabelMap } from './utils/chartUtils';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [apiCredentials, setApiCredentials] = useState(null);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [portfolioData, setPortfolioData] = useState(null);
  const [fullPortfolioData, setFullPortfolioData] = useState(null); // Datos completos del backend
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [csvFile, setCsvFile] = useState(null); // Store CSV file for re-processing
  const [priceTimestamp, setPriceTimestamp] = useState(null);
  const [userRefreshCount, setUserRefreshCount] = useState(0);
  const [fiatRates, setFiatRates] = useState({ USD: 1.0, GBP: 1.0, CAD: 1.0 });

  // Function to re-process CSV with date filters
  const reprocessCsvWithFilters = async (startDate, endDate, excludedOperations = []) => {
    if (!csvFile) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('csv_file', csvFile);

      if (startDate) {
        formData.append('start_date', startDate);
      }
      if (endDate) {
        formData.append('end_date', endDate);
      }

      if (excludedOperations.length > 0) {
        formData.append('excluded_operations', JSON.stringify(excludedOperations));
      }

      const response = await fetch('http://localhost:8001/api/portfolio/csv', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setIsLoading(false);
        return;
      }

      setFullPortfolioData(data);
      setPortfolioData(data.portfolio_data);
      setTimeline(data.timeline || []);

    } catch (err) {
      setError('Failed to reprocess CSV data.');
    } finally {
      setIsLoading(false);
    }
  };

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
        // Store the CSV file for potential re-processing
        if (apiData.csvFile) {
          setCsvFile(apiData.csvFile);
        }
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

  const refreshPrices = async () => {
    if (!fullPortfolioData?.portfolio_data) return;
    // Backend keys (XXBT, XETH) → display keys (BTC, ETH) for the API
    const backendAssets = fullPortfolioData.portfolio_data
      .filter(a => a.asset_type !== 'fiat' && (a.amount || 0) > 0)
      .map(a => a.asset);
    if (backendAssets.length === 0) return;

    // Build mapping: display → backend (e.g. BTC → XXBT)
    const displayToBackend = {};
    const displayAssets = backendAssets.map(bk => {
      const display = assetLabelMap[bk] || bk;
      displayToBackend[display] = bk;
      return display;
    });

    try {
      const res = await fetch(`http://localhost:8001/api/prices/current?assets=${displayAssets.join(',')}`);
      const data = await res.json();
      if (data.from_cache) {
        const ttlLeft = 60 - (data.cache_age_seconds || 0);
        console.warn(`[Prices] ⚠️ Rate limit — caché de ${data.cache_age_seconds}s. Próximo refresh en ~${ttlLeft}s.`);
      }
      if (data.prices) {
        // Convert display keys back to backend keys: {BTC: 60000} → {XXBT: 60000}
        const pricesByBackendKey = {};
        for (const [displayKey, price] of Object.entries(data.prices)) {
          const backendKey = displayToBackend[displayKey] || displayKey;
          if (price != null && price > 0) {
            pricesByBackendKey[backendKey] = price;
          }
        }

        setFullPortfolioData(prev => {
          // Actualizar portfolio_data
          const updatedPortfolioData = prev.portfolio_data.map(asset => {
            const newPrice = pricesByBackendKey[asset.asset];
            if (newPrice != null) {
              return { ...asset, current_price: newPrice, current_value: newPrice * (asset.amount || 0) };
            }
            return asset;
          });

          // Actualizar último punto del timeline con los nuevos precios
          // portfolio_data usa keys del CSV (BTC, ETH) pero el timeline usa
          // keys de Kraken (XXBT, XETH). Usar asset_mapping para traducir.
          const assetMapping = prev.asset_mapping || {};
          let updatedTimeline = prev.timeline;
          if (prev.timeline && prev.timeline.length > 0) {
            updatedTimeline = [...prev.timeline];
            const lastDay = { ...updatedTimeline[updatedTimeline.length - 1] };
            const updatedAssets = { ...lastDay.assets_con_valor };
            let newValue = 0;

            for (const [csvKey, price] of Object.entries(pricesByBackendKey)) {
              // Mapear key del CSV → key del timeline (e.g. BTC → XXBT)
              const timelineKey = assetMapping[csvKey] || csvKey;
              if (updatedAssets[timelineKey]) {
                updatedAssets[timelineKey] = {
                  ...updatedAssets[timelineKey],
                  precio: price,
                  valor: price * updatedAssets[timelineKey].cantidad
                };
              }
            }

            // Recalcular valor total del día
            for (const assetData of Object.values(updatedAssets)) {
              newValue += assetData.valor || 0;
            }

            lastDay.assets_con_valor = updatedAssets;
            lastDay.value = newValue;
            lastDay.unrealized_gain = newValue - (lastDay.cost || 0);
            lastDay.total_gain = lastDay.unrealized_gain + (lastDay.realized_gain_period || 0);

            updatedTimeline[updatedTimeline.length - 1] = lastDay;
          }

          return {
            ...prev,
            portfolio_data: updatedPortfolioData,
            timeline: updatedTimeline
          };
        });
        setPriceTimestamp(data.fetched_at);
        if (!data.from_cache) {
          setUserRefreshCount(c => c + 1);
        }
      }
      return { fromCache: !!data.from_cache, cacheAge: data.cache_age_seconds || 0 };
    } catch (err) {
      console.error('[Prices] ❌ Error:', err);
      return { fromCache: false, cacheAge: 0, error: true };
    }
  };

  // Auto-refresh precios cada ~5 min (alineado con BG task del backend)
  useEffect(() => {
    if (!showPortfolio) return;
    const interval = setInterval(refreshPrices, 310 * 1000);
    return () => clearInterval(interval);
  }, [showPortfolio, fullPortfolioData]);

  // Cargar tipos de cambio fiat al mostrar el portfolio
  useEffect(() => {
    if (!showPortfolio) return;
    fetch('http://localhost:8001/api/forex-rates')
      .then(r => r.json())
      .then(rates => { if (rates.USD) setFiatRates(rates); })
      .catch(() => {});
  }, [showPortfolio]);

  // Inicializar timestamp cuando llegan los datos del backend
  useEffect(() => {
    if (fullPortfolioData?.price_captured_at && !priceTimestamp) {
      setPriceTimestamp(fullPortfolioData.price_captured_at);
    }
  }, [fullPortfolioData]);

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
    <div
      id="main-scroll"
      style={{
        position: 'relative',
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        overscrollBehavior: 'none'
      }}
    >
      {/* Form Page */}
      <div style={{
        position: showPortfolio ? 'absolute' : 'relative',
        top: 0,
        left: 0,
        width: '100%',
        minHeight: showPortfolio ? 0 : '100vh',
        height: showPortfolio ? 0 : 'auto',
        overflow: showPortfolio ? 'hidden' : 'visible',
        opacity: (!showPortfolio && !isTransitioning) ? 1 : 0,
        transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: !showPortfolio ? 'auto' : 'none',
        zIndex: !showPortfolio ? 2 : 1
      }}>
        <GainTrackForm
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
        height: !showPortfolio ? 0 : 'auto',
        minHeight: 0,
        overflow: !showPortfolio ? 'hidden' : 'visible',
        opacity: (showPortfolio && !isTransitioning) ? 1 : 0,
        transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
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
            onReprocessCsv={reprocessCsvWithFilters}
            onRefreshPrices={refreshPrices}
            priceTimestamp={priceTimestamp}
            userRefreshCount={userRefreshCount}
            fiatRates={fiatRates}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default App;
