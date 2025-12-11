import { Server as IOServer, Socket } from 'socket.io';
import { SupabaseClient } from '@supabase/supabase-js';

// --- 🟢 AQUÍ ESTÁ LA CORRECCIÓN 2 🟢 ---
interface PlayerData {
    socket?: Socket; // 👈 'socket' es opcional (para el Bot)
    userId: string;
    displayName: string;
    role: 'shooter' | 'goalkeeper';
    currentChoice?: number | null;
    score: number;
}

interface Game {
    id: string; 
    players: PlayerData[];
    currentRound: number;
    maxRounds: number;
    phase: 'waiting' | 'playing' | 'finished';
    timer?: any;
    botTimer?: any;
    hostId: string;
    isPublic: boolean;
}

interface TranslatedChoice {
    height: 'alta' | 'mitjana' | 'baixa';
    side: 'esquerra' | 'centre' | 'dreta';
}

export class MatchMaker {
    private io: IOServer;
    private supabase: SupabaseClient;
    private games: Map<string, Game> = new Map();

    constructor(io: IOServer, supabase: SupabaseClient) {
        this.io = io;
        this.supabase = supabase;
    }

    private calculatePoints(shoot: TranslatedChoice, save: TranslatedChoice): number {
        let points = 0;
        if (shoot.height === save.height) points++;
        if (shoot.side === save.side) points++;
        return points;
    }

    // --- 🟢 AQUÍ ESTÁ LA CORRECCIÓN 3 🟢 ---
    private translateZone(zoneId: number): TranslatedChoice {
        // 'as const' asegura a TypeScript que los tipos son exactos
        const heightMap = ['alta', 'alta', 'alta', 'mitjana', 'mitjana', 'mitjana', 'baixa', 'baixa', 'baixa'] as const;
        const sideMap = ['esquerra', 'centre', 'dreta', 'esquerra', 'centre', 'dreta', 'esquerra', 'centre', 'dreta'] as const;
        const safeZone = Math.max(0, Math.min(zoneId, 8));
        
        // Ahora el 'return' es válido
        return { height: heightMap[safeZone], side: sideMap[safeZone] };
    }

    private getSanitizedGame(game: Game) {
        return {
            id: game.id,
            phase: game.phase,
            currentRound: game.currentRound,
            maxRounds: game.maxRounds,
            hostId: game.hostId,
            isPublic: game.isPublic,
            players: game.players.map(p => ({
                userId: p.userId,
                displayName: p.displayName,
                role: p.role,
                score: p.score
            }))
        };
    }

    public createGame(socket: Socket, displayName: string, isPublic: boolean, maxRounds: number) {
        const gameCode = this.generateGameCode();
        const host: PlayerData = {
            socket,
            userId: socket.id,
            displayName: displayName || 'Anónimo',
            role: 'shooter',
            score: 0,
        };
        const game: Game = {
            id: gameCode,
            players: [host],
            phase: 'waiting', 
            currentRound: 1,
            maxRounds: (maxRounds || 1) * 2,
            hostId: socket.id,
            isPublic: isPublic
        };
        this.games.set(gameCode, game);
        socket.join(gameCode);
        socket.emit('game_created', { gameCode, game: this.getSanitizedGame(game) });

        if (isPublic) {
            this.broadcastPublicGames();
        }
    }

    public requestBotGame(socket: Socket, gameCode: string) {
        const game = this.games.get(gameCode);
        if (!game || !game.isPublic || game.phase !== 'waiting' || game.players.length !== 1 || game.hostId !== socket.id) {
            return socket.emit('error_joining', { message: 'No s\'ha pogut afegir el bot' });
        }

        // 'botPlayer' ahora es válido porque 'socket' es opcional
        const botPlayer: PlayerData = {
            socket: undefined,
            userId: 'BOT',
            displayName: 'Bot Rival',
            role: 'goalkeeper',
            score: 0,
        };
        game.players.push(botPlayer);
        game.phase = 'playing';
        
        const host = game.players[0];
        if (host && host.socket) {
            host.socket.emit('bot_joined');
            host.socket.emit('match_start', { game: this.getSanitizedGame(game) });
        }
        
        this.broadcastPublicGames();
        this.startRound(game);
    }


    public joinGame(socket: Socket, gameCode: string, displayName: string) {
        const game = this.games.get(gameCode);
        if (!game) return socket.emit('error_joining', { message: 'Partida no encontrada' });
        if (game.players.length >= 2) return socket.emit('error_joining', { message: 'Partida llena' });
        if (game.phase !== 'waiting') return socket.emit('error_joining', { message: 'La partida ya ha comenzado' });

        const player2: PlayerData = {
            socket,
            userId: socket.id,
            displayName: displayName || 'Anónimo',
            role: 'goalkeeper',
            score: 0,
        };
        game.players.push(player2);
        game.phase = 'playing';
        socket.join(gameCode);

        const sanitizedGame = this.getSanitizedGame(game);
        this.io.to(gameCode).emit('match_start', { game: sanitizedGame });
        this.startRound(game);

        if (game.isPublic) this.broadcastPublicGames();
    }

    public getPublicGames(socket: Socket) {
        const openGames = Array.from(this.games.values())
            .filter(g => g.isPublic && g.phase === 'waiting' && g.players.length === 1)
            .map(g => this.getSanitizedGame(g));
        socket.emit('public_games_list', openGames);
    }

    private broadcastPublicGames() {
        const openGames = Array.from(this.games.values())
            .filter(g => g.isPublic && g.phase === 'waiting' && g.players.length === 1)
            .map(g => this.getSanitizedGame(g));
        this.io.emit('public_games_list', openGames);
    }

    public registerChoice(socket: Socket, gameCode: string, zoneId: any) {
        const game = this.games.get(gameCode);
        if (!game) return;
        const player = game.players.find(p => p.userId === socket.id);
        if (!player || player.currentChoice !== null) return;

        player.currentChoice = parseInt(String(zoneId), 10);
        
        const opponent = game.players.find(p => p.userId !== socket.id);
        if(opponent && opponent.userId === 'BOT' && opponent.currentChoice === null) {
            const botDelay = Math.floor(Math.random() * 2000) + 1000;
            if (game.botTimer) clearTimeout(game.botTimer);
            game.botTimer = setTimeout(() => this.makeBotChoice(game), botDelay);
        }

        this.checkRoundCompletion(game);
    }

    private startRound(game: Game) {
        if (game.phase !== 'playing') return;
        game.players.forEach(p => p.currentChoice = null);
        
        if (game.timer) clearTimeout(game.timer);
        if (game.botTimer) clearTimeout(game.botTimer);

        game.players.forEach(p => {
            if (p.socket) {
                p.socket.emit('round_start', {
                    round: game.currentRound,
                    role: p.role
                });
            }
        });

        game.timer = setTimeout(() => this.forceRandomChoices(game), 10000);

        const botShooter = game.players.find(p => p.userId === 'BOT' && p.role === 'shooter');
        if(botShooter) {
            const botDelay = Math.floor(Math.random() * 2000) + 1000;
            game.botTimer = setTimeout(() => this.makeBotChoice(game), botDelay);
        }
    }
    
    private makeBotChoice(game: Game) {
        const bot = game.players.find(p => p.userId === 'BOT');
        if (bot && bot.currentChoice === null) {
            bot.currentChoice = Math.floor(Math.random() * 9);
            this.checkRoundCompletion(game);
        }
    }

    private forceRandomChoices(game: Game) {
        game.players.forEach(p => {
            if (p.currentChoice === null) p.currentChoice = Math.floor(Math.random() * 9);
        });
        this.resolveRound(game);
    }
    
    private checkRoundCompletion(game: Game) {
        const [p1, p2] = game.players;
        if (p1 && p2 && p1.currentChoice !== null && p2.currentChoice !== null) {
            if (game.timer) clearTimeout(game.timer);
            if (game.botTimer) clearTimeout(game.botTimer);
            setTimeout(() => this.resolveRound(game), 100);
        }
    }
    
    private resolveRound(game: Game) {
        if (game.phase === 'finished') return; 

        const [p1, p2] = game.players;
        if (!p1 || !p2) return;

        const shooter = (p1.role === 'shooter') ? p1 : p2;
        const keeper = (p1.role === 'goalkeeper') ? p1 : p2;

        const sZone = shooter.currentChoice ?? 0;
        const kZone = keeper.currentChoice ?? 0;
        
        const shootChoice = this.translateZone(sZone);
        const saveChoice = this.translateZone(kZone);

        const keeperPoints = this.calculatePoints(shootChoice, saveChoice);
        keeper.score += keeperPoints;

        game.players.forEach(p => {
            if (p.socket) {
                p.socket.emit('round_result', {
                    shooterZone: sZone,
                    keeperZone: kZone,
                    isGoal: keeperPoints < 2,
                    keeperPointsAwarded: keeperPoints,
                    scores: { [p1.userId]: p1.score, [p2.userId]: p2.score }
                });
            }
        });

        const tempRole = p1.role;
        p1.role = p2.role;
        p2.role = tempRole;

        if (game.currentRound >= game.maxRounds) {
            this.finishMatch(game);
        } else {
            game.currentRound++;
            setTimeout(() => this.startRound(game), 3000);
        }
    }

    private finishMatch(game: Game) {
        if (game.timer) clearTimeout(game.timer);
        if (game.botTimer) clearTimeout(game.botTimer);
        game.phase = 'finished';

        const [p1, p2] = game.players;
        let winner = 'Empate';
        if (p1 && p2) {
            if (p1.score > p2.score) winner = p1.displayName;
            else if (p2.score > p1.score) winner = p2.displayName;
        }

        const stats = game.players.map(p => ({
            displayName: p.displayName,
            score: p.score
        })).sort((a, b) => b.score - a.score);

        this.io.to(game.id).emit('match_end', { winner, stats });
    }
    
    public removeSocket(socket: Socket) {
        for (const game of this.games.values()) {
            if (game.phase === 'waiting' && game.hostId === socket.id && game.timer) {
                clearTimeout(game.timer);
            }
            const playerIndex = game.players.findIndex(p => p.userId === socket.id);
            if (playerIndex > -1) {
                const wasPublic = game.isPublic;
                game.players.splice(playerIndex, 1);
                game.phase = 'finished';
                if (game.players.length === 0) this.games.delete(game.id);
                else {
                    const remainingPlayer = game.players[0];
                    if (remainingPlayer && remainingPlayer.socket) {
                        remainingPlayer.socket.emit('opponent_left');
                    }
                }
                if (wasPublic) this.broadcastPublicGames();
                break;
            }
        }
    }

    private generateGameCode(): string {
        let code = '';
        const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
        do {
            code = '';
            for (let i = 0; i < 4; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        } while (this.games.has(code));
        return code;
    }
}