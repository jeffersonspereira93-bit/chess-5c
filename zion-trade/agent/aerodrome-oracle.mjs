export async function fetchRealAssetSignal(symbol, address) {
  // Simulação de preço spot ancorada na realidade operacional da Base/Aerodrome
  const mockSpot = {
    WETH: 3250.0 + (Math.random() * 50 - 25),
    AERO: 1.15 + (Math.random() * 0.10 - 0.05),
    USDC: 1.0
  };

  const price = mockSpot[symbol] || 1.0;
  const delta = Math.random();

  if (symbol === 'LP_USDC_WETH') {
    // Avalia range de liquidez concentrada (ex: +-5% ou +-8% do spot)
    const lowerRange = price * 0.94;
    const upperRange = price * 1.06;
    const volatilityScore = Math.abs(delta - 0.5); // 0 a 0.5
    const viability = volatilityScore < 0.35 ? 'VIABLE_RANGE' : 'OUT_OF_BOUNDS_WARNING';
    
    return {
      action: viability === 'VIABLE_RANGE' ? 'HOLD_LP_RANGE' : 'REBALANCE_RANGE',
      confidence: 0.92,
      range: { lower: lowerRange.toFixed(2), upper: upperRange.toFixed(2), spot: price.toFixed(2) },
      viability,
      expectedLoss: 0.8
    };
  }

  if (symbol === 'AERO') {
    // Swing trade / acumulação baseada em desvio expressivo
    if (delta > 0.85) {
      return { action: 'SELL_AERO_PEAK', confidence: 0.89, amount: 50, expectedLoss: 1.5, priceUsd: price, mode: 'SWING_DISTRIBUTE' };
    } else if (delta < 0.15) {
      return { action: 'BUY_AERO_VALLEY', confidence: 0.93, amount: 60, expectedLoss: 1.5, priceUsd: price, mode: 'SWING_ACCUMULATE' };
    }
    return { action: 'HOLD_AERO_CORE', confidence: 1.0, amount: 0, expectedLoss: 0, priceUsd: price, mode: 'HOLD' };
  }

  return { action: 'HOLD', confidence: 1.0, amount: 0, expectedLoss: 0, priceUsd: price };
}
