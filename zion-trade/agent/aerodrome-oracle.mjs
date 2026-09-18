export async function fetchRealAssetSignal(symbol, address, baseReferencePrice = null) {
  // Simulação / Leitura spot (pode ser substituída por RPC real da pool WETH/USDC e AERO/USDC)
  const mockSpot = {
    WETH: 3250.0,
    AERO: 1.15,
    USDC: 1.0
  };

  const spot = mockSpot[symbol] || 1.0;
  const delta = Math.random(); // variação simulada de 1h

  if (symbol === 'LP_USDC_WETH') {
    // ±5% rigoroso de range de liquidez concentrada
    const lowerRange = spot * 0.95;
    const upperRange = spot * 1.05;
    
    // Simula se o preço atual está dentro da faixa de ±5%
    const currentPriceInPool = spot * (1 + (delta - 0.5) * 0.08);
    const inBounds = currentPriceInPool >= lowerRange && currentPriceInPool <= upperRange;

    return {
      asset: 'LP_USDC_WETH',
      engine: 'CONCENTRATED_LIQUIDITY',
      rangeAmplitude: '±5%',
      lower: lowerRange.toFixed(4),
      upper: upperRange.toFixed(4),
      spot: spot.toFixed(4),
      action: inBounds ? 'HOLD_LP_RANGE' : 'REBALANCE_LP_5PCT',
      confidence: 0.95,
      expectedLoss: 0.5
    };
  }

  if (symbol === 'AERO') {
    // Simula variação percentual de preço recente do AERO (ex: queda de 7% ou alta de 11%)
    // Simulador estocástico controlado para testes de banda
    const priceChangePct = (delta * 0.22) - 0.10; // varia entre -10% e +12%
    const simulatedAeroPrice = spot * (1 + priceChangePct);

    let tacticalAction = 'HOLD_AERO_CORE';
    let mode = 'NEUTRAL';
    let sizeUsdc = 0;

    if (priceChangePct <= -0.05) {
      // Queda ≥ 5% até 9%+: Momento calmo de compra/acumulação com USDC de caixa
      tacticalAction = 'BUY_AERO_VALLEY';
      mode = 'ACCUMULATE_SAFE';
      sizeUsdc = 100; // tamanho tático modular em USDC
    } else if (priceChangePct >= 0.10) {
      // Alta ≥ 10% / 11%+: Momento de realização parcial / venda para USDC
      tacticalAction = 'SELL_AERO_PEAK';
      mode = 'DISTRIBUTE_PROFIT';
      sizeUsdc = 100;
    }

    return {
      asset: 'AERO',
      engine: 'SWING_TACTICAL',
      changePct: (priceChangePct * 100).toFixed(2) + '%',
      priceUsd: simulatedAeroPrice.toFixed(4),
      action: tacticalAction,
      mode,
      amountUsdcToRotate: sizeUsdc,
      confidence: 0.91,
      expectedLoss: 1.0
    };
  }

  return { action: 'HOLD', confidence: 1.0 };
}
