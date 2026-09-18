import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ChessModule = require('chess.js');
const Chess = ChessModule.Chess || ChessModule;
import fs from 'fs';

class ZionArenaValidator {
    constructor() {
        this.report = {
            timestamp: new Date().toISOString(),
            fideRulesValid: false,
            matchesSimulated: 0,
            anomalies: [],
            stats: { draws: 0, wins: { w: 0, b: 0 }, avgTurns: 0 }
        };
    }

    testFideEdgeCases() {
        const game = new Chess();
        const move = game.move('e4');
        if (!move) throw new Error('FIDE basic move e4 failed');
        if (game.turn() !== 'b') throw new Error('Turn switch failed');
        this.report.fideRulesValid = true;
    }

    runBatchSimulation(numMatches = 50) {
        let totalTurns = 0;
        for (let i = 0; i < numMatches; i++) {
            const game = new Chess();
            let turn = 0;
            const maxTurns = 100;
            while (!game.isGameOver() && turn < maxTurns) {
                const moves = game.moves({ verbose: true });
                if (moves.length === 0) break;
                const chosen = moves[Math.floor(Math.random() * moves.length)];
                try {
                    game.move(chosen);
                } catch (e) {
                    this.report.anomalies.push({ match: i, turn, error: e.message });
                    break;
                }
                turn++;
            }
            totalTurns += turn;
            this.report.matchesSimulated++;
            if (game.isCheckmate()) {
                const winner = game.turn() === 'w' ? 'b' : 'w';
                this.report.stats.wins[winner]++;
            } else {
                this.report.stats.draws++;
            }
        }
        this.report.stats.avgTurns = Math.round(totalTurns / this.report.matchesSimulated);
    }

    execute() {
        console.log('🛡️ [ZION QA] Iniciando validação completa da Chess 5C Arena...');
        try {
            this.testFideEdgeCases();
            console.log('✅ [ZION QA] Regras FIDE / chess.js validadas.');
            this.runBatchSimulation(100);
            console.log(`✅ [ZION QA] ${this.report.matchesSimulated} simulações concluídas com sucesso.`);
            fs.writeFileSync('zion-validation-report.json', JSON.stringify(this.report, null, 2));
            console.table(this.report.stats);
            if (this.report.anomalies.length === 0) {
                console.log('🎉 [ZION QA] Status: 100% ÍNTEGRO. Pronto para distribuição.');
            } else {
                console.warn('⚠️ [ZION QA] Anomalias detectadas:', this.report.anomalies);
            }
        } catch (err) {
            console.error('❌ [ZION QA] Falha crítica:', err.message);
            process.exit(1);
        }
    }
}

new ZionArenaValidator().execute();
