import { Server as IOServer, Socket } from 'socket.io';
import { SupabaseClient } from '@supabase/supabase-js';
export declare class MatchMaker {
    private io;
    private supabase;
    private games;
    constructor(io: IOServer, supabase: SupabaseClient);
    private calculatePoints;
    private translateZone;
    private getSanitizedGame;
    createGame(socket: Socket, displayName: string, isPublic: boolean, maxRounds: number): void;
    requestBotGame(socket: Socket, gameCode: string): boolean | undefined;
    joinGame(socket: Socket, gameCode: string, displayName: string): boolean | undefined;
    getPublicGames(socket: Socket): void;
    private broadcastPublicGames;
    registerChoice(socket: Socket, gameCode: string, zoneId: any): void;
    private startRound;
    private makeBotChoice;
    private forceRandomChoices;
    private checkRoundCompletion;
    private resolveRound;
    private finishMatch;
    removeSocket(socket: Socket): void;
    private generateGameCode;
}
//# sourceMappingURL=matchmaker.d.ts.map