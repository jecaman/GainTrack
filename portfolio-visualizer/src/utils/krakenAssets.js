// KRAKEN ASSETS DATABASE
// Colores basados en los colores principales de los logos + datos estáticos

const ASSET_LOGO_COLORS = {
  // Colores extraídos de los logos oficiales
  BTC: '#F7931A', // Bitcoin Orange
  ETH: '#627EEA', // Ethereum Blue
  XRP: '#23292F', // Ripple Black
  ADA: '#0033AD', // Cardano Blue
  SOL: '#9945FF', // Solana Purple
  DOT: '#E6007A', // Polkadot Pink
  LINK: '#375BD2', // Chainlink Blue
  MATIC: '#8247E5', // Polygon Purple
  AVAX: '#E84142', // Avalanche Red
  ATOM: '#2E3148', // Cosmos Dark Blue
  UNI: '#FF007A', // Uniswap Pink
  LTC: '#BFBBBB', // Litecoin Silver
  BCH: '#8DC351', // Bitcoin Cash Green
  XLM: '#000000', // Stellar Black
  USDT: '#26A17B', // Tether Green
  USDC: '#2775CA', // USD Coin Blue
  DAI: '#F5AC37', // Dai Yellow
  DOGE: '#C2A633', // Dogecoin Yellow
  SHIB: '#FFA409', // Shiba Orange
  TRUMP: '#C41E3A', // Trump Red
  HBAR: '#5DBECD', // Hedera Teal
  EUR: '#003399', // Euro Blue
  USD: '#228B22', // Dollar Green
  GBP: '#012169', // Pound Blue
  XMR: '#FF6600', // Monero Orange
  ZEC: '#F4B728', // Zcash Yellow
  ETC: '#328332', // Ethereum Classic Green
  CRV: '#40E0D0', // Curve Turquoise
  COMP: '#00D395', // Compound Green
  DEFAULT: '#95A5A6', // Neutral Gray
};

export const KRAKEN_ASSETS = {
  // Flagship cryptocurrencies
  'BTC': {
    name: 'Bitcoin',
    symbol: 'BTC', 
    color: ASSET_LOGO_COLORS.BTC,
    category: 'cryptocurrency',
    logo: 'btc.png'
  },
  'ETH': {
    name: 'Ethereum',
    symbol: 'ETH',
    color: ASSET_LOGO_COLORS.ETH, 
    category: 'cryptocurrency',
    logo: 'eth.png'
  },
  
  // Major altcoins
  'XRP': {
    name: 'Ripple',
    symbol: 'XRP',
    color: ASSET_LOGO_COLORS.XRP,
    category: 'cryptocurrency',
    logo: 'xrp.png'
  },
  'ADA': {
    name: 'Cardano', 
    symbol: 'ADA',
    color: ASSET_LOGO_COLORS.ADA,
    category: 'cryptocurrency', 
    logo: 'ada.png'
  },
  'SOL': {
    name: 'Solana',
    symbol: 'SOL', 
    color: ASSET_LOGO_COLORS.SOL,
    category: 'cryptocurrency',
    logo: 'sol.png'
  },
  'DOT': {
    name: 'Polkadot',
    symbol: 'DOT',
    color: ASSET_LOGO_COLORS.DOT, 
    category: 'cryptocurrency',
    logo: 'dot.png'
  },
  'LINK': {
    name: 'Chainlink',
    symbol: 'LINK',
    color: ASSET_LOGO_COLORS.LINK,
    category: 'defi',
    logo: 'link.png'
  },
  'MATIC': {
    name: 'Polygon',
    symbol: 'MATIC', 
    color: ASSET_LOGO_COLORS.MATIC,
    category: 'cryptocurrency',
    logo: 'matic.png'
  },
  'AVAX': {
    name: 'Avalanche',
    symbol: 'AVAX',
    color: ASSET_LOGO_COLORS.AVAX,
    category: 'cryptocurrency', 
    logo: 'avax.png'
  },
  
  // Popular altcoins
  'ATOM': {
    name: 'Cosmos',
    symbol: 'ATOM',
    color: ASSET_LOGO_COLORS.ATOM,
    category: 'cryptocurrency',
    logo: 'atom.png'
  },
  'UNI': {
    name: 'Uniswap',
    symbol: 'UNI', 
    color: ASSET_LOGO_COLORS.UNI,
    category: 'defi',
    logo: 'uni.png'
  },
  'LTC': {
    name: 'Litecoin',
    symbol: 'LTC',
    color: ASSET_LOGO_COLORS.LTC, 
    category: 'cryptocurrency',
    logo: 'ltc.png'
  },
  'BCH': {
    name: 'Bitcoin Cash', 
    symbol: 'BCH',
    color: ASSET_LOGO_COLORS.BCH,
    category: 'cryptocurrency',
    logo: 'bch.png' 
  },
  'XLM': {
    name: 'Stellar',
    symbol: 'XLM',
    color: ASSET_LOGO_COLORS.XLM,
    category: 'cryptocurrency',
    logo: 'xlm.png'
  },
  
  // Stablecoins
  'USDT': {
    name: 'Tether',
    symbol: 'USDT',
    color: ASSET_LOGO_COLORS.USDT,
    category: 'stablecoin',
    logo: 'usdt.png'
  },
  'USDC': {
    name: 'USD Coin',
    symbol: 'USDC', 
    color: ASSET_LOGO_COLORS.USDC,
    category: 'stablecoin',
    logo: 'usdc.png'
  },
  'DAI': {
    name: 'Dai',
    symbol: 'DAI',
    color: ASSET_LOGO_COLORS.DAI, 
    category: 'stablecoin',
    logo: 'dai.png'
  },
  
  // Meme coins
  'DOGE': {
    name: 'Dogecoin',
    symbol: 'DOGE',
    color: ASSET_LOGO_COLORS.DOGE,
    category: 'meme',
    logo: 'doge.png'
  },
  'SHIB': {
    name: 'Shiba Inu',
    symbol: 'SHIB',
    color: ASSET_LOGO_COLORS.SHIB,
    category: 'meme', 
    logo: 'shib.png'
  },
  'TRUMP': {
    name: 'Trump',
    symbol: 'TRUMP', 
    color: ASSET_LOGO_COLORS.TRUMP,
    category: 'meme',
    logo: 'trump.png'
  },
  'HBAR': {
    name: 'Hedera',
    symbol: 'HBAR',
    color: ASSET_LOGO_COLORS.HBAR,
    category: 'cryptocurrency',
    logo: 'hbar.png'
  },
  
  // Fiat currencies
  'EUR': {
    name: 'Euro',
    symbol: 'EUR',
    color: ASSET_LOGO_COLORS.EUR, 
    category: 'fiat',
    logo: 'eur.png'
  },
  'USD': {
    name: 'US Dollar',
    symbol: 'USD',
    color: ASSET_LOGO_COLORS.USD,
    category: 'fiat',
    logo: 'usd.png'
  },
  'GBP': {
    name: 'British Pound',
    symbol: 'GBP', 
    color: ASSET_LOGO_COLORS.GBP,
    category: 'fiat',
    logo: 'gbp.png'
  },
  
  // Privacy & other coins
  'XMR': {
    name: 'Monero',
    symbol: 'XMR',
    color: ASSET_LOGO_COLORS.XMR,
    category: 'privacy',
    logo: 'xmr.png'
  },
  'ZEC': {
    name: 'Zcash',
    symbol: 'ZEC',
    color: ASSET_LOGO_COLORS.ZEC,
    category: 'privacy', 
    logo: 'zec.png'
  },
  'ETC': {
    name: 'Ethereum Classic',
    symbol: 'ETC', 
    color: ASSET_LOGO_COLORS.ETC,
    category: 'cryptocurrency',
    logo: 'etc.png'
  },
  
  // DeFi tokens
  'CRV': {
    name: 'Curve DAO',
    symbol: 'CRV',
    color: ASSET_LOGO_COLORS.CRV, 
    category: 'defi',
    logo: 'crv.png'
  },
  'COMP': {
    name: 'Compound',
    symbol: 'COMP',
    color: ASSET_LOGO_COLORS.COMP,
    category: 'defi',
    logo: 'comp.png'
  },
  
  // Default for unknown assets
  'DEFAULT': {
    name: 'Unknown Asset',
    symbol: '???',
    color: ASSET_LOGO_COLORS.DEFAULT,
    category: 'unknown', 
    logo: 'default.png'
  }
};

export const getAssetLogo = (symbol, size = 'small') => {
  const normalizedSymbol = symbol?.toUpperCase();
  
  // URLs verificadas que funcionan - sin fallback para activos no incluidos
  const logoUrls = {
    'BTC': 'https://coin-images.coingecko.com/coins/images/1/small/bitcoin.png',
    'ETH': 'https://coin-images.coingecko.com/coins/images/279/small/ethereum.png',
    'XRP': 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
    'ADA': 'https://coin-images.coingecko.com/coins/images/975/small/cardano.png',
    'SOL': 'https://coin-images.coingecko.com/coins/images/4128/small/solana.png',
    'DOT': 'https://coin-images.coingecko.com/coins/images/12171/small/polkadot.png',
    'LINK': 'https://coin-images.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
    'MATIC': 'https://coin-images.coingecko.com/coins/images/4713/small/matic-token-icon.png',
    'AVAX': 'https://coin-images.coingecko.com/coins/images/12559/small/avalanche-avax-logo.png',
    'ATOM': 'https://coin-images.coingecko.com/coins/images/1481/small/cosmos_hub.png',
    'UNI': 'https://coin-images.coingecko.com/coins/images/12504/small/uniswap-uni.png',
    'LTC': 'https://coin-images.coingecko.com/coins/images/2/small/litecoin.png',
    'BCH': 'https://coin-images.coingecko.com/coins/images/780/small/bitcoin-cash-circle.png',
    'XLM': 'https://coin-images.coingecko.com/coins/images/100/small/Stellar_symbol_black_RGB.png',
    'USDT': 'https://coin-images.coingecko.com/coins/images/325/small/Tether.png',
    'USDC': 'https://coin-images.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
    'DAI': 'https://coin-images.coingecko.com/coins/images/9956/small/dai-multi-collateral-mcd.png',
    'DOGE': 'https://coin-images.coingecko.com/coins/images/5/small/dogecoin.png',
    'SHIB': 'https://coin-images.coingecko.com/coins/images/11939/small/shiba.png',
    'TRUMP': 'https://coin-images.coingecko.com/coins/images/53746/small/trump.png',
    'HBAR': 'https://coin-images.coingecko.com/coins/images/3688/small/hbar.png',
    'XMR': 'https://coin-images.coingecko.com/coins/images/69/small/monero_logo.png',
    'ZEC': 'https://coin-images.coingecko.com/coins/images/486/small/circle-zcash-color.png',
    'ETC': 'https://coin-images.coingecko.com/coins/images/453/small/ethereum-classic-logo.png',
    'CRV': 'https://coin-images.coingecko.com/coins/images/12124/small/Curve.png',
    'COMP': 'https://coin-images.coingecko.com/coins/images/10775/small/COMP.png'
  };
  
  return logoUrls[normalizedSymbol] || null; // Retorna null si no existe
};