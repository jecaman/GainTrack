// Asset color scheme matching the page design
// Colors that work well with both dark and light themes

export const assetColors = {
  // Cryptocurrencies - Representative colors that match dashboard style
  'BTC': '#f7931a',      // Bitcoin orange rgba(247,147,26,255)
  'XXBT': '#f7931a',     // Bitcoin orange
  'XXBTEUR': '#f7931a',  // Bitcoin orange
  'XXBTZEUR': '#f7931a', // Bitcoin orange
  'ETH': '#627eea',      // Ethereum blue/purple
  'XETH': '#627eea',
  'XETHEUR': '#627eea',  // Ethereum blue/purple
  'XETHZEUR': '#627eea', // Ethereum blue/purple
  'ADA': '#0033ad',      // Cardano - Blue
  'DOT': '#e6007a',      // Polkadot - Pink/magenta
  'SOL': '#9945ff',      // Solana - Purple
  'MATIC': '#8247e5',    // Polygon - Purple
  'AVAX': '#e84142',     // Avalanche - Red
  'LINK': '#375bd2',     // Chainlink - Blue
  'UNI': '#ff007a',      // Uniswap - Pink
  'ATOM': '#2e3148',     // Cosmos - Dark gray
  'XRP': '#23292f',      // Ripple - Dark
  'XXRP': '#23292f',
  'XXRPZ': '#23292f',
  'XXRPEUR': '#23292f',
  'XXRPZEUR': '#23292f',
  'LTC': '#bebebe',      // Litecoin - Silver
  'BCH': '#8dc351',      // Bitcoin Cash - Green
  'XLM': '#14b6ff',      // Stellar - Blue
  'ALGO': '#000000',     // Algorand - Black
  'VET': '#15bdff',      // VeChain - Blue
  'THETA': '#2ab8e6',    // Theta - Blue
  'FIL': '#1e40af',      // Filecoin - Blue
  'AAVE': '#2563eb',     // Aave - Bright blue
  'COMP': '#3b82f6',     // Compound - Sky blue
  'MKR': '#60a5fa',      // Maker - Light blue
  'SUSHI': '#93c5fd',    // SushiSwap - Pale blue
  'YFI': '#dbeafe',      // Yearn - Very light blue
  'SNX': '#ef4444',      // Synthetix - Red
  'CRV': '#f87171',      // Curve - Light red
  'BAL': '#fca5a5',      // Balancer - Pink red
  'SAND': '#fbbf24',     // Sandbox - Amber
  'MANA': '#f59e0b',     // Decentraland - Orange
  'ENJ': '#d97706',      // Enjin - Dark orange
  'GALA': '#b45309',     // Gala - Brown orange
  'AXS': '#92400e',      // Axie Infinity - Dark brown
  'ICP': '#78716c',      // Internet Computer - Gray
  'NEAR': '#6b7280',     // Near - Gray
  'FLOW': '#9ca3af',     // Flow - Light gray
  'EGLD': '#d1d5db',     // Elrond - Very light gray
  
  // Fiat currencies - Neutral tones
  'EUR': '#4b5563',      // Euro - Dark gray
  'ZEUR': '#4b5563',
  'USD': '#6b7280',      // Dollar - Medium gray
  'ZUSD': '#6b7280',
  'GBP': '#9ca3af',      // Pound - Light gray
  'ZGBP': '#9ca3af',
  'JPY': '#d1d5db',      // Yen - Very light gray
  'CAD': '#e5e7eb',      // Canadian Dollar - Almost white
  'CHF': '#f3f4f6',      // Swiss Franc - Off white
  'KRW': '#f9fafb',      // Korean Won - Nearly white
  'USDT': '#71717a',     // Tether - Zinc
  'USDC': '#a1a1aa',     // USD Coin - Light zinc
  'BUSD': '#d4d4d8',     // Binance USD - Light zinc
  'DAI': '#e4e4e7',      // Dai - Very light zinc
  
  // Staking/DeFi tokens - Purple/Blue spectrum
  'CAKE': '#8b5cf6',     // PancakeSwap - Purple
  'LUNA': '#7c3aed',     // Terra - Deep purple
  'AVAX': '#6d28d9',     // Avalanche - Rich purple
  'FTM': '#5b21b6',      // Fantom - Dark purple
  'ONE': '#4c1d95',      // Harmony - Deep violet
  'MATIC': '#3730a3',    // Polygon - Indigo
  'BNB': '#1e1b4b',      // Binance Coin - Deep indigo
  
  // Meme coins - Bright colors
  'DOGE': '#fbbf24',     // Dogecoin - Amber
  'SHIB': '#f59e0b',     // Shiba Inu - Orange
  'PEPE': '#10b981',     // Pepe - Green
  'FLOKI': '#ef4444',    // Floki - Red
  
  // Default fallback colors - continuation of the palette
  'DEFAULT_1': '#06b6d4',  // Cyan
  'DEFAULT_2': '#0891b2',  // Dark cyan
  'DEFAULT_3': '#0e7490',  // Darker cyan
  'DEFAULT_4': '#155e75',  // Deep cyan
  'DEFAULT_5': '#164e63',  // Very deep cyan
  'DEFAULT_6': '#0f172a',  // Slate
  'DEFAULT_7': '#1e293b',  // Dark slate
  'DEFAULT_8': '#334155',  // Medium slate
  'DEFAULT_9': '#475569',  // Light slate
  'DEFAULT_10': '#64748b', // Very light slate
};

// Function to get color for an asset
export const getAssetColor = (asset) => {
  // Try exact match first
  if (assetColors[asset]) {
    return assetColors[asset];
  }
  
  // Clean the asset name (remove prefixes/suffixes and common pairs)
  let cleanAsset = asset
    .replace(/^[XZ]/, '')           // Remove X or Z prefix
    .replace(/[XZ]$/, '')           // Remove X or Z suffix
    .replace(/EUR$/, '')            // Remove EUR suffix
    .replace(/ZEUR$/, '')           // Remove ZEUR suffix
    .replace(/USD$/, '')            // Remove USD suffix
    .replace(/\/$/, '');            // Remove trailing slash
  
  // Try clean asset name
  if (assetColors[cleanAsset]) {
    return assetColors[cleanAsset];
  }
  
  // Try common mappings
  const commonMappings = {
    'BT': 'BTC',
    'ET': 'ETH',
    'XXBT': 'BTC',
    'XETH': 'ETH'
  };
  
  if (commonMappings[cleanAsset] && assetColors[commonMappings[cleanAsset]]) {
    return assetColors[commonMappings[cleanAsset]];
  }
  
  // Use hash-based default color for consistency
  const hash = asset.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const defaultColors = [
    assetColors.DEFAULT_1, assetColors.DEFAULT_2, assetColors.DEFAULT_3,
    assetColors.DEFAULT_4, assetColors.DEFAULT_5, assetColors.DEFAULT_6,
    assetColors.DEFAULT_7, assetColors.DEFAULT_8, assetColors.DEFAULT_9,
    assetColors.DEFAULT_10
  ];
  
  return defaultColors[hash % defaultColors.length];
};

// Function to get colors array for multiple assets
export const getAssetColorsArray = (assets) => {
  return assets.map(asset => getAssetColor(asset));
};

// Dark theme specific colors (higher contrast)
export const darkThemeAssetColors = {
  ...assetColors,
  // Override some colors for better dark theme visibility
  'EUR': '#6b7280',
  'ZEUR': '#6b7280',
  'USD': '#9ca3af',
  'ZUSD': '#9ca3af',
  'GBP': '#d1d5db',
  'ZGBP': '#d1d5db',
};

// Light theme specific colors (softer tones)
export const lightThemeAssetColors = {
  ...assetColors,
  // Override some colors for better light theme visibility
  'BTC': '#f7931a',      // Bitcoin orange for light theme
  'XXBT': '#f7931a',
  'XXBTEUR': '#f7931a',
  'XXBTZEUR': '#f7931a',
  'ETH': '#627eea',      // Keep Ethereum blue/purple
  'XETH': '#627eea',
  'XETHEUR': '#627eea',
  'XETHZEUR': '#627eea',
};

// Get theme-specific colors
export const getThemeAssetColors = (isDark = true) => {
  return isDark ? darkThemeAssetColors : lightThemeAssetColors;
};

// Get theme-specific color for asset
export const getThemeAssetColor = (asset, isDark = true) => {
  const colors = getThemeAssetColors(isDark);
  
  // Try exact match first
  if (colors[asset]) {
    return colors[asset];
  }
  
  // Clean the asset name using the same logic as getAssetColor
  let cleanAsset = asset
    .replace(/^[XZ]/, '')           // Remove X or Z prefix
    .replace(/[XZ]$/, '')           // Remove X or Z suffix
    .replace(/EUR$/, '')            // Remove EUR suffix
    .replace(/ZEUR$/, '')           // Remove ZEUR suffix
    .replace(/USD$/, '')            // Remove USD suffix
    .replace(/\/$/, '');            // Remove trailing slash
  
  if (colors[cleanAsset]) {
    return colors[cleanAsset];
  }
  
  // Try common mappings
  const commonMappings = {
    'BT': 'BTC',
    'ET': 'ETH',
    'XXBT': 'BTC',
    'XETH': 'ETH'
  };
  
  if (commonMappings[cleanAsset] && colors[commonMappings[cleanAsset]]) {
    return colors[commonMappings[cleanAsset]];
  }
  
  // Fallback to regular color
  return getAssetColor(asset);
};