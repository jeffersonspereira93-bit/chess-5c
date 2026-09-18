import { ZionTradeAgent } from '../agent/zion-agent.mjs';
import fs from 'fs';

console.log('🛡️ [ZION-TRADE QA] Executing Hardened Zero-Trust & Schema Validation Suite...');
const agent = new ZionTradeAgent({ riskProfile: 'hybrid' });

const testCases = [
    { name: 'Valid Long within caps', input: { action: 'LONG', confidence: 0.95, amount: 40, expectedLoss: 2 }, override: null, expectedStatus: 'VALIDATED' },
    { name: 'Hallucinated/Illegal Action', input: { action: 'RUGPULL', confidence: 0.99, amount: 10, expectedLoss: 1 }, override: null, expectedStatus: 'BLOCKED' },
    { name: 'Confidence out of bounds (>1.0)', input: { action: 'SHORT', confidence: 1.5, amount: 20, expectedLoss: 1 }, override: null, expectedStatus: 'BLOCKED' },
    { name: 'Exceeds tactical buffer via override', input: { action: 'LONG', confidence: 0.8, amount: 10, expectedLoss: 1 }, override: { amount: 250, loss: 2 }, expectedStatus: 'BLOCKED' },
    { name: 'Neutral Safe State', input: { action: 'HOLD', confidence: 1.0, amount: 0, expectedLoss: 0 }, override: null, expectedStatus: 'OK' }
];

let passed = 0;
for (const [idx, tc] of testCases.entries()) {
    const res = await agent.processTick(tc.input, tc.override?.amount, tc.override?.loss);
    const match = res.status === tc.expectedStatus || (tc.expectedStatus === 'OK' && res.action === 'HOLD');
    if (match) {
        console.log(`✅ [TEST #${idx+1}: ${tc.name}] Passou (${res.status || res.action})`);
        passed++;
    } else {
        console.error(`❌ [TEST #${idx+1}: ${tc.name}] Falhou. Esperado ${tc.expectedStatus}, obtido`, res);
    }
}

const report = {
    timestamp: new Date().toISOString(),
    totalTests: testCases.length,
    passed,
    hardenedSchema: true,
    status: passed === testCases.length ? '100%_HARDENED_PASS' : 'FAIL'
};

fs.writeFileSync('zion-trade-report.json', JSON.stringify(report, null, 2));
console.log('📊 Relatório blindado salvo em zion-trade-report.json');
if (passed !== testCases.length) process.exit(1);
