import fs from 'fs';
import { ZionExecutor } from './zion-executor.mjs';
import { fetchRealAssetSignal } from './aerodrome-oracle.mjs';

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const executor = new ZionExecutor();

async function runHourlySweep() {
  const timestamp = new Date().toISOString();
  console.log(`\n==================================================`);
  console.log(`⏰ [ZION-MONITOR] Varredura LP & AERO Swing | ${timestamp}`);
  console.log(`==================================================`);
  
  for (const [symbol, meta] of Object.entries(config.assets)) {
    try {
      const realSignal = await fetchRealAssetSignal(symbol, meta.address);
      if (symbol === 'LP_USDC_WETH') {
        console.log(`[LP RANGE] Spot: ${realSignal.range?.spot} | Faixa ideal: [${realSignal.range?.lower} - ${realSignal.range?.upper}] | Status: ${realSignal.viability}`);
      } else {
        console.log(`[AERO SWING] Ação: ${realSignal.action} | Preço: $${realSignal.priceUsd?.toFixed(4)} | Modo: ${realSignal.mode}`);
      }
      
      const payloadReady = {
        asset: symbol,
        role: meta.role,
        signal: realSignal,
        timestamp: Date.now()
      };
      fs.writeFileSync(`agent/state-${symbol.toLowerCase()}.json`, JSON.stringify(payloadReady, null, 2));
    } catch (err) {
      console.error(`❌ [ZION-MONITOR] Erro em ${symbol}:`, err.message);
    }
  }
}

runHourlySweep();
setInterval(runHourlySweep, config.pollIntervalMs || 3600000);
console.log(`🛡️ [ZION-MONITOR] Motor LP+Swing ativo em background.`);
