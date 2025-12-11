"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const supabase_js_1 = require("@supabase/supabase-js");
const matchmaker_1 = require("./matchmaker");
const PORT = Number(process.env.PORT || 4000);
const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_KEY || '').trim();
if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Faltan variables de Supabase');
    process.exit(1);
}
const supabase = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_KEY);
const app = (0, express_1.default)();
app.use(express_1.default.json());
const httpServer = http_1.default.createServer(app);
const io = new socket_io_1.Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});
const matchMaker = new matchmaker_1.MatchMaker(io, supabase);
io.on('connection', (socket) => {
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
//# sourceMappingURL=server.js.map