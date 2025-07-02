import { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  Filler,
} from 'chart.js';
import {
  centerTextPlugin,
  centerInvestmentTextPlugin,
} from '../utils/chartUtils';
import KPISection from './KPISection';
import GeneralPerformanceSection from './GeneralPerformanceSection';
import AssetAnalysisSection from './AssetAnalysisSection';

// Register Chart.js components and plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  Filler,
  centerTextPlugin,
  centerInvestmentTextPlugin
);

const PortfolioCharts = ({ apiKey, apiSecret }) => {
  const [portfolioData, setPortfolioData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCharts, setShowCharts] = useState(false);

  // API call to backend
  const fetchPortfolioData = async () => {
    if (!apiKey || !apiSecret) {
      setError('Please provide both API key and secret');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, api_secret: apiSecret })
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      if (!data.summary || !Array.isArray(data.summary)) {
        setError('Unexpected response format');
        return;
      }

      setPortfolioData(data.summary);
      setTimeline(data.timeline || []);
      setShowCharts(true);
    } catch (err) {
      setError('Failed to fetch portfolio data. Make sure the backend is running.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };





  return (
    <div className="min-h-screen bg-black text-white">
      {/* Main Container - Pantalla Completa */}
      <div className="w-full mx-auto px-4 lg:px-8 py-8">
        {/* Control Panel */}
        <div className="text-center mb-12">
          <div className="group relative max-w-md mx-auto">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            <div className="relative bg-gray-900 border border-gray-700 rounded-xl p-6">
              <button
                onClick={fetchPortfolioData}
                disabled={isLoading || !apiKey || !apiSecret}
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-600 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 font-mono shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Loading Portfolio Data...
                  </div>
                ) : (
                  '🚀 Load Portfolio Data'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8">
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-pink-600 rounded-xl blur opacity-30"></div>
              <div className="relative bg-red-900/20 border border-red-500/30 text-red-400 p-6 rounded-xl text-center">
                <div className="text-2xl mb-2">⚠️</div>
                <p className="font-mono text-lg">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State Mejorado */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
                <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-8">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-white mb-2 font-mono">🔄 Conectando con Kraken</h3>
                      <p className="text-lg text-gray-300 font-mono mb-2">Obteniendo datos de tu portfolio...</p>
                      <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                        <span>📊</span>
                        <span className="animate-pulse">Esto puede tomar unos segundos</span>
                        <span>⏳</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Sections */}
        {showCharts && portfolioData && !isLoading && (
          <>
            {/* Section 1: KPIs */}
            <KPISection portfolioData={portfolioData} />

            {/* Section 2: General Performance & Infographics */}
            <GeneralPerformanceSection portfolioData={portfolioData} timeline={timeline} />

            {/* Section 3: Individual Asset Analysis */}
            <AssetAnalysisSection portfolioData={portfolioData} timeline={timeline} />
          </>
        )}

        {/* Welcome State */}
        {!showCharts && !isLoading && !error && (
          <div className="text-center py-20">
            <div className="mb-8">
              <div className="text-8xl mb-4">📊</div>
              <h2 className="text-4xl font-bold text-white mb-4 font-mono">
                Welcome to Portfolio Analytics
              </h2>
              <p className="text-xl text-gray-400 font-mono">
                Click the button above to load your portfolio data and start analyzing your investments
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-center">
                <div className="text-4xl mb-3">📈</div>
                <h3 className="text-xl font-bold text-white mb-2">KPI Dashboard</h3>
                <p className="text-gray-400">Track your key performance indicators</p>
              </div>
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-center">
                <div className="text-4xl mb-3">📊</div>
                <h3 className="text-xl font-bold text-white mb-2">Performance Charts</h3>
                <p className="text-gray-400">Visualize your portfolio performance</p>
              </div>
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="text-xl font-bold text-white mb-2">Asset Analysis</h3>
                <p className="text-gray-400">Analyze individual assets in detail</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioCharts;