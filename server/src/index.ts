import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameManager } from './GameManager';
import { CATEGORIES } from './categories';
import type {
  CreateRoomPayload,
  JoinRoomPayload,
  StartGamePayload,
  SendMessagePayload,
  MakeGuessPayload,
} from './types';

const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/categories', (_req, res) => res.json(CATEGORIES));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const manager = new GameManager();

function emitRoomUpdate(roomId: string, room: ReturnType<typeof manager.getSerializableRoom>) {
  io.to(roomId).emit('room_updated', { room });
}

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // --- Create room ---
  socket.on('create_room', (payload: CreateRoomPayload, cb: Function) => {
    try {
      const room = manager.createRoom(socket.id, payload.playerName, payload.avatar);
      socket.join(room.id);
      cb({ success: true, room: manager.getSerializableRoom(room) });
    } catch (err) {
      cb({ success: false, error: '创建房间失败' });
    }
  });

  // --- Join room ---
  socket.on('join_room', (payload: JoinRoomPayload, cb: Function) => {
    const result = manager.joinRoom(
      payload.roomCode,
      socket.id,
      payload.playerName,
      payload.avatar
    );
    if (!result.success || !result.room) {
      cb({ success: false, error: result.error });
      return;
    }
    socket.join(result.room.id);
    cb({ success: true, room: manager.getSerializableRoom(result.room) });
    emitRoomUpdate(result.room.id, manager.getSerializableRoom(result.room));
  });

  // --- Leave room ---
  socket.on('leave_room', (cb?: Function) => {
    const result = manager.leaveRoom(socket.id);
    if (!result.roomEmpty && result.room) {
      socket.leave(result.room.id);
      emitRoomUpdate(result.room.id, manager.getSerializableRoom(result.room));
    }
    if (cb) cb({ success: true });
  });

  // --- Update settings (host only) ---
  socket.on('update_settings', (settings: Partial<StartGamePayload['settings']>, cb?: Function) => {
    const room = manager.getRoomByPlayerId(socket.id);
    if (!room || room.hostId !== socket.id) {
      if (cb) cb({ success: false, error: '无权限' });
      return;
    }
    room.settings = { ...room.settings, ...settings };
    emitRoomUpdate(room.id, manager.getSerializableRoom(room));
    if (cb) cb({ success: true });
  });

  // --- Start game ---
  socket.on('start_game', (payload: StartGamePayload, cb: Function) => {
    const room = manager.getRoomByPlayerId(socket.id);
    if (!room) { cb({ success: false, error: '房间不存在' }); return; }

    const result = manager.startGame(room.id, socket.id, payload.settings);
    if (!result.success || !result.room) {
      cb({ success: false, error: result.error });
      return;
    }
    cb({ success: true });
    emitRoomUpdate(room.id, manager.getSerializableRoom(result.room));
  });

  // --- Send message ---
  socket.on('send_message', (payload: SendMessagePayload, cb?: Function) => {
    const room = manager.getRoomByPlayerId(socket.id);
    if (!room) { if (cb) cb({ success: false, error: '不在房间中' }); return; }

    const result = manager.sendMessage(
      room.id,
      socket.id,
      payload.content,
      payload.targetPlayerId,
      payload.type
    );
    if (!result.success || !result.room) {
      if (cb) cb({ success: false, error: result.error });
      return;
    }
    if (cb) cb({ success: true });
    emitRoomUpdate(room.id, manager.getSerializableRoom(result.room));
  });

  // --- Make guess ---
  socket.on('make_guess', (payload: MakeGuessPayload, cb: Function) => {
    const room = manager.getRoomByPlayerId(socket.id);
    if (!room) { cb({ success: false, error: '不在房间中' }); return; }

    const result = manager.makeGuess(room.id, socket.id, payload.guess);
    if (!result.success || !result.room) {
      cb({ success: false, error: result.error });
      return;
    }

    cb({ success: true, correct: result.correct, gameOver: result.gameOver });
    emitRoomUpdate(room.id, manager.getSerializableRoom(result.room));
  });

  // --- End turn (current player ends their turn) ---
  socket.on('end_turn', (cb?: Function) => {
    const room = manager.getRoomByPlayerId(socket.id);
    if (!room) { if (cb) cb({ success: false }); return; }

    const result = manager.endTurn(room.id, socket.id);
    if (!result.success || !result.room) {
      if (cb) cb({ success: false, error: result.error });
      return;
    }
    if (cb) cb({ success: true });
    emitRoomUpdate(room.id, manager.getSerializableRoom(result.room));
  });

  // --- Get room state ---
  socket.on('get_room', (cb: Function) => {
    const room = manager.getRoomByPlayerId(socket.id);
    if (!room) { cb({ success: false, error: '不在房间中' }); return; }
    cb({ success: true, room: manager.getSerializableRoom(room) });
  });

  // --- Disconnect ---
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    const room = manager.playerDisconnect(socket.id);
    if (room) {
      emitRoomUpdate(room.id, manager.getSerializableRoom(room));
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`🎮 HeadGame server running on port ${PORT}`);
});
