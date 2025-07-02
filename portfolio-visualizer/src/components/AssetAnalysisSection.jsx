import { useState } from 'react';
import { Chart } from 'react-chartjs-2';
import { 
  getFiatSymbol, 
  calculateKPIs,
  chartColors,
  assetLabelMap
} from '../utils/chartUtils';

const AssetAnalysisSection = ({ portfolioData, timeline }) => {
  const [selectedAsset, setSelectedAsset] = useState('ALL');

  if (!portfolioData) return null;

  const symbol = getFiatSymbol(portfolioData);
  const assets = portfolioData.filter(asset => asset.average_cost !== null);

  // Filter data based on selected asset
  const getFilteredData = () => {
    if (selectedAsset === 'ALL') {
      return portfolioData;
    }
    return portfolioData.filter(asset => asset.asset === selectedAsset);
  };

  const filteredData = getFilteredData();
  const filteredAssets = filteredData.filter(asset => asset.average_cost !== null);

  // Get available assets for filter
  const availableAssets = assets.map(asset => ({
    value: asset.asset,
    label: assetLabelMap[asset.asset] || asset.asset
  }));

  // Create asset-specific chart data
  const createAssetPerformanceData = () => {
    if (selectedAsset === 'ALL') {
      const labels = filteredAssets.map(asset => assetLabelMap[asset.asset] || asset.asset);
      const profitData = filteredAssets.map(asset => asset.pnl_eur);
      const profitPercentData = filteredAssets.map(asset => asset.pnl_percent);

      return {
        labels,
        datasets: [
          {
            label: 'Profit (€)',
            data: profitData,
            backgroundColor: profitData.map(profit => profit >= 0 ? '#10b981' : '#ef4444'),
            borderColor: profitData.map(profit => profit >= 0 ? '#059669' : '#dc2626'),
            borderWidth: 2,
            borderRadius: 8,
            yAxisID: 'y'
          },
          {
            label: 'Profit (%)',
            data: profitPercentData,
            type: 'line',
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#8b5cf6',
            pointBorderColor: '#6d28d9',
            pointBorderWidth: 2,
            yAxisID: 'y1'
          }
        ]
      };
    } else {
      // Single asset analysis
      const asset = filteredAssets[0];
      if (!asset) return { labels: [], datasets: [] };

      const labels = ['Invested', 'Current Value', 'Profit/Loss'];
      const data = [asset.total_invested, asset.current_value, asset.pnl_eur];

      return {
        labels,
        datasets: [{
          data,
          backgroundColor: [
            '#f59e0b',
            asset.current_value >= asset.total_invested ? '#10b981' : '#ef4444',
            asset.pnl_eur >= 0 ? '#10b981' : '#ef4444'
          ],
          borderColor: [
            '#d97706',
            asset.current_value >= asset.total_invested ? '#059669' : '#dc2626',
            asset.pnl_eur >= 0 ? '#059669' : '#dc2626'
          ],
          borderWidth: 2,
          borderRadius: 8
        }]
      };
    }
  };

  const createAssetAllocationData = () => {
    const labels = filteredAssets.map(asset => assetLabelMap[asset.asset] || asset.asset);
    const currentValues = filteredAssets.map(asset => asset.current_value);
    const investedValues = filteredAssets.map(asset => asset.total_invested);

    return {
      labels,
      datasets: [
        {
          label: 'Current Value',
          data: currentValues,
          backgroundColor: chartColors,
          borderWidth: 3,
          borderColor: '#1f2937'
        },
        {
          label: 'Invested Amount',
          data: investedValues,
          backgroundColor: chartColors.map(color => color + '80'), // Add transparency
          borderWidth: 2,
          borderColor: chartColors,
          borderDash: [5, 5]
        }
      ]
    };
  };

  // Chart options
  const performanceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        ticks: {
          color: '#9ca3af',
          font: { family: 'JetBrains Mono, monospace' },
          callback: value => `€${value}`
        },
        grid: { color: 'rgba(156, 163, 175, 0.1)' },
        title: {
          display: true,
          text: 'Profit (€)',
          color: '#d1d5db',
          font: { family: 'JetBrains Mono, monospace' }
        }
      },
      y1: selectedAsset === 'ALL' ? {
        type: 'linear',
        display: true,
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: {
          color: '#9ca3af',
          font: { family: 'JetBrains Mono, monospace' },
          callback: value => `${value}%`
        },
        title: {
          display: true,
          text: 'Profit (%)',
          color: '#d1d5db',
          font: { family: 'JetBrains Mono, monospace' }
        }
      } : undefined,
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
        borderWidth: 1
      }
    }
  };

  const allocationOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#9ca3af',
          font: { family: 'JetBrains Mono, monospace' },
          callback: value => `€${value}`
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
      legend: {
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

  // Calculate stats for selected asset(s)
  const getAssetStats = () => {
    if (selectedAsset === 'ALL') {
      const kpis = calculateKPIs(portfolioData);
      return {
        totalAssets: assets.length,
        totalInvested: kpis.totalInvested,
        totalValue: kpis.totalCurrent,
        totalProfit: kpis.profit,
        totalProfitPercent: kpis.profitPercent
      };
    } else {
      const asset = assets.find(a => a.asset === selectedAsset);
      if (!asset) return null;
      
      return {
        assetName: assetLabelMap[asset.asset] || asset.asset,
        amount: asset.amount,
        avgCost: asset.average_cost,
        currentPrice: asset.current_price,
        invested: asset.total_invested,
        currentValue: asset.current_value,
        profit: asset.pnl_eur,
        profitPercent: asset.pnl_percent
      };
    }
  };

  const stats = getAssetStats();

  return (
    <section className="mb-12">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-white mb-4 font-mono">
          🔍 Asset-Specific Analysis
        </h2>
        <div className="w-32 h-1 bg-gradient-to-r from-purple-500 to-cyan-500 mx-auto rounded-full"></div>
      </div>

      {/* Filter Section */}
      <div className="mb-8">
        <div className="group relative max-w-md mx-auto">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
          <div className="relative bg-gray-900 border border-gray-700 rounded-xl p-6 transition-all duration-300 hover:border-purple-500">
            <label className="block text-sm font-medium text-gray-300 mb-2 font-mono">
              Select Asset:
            </label>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none font-mono transition-colors duration-200"
            >
              <option value="ALL">ALL ASSETS</option>
              {availableAssets.map(asset => (
                <option key={asset.value} value={asset.value}>
                  {asset.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Asset Statistics */}
      {stats && (
        <div className="mb-8">
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 transition-all duration-300 hover:border-blue-500">
              <h3 className="text-xl font-bold text-white mb-4 font-mono flex items-center">
                <span className="mr-2">📊</span>
                {selectedAsset === 'ALL' ? 'Portfolio Statistics' : `${stats.assetName} Statistics`}
              </h3>
              
              {selectedAsset === 'ALL' ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-400 font-mono">{stats.totalAssets}</div>
                    <div className="text-sm text-gray-400">Total Assets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400 font-mono">{symbol}{stats.totalInvested.toFixed(2)}</div>
                    <div className="text-sm text-gray-400">Total Invested</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400 font-mono">{symbol}{stats.totalValue.toFixed(2)}</div>
                    <div className="text-sm text-gray-400">Total Value</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold font-mono ${stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {symbol}{stats.totalProfit.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-400">Total Profit</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold font-mono ${stats.totalProfitPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {stats.totalProfitPercent.toFixed(2)}%
                    </div>
                    <div className="text-sm text-gray-400">Profit %</div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-400 font-mono">{stats.amount}</div>
                    <div className="text-sm text-gray-400">Amount Held</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400 font-mono">{symbol}{stats.avgCost}</div>
                    <div className="text-sm text-gray-400">Avg Cost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400 font-mono">{symbol}{stats.currentPrice}</div>
                    <div className="text-sm text-gray-400">Current Price</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold font-mono ${stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {stats.profitPercent.toFixed(2)}%
                    </div>
                    <div className="text-sm text-gray-400">Performance</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Charts - Pantalla Completa */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Performance Chart */}
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 transition-all duration-300 hover:border-green-500">
            <h3 className="text-2xl font-bold text-white mb-6 font-mono flex items-center">
              <span className="mr-2">📈</span>
              {selectedAsset === 'ALL' ? 'Assets Performance Comparison' : `${assetLabelMap[selectedAsset] || selectedAsset} Analysis`}
            </h3>
            <div className="h-96 lg:h-[32rem]">
              <Chart
                type={selectedAsset === 'ALL' ? 'bar' : 'bar'}
                data={createAssetPerformanceData()}
                options={performanceOptions}
              />
            </div>
          </div>
        </div>

        {/* Allocation Chart */}
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 transition-all duration-300 hover:border-orange-500">
            <h3 className="text-2xl font-bold text-white mb-6 font-mono flex items-center">
              <span className="mr-2">💼</span>
              Value vs Investment Comparison
            </h3>
            <div className="h-96 lg:h-[32rem]">
              <Chart
                type="bar"
                data={createAssetAllocationData()}
                options={allocationOptions}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Individual Asset Details Table */}
      {selectedAsset !== 'ALL' && filteredAssets.length > 0 && (
        <div className="mt-8">
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 transition-all duration-300 hover:border-purple-500">
              <h3 className="text-xl font-bold text-white mb-4 font-mono flex items-center">
                <span className="mr-2">📋</span>
                {assetLabelMap[selectedAsset] || selectedAsset} Detailed Information
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-white font-mono">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">Metric</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-300 uppercase tracking-wider">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredAssets.map((asset, index) => (
                      <>
                        <tr key={`${index}-amount`} className="hover:bg-gray-800 transition-colors duration-200">
                          <td className="px-4 py-3 text-sm">Amount Held</td>
                          <td className="px-4 py-3 text-sm text-right">{asset.amount}</td>
                        </tr>
                        <tr key={`${index}-avg`} className="hover:bg-gray-800 transition-colors duration-200">
                          <td className="px-4 py-3 text-sm">Average Cost</td>
                          <td className="px-4 py-3 text-sm text-right">{symbol}{asset.average_cost}</td>
                        </tr>
                        <tr key={`${index}-current`} className="hover:bg-gray-800 transition-colors duration-200">
                          <td className="px-4 py-3 text-sm">Current Price</td>
                          <td className="px-4 py-3 text-sm text-right">{symbol}{asset.current_price}</td>
                        </tr>
                        <tr key={`${index}-invested`} className="hover:bg-gray-800 transition-colors duration-200">
                          <td className="px-4 py-3 text-sm">Total Invested</td>
                          <td className="px-4 py-3 text-sm text-right">{symbol}{asset.total_invested}</td>
                        </tr>
                        <tr key={`${index}-value`} className="hover:bg-gray-800 transition-colors duration-200">
                          <td className="px-4 py-3 text-sm">Current Value</td>
                          <td className="px-4 py-3 text-sm text-right">{symbol}{asset.current_value}</td>
                        </tr>
                        <tr key={`${index}-pnl`} className="hover:bg-gray-800 transition-colors duration-200">
                          <td className="px-4 py-3 text-sm">Profit/Loss (€)</td>
                          <td className={`px-4 py-3 text-sm text-right font-semibold ${asset.pnl_eur >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {asset.pnl_eur}
                          </td>
                        </tr>
                        <tr key={`${index}-pnl-pct`} className="hover:bg-gray-800 transition-colors duration-200">
                          <td className="px-4 py-3 text-sm">Profit/Loss (%)</td>
                          <td className={`px-4 py-3 text-sm text-right font-semibold ${asset.pnl_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {asset.pnl_percent}%
                          </td>
                        </tr>
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AssetAnalysisSection;