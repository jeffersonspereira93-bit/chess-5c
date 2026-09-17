import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ChessModule = require('chess.js');
const Chess = ChessModule.Chess || ChessModule;
import fs from 'fs';

class ChessAISimulator {
    constructor() {
        this.stats = { totalMatches: 0, draws: 0, wins: { w: 0, b: 0 }, avgTurns: 0, anomalies: [] };
    }

    botRandom(moves) {
        return moves[Math.floor(Math.random() * moves.length)];
    }

    isGameOver(game) {
        return typeof game.isGameOver === 'function' ? game.isGameOver() : game.game_over();
    }

    inCheckmate(game) {
        return typeof game.isCheckmate === 'function' ? game.isCheckmate() : game.in_checkmate();
    }

    runMatch(maxTurns = 150) {
        const game = new Chess();
        let turn = 0;

        while (!this.isGameOver(game) && turn < maxTurns) {
            const moves = game.moves({ verbose: true });
            if (moves.length === 0) break;
            
            const chosen = this.botRandom(moves);
            try {
                game.move(chosen);
            } catch (err) {
                this.stats.anomalies.push({ turn, error: err.message });
                break;
            }
            turn++;
        }

        this.stats.totalMatches++;
        this.stats.avgTurns = Math.round(((this.stats.avgTurns * (this.stats.totalMatches - 1)) + turn) / this.stats.totalMatches);

        if (this.inCheckmate(game)) {
            const winner = game.turn() === 'w' ? 'b' : 'w';
            this.stats.wins[winner]++;
        } else {
            this.stats.draws++;
        }
    }

    simulateBatch(numMatches = 100) {
        console.log(`⚡ [AI-SIM] Rodando ${numMatches} partidas de xadrez AI vs AI...`);
        const start = Date.now();
        for (let i = 0; i < numMatches; i++) {
            this.runMatch();
        }
        const duration = Date.now() - start;
        console.log(`✅ [AI-SIM] Concluído em ${duration}ms.`);
        console.table(this.stats);
        fs.writeFileSync('ai-sim-report.json', JSON.stringify(this.stats, null, 2));
    }
}

const sim = new ChessAISimulator();
sim.simulateBatch(200);
