// frontend/src/api/socket.ts
import { io, Socket } from 'socket.io-client';

export interface AppSocket extends Socket {
  // Puedes agregar campos extra si quieres
}

const socket: AppSocket = io('http://localhost:4000'); // URL del backend
export default socket;
