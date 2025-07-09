// Chart.js utility functions and plugins

// Center text plugin for donut charts
export const centerTextPlugin = {
  id: 'centerText',
  beforeDraw(chart) {
    const { ctx, width, height } = chart;
    ctx.restore();
    
    const total = chart.data.datasets[0].data.reduce((sum, v) => sum + v, 0);
    const fontSize = (height / 150).toFixed(2);
    ctx.font = `${fontSize}em sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff'; // White text for dark theme
    
    // Get symbol from chart options or default to €
    const symbol = chart.options.plugins?.centerText?.symbol || '€';
    const text = `${symbol}${total.toFixed(2)}`;
    
    const textX = Math.round((width - ctx.measureText(text).width) / 2);
    const textY = height / 2;
    
    ctx.fillText(text, textX, textY);
    ctx.save();
  }
};

// Investment center text plugin (separate for different styling)
export const centerInvestmentTextPlugin = {
  id: 'centerInvestmentText',
  beforeDraw(chart) {
    const { ctx, width, height } = chart;
    ctx.restore();
    
    const total = chart.data.datasets[0].data.reduce((sum, v) => sum + v, 0);
    const fontSize = (height / 150).toFixed(2);
    ctx.font = `${fontSize}em sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff'; // White text for dark theme
    
    // Get symbol from chart options or default to €
    const symbol = chart.options.plugins?.centerInvestmentText?.symbol || '€';
    const text = `${symbol}${total.toFixed(2)}`;
    
    const textX = Math.round((width - ctx.measureText(text).width) / 2);
    const textY = height / 2;
    
    ctx.fillText(text, textX, textY);
    ctx.save();
  }
};

// Asset label mapping
export const assetLabelMap = { 
  'XXBT': 'BTC', 
  'XETH': 'ETH', 
  'ZEUR': 'EUR',
  'ZUSD': 'USD',
  'ZGBP': 'GBP'
};

// Fiat currency symbols
export const fiatSymbols = { 
  'EUR': '€', 
  'USD': '$', 
  'GBP': '£', 
  'JPY': '¥', 
  'CAD': 'C$', 
  'CHF': 'Fr.', 
  'KRW': '₩' 
};

// Get fiat symbol from portfolio data
export const getFiatSymbol = (data) => {
  // En el nuevo formato, siempre trabajamos con EUR
  return '€';
};

// Color palette for charts
export const chartColors = [
  '#4caf50', '#2196f3', '#ff9800', '#e91e63', '#9c27b0',
  '#3f51b5', '#00bcd4', '#ffc107', '#795548', '#607d8b',
  '#f44336', '#9e9e9e', '#ffeb3b', '#8bc34a', '#cddc39'
];

// Timeline data grouping function
export const groupTimelineData = (timelineData, mode) => {
  const grouped = {};

  timelineData.forEach(entry => {
    const date = new Date(entry.date);
    let key;

    if (mode === "monthly") {
      key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    } else if (mode === "weekly") {
      const monday = new Date(date);
      monday.setDate(monday.getDate() - monday.getDay() + 1);
      key = monday.toISOString().split("T")[0];
    } else {
      key = entry.date;
    }

    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(entry);
  });

  const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;

  let result = Object.entries(grouped).map(([key, group]) => ({
    date: key,
    value: avg(group.map(e => e.value)),
    cost: avg(group.map(e => e.cost)),
    profit: avg(group.map(e => e.profit)),
    profit_pct: avg(group.map(e => e.profit_pct))
  }));

  // Add exact last point if not already included
  if (timelineData.length > 0) {
    const last = timelineData[timelineData.length - 1];
    const lastExactDate = last.date;

    const alreadyIncluded = result.some(r => r.date === lastExactDate);
    if (!alreadyIncluded) {
      result.push({
        date: lastExactDate,
        value: last.value,
        cost: last.cost,
        profit: last.profit,
        profit_pct: last.profit_pct
      });
    }
  }

  result.sort((a, b) => new Date(a.date) - new Date(b.date));
  return result;
};

// Calculate portfolio KPIs
export const calculateKPIs = (data) => {
  const symbol = '€'; // Siempre EUR en el nuevo formato
  
  // Separar assets crypto y fiat
  const cryptoAssets = data.filter(a => a.average_cost !== null && a.current_value !== null);
  const fiatAssets = data.filter(a => a.average_cost === null);
  
  // Calcular totales
  const totalInvested = cryptoAssets.reduce((sum, a) => sum + (a.total_invested || 0), 0);
  const totalCurrent = cryptoAssets.reduce((sum, a) => sum + (a.current_value || 0), 0);
  const liquidity = fiatAssets.reduce((sum, a) => sum + (a.current_value || 0), 0);
  
  // Calcular profit (si tenemos datos de inversión)
  const profit = totalInvested > 0 ? totalCurrent - totalInvested : 0;
  const profitPercent = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

  return {
    symbol,
    totalInvested,
    totalCurrent,
    profit,
    profitPercent,
    liquidity
  };
};

// Format currency value
export const formatCurrency = (value, symbol = '€', decimals = 2) => {
  return `${symbol}${Number(value).toFixed(decimals)}`;
};

// Format percentage
export const formatPercentage = (value, decimals = 2) => {
  return `${Number(value).toFixed(decimals)}%`;
};