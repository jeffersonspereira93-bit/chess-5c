import { ZionTradeAgent } from '../agent/zion-agent.mjs';
import fs from 'fs';

console.log('🛡️ [ZION-TRADE QA] Validando agente com contexto on-chain da Base...');
const agent = new ZionTradeAgent({ riskProfile: 'hybrid' });

const testCases = [
    { signal: 'LONG_SIGNAL', amount: 50, loss: 1, expected: 'VALIDATED' },
    { signal: 'SHORT_SIGNAL', amount: 500, loss: 1, expected: 'BLOCKED' },
    { signal: 'LONG_SIGNAL', amount: 40, loss: 10, expected: 'BLOCKED' }
];

let passed = 0;
for (const [idx, tc] of testCases.entries()) {
    const res = await agent.processTick(tc.signal, tc.amount, tc.loss);
    if (res.status === tc.expected) {
        console.log(`✅ [TEST #${idx+1}] Passou (${res.status}, bloco/ts: ${res.block})`);
        passed++;
    } else {
        console.error(`❌ [TEST #${idx+1}] Falhou. Esperado ${tc.expected}, obtido ${res.status}`);
    }
}

const report = {
    timestamp: new Date().toISOString(),
    totalTests: testCases.length,
    passed,
    status: passed === testCases.length ? '100%_PASS' : 'FAIL'
};

fs.writeFileSync('zion-trade-report.json', JSON.stringify(report, null, 2));
console.log('📊 Relatório atualizado em zion-trade-report.json');
if (passed !== testCases.length) process.exit(1);
