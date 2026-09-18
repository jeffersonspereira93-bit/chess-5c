import fs from 'fs';
import { ZionExecutor } from './zion-executor.mjs';

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const executor = new ZionExecutor();

async function mockMarketSignalForAsset(symbol) {
    if (symbol === 'USDC') return { action: 'HOLD', confidence: 1.0, amount: 0, expectedLoss: 0 };
    const vol = Math.random();
    if (vol > 0.8) return { action: 'SHORT', confidence: 0.85, amount: 30, expectedLoss: 1.5 };
    if (vol < 0.2) return { action: 'LONG', confidence: 0.90, amount: 35, expectedLoss: 1.5 };
    return { action: 'HOLD', confidence: 1.0, amount: 0, expectedLoss: 0 };
}

async function runHourlySweep() {
    console.log(`\n⏰ [ZION-MONITOR] Varredura horária iniciada em ${new Date().toISOString()}`);
    for (const [symbol, meta] of Object.entries(config.assets)) {
        console.log(`📊 [ZION-MONITOR] Analisando ativo ${symbol} (${meta.address} | ${meta.role})...`);
        const rawSignal = await mockMarketSignalForAsset(symbol);
        const result = await executor.executeCycle(rawSignal, config.walletAddress);
        console.log(`Status ${symbol}:`, result.executed ? '⚡ INTENT PRONTA PARA ASSINATURA' : `🛡️ ${result.reason}`);
    }
}

// Execução imediata do primeiro ciclo + loop de 1 hora
runHourlySweep();
setInterval(runHourlySweep, config.pollIntervalMs || 3600000);
console.log(`🛡️ [ZION-MONITOR] Daemon rodando em background (ciclo de ${config.pollIntervalMs / 1000 / 60} min). Mantenha o Termux ativo ou migre para PM2.`);
