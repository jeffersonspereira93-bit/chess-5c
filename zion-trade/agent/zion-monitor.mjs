import fs from 'fs';
import { ZionExecutor } from './zion-executor.mjs';
import { fetchRealAssetSignal } from './aerodrome-oracle.mjs';

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const executor = new ZionExecutor();

async function runHourlySweep() {
  const timestamp = new Date().toISOString();
  console.log(`\n==================================================`);
  console.log(`⏰ [ZION-MONITOR] Varredura horária real | ${timestamp}`);
  console.log(`==================================================`);
  
  for (const [symbol, meta] of Object.entries(config.assets)) {
    try {
      const realSignal = await fetchRealAssetSignal(symbol, meta.address);
      const result = await executor.executeCycle(realSignal, config.walletAddress);
      console.log(`[ASSET: ${symbol.padEnd(5)}] Preço/Sinal: ${realSignal.action} (conf: ${realSignal.confidence}) | Status: ${result.executed ? '⚡ INTENT PRONTA' : '🛡️ ' + result.reason}`);
      if (result.executed) {
        fs.writeFileSync(`agent/intent-${symbol.toLowerCase()}-last.json`, JSON.stringify(result.intentPayload, null, 2));
      }
    } catch (err) {
      console.error(`❌ [ZION-MONITOR] Erro no ativo ${symbol}:`, err.message);
    }
  }
}

runHourlySweep();
setInterval(runHourlySweep, config.pollIntervalMs || 3600000);
console.log(`🛡️ [ZION-MONITOR] Daemon multi-ativo ativo em background (intervalo: ${config.pollIntervalMs / 1000 / 60}min).`);
