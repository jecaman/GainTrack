import { Doughnut } from 'react-chartjs-2';
import { assetLabelMap } from '../../../../../utils/chartUtils';
import { getAssetColor } from '../../../../../utils/assetColors';

const DonutChart = ({ portfolioData, theme }) => {
  // Process portfolio data for donut chart
  const processPortfolioData = () => {
    if (!portfolioData?.portfolio_data) return [];

    return portfolioData.portfolio_data
      .filter(asset => (asset.current_value || 0) > 0.5) // Filter very small assets
      .map(asset => ({
        asset: assetLabelMap[asset.asset] || asset.asset,
        fiatValue: asset.current_value || 0,
        originalAsset: asset
      }))
      .sort((a, b) => b.fiatValue - a.fiatValue); // Sort by total value descending
  };

  // Create donut chart data
  const createDonutChartData = () => {
    const processedData = processPortfolioData();
    const labels = processedData.map(item => item.asset);
    const data = processedData.map(item => item.fiatValue);
    const colors = processedData.map(item => getAssetColor(item.originalAsset.asset));
    
    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: colors.map(color => color),
        borderWidth: 2,
        hoverOffset: 4
      }]
    };
  };

  // Donut chart options
  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme.textPrimary,
          font: { family: "'Inter', sans-serif", size: 11 },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#f9fafb',
        bodyColor: '#d1d5db',
        borderColor: theme.accentSecondary,
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : '0.00';
            return `${label}: €${value.toFixed(2)} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%',
    radius: '85%'
  };

  return (
    <div style={{
      backgroundColor: 'transparent', // Invisible
      border: 'none', // Sin borde
      padding: '0', // Sin padding interno
      margin: '1rem', // Margen estándar entre elementos
      display: 'flex',
      flexDirection: 'column',
      height: 'fit-content',
      width: 'fit-content' // Ajustar al contenido
    }}>      
      <div style={{
        flex: 1,
        position: 'relative',
        minHeight: '200px',
        width: 'fit-content' // Ajustar al contenido del donut
      }}>
        <Doughnut data={createDonutChartData()} options={donutOptions} />
      </div>
    </div>
  );
};

export default DonutChart;