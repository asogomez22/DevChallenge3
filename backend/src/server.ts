import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import http from 'http';
import { Server as IOServer, Socket } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import { MatchMaker } from './matchmaker';

const PORT = Number(process.env.PORT || 4000);
const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_KEY || '').trim();

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Faltan variables de Supabase');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const app = express();
app.use(express.json());

const httpServer = http.createServer(app);
const io = new IOServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

const matchMaker = new MatchMaker(io, supabase);

io.on('connection', (socket: Socket) => {
    console.log(`🟢 Conectado: ${socket.id}`);

    socket.on('create_game', ({ displayName, isPublic, maxRounds }) => {
        matchMaker.createGame(socket, displayName, isPublic, maxRounds);
    });

    socket.on('join_game', ({ gameCode, displayName }) => {
        matchMaker.joinGame(socket, gameCode, displayName);
    });

    socket.on('get_public_games', () => {
        matchMaker.getPublicGames(socket);
    });

    // --- NUEVO EVENTO ---
    socket.on('request_bot_game', ({ gameCode }) => {
        matchMaker.requestBotGame(socket, gameCode);
    });

    socket.on('select_choice', ({ gameCode, zoneId }) => {
        matchMaker.registerChoice(socket, gameCode, zoneId);
    });

    socket.on('disconnect', () => {
        console.log(`🔴 Desconectado: ${socket.id}`);
        matchMaker.removeSocket(socket);
    });
});

httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor en puerto ${PORT}`);
});