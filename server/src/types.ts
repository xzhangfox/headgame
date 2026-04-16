export type GameState = 'lobby' | 'selecting' | 'playing' | 'finished';
export type GameMode = 'text' | 'emoji';
export type MessageType = 'question' | 'answer' | 'system' | 'guess_success' | 'guess_fail';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  headItem: string | null;
  headEmoji: string | null;
  score: number;
  lives: number;
  hasGuessed: boolean;
  guessRank: number | null;
  isConnected: boolean;
  isReady: boolean;
  wrongGuesses: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  playerAvatar: string;
  content: string;
  type: MessageType;
  timestamp: number;
  targetPlayerId?: string;
  targetPlayerName?: string;
}

export interface GameSettings {
  category: string;
  mode: GameMode;
  turnTimeLimitSec: number;
  maxLives: number;
  maxPlayers: number;
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  players: Player[];
  state: GameState;
  currentTurnPlayerId: string | null;
  turnNumber: number;
  settings: GameSettings;
  messages: ChatMessage[];
  guessedCount: number;
  startTime: number | null;
  turnStartTime: number | null;
  turnTimerId: ReturnType<typeof setTimeout> | null;
}

// Socket event payloads
export interface CreateRoomPayload {
  playerName: string;
  avatar: string;
}

export interface JoinRoomPayload {
  roomCode: string;
  playerName: string;
  avatar: string;
}

export interface StartGamePayload {
  settings: GameSettings;
}

export interface SendMessagePayload {
  content: string;
  targetPlayerId?: string;
  type: 'question' | 'answer';
}

export interface MakeGuessPayload {
  guess: string;
}

export interface RoomUpdateEvent {
  room: Omit<Room, 'turnTimerId'>;
}
