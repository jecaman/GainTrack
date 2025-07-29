// Debug: Test para verificar que los nuevos KPIs funcionan

console.log('🧪 Testing KPI processing...');

// Simular datos del backend
const mockPortfolioData = {
  kpis: {
    total_invested: 1643.70,
    current_value: 1898.57,
    profit: 223.04,
    profit_percentage: 13.57,
    fees: 5.35,
    liquidity: 0,
    realized_gains: -31.83,
    unrealized_gains: 254.87,
    unrealized_percentage: 15.51
  }
};

// Simular la función getKPIData del componente
function getKPIData(portfolioData) {
  if (!portfolioData?.kpis) {
    console.log('❌ No KPI data found');
    return null;
  }

  const kpis = portfolioData.kpis;
  const isPositive = kpis.profit >= 0;
  
  // Nuevos KPIs mejorados
  const realizedGains = kpis.realized_gains || 0;
  const unrealizedGains = kpis.unrealized_gains || 0;
  const unrealizedPercentage = kpis.unrealized_percentage || 0;
  
  const realizedIsPositive = realizedGains >= 0;
  const unrealizedIsPositive = unrealizedGains >= 0;

  return {
    totalInvested: `${kpis.total_invested.toFixed(2)}€`,
    currentValue: `${kpis.current_value.toFixed(2)}€`,
    profit: `${isPositive ? '+' : ''}${kpis.profit.toFixed(2)}€`,
    profitPercent: `${isPositive ? '+' : ''}${kpis.profit_percentage.toFixed(2)}%`,
    isPositive,
    liquidity: kpis.liquidity > 0 ? `${kpis.liquidity.toFixed(2)}€` : 'N/A',
    fees: `${kpis.fees.toFixed(2)}€`,
    // Nuevos KPIs
    realizedGains: `${realizedIsPositive ? '+' : ''}${realizedGains.toFixed(2)}€`,
    realizedIsPositive,
    unrealizedGains: `${unrealizedIsPositive ? '+' : ''}${unrealizedGains.toFixed(2)}€`,
    unrealizedPercent: `${unrealizedIsPositive ? '+' : ''}${unrealizedPercentage.toFixed(2)}%`,
    unrealizedIsPositive
  };
}

// Test
const result = getKPIData(mockPortfolioData);
console.log('✅ KPI Data processed:', result);

// Verificar que todos los campos existen
const expectedFields = [
  'totalInvested', 'currentValue', 'profit', 'profitPercent', 'isPositive',
  'liquidity', 'fees', 'realizedGains', 'realizedIsPositive',
  'unrealizedGains', 'unrealizedPercent', 'unrealizedIsPositive'
];

const missingFields = expectedFields.filter(field => !(field in result));
if (missingFields.length === 0) {
  console.log('🎉 All fields present!');
} else {
  console.log('❌ Missing fields:', missingFields);
}

console.log('\n📊 Individual KPI values:');
console.log(`   Portfolio Value: ${result.currentValue}`);
console.log(`   Total Invested: ${result.totalInvested}`);
console.log(`   Net Profit: ${result.profit} (${result.profitPercent})`);
console.log(`   Fees: ${result.fees}`);
console.log(`   💎 Realized Gains: ${result.realizedGains}`);
console.log(`   📈 Unrealized Gains: ${result.unrealizedGains} (${result.unrealizedPercent})`);
console.log(`   Liquidity: ${result.liquidity}`);