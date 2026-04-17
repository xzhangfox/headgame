import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import type { Room, Player, ChatMessage, GameSettings } from './types';
import { getUniqueItems, CATEGORIES } from './categories';

const ROOM_CODE_LENGTH = 6;
const MAX_LIVES = 3;
const DEFAULT_TURN_TIME = 60;
const DISCONNECT_TIMEOUT_MS = 60_000; // 1 minute

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function omitTimer(room: Room): Omit<Room, 'turnTimerId'> {
  const { turnTimerId: _t, ...rest } = room;
  return rest;
}

export class GameManager extends EventEmitter {
  private rooms = new Map<string, Room>();
  private playerRooms = new Map<string, string>();          // socketId → roomId
  private disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>(); // playerId → timer

  // ── Room management ────────────────────────────────────────────────────────

  createRoom(hostId: string, hostName: string, hostAvatar: string): Room {
    let code: string;
    do { code = generateRoomCode(); } while (this.getRoomByCode(code));

    const room: Room = {
      id: uuidv4(),
      code,
      hostId,
      players: [this.makePlayer(hostId, hostName, hostAvatar)],
      state: 'lobby',
      currentTurnPlayerId: null,
      turnNumber: 0,
      settings: {
        category: 'animals',
        mode: 'emoji',
        turnTimeLimitSec: DEFAULT_TURN_TIME,
        maxLives: MAX_LIVES,
        maxPlayers: 8,
      },
      messages: [],
      guessedCount: 0,
      startTime: null,
      turnStartTime: null,
      turnTimerId: null,
    };

    this.rooms.set(room.id, room);
    this.playerRooms.set(hostId, room.id);
    return room;
  }

  joinRoom(
    roomCode: string, playerId: string, playerName: string, playerAvatar: string
  ): { success: boolean; room?: Room; error?: string } {
    const room = this.getRoomByCode(roomCode);
    if (!room) return { success: false, error: '房间不存在，请检查房间码' };
    if (room.state !== 'lobby') return { success: false, error: '游戏已经开始，无法加入' };
    if (room.players.length >= room.settings.maxPlayers) return { success: false, error: '房间已满' };
    if (room.players.find(p => p.name === playerName)) {
      return { success: false, error: '该昵称已被使用，请换一个' };
    }

    room.players.push(this.makePlayer(playerId, playerName, playerAvatar));
    this.playerRooms.set(playerId, room.id);
    this.addSys(room, `${playerName} 加入了游戏 ${playerAvatar}`);
    return { success: true, room };
  }

  /** Intentional leave — immediately removes the player. */
  leaveRoom(playerId: string): { room?: Room; wasHost: boolean; roomEmpty: boolean } {
    // Cancel any pending disconnect timer first
    this.cancelDisconnectTimer(playerId);

    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return { wasHost: false, roomEmpty: false };
    const room = this.rooms.get(roomId);
    if (!room) return { wasHost: false, roomEmpty: false };

    const player = room.players.find(p => p.id === playerId);
    const wasHost = room.hostId === playerId;

    room.players = room.players.filter(p => p.id !== playerId);
    this.playerRooms.delete(playerId);

    if (room.players.length === 0) {
      if (room.turnTimerId) clearTimeout(room.turnTimerId);
      this.rooms.delete(roomId);
      return { wasHost, roomEmpty: true };
    }

    if (wasHost) {
      room.hostId = room.players[0].id;
      this.addSys(room, `${room.players[0].name} 成为了新房主`);
    }
    if (player) this.addSys(room, `${player.name} 离开了游戏`);
    if (room.state === 'playing' && room.currentTurnPlayerId === playerId) this.advanceTurn(room);

    return { room, wasHost, roomEmpty: false };
  }

  /** Called on socket disconnect — starts the 60-second eviction timer. */
  playerDisconnect(playerId: string): Room | null {
    const room = this.getRoomByPlayerId(playerId);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.isConnected) return null;

    player.isConnected = false;
    this.addSys(room, `${player.name} 断开了连接，60秒内可重新加入…`);

    const timer = setTimeout(() => {
      this.disconnectTimers.delete(playerId);
      this.evictPlayer(playerId);
    }, DISCONNECT_TIMEOUT_MS);

    this.disconnectTimers.set(playerId, timer);
    return room;
  }

  /** Called when a client reconnects with stored session data. */
  reconnectPlayer(
    roomCode: string, newSocketId: string, playerName: string
  ): { success: boolean; room?: Room; error?: string } {
    const room = this.getRoomByCode(roomCode);
    if (!room) return { success: false, error: '房间不存在或已解散' };

    // Find the disconnected player by name
    const player = room.players.find(p => p.name === playerName && !p.isConnected);
    if (!player) {
      // Maybe they're still connected (two tabs) — treat as rejoin
      const connected = room.players.find(p => p.name === playerName && p.isConnected);
      if (connected) return { success: false, error: '该账号仍在线，请勿重复登录' };
      return { success: false, error: '无法重新加入，可能已超时退出' };
    }

    const oldId = player.id;

    // Cancel eviction timer
    this.cancelDisconnectTimer(oldId);

    // Re-map socket ID
    player.id = newSocketId;
    player.isConnected = true;
    if (room.hostId === oldId) room.hostId = newSocketId;
    if (room.currentTurnPlayerId === oldId) room.currentTurnPlayerId = newSocketId;

    this.playerRooms.delete(oldId);
    this.playerRooms.set(newSocketId, room.id);

    this.addSys(room, `${playerName} 重新回到了游戏 ${player.avatar}`);
    return { success: true, room };
  }

  // ── Game flow ───────────────────────────────────────────────────────────────

  startGame(
    roomId: string, hostId: string, settings: GameSettings
  ): { success: boolean; room?: Room; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: '房间不存在' };
    if (room.hostId !== hostId) return { success: false, error: '只有房主可以开始游戏' };
    if (room.players.length < 2) return { success: false, error: '至少需要2名玩家才能开始' };
    if (room.state !== 'lobby') return { success: false, error: '游戏已经在进行中' };

    room.settings = settings;
    const items = getUniqueItems(settings.category, room.players.length);
    room.players.forEach((p, i) => {
      const item = items[i % items.length];
      p.headItem = item.text;
      p.headEmoji = item.emoji;
      p.score = 0;
      p.lives = settings.maxLives;
      p.hasGuessed = false;
      p.guessRank = null;
      p.wrongGuesses = 0;
    });

    room.state = 'playing';
    room.startTime = Date.now();
    room.guessedCount = 0;
    room.turnNumber = 1;
    room.messages = [];

    const first = room.players[Math.floor(Math.random() * room.players.length)];
    room.currentTurnPlayerId = first.id;
    room.turnStartTime = Date.now();

    this.addSys(room,
      `游戏开始！分类：${this.catName(settings.category)}，模式：${settings.mode === 'emoji' ? '表情图片' : '文字'}。${first.name} 先行！`
    );
    return { success: true, room };
  }

  sendMessage(
    roomId: string, playerId: string, content: string,
    targetPlayerId?: string, type: 'question' | 'answer' = 'question'
  ): { success: boolean; room?: Room; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: '房间不存在' };
    if (room.state !== 'playing') return { success: false, error: '游戏未开始' };
    const player = room.players.find(p => p.id === playerId);
    if (!player) return { success: false, error: '玩家不存在' };

    const target = targetPlayerId ? room.players.find(p => p.id === targetPlayerId) : undefined;
    room.messages.push({
      id: uuidv4(),
      playerId,
      playerName: player.name,
      playerAvatar: player.avatar,
      content,
      type,
      timestamp: Date.now(),
      targetPlayerId,
      targetPlayerName: target?.name,
    });
    return { success: true, room };
  }

  makeGuess(
    roomId: string, playerId: string, guess: string
  ): { success: boolean; correct?: boolean; room?: Room; error?: string; gameOver?: boolean } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: '房间不存在' };
    if (room.state !== 'playing') return { success: false, error: '游戏未开始' };
    const player = room.players.find(p => p.id === playerId);
    if (!player) return { success: false, error: '玩家不存在' };
    if (player.hasGuessed) return { success: false, error: '你已经猜对了！' };
    if (player.lives <= 0) return { success: false, error: '你的生命值已用完' };

    const correct =
      guess.trim().toLowerCase() === player.headItem?.toLowerCase() ||
      guess.trim() === player.headEmoji;

    if (correct) {
      room.guessedCount++;
      player.hasGuessed = true;
      player.guessRank = room.guessedCount;
      const base = Math.max(10, 100 - (room.guessedCount - 1) * 15);
      const bonus = Math.max(0, Math.floor(20 - (Date.now() - (room.startTime || Date.now())) / 10000));
      player.score += base + bonus;
      room.messages.push({
        id: uuidv4(), playerId, playerName: player.name, playerAvatar: player.avatar,
        content: `猜对了！我头顶上是【${player.headItem} ${player.headEmoji}】！+${base + bonus}分`,
        type: 'guess_success', timestamp: Date.now(),
      });
    } else {
      player.lives--;
      player.wrongGuesses++;
      player.score = Math.max(0, player.score - 10);
      room.messages.push({
        id: uuidv4(), playerId, playerName: player.name, playerAvatar: player.avatar,
        content: `猜错了："${guess}"，还剩 ${player.lives} 条命。(-10分)`,
        type: 'guess_fail', timestamp: Date.now(),
      });
      if (player.lives <= 0) {
        player.hasGuessed = true;
        room.guessedCount++;
        this.addSys(room, `${player.name} 生命值耗尽，已淘汰！头顶是【${player.headItem} ${player.headEmoji}】`);
      }
    }

    const allDone = room.players.every(p => p.hasGuessed || p.lives <= 0);
    if (allDone) {
      this.endGame(room);
      return { success: true, correct, room, gameOver: true };
    }
    if (room.currentTurnPlayerId === playerId) this.advanceTurn(room);
    return { success: true, correct, room, gameOver: false };
  }

  endTurn(roomId: string, playerId: string): { success: boolean; room?: Room; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: '房间不存在' };
    if (room.currentTurnPlayerId !== playerId) return { success: false, error: '还没到你的回合' };
    this.advanceTurn(room);
    return { success: true, room };
  }

  // ── Internal helpers ────────────────────────────────────────────────────────

  /** Remove a player after the disconnect timer fires. */
  private evictPlayer(playerId: string): void {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return;
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return;

    // If player somehow reconnected already (race condition), don't evict
    if (player.isConnected) return;

    this.addSys(room, `${player.name} 超时未回，已退出房间`);
    room.players = room.players.filter(p => p.id !== playerId);
    this.playerRooms.delete(playerId);

    if (room.players.length === 0) {
      if (room.turnTimerId) clearTimeout(room.turnTimerId);
      this.rooms.delete(roomId);
      this.emit('room_destroyed', roomId);
      return;
    }

    if (room.hostId === playerId) {
      room.hostId = room.players[0].id;
      this.addSys(room, `${room.players[0].name} 成为了新房主`);
    }
    if (room.state === 'playing' && room.currentTurnPlayerId === playerId) {
      this.advanceTurn(room);
    }

    // Check if game should end (all remaining players done)
    if (room.state === 'playing') {
      const allDone = room.players.every(p => p.hasGuessed || p.lives <= 0);
      if (allDone) this.endGame(room);
    }

    this.emit('room_updated', room);
  }

  private cancelDisconnectTimer(playerId: string): void {
    const t = this.disconnectTimers.get(playerId);
    if (t) {
      clearTimeout(t);
      this.disconnectTimers.delete(playerId);
    }
  }

  private advanceTurn(room: Room): void {
    if (room.state !== 'playing') return;
    const active = room.players.filter(p => !p.hasGuessed && p.lives > 0);
    if (active.length === 0) { this.endGame(room); return; }

    room.turnNumber++;
    let idx = room.players.findIndex(p => p.id === room.currentTurnPlayerId);
    let tries = 0;
    do {
      idx = (idx + 1) % room.players.length;
      tries++;
    } while ((room.players[idx].hasGuessed || room.players[idx].lives <= 0) && tries < room.players.length);

    room.currentTurnPlayerId = room.players[idx].id;
    room.turnStartTime = Date.now();
    this.addSys(room, `第 ${room.turnNumber} 轮 — 轮到 ${room.players[idx].name} 提问了！`);
  }

  private endGame(room: Room): void {
    if (room.turnTimerId) { clearTimeout(room.turnTimerId); room.turnTimerId = null; }
    room.state = 'finished';
    room.currentTurnPlayerId = null;
    const winner = [...room.players].sort((a, b) => b.score - a.score)[0];
    this.addSys(room, `🎉 游戏结束！冠军是 ${winner.name}，得分：${winner.score}！`);
  }

  private makePlayer(id: string, name: string, avatar: string): Player {
    return {
      id, name, avatar,
      headItem: null, headEmoji: null,
      score: 0, lives: MAX_LIVES,
      hasGuessed: false, guessRank: null,
      isConnected: true, isReady: false, wrongGuesses: 0,
    };
  }

  private addSys(room: Room, content: string): void {
    room.messages.push({
      id: uuidv4(), playerId: 'system', playerName: '系统', playerAvatar: '🎮',
      content, type: 'system', timestamp: Date.now(),
    });
  }

  private catName(id: string): string {
    return CATEGORIES.find(c => c.id === id)?.name || id;
  }

  // ── Public getters ──────────────────────────────────────────────────────────

  getRoomByCode(code: string): Room | undefined {
    for (const r of this.rooms.values()) {
      if (r.code === code.toUpperCase()) return r;
    }
  }

  getRoomByPlayerId(playerId: string): Room | undefined {
    const id = this.playerRooms.get(playerId);
    return id ? this.rooms.get(id) : undefined;
  }

  getSerializableRoom(room: Room): Omit<Room, 'turnTimerId'> {
    return omitTimer(room);
  }
}
