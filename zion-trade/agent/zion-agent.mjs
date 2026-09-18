import fs from 'fs';

const ALLOWED_ACTIONS = ['LONG', 'SHORT', 'HOLD', 'REBALANCE'];
const MAX_CONFIDENCE = 1.0;
const MIN_CONFIDENCE = 0.0;

export class ZionTradeAgent {
    constructor(config = {}) {
        this.riskProfile = config.riskProfile || 'conservative';
        this.state = 'IDLE';
        this.metrics = { equity: config.initialEquity || 1000, dailyPnL: 0, violations: 0, processedTicks: 0 };
        this.rpcUrl = config.rpcUrl || 'https://mainnet.base.org';
    }

    async fetchOnChainContext() {
        try {
            const res = await fetch(this.rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 })
            });
            if (!res.ok) throw new Error('RPC HTTP error');
            const data = await res.json();
            const blockNum = data.result ? parseInt(data.result, 16) : Math.floor(Date.now() / 1000);
            return { blockNum, live: true };
        } catch {
            return { blockNum: Math.floor(Date.now() / 1000), live: false };
        }
    }

    sanitizeAndValidatePayload(rawPayload) {
        if (!rawPayload || typeof rawPayload !== 'object') {
            throw new Error('Strict Schema Violation: Payload must be a non-null object.');
        }
        const { action, confidence, amount, expectedLoss } = rawPayload;

        if (!ALLOWED_ACTIONS.includes(action)) {
            throw new Error(`Strict Schema Violation: Action '${action}' is not whitelisted.`);
        }
        if (typeof confidence !== 'number' || Number.isNaN(confidence) || confidence < MIN_CONFIDENCE || confidence > MAX_CONFIDENCE) {
            throw new Error('Strict Schema Violation: Confidence out of bounds [0.0, 1.0].');
        }
        if (typeof amount !== 'number' || Number.isNaN(amount) || amount < 0) {
            throw new Error('Strict Schema Violation: Invalid numeric amount.');
        }
        if (typeof expectedLoss !== 'number' || Number.isNaN(expectedLoss) || expectedLoss < 0) {
            throw new Error('Strict Schema Violation: Invalid expectedLoss.');
        }
        return { action, confidence, amount, expectedLoss };
    }

    evaluateGuardrails(amount, expectedLoss) {
        if (amount > 100) {
            throw new Error('Guardrail Violation: Size exceeds tactical buffer cap (100).');
        }
        if (expectedLoss > 5) {
            throw new Error('Guardrail Violation: Expected loss exceeds daily max risk (5).');
        }
        return true;
    }

    async evaluateRawSignal(rawMarketInput) {
        let candidate;
        if (typeof rawMarketInput === 'object' && rawMarketInput !== null && rawMarketInput.action) {
            candidate = rawMarketInput;
        } else {
            const vol = typeof rawMarketInput === 'number' ? rawMarketInput : 0.5;
            if (vol > 0.85) candidate = { action: 'SHORT', confidence: 0.9, amount: 40, expectedLoss: 2 };
            else if (vol < 0.15) candidate = { action: 'LONG', confidence: 0.9, amount: 40, expectedLoss: 2 };
            else candidate = { action: 'HOLD', confidence: 1.0, amount: 0, expectedLoss: 0 };
        }
        return this.sanitizeAndValidatePayload(candidate);
    }

    async processTick(rawInput, amountOverride, lossOverride) {
        this.metrics.processedTicks++;
        try {
            const chainCtx = await this.fetchOnChainContext();
            const sanitized = await this.evaluateRawSignal(rawInput);
            const effectiveAmount = amountOverride !== undefined ? amountOverride : sanitized.amount;
            const effectiveLoss = lossOverride !== undefined ? lossOverride : sanitized.expectedLoss;

            if (sanitized.action === 'HOLD' || effectiveAmount === 0) {
                this.state = 'IDLE';
                return { action: 'HOLD', status: 'OK', block: chainCtx.blockNum, confidence: sanitized.confidence };
            }

            this.evaluateGuardrails(effectiveAmount, effectiveLoss);
            this.state = 'EXECUTION_READY';
            return {
                action: sanitized.action,
                amount: effectiveAmount,
                expectedLoss: effectiveLoss,
                confidence: sanitized.confidence,
                status: 'VALIDATED',
                block: chainCtx.blockNum
            };
        } catch (err) {
            this.state = 'CIRCUIT_BREAKER_ACTIVE';
            this.metrics.violations++;
            return { action: 'HALT', error: err.message, status: 'BLOCKED' };
        }
    }
}
