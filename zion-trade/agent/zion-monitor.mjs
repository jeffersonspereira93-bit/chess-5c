import fs from 'fs';
import { ZionExecutor } from './zion-executor.mjs';
import { fetchRealAssetSignal } from './aerodrome-oracle.mjs';

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const executor = new ZionExecutor();

async function runHourlySweep() {
  const timestamp = new Date().toISOString();
  console.log(`\n==================================================`);
  console.log(`⏰ [ZION-DUAL-ENGINE] Varredura LP(±5%) vs Swing AERO | ${timestamp}`);
  console.log(`==================================================`);

  const signals = [];
  for (const [symbol, meta] of Object.entries(config.assets)) {
    const sig = await fetchRealAssetSignal(symbol, meta.address);
    signals.push(sig);
    if (sig.engine === 'CONCENTRATED_LIQUIDITY') {
      console.log(`🏊‍♂️ [LP ENGINE - USDC/WETH] Range ±5% [${sig.lower} - ${sig.upper}] | Spot: ${sig.spot} | Status: ${sig.action}`);
    } else {
      console.log(`🦅 [SWING ENGINE - AERO] Variação: ${sig.changePct} | Preço: $${sig.priceUsd} | Ação: ${sig.action} (${sig.mode})`);
    }
  }

  const separated = await executor.processSeparateEngines(signals, config.walletAddress);
  fs.writeFileSync('agent/dual-engine-last.json', JSON.stringify(separated, null, 2));
}

runHourlySweep();
setInterval(runHourlySweep, config.pollIntervalMs || 3600000);
console.log(`🛡️ [ZION-MONITOR] Motores dual (LP ±5% + Swing AERO) ativos!`);
