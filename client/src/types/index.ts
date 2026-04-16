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
}

export interface CategoryItem {
  text: string;
  emoji: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  items: CategoryItem[];
}

export type AppPage = 'home' | 'lobby' | 'game' | 'results';
