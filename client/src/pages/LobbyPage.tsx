import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Room, Category } from '../types';

const CATEGORIES: Category[] = [
  { id: 'animals', name: '动物', emoji: '🐾', items: [] },
  { id: 'food', name: '美食', emoji: '🍽️', items: [] },
  { id: 'movies', name: '影视', emoji: '🎬', items: [] },
  { id: 'celebrities', name: '名人', emoji: '⭐', items: [] },
  { id: 'countries', name: '国家', emoji: '🌍', items: [] },
  { id: 'sports', name: '运动', emoji: '🏆', items: [] },
  { id: 'brands', name: '品牌', emoji: '🏷️', items: [] },
  { id: 'occupations', name: '职业', emoji: '👔', items: [] },
  { id: 'fantasy', name: '奇幻', emoji: '✨', items: [] },
  { id: 'everyday', name: '日常物品', emoji: '🏠', items: [] },
];

interface Props {
  room: Room;
  myId: string;
  onStartGame: (settings: Room['settings']) => void;
  onLeaveRoom: () => void;
  onUpdateSettings: (settings: Partial<Room['settings']>) => void;
}

export default function LobbyPage({ room, myId, onStartGame, onLeaveRoom, onUpdateSettings }: Props) {
  const [copied, setCopied] = useState(false);
  const isHost = room.hostId === myId;
  const settings = room.settings;

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = () => {
    if (room.players.length < 2) return;
    onStartGame(settings);
  };

  return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-3xl font-black text-white mb-1">游戏大厅</h2>
          <p className="text-white/50 text-sm">等待玩家加入...</p>
        </motion.div>

        {/* Room code */}
        <motion.div
          className="glass neon-border rounded-2xl p-4 mb-4 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-white/50 text-xs mb-1">房间码</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-neon-cyan tracking-widest">
              {room.code}
            </span>
            <button onClick={handleCopyCode} className="btn-secondary text-sm px-3 py-1.5">
              {copied ? '✅ 已复制' : '📋 复制'}
            </button>
          </div>
          <p className="text-white/30 text-xs mt-1">把房间码分享给朋友来加入！</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Players */}
          <motion.div
            className="glass rounded-2xl p-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-sm font-semibold text-white/70 mb-3">
              👥 玩家列表 ({room.players.length}/{room.settings.maxPlayers})
            </h3>
            <div className="space-y-2">
              <AnimatePresence>
                {room.players.map((player, i) => (
                  <motion.div
                    key={player.id}
                    className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <span className="text-2xl">{player.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">
                        {player.name}
                        {player.id === myId && (
                          <span className="ml-1.5 text-xs text-brand-300">(你)</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {room.hostId === player.id && (
                        <span className="text-xs bg-neon-yellow/20 text-neon-yellow px-2 py-0.5 rounded-full">
                          👑 房主
                        </span>
                      )}
                      {!player.isConnected && (
                        <span className="text-xs text-red-400/80">离线</span>
                      )}
                      <div className={`w-2 h-2 rounded-full ${player.isConnected ? 'bg-neon-green' : 'bg-red-500'}`} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {room.players.length < 2 && (
                <p className="text-center text-white/30 text-xs py-2">至少需要2名玩家</p>
              )}
            </div>
          </motion.div>

          {/* Settings */}
          <motion.div
            className="glass rounded-2xl p-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-sm font-semibold text-white/70 mb-3">⚙️ 游戏设置</h3>

            {/* Category */}
            <div className="mb-4">
              <label className="text-xs text-white/50 mb-2 block">题库分类</label>
              <div className="grid grid-cols-2 gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => isHost && onUpdateSettings({ category: cat.id })}
                    disabled={!isHost}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                      settings.category === cat.id
                        ? 'bg-brand-600/70 text-white ring-1 ring-brand-400'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    } ${!isHost ? 'cursor-default' : ''}`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mode */}
            <div className="mb-4">
              <label className="text-xs text-white/50 mb-1.5 block">显示模式</label>
              <div className="flex gap-2">
                {[
                  { value: 'emoji', label: '🖼️ 表情图片' },
                  { value: 'text', label: '🔤 文字' },
                ].map((m) => (
                  <button
                    key={m.value}
                    onClick={() => isHost && onUpdateSettings({ mode: m.value as 'emoji' | 'text' })}
                    disabled={!isHost}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      settings.mode === m.value
                        ? 'bg-brand-600/70 text-white ring-1 ring-brand-400'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    } ${!isHost ? 'cursor-default' : ''}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lives & Timer */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">❤️ 生命数</label>
                <select
                  value={settings.maxLives}
                  onChange={(e) => isHost && onUpdateSettings({ maxLives: Number(e.target.value) })}
                  disabled={!isHost}
                  className="game-input py-2 text-sm"
                >
                  {[1, 2, 3, 5].map((n) => (
                    <option key={n} value={n} className="bg-gray-900">{n} 条命</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">⏱️ 回合限时</label>
                <select
                  value={settings.turnTimeLimitSec}
                  onChange={(e) => isHost && onUpdateSettings({ turnTimeLimitSec: Number(e.target.value) })}
                  disabled={!isHost}
                  className="game-input py-2 text-sm"
                >
                  {[30, 60, 90, 120].map((n) => (
                    <option key={n} value={n} className="bg-gray-900">{n}秒</option>
                  ))}
                </select>
              </div>
            </div>

            {!isHost && (
              <p className="text-xs text-white/30 mt-3 text-center">等待房主配置设置...</p>
            )}
          </motion.div>
        </div>

        {/* Action buttons */}
        <motion.div
          className="flex gap-3 mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button onClick={onLeaveRoom} className="btn-secondary flex-shrink-0">
            ← 离开
          </button>
          {isHost && (
            <button
              onClick={handleStart}
              disabled={room.players.length < 2}
              className="btn-primary flex-1 py-3.5 text-base"
            >
              {room.players.length < 2 ? '等待更多玩家...' : `🎮 开始游戏 (${room.players.length}人)`}
            </button>
          )}
          {!isHost && (
            <div className="flex-1 glass rounded-xl flex items-center justify-center text-white/40 text-sm">
              <span className="animate-pulse">等待房主开始游戏...</span>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
