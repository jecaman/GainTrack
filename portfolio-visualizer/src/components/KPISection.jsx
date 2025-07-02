import { calculateKPIs } from '../utils/chartUtils';

const KPISection = ({ portfolioData }) => {
  if (!portfolioData) return null;

  const kpis = calculateKPIs(portfolioData);
  const { symbol, totalInvested, totalCurrent, profit, profitPercent, liquidity } = kpis;

  const kpiCards = [
    {
      title: 'Total Invested',
      value: `${symbol}${totalInvested.toFixed(2)}`,
      icon: '💰',
      color: 'text-blue-400'
    },
    {
      title: 'Current Value',
      value: `${symbol}${totalCurrent.toFixed(2)}`,
      icon: '📈',
      color: 'text-green-400'
    },
    {
      title: 'Liquidity',
      value: `${symbol}${liquidity.toFixed(2)}`,
      icon: '💧',
      color: 'text-cyan-400'
    },
    {
      title: 'Profit',
      value: `${symbol}${profit.toFixed(2)}`,
      icon: profit >= 0 ? '📊' : '📉',
      color: profit >= 0 ? 'text-green-400' : 'text-red-400'
    },
    {
      title: 'Profit %',
      value: `${profitPercent.toFixed(2)}%`,
      icon: profitPercent >= 0 ? '🚀' : '📉',
      color: profitPercent >= 0 ? 'text-green-400' : 'text-red-400'
    }
  ];

  return (
    <section className="mb-12">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-white mb-4 font-mono">
          📊 Global Portfolio Summary
        </h2>
        <div className="w-32 h-1 bg-gradient-to-r from-purple-500 to-cyan-500 mx-auto rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {kpiCards.map((kpi, index) => (
          <div 
            key={index}
            className="group relative"
          >
            {/* Background glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
            
            {/* Card content */}
            <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 h-full flex flex-col items-center justify-center text-center transition-all duration-300 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20">
              <div className="text-3xl mb-3 transform transition-transform duration-300 group-hover:scale-110">
                {kpi.icon}
              </div>
              
              <h3 className="text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">
                {kpi.title}
              </h3>
              
              <p className={`text-2xl font-bold font-mono ${kpi.color} transition-colors duration-300`}>
                {kpi.value}
              </p>
              
              {/* Animated border */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-300 group-hover:w-3/4"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance indicator */}
      <div className="mt-8 text-center">
        <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-semibold ${
          profit >= 0 
            ? 'bg-green-900/30 text-green-400 border border-green-500/30' 
            : 'bg-red-900/30 text-red-400 border border-red-500/30'
        }`}>
          <span className="mr-2">
            {profit >= 0 ? '📈' : '📉'}
          </span>
          <span>
            Portfolio Performance: {profit >= 0 ? 'Positive' : 'Negative'}
          </span>
        </div>
      </div>
    </section>
  );
};

export default KPISection;