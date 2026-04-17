import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Room, Category } from '../types';

const CATEGORIES: Category[] = [
  { id: 'animals',     name: '动物',   emoji: '🐾', items: [] },
  { id: 'food',        name: '美食',   emoji: '🍽️', items: [] },
  { id: 'movies',      name: '影视',   emoji: '🎬', items: [] },
  { id: 'celebrities', name: '名人',   emoji: '⭐', items: [] },
  { id: 'countries',   name: '国家',   emoji: '🌍', items: [] },
  { id: 'sports',      name: '运动',   emoji: '🏆', items: [] },
  { id: 'brands',      name: '品牌',   emoji: '🏷️', items: [] },
  { id: 'occupations', name: '职业',   emoji: '👔', items: [] },
  { id: 'fantasy',     name: '奇幻',   emoji: '✨', items: [] },
  { id: 'everyday',    name: '日常',   emoji: '🏠', items: [] },
];

interface Props {
  room: Room;
  myId: string;
  onStartGame:      (settings: Room['settings']) => void;
  onLeaveRoom:      () => void;
  onUpdateSettings: (s: Partial<Room['settings']>) => void;
}

export default function LobbyPage({ room, myId, onStartGame, onLeaveRoom, onUpdateSettings }: Props) {
  const [copied, setCopied] = useState(false);
  const isHost = room.hostId === myId;
  const { settings } = room;

  const copyCode = async () => {
    await navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-lg">

        {/* Header */}
        <motion.div className="text-center mb-8"
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-title-1 text-white mb-1">游戏大厅</h2>
          <p className="text-subhead" style={{ color: 'rgba(235,235,245,0.40)' }}>
            等待玩家加入…
          </p>
        </motion.div>

        {/* Room code */}
        <motion.div
          className="surface shadow-card mb-4 p-5 text-center"
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08 }}
        >
          <p className="text-caption mb-2" style={{ color: 'rgba(235,235,245,0.40)' }}>
            房间码
          </p>
          <div className="flex items-center justify-center gap-4 mb-2">
            <span
              className="font-mono font-bold text-gold-bright tracking-widest"
              style={{ fontSize: '2.4rem', letterSpacing: '0.2em' }}
            >
              {room.code}
            </span>
            <button onClick={copyCode} className="btn-chip active" style={{ minWidth: 72 }}>
              {copied ? '✓ 复制' : '复制'}
            </button>
          </div>
          <p className="text-caption" style={{ color: 'rgba(235,235,245,0.25)' }}>
            把房间码分享给朋友
          </p>
        </motion.div>

        {/* Players + Settings */}
        <div className="grid md:grid-cols-2 gap-3">
          {/* Players */}
          <motion.div className="surface shadow-card p-4"
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.14 }}>
            <p className="text-footnote font-semibold mb-3" style={{ color: 'rgba(235,235,245,0.40)' }}>
              玩家 {room.players.length}/{room.settings.maxPlayers}
            </p>

            <div className="space-y-1.5">
              <AnimatePresence>
                {room.players.map((p, i) => (
                  <motion.div
                    key={p.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-inner"
                    style={{ background: 'rgba(118,118,128,0.12)' }}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <span className="text-2xl leading-none">{p.avatar}</span>
                    <span className="text-subhead font-medium text-white flex-1 truncate">
                      {p.name}
                      {p.id === myId && (
                        <span className="ml-1.5 text-caption text-gold"> 你</span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      {room.hostId === p.id && (
                        <span className="text-caption px-2 py-0.5 rounded-pill"
                          style={{ background: 'rgba(212,175,55,0.16)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.35)' }}>
                          房主
                        </span>
                      )}
                      <div className={`w-1.5 h-1.5 rounded-full ${p.isConnected ? 'bg-neon-green' : 'bg-neon-red'}`} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {room.players.length < 2 && (
                <p className="text-caption text-center py-2" style={{ color: 'rgba(235,235,245,0.25)' }}>
                  至少需要 2 名玩家
                </p>
              )}
            </div>
          </motion.div>

          {/* Settings */}
          <motion.div className="surface shadow-card p-4"
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18 }}>
            <p className="text-footnote font-semibold mb-3" style={{ color: 'rgba(235,235,245,0.40)' }}>
              游戏设置
            </p>

            {/* Category */}
            <div className="mb-4">
              <p className="text-caption mb-2" style={{ color: 'rgba(235,235,245,0.40)' }}>题库</p>
              <div className="grid grid-cols-2 gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => isHost && onUpdateSettings({ category: cat.id })}
                    disabled={!isHost}
                    className={`flex items-center gap-2 px-3 py-2 rounded-inner text-footnote transition-all ${
                      !isHost ? 'cursor-default' : ''
                    }`}
                    style={settings.category === cat.id ? {
                      background: 'rgba(212,175,55,0.16)',
                      color: '#ffd700',
                      border: '1px solid rgba(212,175,55,0.40)',
                      borderRadius: 10,
                    } : {
                      background: 'rgba(118,118,128,0.12)',
                      color: 'rgba(235,235,245,0.60)',
                      border: '1px solid transparent',
                      borderRadius: 10,
                    }}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mode */}
            <div className="mb-3">
              <p className="text-caption mb-1.5" style={{ color: 'rgba(235,235,245,0.40)' }}>显示模式</p>
              <div className="flex gap-2">
                {[{ v: 'emoji', l: '🖼️ 表情' }, { v: 'text', l: '🔤 文字' }].map((m) => (
                  <button
                    key={m.v}
                    onClick={() => isHost && onUpdateSettings({ mode: m.v as 'emoji' | 'text' })}
                    disabled={!isHost}
                    className={`flex-1 py-2 rounded-inner text-footnote transition-all ${!isHost ? 'cursor-default' : ''}`}
                    style={settings.mode === m.v ? {
                      background: 'rgba(212,175,55,0.16)',
                      color: '#ffd700',
                      border: '1px solid rgba(212,175,55,0.40)',
                    } : {
                      background: 'rgba(118,118,128,0.12)',
                      color: 'rgba(235,235,245,0.60)',
                      border: '1px solid transparent',
                    }}
                  >
                    {m.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Lives + Timer */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '生命数', key: 'maxLives',        opts: [1,2,3,5],        fmt: (n: number) => `${n} 条命` },
                { label: '回合限时', key: 'turnTimeLimitSec', opts: [30,60,90,120], fmt: (n: number) => `${n}s` },
              ].map(({ label, key, opts, fmt }) => (
                <div key={key}>
                  <p className="text-caption mb-1" style={{ color: 'rgba(235,235,245,0.40)' }}>{label}</p>
                  <select
                    value={(settings as unknown as Record<string, number>)[key]}
                    onChange={(e) => isHost && onUpdateSettings({ [key]: Number(e.target.value) } as Partial<Room['settings']>)}
                    disabled={!isHost}
                    className="game-input py-2 text-footnote"
                  >
                    {opts.map((n) => (
                      <option key={n} value={n} className="bg-gray-900">{fmt(n)}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {!isHost && (
              <p className="text-caption text-center mt-3" style={{ color: 'rgba(235,235,245,0.25)' }}>
                等待房主配置…
              </p>
            )}
          </motion.div>
        </div>

        {/* Actions */}
        <motion.div className="flex gap-3 mt-4"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}>
          <button onClick={onLeaveRoom} className="btn-secondary flex-shrink-0 px-4">
            离开
          </button>
          {isHost ? (
            <button
              onClick={() => onStartGame(settings)}
              disabled={room.players.length < 2}
              className="btn-primary flex-1 py-3"
            >
              {room.players.length < 2
                ? '等待更多玩家…'
                : `开始游戏  ${room.players.length} 人`}
            </button>
          ) : (
            <div className="flex-1 surface rounded-card flex items-center justify-center"
              style={{ color: 'rgba(235,235,245,0.30)', fontSize: '0.9375rem' }}>
              <span className="animate-pulse">等待房主开始…</span>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
