import fs from 'fs';
import { ZionTradeAgent } from './zion-agent.mjs';

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

export class ZionExecutor {
    constructor() {
        this.agent = new ZionTradeAgent({ riskProfile: 'hybrid', rpcUrl: config.rpcUrl });
    }

    async executeCycle(rawSignal, walletAddress, amountOverride, lossOverride) {
        console.log(`⚡ [ZION-EXEC] Processando ciclo para carteira ${walletAddress}...`);
        const decision = await this.agent.processTick(rawSignal, amountOverride, lossOverride);

        if (decision.status !== 'VALIDATED') {
            console.warn(`🛡️ [ZION-EXEC] Execução suspensa/bloqueada: ${decision.error || decision.action}`);
            return { executed: false, reason: decision.error || 'HOLD_OR_BLOCKED', decision };
        }

        // Se validado, monta intent assianável / payload on-chain para Base / Aerodrome / Vault
        const intentPayload = {
            targetVault: config.tacticalVault,
            action: decision.action,
            amount: decision.amount,
            expectedLoss: decision.expectedLoss,
            chainId: config.chainId,
            executorWallet: walletAddress,
            timestamp: Date.now()
        };

        console.log('✅ [ZION-EXEC] Intent tática validada e empacotada:', intentPayload);
        return { executed: true, intentPayload, decision };
    }
}

// Auto-teste do executor
if (import.meta.url === `file://${process.argv}`) {
    const exec = new ZionExecutor();
    const res = await exec.executeCycle({ action: 'LONG', confidence: 0.95, amount: 40, expectedLoss: 2 }, '0xHUB_WALLET_ADDRESS_BASE');
    fs.writeFileSync('zion-execution-last.json', JSON.stringify(res, null, 2));
    console.log('📄 Log do último ciclo gravado.');
}
