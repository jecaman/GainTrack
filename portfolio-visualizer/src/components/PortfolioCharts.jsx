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

// Recibe portfolioData y timeline como props
const PortfolioCharts = ({ portfolioData, timeline }) => {
  // Solo renderiza los gráficos si hay datos
  if (!portfolioData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-4">📊</div>
          <h2 className="text-4xl font-bold text-white mb-4 font-mono">
            No portfolio data loaded
          </h2>
          <p className="text-xl text-gray-400 font-mono">
            Please return to the form and fetch your portfolio.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="w-full mx-auto px-4 lg:px-8 py-8">
        {/* Section 1: KPIs */}
        <KPISection portfolioData={portfolioData} />
        {/* Section 2: General Performance & Infographics */}
        <GeneralPerformanceSection portfolioData={portfolioData} timeline={timeline} />
        {/* Section 3: Individual Asset Analysis */}
        <AssetAnalysisSection portfolioData={portfolioData} timeline={timeline} />
      </div>
    </div>
  );
};

export default PortfolioCharts;