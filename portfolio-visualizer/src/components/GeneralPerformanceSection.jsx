import { useState } from 'react';
import { Chart } from 'react-chartjs-2';
import { 
  getFiatSymbol, 
  groupTimelineData, 
  calculateKPIs,
  chartColors,
  centerTextPlugin,
  centerInvestmentTextPlugin,
  assetLabelMap
} from '../utils/chartUtils';

const GeneralPerformanceSection = ({ portfolioData, timeline }) => {
  const [granularity, setGranularity] = useState('daily');

  if (!portfolioData) return null;

  const symbol = getFiatSymbol(portfolioData);
  const kpis = calculateKPIs(portfolioData);

  // Chart data creators
  const createDonutChartData = () => {
    const labels = [];
    const values = [];

    portfolioData.forEach(asset => {
      const value = parseFloat(asset.current_value);
      if (!isNaN(value) && value > 0) {
        labels.push(assetLabelMap[asset.asset] || asset.asset);
        values.push(value);
      }
    });

    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: chartColors,
        borderWidth: 3,
        borderColor: '#1f2937',
        hoverBorderWidth: 4,
        hoverBorderColor: '#8b5cf6'
      }]
    };
  };

  const createInvestmentPieChartData = () => {
    const labels = [];
    const values = [];

    portfolioData.forEach(asset => {
      if (asset.total_invested > 0) {
        labels.push(assetLabelMap[asset.asset] || asset.asset);
        values.push(asset.total_invested);
      }
    });

    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: chartColors,
        borderWidth: 3,
        borderColor: '#1f2937',
        hoverBorderWidth: 4,
        hoverBorderColor: '#06b6d4'
      }]
    };
  };

  const createSummaryChartData = () => {
    const { totalInvested, totalCurrent, profit, profitPercent } = kpis;
    
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
          '#f59e0b',
          totalCurrent >= totalInvested ? '#10b981' : '#ef4444',
          profit >= 0 ? '#10b981' : '#ef4444'
        ],
        borderColor: [
          '#d97706',
          totalCurrent >= totalInvested ? '#059669' : '#dc2626',
          profit >= 0 ? '#059669' : '#dc2626'
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    };
  };

  const createTimelineChartData = () => {
    if (!timeline || timeline.length === 0) return { labels: [], datasets: [] };
    
    const groupedData = groupTimelineData(timeline, granularity);
    const labels = groupedData.map(d => d.date);
    const values = groupedData.map(d => d.value);
    const profits = groupedData.map(d => d.profit);

    return {
      labels,
      datasets: [
        {
          label: 'Portfolio Value (€)',
          data: values,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#1e40af',
          pointBorderWidth: 2,
          fill: true,
          yAxisID: 'y',
        },
        {
          label: 'Profit (€)',
          data: profits,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#047857',
          pointBorderWidth: 2,
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
      legend: { 
        position: 'bottom',
        labels: {
          color: '#d1d5db',
          font: { family: 'JetBrains Mono, monospace' },
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#f9fafb',
        bodyColor: '#d1d5db',
        borderColor: '#8b5cf6',
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            const total = context.chart._metasets[0].total;
            const value = context.parsed;
            const percent = ((value / total) * 100).toFixed(2);
            return `${context.label}: ${symbol}${value.toFixed(2)} (${percent}%)`;
          }
        }
      },
      centerText: { symbol }
    }
  };

  const investmentPieOptions = {
    ...donutOptions,
    plugins: {
      ...donutOptions.plugins,
      centerInvestmentText: { symbol }
    }
  };

  const summaryOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#9ca3af',
          font: { family: 'JetBrains Mono, monospace' },
          callback: function (value) {
            return symbol + value;
          }
        },
        grid: { color: 'rgba(156, 163, 175, 0.1)' }
      },
      x: {
        ticks: {
          color: '#9ca3af',
          font: { family: 'JetBrains Mono, monospace' }
        },
        grid: { color: 'rgba(156, 163, 175, 0.1)' }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#f9fafb',
        bodyColor: '#d1d5db',
        borderColor: '#8b5cf6',
        borderWidth: 1,
        callbacks: {
          label: function (context) {
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
          color: '#9ca3af',
          font: { family: 'JetBrains Mono, monospace' },
          callback: value => `€${value}`
        },
        grid: { color: 'rgba(156, 163, 175, 0.1)' },
        title: {
          display: true,
          text: 'Portfolio Value',
          color: '#d1d5db',
          font: { family: 'JetBrains Mono, monospace' }
        }
      },
      y1: {
        beginAtZero: false,
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: {
          color: '#9ca3af',
          font: { family: 'JetBrains Mono, monospace' },
          callback: value => `€${value}`
        },
        title: {
          display: true,
          text: 'Accumulated Profit',
          color: '#d1d5db',
          font: { family: 'JetBrains Mono, monospace' }
        }
      },
      x: {
        ticks: {
          color: '#9ca3af',
          font: { family: 'JetBrains Mono, monospace' }
        },
        grid: { color: 'rgba(156, 163, 175, 0.1)' }
      }
    },
    plugins: {
      legend: { 
        position: 'top',
        labels: {
          color: '#d1d5db',
          font: { family: 'JetBrains Mono, monospace' }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#f9fafb',
        bodyColor: '#d1d5db',
        borderColor: '#8b5cf6',
        borderWidth: 1,
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: €${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    }
  };

  return (
    <section className="mb-12">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-white mb-4 font-mono">
          📈 General Performance & Infographics
        </h2>
        <div className="w-32 h-1 bg-gradient-to-r from-purple-500 to-cyan-500 mx-auto rounded-full"></div>
      </div>

      {/* Charts Grid - Pantalla Completa */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        {/* Portfolio Distribution */}
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 transition-all duration-300 hover:border-purple-500">
            <h3 className="text-2xl font-bold text-white mb-6 font-mono flex items-center">
              <span className="mr-2">🎯</span>
              Portfolio Distribution
            </h3>
            <div className="h-96 lg:h-[32rem]">
              <Chart
                type="doughnut"
                data={createDonutChartData()}
                options={donutOptions}
              />
            </div>
          </div>
        </div>

        {/* Investment Distribution */}
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 transition-all duration-300 hover:border-cyan-500">
            <h3 className="text-2xl font-bold text-white mb-6 font-mono flex items-center">
              <span className="mr-2">💼</span>
              Investment Distribution
            </h3>
            <div className="h-96 lg:h-[32rem]">
              <Chart
                type="doughnut"
                data={createInvestmentPieChartData()}
                options={investmentPieOptions}
              />
            </div>
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 transition-all duration-300 hover:border-orange-500">
            <h3 className="text-2xl font-bold text-white mb-6 font-mono flex items-center">
              <span className="mr-2">📊</span>
              Portfolio Summary
            </h3>
            <div className="h-96 lg:h-[32rem]">
              <Chart
                type="bar"
                data={createSummaryChartData()}
                options={summaryOptions}
              />
            </div>
          </div>
        </div>

        {/* Timeline Chart */}
        {timeline && timeline.length > 0 && (
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 transition-all duration-300 hover:border-green-500">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white font-mono flex items-center">
                  <span className="mr-2">📈</span>
                  Portfolio Evolution
                </h3>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-400 font-mono">Granularity:</label>
                  <select
                    value={granularity}
                    onChange={(e) => setGranularity(e.target.value)}
                    className="bg-gray-800 text-white text-sm p-2 rounded border border-gray-600 focus:border-purple-500 focus:outline-none font-mono"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
              <div className="h-96 lg:h-[32rem]">
                <Chart
                  type="line"
                  data={createTimelineChartData()}
                  options={timelineOptions}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Portfolio Table */}
      <div className="group relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
        <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 transition-all duration-300 hover:border-purple-500">
          <h3 className="text-xl font-bold text-white mb-4 font-mono flex items-center">
            <span className="mr-2">📄</span>
Detailed Asset Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-white font-mono">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Asset</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-300 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-300 uppercase tracking-wider">Avg. Cost (€)</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-300 uppercase tracking-wider">Current Price (€)</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-300 uppercase tracking-wider">Price Change (%)</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-300 uppercase tracking-wider">Invested (€)</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-300 uppercase tracking-wider">Fees (€)</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-300 uppercase tracking-wider">Value (€)</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-300 uppercase tracking-wider">Weight (%)</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-300 uppercase tracking-wider">PNL (€)</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-300 uppercase tracking-wider">ROI (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {portfolioData.map((asset, index) => {
                  const totalPortfolioValue = portfolioData.reduce((sum, a) => sum + (a.current_value || 0), 0);
                  const portfolioWeight = totalPortfolioValue > 0 ? ((asset.current_value || 0) / totalPortfolioValue * 100) : 0;
                  const priceChange = asset.average_cost > 0 ? (((asset.current_price || 0) - asset.average_cost) / asset.average_cost * 100) : 0;
                  const totalCost = (asset.total_invested || 0) + (asset.fees_paid || 0);
                  const roi = totalCost > 0 ? ((asset.current_value || 0) - totalCost) / totalCost * 100 : 0;
                  
                  return (
                    <tr key={index} className="hover:bg-gray-800 transition-colors duration-200">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center">
                          <span className="mr-2">
                            {asset.is_sold ? '🔴' : (asset.asset_type === 'crypto' ? '₿' : '💰')}
                          </span>
                          {assetLabelMap[asset.asset] || asset.asset}
                          {asset.is_sold && <span className="ml-2 text-xs text-red-400">(SOLD)</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          asset.asset_type === 'crypto' 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {asset.asset_type || 'crypto'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right">{asset.amount}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right">{asset.average_cost}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right">{asset.current_price}</td>
                      <td className={`px-4 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                        priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right">{asset.total_invested}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-orange-400">
                        {asset.fees_paid || '0.00'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium">{asset.current_value}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-cyan-400">
                        {portfolioWeight.toFixed(2)}%
                      </td>
                      <td className={`px-4 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                        asset.pnl_eur >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {asset.pnl_eur}
                      </td>
                      <td className={`px-4 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                        roi >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GeneralPerformanceSection;