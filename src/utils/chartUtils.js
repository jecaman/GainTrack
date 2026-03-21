// Chart.js utility functions and plugins

// Center text plugin for donut charts
export const centerTextPlugin = {
  id: 'centerText',
  beforeDraw(chart) {
    const { ctx, width, height } = chart;
    ctx.restore();

    const total = chart.data.datasets[0].data.reduce((sum, v) => sum + v, 0);
    const fontSize = Math.max(30, (height / 30)); // Smaller font: min 18px, more conservative scale
    ctx.font = `bold ${fontSize}px 'Space Grotesk', sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff'; // White text for dark theme

    // Get symbol from chart options or default to €
    const symbol = chart.options.plugins?.centerText?.symbol || '€';
    const text = `${Math.round(total)}${symbol}`; // Rounded number with symbol

    const textX = width / 2;
    const textY = height / 2 - (height * 0.05); // Responsive offset: 3% of height

    // Add shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

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
  // Bitcoin variants
  'XXBT': 'BTC',
  'XXBTZ': 'BTC',
  'XXBTEUR': 'BTC',
  'XXBTZEUR': 'BTC',
  'XXBT/': 'BTC',
  'XXBTZEUR/': 'BTC',
  'XXBTEUR/': 'BTC',
  'BTC': 'BTC',

  // Ethereum variants
  'XETH': 'ETH',
  'XETHZ': 'ETH',
  'XETHEUR': 'ETH',
  'XETHZEUR': 'ETH',
  'XETH/': 'ETH',
  'XETHZEUR/': 'ETH',
  'XETHEUR/': 'ETH',
  'ETH': 'ETH',

  // XRP variants
  'XXRP': 'XRP',
  'XXRPZ': 'XRP',
  'XXRPEUR': 'XRP',
  'XXRPZEUR': 'XRP',
  'XXRP/': 'XRP',
  'XXRPZEUR/': 'XRP',
  'XXRPEUR/': 'XRP',
  'XRP': 'XRP',

  // Dogecoin variants (Kraken uses XDG internally)
  'XDG': 'DOGE',
  'XDGEUR': 'DOGE',
  'XDGZEUR': 'DOGE',

  // Litecoin variants (Kraken uses XLTC internally)
  'XLTC': 'LTC',
  'XLTCZ': 'LTC',
  'XLTCZEUR': 'LTC',
  'LTC': 'LTC',

  // Stellar variants (Kraken uses XXLM internally)
  'XXLM': 'XLM',
  'XXLMZ': 'XLM',
  'XXLMZEUR': 'XLM',
  'XLM': 'XLM',

  // Fiat currencies
  'ZEUR': 'EUR',
  'ZUSD': 'USD',
  'ZGBP': 'GBP',
  'EUR': 'EUR',
  'USD': 'USD',
  'GBP': 'GBP'
};

// Format currency value
export const formatCurrency = (value, symbol = '€', decimals = 2) => {
  return `${symbol}${Number(value).toFixed(decimals)}`;
};

// Format percentage
export const formatPercentage = (value, decimals = 2) => {
  return `${Number(value).toFixed(decimals)}%`;
};

// Genera un ID único por operación para el sistema de disabledOps
export const makeOpId = (operation, date) => {
  const ts = operation.timestamp || date || '';
  return `${ts}_${operation.asset}_${operation.type}_${operation.cantidad}_${operation.cost}`;
};
