import { v4 as uuidv4 } from 'uuid';
import type { Room, Player, ChatMessage, GameSettings, GameState } from './types';
import { getUniqueItems, CATEGORIES } from './categories';

const ROOM_CODE_LENGTH = 6;
const MAX_LIVES = 3;
const DEFAULT_TURN_TIME = 60;

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function makeSerializable(room: Room): Omit<Room, 'turnTimerId'> {
  const { turnTimerId: _t, ...rest } = room;
  return rest;
}

export class GameManager {
  private rooms = new Map<string, Room>();
  private playerRooms = new Map<string, string>(); // socketId -> roomId

  // -- Room management --

  createRoom(hostId: string, hostName: string, hostAvatar: string): Room {
    let code: string;
    do {
      code = generateRoomCode();
    } while (this.getRoomByCode(code));

    const room: Room = {
      id: uuidv4(),
      code,
      hostId,
      players: [this.createPlayer(hostId, hostName, hostAvatar)],
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
    roomCode: string,
    playerId: string,
    playerName: string,
    playerAvatar: string
  ): { success: boolean; room?: Room; error?: string } {
    const room = this.getRoomByCode(roomCode);
    if (!room) return { success: false, error: '房间不存在，请检查房间码' };
    if (room.state !== 'lobby') return { success: false, error: '游戏已经开始，无法加入' };
    if (room.players.length >= room.settings.maxPlayers) return { success: false, error: '房间已满' };
    if (room.players.find(p => p.name === playerName)) {
      return { success: false, error: '该昵称已被使用，请换一个' };
    }

    const player = this.createPlayer(playerId, playerName, playerAvatar);
    room.players.push(player);
    this.playerRooms.set(playerId, room.id);

    this.addSystemMessage(room, `${playerName} 加入了游戏 ${playerAvatar}`);
    return { success: true, room };
  }

  leaveRoom(playerId: string): { room?: Room; wasHost: boolean; roomEmpty: boolean } {
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

    // Transfer host if needed
    if (wasHost) {
      room.hostId = room.players[0].id;
      this.addSystemMessage(room, `${room.players[0].name} 成为了新房主`);
    }

    if (player) {
      this.addSystemMessage(room, `${player.name} 离开了游戏`);
    }

    // If game in progress and this player had the turn, advance
    if (room.state === 'playing' && room.currentTurnPlayerId === playerId) {
      this.advanceTurn(room);
    }

    return { room, wasHost, roomEmpty: false };
  }

  playerDisconnect(playerId: string): Room | null {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return null;
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.isConnected = false;
    }
    return room;
  }

  playerReconnect(playerId: string): Room | null {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return null;
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.isConnected = true;
    }
    return room;
  }

  // -- Game flow --

  startGame(
    roomId: string,
    hostId: string,
    settings: GameSettings
  ): { success: boolean; room?: Room; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: '房间不存在' };
    if (room.hostId !== hostId) return { success: false, error: '只有房主可以开始游戏' };
    if (room.players.length < 2) return { success: false, error: '至少需要2名玩家才能开始' };
    if (room.state !== 'lobby') return { success: false, error: '游戏已经在进行中' };

    room.settings = settings;

    // Assign items to players
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

    // First turn: random player
    const firstPlayer = room.players[Math.floor(Math.random() * room.players.length)];
    room.currentTurnPlayerId = firstPlayer.id;
    room.turnStartTime = Date.now();

    this.addSystemMessage(
      room,
      `游戏开始！分类：${this.getCategoryName(settings.category)}，模式：${settings.mode === 'emoji' ? '表情图片' : '文字'}。${firstPlayer.name} 先行！`
    );

    return { success: true, room };
  }

  sendMessage(
    roomId: string,
    playerId: string,
    content: string,
    targetPlayerId?: string,
    type: 'question' | 'answer' = 'question'
  ): { success: boolean; room?: Room; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: '房间不存在' };
    if (room.state !== 'playing') return { success: false, error: '游戏未开始' };

    const player = room.players.find(p => p.id === playerId);
    if (!player) return { success: false, error: '玩家不存在' };

    let targetPlayerName: string | undefined;
    if (targetPlayerId) {
      const target = room.players.find(p => p.id === targetPlayerId);
      targetPlayerName = target?.name;
    }

    const msg: ChatMessage = {
      id: uuidv4(),
      playerId,
      playerName: player.name,
      playerAvatar: player.avatar,
      content,
      type,
      timestamp: Date.now(),
      targetPlayerId,
      targetPlayerName,
    };
    room.messages.push(msg);

    // If sending a question, advance turn (only current turn player sends questions)
    if (type === 'question' && room.currentTurnPlayerId === playerId) {
      // Don't auto-advance; let the player decide when to end turn or guess
    }

    return { success: true, room };
  }

  makeGuess(
    roomId: string,
    playerId: string,
    guess: string
  ): { success: boolean; correct?: boolean; room?: Room; error?: string; gameOver?: boolean } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: '房间不存在' };
    if (room.state !== 'playing') return { success: false, error: '游戏未开始' };

    const player = room.players.find(p => p.id === playerId);
    if (!player) return { success: false, error: '玩家不存在' };
    if (player.hasGuessed) return { success: false, error: '你已经猜对了！' };
    if (player.lives <= 0) return { success: false, error: '你的生命值已用完' };

    const isCorrect =
      guess.trim().toLowerCase() === player.headItem?.toLowerCase() ||
      guess.trim() === player.headEmoji;

    if (isCorrect) {
      room.guessedCount++;
      player.hasGuessed = true;
      player.guessRank = room.guessedCount;

      // Score: 100 for 1st, -15 per rank. Min 10.
      const baseScore = Math.max(10, 100 - (room.guessedCount - 1) * 15);
      // Time bonus: up to +20 based on how fast in the game
      const elapsed = (Date.now() - (room.startTime || Date.now())) / 1000;
      const timeBonus = Math.max(0, Math.floor(20 - elapsed / 10));
      player.score += baseScore + timeBonus;

      const msg: ChatMessage = {
        id: uuidv4(),
        playerId,
        playerName: player.name,
        playerAvatar: player.avatar,
        content: `猜对了！我头顶上是【${player.headItem} ${player.headEmoji}】！+${baseScore + timeBonus}分`,
        type: 'guess_success',
        timestamp: Date.now(),
      };
      room.messages.push(msg);
    } else {
      player.lives--;
      player.wrongGuesses++;
      player.score = Math.max(0, player.score - 10);

      const msg: ChatMessage = {
        id: uuidv4(),
        playerId,
        playerName: player.name,
        playerAvatar: player.avatar,
        content: `猜错了："${guess}"，还剩 ${player.lives} 条命。(-10分)`,
        type: 'guess_fail',
        timestamp: Date.now(),
      };
      room.messages.push(msg);

      if (player.lives <= 0) {
        player.hasGuessed = true; // eliminated
        room.guessedCount++;
        this.addSystemMessage(room, `${player.name} 生命值耗尽，已淘汰！头顶是【${player.headItem} ${player.headEmoji}】`);
      }
    }

    // Check if game is over
    const activePlayers = room.players.filter(p => p.lives > 0 || p.hasGuessed);
    const allDone = room.players.every(p => p.hasGuessed || p.lives <= 0);

    if (allDone) {
      this.endGame(room);
      return { success: true, correct: isCorrect, room, gameOver: true };
    }

    // If current turn player just guessed correctly, advance turn
    if (room.currentTurnPlayerId === playerId) {
      this.advanceTurn(room);
    }

    return { success: true, correct: isCorrect, room, gameOver: false };
  }

  endTurn(roomId: string, playerId: string): { success: boolean; room?: Room; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: '房间不存在' };
    if (room.currentTurnPlayerId !== playerId) return { success: false, error: '还没到你的回合' };
    this.advanceTurn(room);
    return { success: true, room };
  }

  // -- Internal helpers --

  private advanceTurn(room: Room): void {
    if (room.state !== 'playing') return;

    const activePlayers = room.players.filter(p => !p.hasGuessed && p.lives > 0);
    if (activePlayers.length === 0) {
      this.endGame(room);
      return;
    }

    room.turnNumber++;

    // Find next player in order
    const currentIdx = room.players.findIndex(p => p.id === room.currentTurnPlayerId);
    let nextIdx = (currentIdx + 1) % room.players.length;
    let tries = 0;
    while (
      (room.players[nextIdx].hasGuessed || room.players[nextIdx].lives <= 0) &&
      tries < room.players.length
    ) {
      nextIdx = (nextIdx + 1) % room.players.length;
      tries++;
    }

    room.currentTurnPlayerId = room.players[nextIdx].id;
    room.turnStartTime = Date.now();

    this.addSystemMessage(room, `第 ${room.turnNumber} 轮 — 轮到 ${room.players[nextIdx].name} 提问了！`);
  }

  private endGame(room: Room): void {
    if (room.turnTimerId) {
      clearTimeout(room.turnTimerId);
      room.turnTimerId = null;
    }
    room.state = 'finished';
    room.currentTurnPlayerId = null;

    // Sort players by score for final announcement
    const sorted = [...room.players].sort((a, b) => b.score - a.score);
    const winner = sorted[0];
    this.addSystemMessage(room, `🎉 游戏结束！冠军是 ${winner.name}，得分：${winner.score}！`);
  }

  private createPlayer(id: string, name: string, avatar: string): Player {
    return {
      id,
      name,
      avatar,
      headItem: null,
      headEmoji: null,
      score: 0,
      lives: MAX_LIVES,
      hasGuessed: false,
      guessRank: null,
      isConnected: true,
      isReady: false,
      wrongGuesses: 0,
    };
  }

  private addSystemMessage(room: Room, content: string): void {
    room.messages.push({
      id: uuidv4(),
      playerId: 'system',
      playerName: '系统',
      playerAvatar: '🎮',
      content,
      type: 'system',
      timestamp: Date.now(),
    });
  }

  private getCategoryName(categoryId: string): string {
    return CATEGORIES.find(c => c.id === categoryId)?.name || categoryId;
  }

  // -- Getters --

  getRoomByCode(code: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.code === code.toUpperCase()) return room;
    }
    return undefined;
  }

  getRoomByPlayerId(playerId: string): Room | undefined {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  getSerializableRoom(room: Room): Omit<Room, 'turnTimerId'> {
    return makeSerializable(room);
  }
}
