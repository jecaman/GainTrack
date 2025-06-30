import { useEffect, useRef, useState } from 'react';
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
import { Chart } from 'react-chartjs-2';
import {
  centerTextPlugin,
  centerInvestmentTextPlugin,
  assetLabelMap,
  getFiatSymbol,
  groupTimelineData,
  calculateKPIs,
  chartColors,
  formatCurrency,
  formatPercentage
} from '../utils/chartUtils';

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
  const [selectedAsset, setSelectedAsset] = useState('ALL');
  const [granularity, setGranularity] = useState('daily');
  const [showCharts, setShowCharts] = useState(false);

  // Chart refs for cleanup
  const donutChartRef = useRef(null);
  const summaryChartRef = useRef(null);
  const investmentPieChartRef = useRef(null);
  const timelineChartRef = useRef(null);

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



  // Chart configurations
  const createDonutChartData = (data, symbol) => {
    const labels = [];
    const values = [];

    data.forEach(asset => {
      const value = parseFloat(asset.current_value);
      if (!isNaN(value) && value > 0 && asset.average_cost !== null) {
        labels.push(assetLabelMap[asset.asset] || asset.asset);
        values.push(value);
      }
    });

    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: chartColors
      }]
    };
  };

  const createSummaryChartData = (kpis) => {
    const { symbol, totalInvested, totalCurrent, profit, profitPercent } = kpis;
    
    return {
      labels: ['Total Invested', 'Current Value', `Profit (${profitPercent.toFixed(2)}%)`],
      datasets: [{
        label: `Portfolio (${symbol})`,
        data: [
          totalInvested.toFixed(2),
          totalCurrent.toFixed(2),
          profit.toFixed(2)
        ],
        backgroundColor: [
          '#ff9800',
          totalCurrent >= totalInvested ? '#4caf50' : '#f44336',
          profit >= 0 ? '#4caf50' : '#f44336'
        ]
      }]
    };
  };

  const createInvestmentPieChartData = (data, symbol) => {
    const labels = [];
    const values = [];

    data.forEach(asset => {
      if (asset.average_cost !== null && asset.total_invested > 0) {
        labels.push(assetLabelMap[asset.asset] || asset.asset);
        values.push(asset.total_invested);
      }
    });

    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: chartColors
      }]
    };
  };

  const createTimelineChartData = (timelineData) => {
    const groupedData = groupTimelineData(timelineData, granularity);
    const labels = groupedData.map(d => d.date);
    const values = groupedData.map(d => d.value);
    const profits = groupedData.map(d => d.profit);

    return {
      labels,
      datasets: [
        {
          label: 'Portfolio Value (€)',
          data: values,
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          tension: 0.3,
          pointRadius: 1,
          fill: true,
          yAxisID: 'y',
        },
        {
          label: 'Profit (€)',
          data: profits,
          borderColor: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.3,
          pointRadius: 1,
          fill: true,
          yAxisID: 'y1',
        }
      ]
    };
  };

  // Chart options
  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          label: (context) => {
            const total = context.chart._metasets[0].total;
            const value = context.parsed;
            const percent = ((value / total) * 100).toFixed(2);
            const symbol = portfolioData ? getFiatSymbol(portfolioData) : '€';
            return `${context.label}: ${symbol}${value.toFixed(2)} (${percent}%)`;
          }
        }
      },
      centerText: {
        symbol: portfolioData ? getFiatSymbol(portfolioData) : '€'
      }
    }
  };

  const investmentPieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          label: (context) => {
            const total = context.chart._metasets[0].total;
            const value = context.parsed;
            const percent = ((value / total) * 100).toFixed(2);
            const symbol = portfolioData ? getFiatSymbol(portfolioData) : '€';
            return `${context.label}: ${symbol}${value.toFixed(2)} (${percent}%)`;
          }
        }
      },
      centerInvestmentText: {
        symbol: portfolioData ? getFiatSymbol(portfolioData) : '€'
      }
    }
  };

  const summaryOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            const symbol = portfolioData ? getFiatSymbol(portfolioData) : '€';
            return symbol + value;
          }
        }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function (context) {
            const symbol = portfolioData ? getFiatSymbol(portfolioData) : '€';
            return `${context.dataset.label}: ${symbol}${context.parsed.y}`;
          }
        }
      }
    }
  };

  const timelineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    scales: {
      y: {
        beginAtZero: false,
        position: 'left',
        ticks: {
          callback: value => `€${value}`
        },
        title: {
          display: true,
          text: 'Valor total'
        }
      },
      y1: {
        beginAtZero: false,
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: {
          callback: value => `€${value}`
        },
        title: {
          display: true,
          text: 'Profit acumulado'
        }
      }
    },
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: €${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    }
  };

  // Handle granularity change
  const handleGranularityChange = (newGranularity) => {
    setGranularity(newGranularity);
  };

  // Render portfolio table
  const renderTable = (data) => {
    const filteredAssets = data.filter(a => a.average_cost !== null);
    
    return (
      <div className="overflow-x-auto bg-gray-900 rounded-lg">
        <table className="min-w-full text-white">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left">Asset</th>
              <th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2 text-right">Avg Cost</th>
              <th className="px-4 py-2 text-right">Current Price</th>
              <th className="px-4 py-2 text-right">Total Invested</th>
              <th className="px-4 py-2 text-right">Current Value</th>
              <th className="px-4 py-2 text-right">P&L (€)</th>
              <th className="px-4 py-2 text-right">P&L (%)</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.map((asset, index) => (
              <tr key={index} className="border-b border-gray-700">
                <td className="px-4 py-2">{assetLabelMap[asset.asset] || asset.asset}</td>
                <td className="px-4 py-2 text-right">{asset.amount}</td>
                <td className="px-4 py-2 text-right">{asset.average_cost}</td>
                <td className="px-4 py-2 text-right">{asset.current_price}</td>
                <td className="px-4 py-2 text-right">{asset.total_invested}</td>
                <td className="px-4 py-2 text-right">{asset.current_value}</td>
                <td className={`px-4 py-2 text-right ${asset.pnl_eur >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {asset.pnl_eur}
                </td>
                <td className={`px-4 py-2 text-right ${asset.pnl_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {asset.pnl_percent}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render KPIs
  const renderKPIs = (kpis) => {
    const { symbol, totalInvested, totalCurrent, profit, profitPercent, liquidity } = kpis;
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg text-center">
          <div className="text-sm text-gray-400">Total Invested</div>
          <div className="text-xl font-bold text-white">{symbol}{totalInvested.toFixed(2)}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg text-center">
          <div className="text-sm text-gray-400">Current Value</div>
          <div className="text-xl font-bold text-white">{symbol}{totalCurrent.toFixed(2)}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg text-center">
          <div className="text-sm text-gray-400">Profit</div>
          <div className={`text-xl font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {symbol}{profit.toFixed(2)}
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg text-center">
          <div className="text-sm text-gray-400">Profit %</div>
          <div className={`text-xl font-bold ${profitPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {profitPercent.toFixed(2)}%
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg text-center">
          <div className="text-sm text-gray-400">Liquidity</div>
          <div className="text-xl font-bold text-white">{symbol}{liquidity.toFixed(2)}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-black text-white">
      {/* Control Panel */}
      <div className="mb-6">
        <button
          onClick={fetchPortfolioData}
          disabled={isLoading || !apiKey || !apiSecret}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          {isLoading ? 'Loading...' : 'Load Portfolio Data'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Charts and Data */}
      {showCharts && portfolioData && (
        <div className="space-y-8">
          {/* KPIs */}
          {renderKPIs(calculateKPIs(portfolioData))}

          {/* Controls */}
          <div className="flex gap-4 mb-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Granularity</label>
              <select
                value={granularity}
                onChange={(e) => handleGranularityChange(e.target.value)}
                className="bg-gray-800 text-white p-2 rounded border border-gray-600"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Portfolio Distribution (Donut) */}
            <div className="bg-gray-900 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Portfolio Distribution</h3>
              <div className="h-64">
                <Chart
                  ref={donutChartRef}
                  type="doughnut"
                  data={createDonutChartData(portfolioData, getFiatSymbol(portfolioData))}
                  options={donutOptions}
                />
              </div>
            </div>

            {/* Summary Chart */}
            <div className="bg-gray-900 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Portfolio Summary</h3>
              <div className="h-64">
                <Chart
                  ref={summaryChartRef}
                  type="bar"
                  data={createSummaryChartData(calculateKPIs(portfolioData))}
                  options={summaryOptions}
                />
              </div>
            </div>

            {/* Investment Distribution */}
            <div className="bg-gray-900 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Investment Distribution</h3>
              <div className="h-64">
                <Chart
                  ref={investmentPieChartRef}
                  type="doughnut"
                  data={createInvestmentPieChartData(portfolioData, getFiatSymbol(portfolioData))}
                  options={investmentPieOptions}
                />
              </div>
            </div>

            {/* Timeline Chart */}
            {timeline.length > 0 && (
              <div className="bg-gray-900 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Portfolio Timeline</h3>
                <div className="h-64">
                  <Chart
                    ref={timelineChartRef}
                    type="line"
                    data={createTimelineChartData(timeline)}
                    options={timelineOptions}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Portfolio Table */}
          <div className="bg-gray-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Portfolio Details</h3>
            {renderTable(portfolioData)}
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioCharts;