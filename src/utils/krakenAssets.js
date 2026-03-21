// KRAKEN ASSETS DATABASE
// Colores basados en los colores principales de los logos + datos estáticos

const ASSET_LOGO_COLORS = {
  // ── Top market cap ──
  BTC: '#F7931A', ETH: '#627EEA', XRP: '#23292F', ADA: '#0033AD',
  SOL: '#9945FF', DOT: '#E6007A', LINK: '#375BD2', AVAX: '#E84142',
  ATOM: '#2E3148', UNI: '#FF007A', DOGE: '#C2A633', SHIB: '#FFA409',
  TRUMP: '#C41E3A', HBAR: '#5DBECD', POL: '#8247E5', MATIC: '#8247E5',
  TRX: '#FF0013', TON: '#0098EA', KAS: '#49EACB', ICP: '#29ABE2',
  LTC: '#BFBBBB', BCH: '#8DC351', XLM: '#000000', BNB: '#F3BA2F',
  XTZ: '#2C7DF7',
  // ── L2 / New L1 ──
  NEAR: '#00C08B', APT: '#000000', ARB: '#28A0F0', OP: '#FF0420',
  SUI: '#6FBCF0', SEI: '#9B1C2E', STX: '#5546FF', TIA: '#7B2BF9',
  INJ: '#00F2FE', MINA: '#E39144', FLOW: '#00EF8B', KAVA: '#FF564F',
  ALGO: '#000000',
  // ── DeFi ──
  AAVE: '#B6509E', CRV: '#40E0D0', COMP: '#00D395', SNX: '#00D1FF',
  SUSHI: '#D65B98', YFI: '#006AE3', '1INCH': '#1B314F', DYDX: '#6966FF',
  PENDLE: '#4DFFC3', RUNE: '#33FF99', FIL: '#0090FF',
  // ── AI / Data ──
  FET: '#1D2951', OCEAN: '#FF4092', RENDER: '#000000', TAO: '#000000',
  GRT: '#6747ED',
  // ── Gaming / Metaverse ──
  MANA: '#FF2D55', SAND: '#04ADEF', AXS: '#0055D5', ENJ: '#624DBF',
  GALA: '#000000', IMX: '#000000',
  // ── Meme ──
  PEPE: '#479F53', FLOKI: '#F89D1E', BONK: '#F8A61E', WIF: '#E4A101',
  // ── Trending / New ──
  JUP: '#C7F284', WLD: '#000000', STRK: '#000000', ZRO: '#000000',
  EIGEN: '#1A0533', ENA: '#7C3AED', ONDO: '#1462F5', ETHFI: '#6366F1',
  // ── Fiat & Other ──
  EUR: '#003399', USD: '#228B22', GBP: '#012169',
  USDT: '#26A17B', USDC: '#2775CA', DAI: '#F5AC37',
  XMR: '#FF6600', ZEC: '#F4B728', ETC: '#328332',
  DEFAULT: '#95A5A6',
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
  'POL': {
    name: 'Polygon',
    symbol: 'POL',
    color: ASSET_LOGO_COLORS.POL,
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
  
  // ── DeFi ──
  'CRV': { name: 'Curve DAO', symbol: 'CRV', color: ASSET_LOGO_COLORS.CRV, category: 'defi' },
  'COMP': { name: 'Compound', symbol: 'COMP', color: ASSET_LOGO_COLORS.COMP, category: 'defi' },
  'AAVE': { name: 'Aave', symbol: 'AAVE', color: ASSET_LOGO_COLORS.AAVE, category: 'defi' },
  'SNX': { name: 'Synthetix', symbol: 'SNX', color: ASSET_LOGO_COLORS.SNX, category: 'defi' },
  'SUSHI': { name: 'SushiSwap', symbol: 'SUSHI', color: ASSET_LOGO_COLORS.SUSHI, category: 'defi' },
  'YFI': { name: 'Yearn Finance', symbol: 'YFI', color: ASSET_LOGO_COLORS.YFI, category: 'defi' },
  '1INCH': { name: '1inch', symbol: '1INCH', color: ASSET_LOGO_COLORS['1INCH'], category: 'defi' },
  'DYDX': { name: 'dYdX', symbol: 'DYDX', color: ASSET_LOGO_COLORS.DYDX, category: 'defi' },
  'PENDLE': { name: 'Pendle', symbol: 'PENDLE', color: ASSET_LOGO_COLORS.PENDLE, category: 'defi' },
  'RUNE': { name: 'THORChain', symbol: 'RUNE', color: ASSET_LOGO_COLORS.RUNE, category: 'defi' },
  'FIL': { name: 'Filecoin', symbol: 'FIL', color: ASSET_LOGO_COLORS.FIL, category: 'defi' },

  // ── Top market cap (new) ──
  'TRX': { name: 'TRON', symbol: 'TRX', color: ASSET_LOGO_COLORS.TRX, category: 'cryptocurrency' },
  'TON': { name: 'Toncoin', symbol: 'TON', color: ASSET_LOGO_COLORS.TON, category: 'cryptocurrency' },
  'KAS': { name: 'Kaspa', symbol: 'KAS', color: ASSET_LOGO_COLORS.KAS, category: 'cryptocurrency' },
  'ICP': { name: 'Internet Computer', symbol: 'ICP', color: ASSET_LOGO_COLORS.ICP, category: 'cryptocurrency' },
  'BNB': { name: 'BNB', symbol: 'BNB', color: ASSET_LOGO_COLORS.BNB, category: 'cryptocurrency' },
  'XTZ': { name: 'Tezos', symbol: 'XTZ', color: ASSET_LOGO_COLORS.XTZ, category: 'cryptocurrency' },

  // ── L2 / New L1 ──
  'NEAR': { name: 'NEAR Protocol', symbol: 'NEAR', color: ASSET_LOGO_COLORS.NEAR, category: 'cryptocurrency' },
  'APT': { name: 'Aptos', symbol: 'APT', color: ASSET_LOGO_COLORS.APT, category: 'cryptocurrency' },
  'ARB': { name: 'Arbitrum', symbol: 'ARB', color: ASSET_LOGO_COLORS.ARB, category: 'cryptocurrency' },
  'OP': { name: 'Optimism', symbol: 'OP', color: ASSET_LOGO_COLORS.OP, category: 'cryptocurrency' },
  'SUI': { name: 'Sui', symbol: 'SUI', color: ASSET_LOGO_COLORS.SUI, category: 'cryptocurrency' },
  'SEI': { name: 'Sei', symbol: 'SEI', color: ASSET_LOGO_COLORS.SEI, category: 'cryptocurrency' },
  'STX': { name: 'Stacks', symbol: 'STX', color: ASSET_LOGO_COLORS.STX, category: 'cryptocurrency' },
  'TIA': { name: 'Celestia', symbol: 'TIA', color: ASSET_LOGO_COLORS.TIA, category: 'cryptocurrency' },
  'INJ': { name: 'Injective', symbol: 'INJ', color: ASSET_LOGO_COLORS.INJ, category: 'cryptocurrency' },
  'MINA': { name: 'Mina', symbol: 'MINA', color: ASSET_LOGO_COLORS.MINA, category: 'cryptocurrency' },
  'FLOW': { name: 'Flow', symbol: 'FLOW', color: ASSET_LOGO_COLORS.FLOW, category: 'cryptocurrency' },
  'KAVA': { name: 'Kava', symbol: 'KAVA', color: ASSET_LOGO_COLORS.KAVA, category: 'cryptocurrency' },
  'ALGO': { name: 'Algorand', symbol: 'ALGO', color: ASSET_LOGO_COLORS.ALGO, category: 'cryptocurrency' },

  // ── AI / Data ──
  'FET': { name: 'Fetch.ai', symbol: 'FET', color: ASSET_LOGO_COLORS.FET, category: 'ai' },
  'OCEAN': { name: 'Ocean Protocol', symbol: 'OCEAN', color: ASSET_LOGO_COLORS.OCEAN, category: 'ai' },
  'RENDER': { name: 'Render', symbol: 'RENDER', color: ASSET_LOGO_COLORS.RENDER, category: 'ai' },
  'TAO': { name: 'Bittensor', symbol: 'TAO', color: ASSET_LOGO_COLORS.TAO, category: 'ai' },
  'GRT': { name: 'The Graph', symbol: 'GRT', color: ASSET_LOGO_COLORS.GRT, category: 'ai' },

  // ── Gaming / Metaverse ──
  'MANA': { name: 'Decentraland', symbol: 'MANA', color: ASSET_LOGO_COLORS.MANA, category: 'gaming' },
  'SAND': { name: 'The Sandbox', symbol: 'SAND', color: ASSET_LOGO_COLORS.SAND, category: 'gaming' },
  'AXS': { name: 'Axie Infinity', symbol: 'AXS', color: ASSET_LOGO_COLORS.AXS, category: 'gaming' },
  'ENJ': { name: 'Enjin', symbol: 'ENJ', color: ASSET_LOGO_COLORS.ENJ, category: 'gaming' },
  'GALA': { name: 'Gala', symbol: 'GALA', color: ASSET_LOGO_COLORS.GALA, category: 'gaming' },
  'IMX': { name: 'Immutable X', symbol: 'IMX', color: ASSET_LOGO_COLORS.IMX, category: 'gaming' },

  // ── Meme (new) ──
  'PEPE': { name: 'Pepe', symbol: 'PEPE', color: ASSET_LOGO_COLORS.PEPE, category: 'meme' },
  'FLOKI': { name: 'Floki', symbol: 'FLOKI', color: ASSET_LOGO_COLORS.FLOKI, category: 'meme' },
  'BONK': { name: 'Bonk', symbol: 'BONK', color: ASSET_LOGO_COLORS.BONK, category: 'meme' },
  'WIF': { name: 'dogwifhat', symbol: 'WIF', color: ASSET_LOGO_COLORS.WIF, category: 'meme' },

  // ── Trending / New ──
  'JUP': { name: 'Jupiter', symbol: 'JUP', color: ASSET_LOGO_COLORS.JUP, category: 'defi' },
  'WLD': { name: 'Worldcoin', symbol: 'WLD', color: ASSET_LOGO_COLORS.WLD, category: 'cryptocurrency' },
  'STRK': { name: 'StarkNet', symbol: 'STRK', color: ASSET_LOGO_COLORS.STRK, category: 'cryptocurrency' },
  'ZRO': { name: 'LayerZero', symbol: 'ZRO', color: ASSET_LOGO_COLORS.ZRO, category: 'cryptocurrency' },
  'EIGEN': { name: 'EigenLayer', symbol: 'EIGEN', color: ASSET_LOGO_COLORS.EIGEN, category: 'cryptocurrency' },
  'ENA': { name: 'Ethena', symbol: 'ENA', color: ASSET_LOGO_COLORS.ENA, category: 'defi' },
  'ONDO': { name: 'Ondo Finance', symbol: 'ONDO', color: ASSET_LOGO_COLORS.ONDO, category: 'defi' },
  'ETHFI': { name: 'Ether.fi', symbol: 'ETHFI', color: ASSET_LOGO_COLORS.ETHFI, category: 'defi' },

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
    'POL': 'https://coin-images.coingecko.com/coins/images/4713/small/matic-token-icon.png',
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
    'COMP': 'https://coin-images.coingecko.com/coins/images/10775/small/COMP.png',
    // New assets
    'TRX': 'https://coin-images.coingecko.com/coins/images/1094/small/tron-logo.png',
    'TON': 'https://coin-images.coingecko.com/coins/images/17980/small/ton_symbol.png',
    'KAS': 'https://coin-images.coingecko.com/coins/images/25751/small/kaspa-icon-exchanges.png',
    'ICP': 'https://coin-images.coingecko.com/coins/images/14495/small/Internet_Computer_logo.png',
    'BNB': 'https://coin-images.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
    'XTZ': 'https://coin-images.coingecko.com/coins/images/976/small/Tezos-logo.png',
    'NEAR': 'https://coin-images.coingecko.com/coins/images/10365/small/near.jpg',
    'APT': 'https://coin-images.coingecko.com/coins/images/26455/small/aptos_round.png',
    'ARB': 'https://coin-images.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg',
    'OP': 'https://coin-images.coingecko.com/coins/images/25244/small/Optimism.png',
    'SUI': 'https://coin-images.coingecko.com/coins/images/26375/small/sui_asset.jpeg',
    'SEI': 'https://coin-images.coingecko.com/coins/images/28205/small/Sei_Logo_-_Transparent.png',
    'STX': 'https://coin-images.coingecko.com/coins/images/2069/small/Stacks_logo_full.png',
    'TIA': 'https://coin-images.coingecko.com/coins/images/31967/small/tia.jpg',
    'INJ': 'https://coin-images.coingecko.com/coins/images/12882/small/Secondary_Symbol.png',
    'MINA': 'https://coin-images.coingecko.com/coins/images/15628/small/JM4_vQ34_400x400.png',
    'FLOW': 'https://coin-images.coingecko.com/coins/images/13446/small/5f6294c0c7a8cda55cb1c936_Flow_Wordmark.png',
    'KAVA': 'https://coin-images.coingecko.com/coins/images/9761/small/kava.png',
    'ALGO': 'https://coin-images.coingecko.com/coins/images/4380/small/download.png',
    'AAVE': 'https://coin-images.coingecko.com/coins/images/12645/small/AAVE.png',
    'SNX': 'https://coin-images.coingecko.com/coins/images/3406/small/SNX.png',
    'SUSHI': 'https://coin-images.coingecko.com/coins/images/12271/small/512x512_Logo_no_chop.png',
    'YFI': 'https://coin-images.coingecko.com/coins/images/11849/small/yearn-finance-yfi.png',
    '1INCH': 'https://coin-images.coingecko.com/coins/images/13469/small/1inch-token.png',
    'DYDX': 'https://coin-images.coingecko.com/coins/images/17500/small/hjnIm9bV.jpg',
    'PENDLE': 'https://coin-images.coingecko.com/coins/images/15069/small/Pendle_Logo_Normal-03.png',
    'RUNE': 'https://coin-images.coingecko.com/coins/images/6595/small/Rune200x200.png',
    'FIL': 'https://coin-images.coingecko.com/coins/images/12817/small/filecoin.png',
    'FET': 'https://coin-images.coingecko.com/coins/images/5681/small/Fetch.jpg',
    'OCEAN': 'https://coin-images.coingecko.com/coins/images/3687/small/ocean-protocol-logo.jpg',
    'RENDER': 'https://coin-images.coingecko.com/coins/images/11636/small/rndr.png',
    'TAO': 'https://coin-images.coingecko.com/coins/images/28452/small/ARUsPeNQ_400x400.jpeg',
    'GRT': 'https://coin-images.coingecko.com/coins/images/13397/small/Graph_Token.png',
    'MANA': 'https://coin-images.coingecko.com/coins/images/878/small/decentraland-mana.png',
    'SAND': 'https://coin-images.coingecko.com/coins/images/14476/small/the-sandbox.png',
    'AXS': 'https://coin-images.coingecko.com/coins/images/13029/small/axie_infinity_logo.png',
    'ENJ': 'https://coin-images.coingecko.com/coins/images/1102/small/enjin-coin-logo.png',
    'GALA': 'https://coin-images.coingecko.com/coins/images/12493/small/GALA-COINGECKO.png',
    'IMX': 'https://coin-images.coingecko.com/coins/images/17233/small/immutableX-symbol-BLK-RGB.png',
    'PEPE': 'https://coin-images.coingecko.com/coins/images/29850/small/pepe-token.jpeg',
    'FLOKI': 'https://coin-images.coingecko.com/coins/images/16746/small/PNG_image.png',
    'BONK': 'https://coin-images.coingecko.com/coins/images/28600/small/bonk.jpg',
    'WIF': 'https://coin-images.coingecko.com/coins/images/33566/small/dogwifhat.jpg',
    'JUP': 'https://coin-images.coingecko.com/coins/images/34188/small/jup.png',
    'WLD': 'https://coin-images.coingecko.com/coins/images/31069/small/worldcoin.jpeg',
    'STRK': 'https://coin-images.coingecko.com/coins/images/26433/small/starknet.png',
    'ZRO': 'https://coin-images.coingecko.com/coins/images/28206/small/ftxG9_TJ_400x400.jpeg',
    'EIGEN': 'https://coin-images.coingecko.com/coins/images/37447/small/eigen.png',
    'ENA': 'https://coin-images.coingecko.com/coins/images/36530/small/ethena.png',
    'ONDO': 'https://coin-images.coingecko.com/coins/images/26580/small/ONDO.png',
    'ETHFI': 'https://coin-images.coingecko.com/coins/images/35958/small/etherfi.jpeg',
  };
  
  return logoUrls[normalizedSymbol] || null; // Retorna null si no existe
};