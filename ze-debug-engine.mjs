import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Chess = require('chess.js').Chess || require('chess.js');
import fs from 'fs';
import path from 'path';

class ZeGameDebugger {
    constructor() {
        this.game = new Chess();
        this.telemetry = { fuzzMoves: 0, crashes: 0, warnings: [] };
    }

    log(tier, msg) {
        const ts = new Date().toISOString().slice(11, 23);
        console.log(`[${ts}] [ZE-${tier.toUpperCase()}] ${msg}`);
    }

    // Fuzz Testing: estressa o motor FIDE com 200 mutações aleatórias consecutivas
    runFuzzStress(iterations = 200) {
        this.log('INFO', `Iniciando fuzz stress test (${iterations} ciclos)...`);
        this.game.reset();

        for (let i = 0; i < iterations; i++) {
            if (this.game.game_over()) {
                this.game.reset();
            }
            const moves = this.game.moves({ verbose: true });
            if (moves.length === 0) break;
            
            const target = moves[Math.floor(Math.random() * moves.length)];
            try {
                this.game.move(target);
                this.telemetry.fuzzMoves++;
            } catch (err) {
                this.telemetry.crashes++;
                this.log('CRASH', `Falha no estado pós-lance [${target.san}]: ${err.message}`);
            }
        }
        this.log('REPORT', `Fuzz finalizado. Lances válidos: ${this.telemetry.fuzzMoves} | Crashes/Erros lógicos: ${this.telemetry.crashes}`);
    }

    // Invariantes estruturais do HTML/DOM do jogo
    auditDOMInvariants(filePath) {
        this.log('INFO', `Auditando invariantes em ${filePath}...`);
        if (!fs.existsSync(filePath)) {
            this.log('CRASH', 'Arquivo alvo não encontrado.');
            return false;
        }
        const html = fs.readFileSync(filePath, 'utf8');
        
        const checks = [
            { id: 'Viewport Mobile-First', test: html.includes('maximum-scale=1.0') },
            { id: 'AudioContext Safe Resume', test: html.includes('audioCtx.resume') },
            { id: 'Escrow State Lock', test: html.includes('escrowLocked') },
            { id: 'Grid Board 8x8 CSS Grid', test: html.includes('grid-template-columns: repeat(8, 1fr)') }
        ];

        checks.forEach(c => {
            if (!c.test) {
                this.telemetry.warnings.push(`Violação de invariante: ${c.id}`);
                this.log('WARN', `❌ ${c.id}`);
            } else {
                this.log('OK', `✔️ ${c.id}`);
            }
        });
        return this.telemetry.warnings.length === 0;
    }
}

// Execução imediata se chamado via CLI
const debugTarget = path.resolve('./index.html');
const ze = new ZeGameDebugger();
console.log('🤖 Zé-Debugger ativo acoplado ao pipeline...\n');
ze.auditDOMInvariants(debugTarget);
console.log('');
ze.runFuzzStress(150);
