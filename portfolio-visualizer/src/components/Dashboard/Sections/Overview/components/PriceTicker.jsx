import { formatEuropeanCurrency, formatEuropeanPercentage } from '../../../../../utils/numberFormatter';
import { getAssetLogo } from '../../../../../utils/krakenAssets';

const PriceTicker = ({ portfolioData, theme }) => {
  // Frases profesionales para mostrar intercaladas
  const professionalQuotes = [
    "Diversification is the only free lunch in investing",
    "Time in the market beats timing the market",
    "Risk comes from not knowing what you're doing",
    "The best investment you can make is in yourself",
    "Compound interest is the eighth wonder of the world",
    "Don't put all your eggs in one basket",
    "An investment in knowledge pays the best interest",
    "Price is what you pay, value is what you get",
    "The market is a voting machine in the short run, but a weighing machine in the long run",
    "Be fearful when others are greedy, greedy when others are fearful",
    "In the short run, the market is a popularity contest. In the long run, it's a weighing machine",
    "The stock market is designed to transfer money from the impatient to the patient",
    "It's not about timing the market, but time in the market",
    "Risk and reward are inextricably linked",
    "The biggest risk is not taking any risk at all",
    "Past performance does not guarantee future results",
    "Invest in what you understand",
    "The trend is your friend until it bends at the end",
    "Bulls make money, bears make money, but pigs get slaughtered",
    "Cut your losses and let your profits run",
    "Never invest money you cannot afford to lose",
    "The market can remain irrational longer than you can remain solvent",
    "Volatility is the price of returns",
    "A portfolio without risk is a portfolio without reward",
    "Discipline is the bridge between goals and accomplishment",
    "Patience is a virtue in investing",
    "Markets are cyclical, emotions are not",
    "Quality over quantity in portfolio construction",
    "Successful investing requires emotional discipline",
    "The power of compounding grows with time",
    "Consistency beats perfection in investing",
    "Financial education is the foundation of wealth",
    "Asset allocation is more important than security selection",
    "Focus on fundamentals, not market noise",
    "Rebalancing maintains your investment strategy",
    "Systematic investing reduces emotional decisions",
    "Long-term thinking creates lasting wealth",
    "Risk management preserves capital",
    "Market timing is a fool's game",
    "Dollar-cost averaging smooths volatility",
    "Stay invested during market downturns",
    "Inflation erodes purchasing power over time",
    "Emergency funds provide peace of mind",
    "Tax efficiency maximizes returns",
    "Regular reviews keep portfolios on track"
  ];

  // Lista de activos conocidos para rellenar hasta 8
  const popularAssets = [
    { symbol: 'BTC', price: 95432.50 },
    { symbol: 'ETH', price: 3421.80 },
    { symbol: 'ADA', price: 0.89 },
    { symbol: 'DOT', price: 12.45 },
    { symbol: 'MATIC', price: 1.23 },
    { symbol: 'SOL', price: 234.67 },
    { symbol: 'AVAX', price: 67.89 },
    { symbol: 'ATOM', price: 15.34 },
    { symbol: 'LINK', price: 23.45 },
    { symbol: 'UNI', price: 8.76 }
  ];

  // Procesar datos del portfolio para extraer precios
  const getTickerData = () => {
    let ownedAssets = [];
    
    // Si hay portfolio data, procesarla
    if (portfolioData?.portfolio_data) {
      // Assets que ya tienes en el portfolio - ORDENADOS por valor (menor valor primero)
      ownedAssets = portfolioData.portfolio_data
        .filter(asset => asset.current_value > 0)
        .sort((a, b) => (a.current_value || 0) - (b.current_value || 0)) // Menor valor primero
        .map(asset => ({
          symbol: asset.asset,
          price: asset.current_price || 0,
          isOwned: true,
          // Simular cambio 24h por ahora - después conectar con API real
          change24h: ((Math.random() - 0.5) * 10).toFixed(2),
          changePercent24h: ((Math.random() - 0.5) * 8).toFixed(1)
        }));
    }

    // Siempre asegurar que hay al menos activos populares
    const ownedSymbols = new Set(ownedAssets.map(asset => asset.symbol));
    const targetCount = Math.max(8, ownedAssets.length); // Al menos 8 activos
    const missingCount = targetCount - ownedAssets.length;
    
    const popularToAdd = popularAssets
      .filter(asset => !ownedSymbols.has(asset.symbol))
      .slice(0, missingCount)
      .map(asset => ({
        symbol: asset.symbol,
        price: asset.price,
        isOwned: false,
        // Simular cambio 24h para activos populares
        change24h: ((Math.random() - 0.5) * 10).toFixed(2),
        changePercent24h: ((Math.random() - 0.5) * 8).toFixed(1)
      }));

    // PRIMERO los populares, DESPUÉS los que tienes (menor valor primero)
    return [...popularToAdd, ...ownedAssets];
  };

  const tickerData = getTickerData();
  
  // Debug logging for asset ordering
  console.log('PriceTicker - Portfolio data:', portfolioData?.portfolio_data?.map(asset => ({
    asset: asset.asset,
    current_value: asset.current_value,
    amount: asset.amount
  })));
  console.log('PriceTicker - Ticker data:', tickerData);

  // Ya no retornamos null - siempre renderizamos el ticker

  // Scroll infinito ultra lento - bucle perfecto
  const animationDuration = 2400; // 40 minutos por ciclo (se repite infinitamente)

  // Renderizar una frase profesional
  const renderQuote = (index) => {
    const quote = professionalQuotes[index % professionalQuotes.length];
    return (
      <div
        key={`quote-${index}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginRight: '80px', // Espaciado entre elementos
          whiteSpace: 'nowrap',
          fontSize: '14px',
          fontFamily: "'Inter', sans-serif",
          fontStyle: 'italic',
          color: '#d0d0d0'
        }}
      >
        <span>"{quote}"</span>
      </div>
    );
  };

  // Renderizar todos los activos en orden
  const renderAllAssets = () => {
    return tickerData.map((asset, index) => {
      const isPositive = parseFloat(asset.changePercent24h) >= 0;
      
      return (
        <div
          key={`asset-${index}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginRight: '60px', // Espaciado entre items
            whiteSpace: 'nowrap',
            fontSize: '14px',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          {/* Logo */}
          {getAssetLogo(asset.symbol) ? (
            <img 
              src={getAssetLogo(asset.symbol, 'small')} 
              alt={asset.symbol}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div style={{
              width: '26px',
              height: '26px',
              flexShrink: 0
            }} />
          )}

          {/* Symbol */}
          <span style={{
            fontWeight: '600',
            color: asset.isOwned ? theme.accentPrimary : '#d0d0d0',
            textTransform: 'uppercase',
            opacity: asset.isOwned ? 1 : 0.7
          }}>
            {asset.symbol}:
          </span>

          {/* Price */}
          <span style={{
            fontWeight: '900',
            color: asset.isOwned ? theme.textPrimary : '#d0d0d0',
            opacity: asset.isOwned ? 1 : 0.8
          }}>
            {formatEuropeanCurrency(asset.price)}
          </span>

          {/* 24h Change */}
          <span style={{
            fontWeight: '400',
            fontStyle: 'italic',
            color: isPositive ? '#00FF99' : '#ef4444'
          }}>
            {isPositive ? '+' : ''}{formatEuropeanPercentage(parseFloat(asset.changePercent24h))} {isPositive ? '↗' : '↘'}
          </span>
        </div>
      );
    });
  };

  return (
    <div style={{
      height: '56px',
      width: '100%',
      overflow: 'hidden',
      background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.03) 100%)',
      borderBottom: `1px solid ${theme.borderColor}`,
      marginBottom: '1rem',
      marginTop: '-10px',
      position: 'absolute',
      top: '-28px', // Ajustado bajándolo 2px
      left: '-8rem', // Extender mucho más a la izquierda
      right: '-8rem', // Extender mucho más a la derecha
      width: 'calc(100% + 16rem)', // Ancho total cubriendo toda la pantalla
      zIndex: 10,
      display: 'flex',
      alignItems: 'center'
    }}>
      {/* Gradiente de fade en los bordes */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '50px',
        height: '100%',
        background: `linear-gradient(90deg, ${theme.bg}, transparent)`,
        zIndex: 2,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        right: 0,
        top: 0,
        width: '50px',
        height: '100%',
        background: `linear-gradient(90deg, transparent, ${theme.bg})`,
        zIndex: 2,
        pointerEvents: 'none'
      }} />

      {/* Contenido del ticker que se desplaza */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        animation: `scroll-ticker ${animationDuration}s linear infinite`,
        animationPlayState: 'running',
        willChange: 'transform'
      }}>
        {/* Primer conjunto completo */}
        {Array.from({ length: 10 }, (_, i) => (
          <div key={`set1-${i}`} style={{ display: 'flex', alignItems: 'center' }}>
            {renderQuote(i)}
            {renderAllAssets()}
          </div>
        ))}
        
        {/* Segundo conjunto idéntico para bucle perfecto */}
        {Array.from({ length: 10 }, (_, i) => (
          <div key={`set2-${i}`} style={{ display: 'flex', alignItems: 'center' }}>
            {renderQuote(i)}
            {renderAllAssets()}
          </div>
        ))}
      </div>

      <style>
        {`
          @keyframes scroll-ticker {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
        `}
      </style>
    </div>
  );
};

export default PriceTicker;