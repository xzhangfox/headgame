import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AVATARS = ['🐶', '🐱', '🐸', '🦊', '🐼', '🦁', '🐯', '🐻', '🦄', '🐲', '🦋', '🐧', '🦉', '🐙', '🦈', '🐺', '🦅', '🐬', '🐨', '🦚'];

interface Props {
  onCreateRoom: (name: string, avatar: string) => void;
  onJoinRoom: (code: string, name: string, avatar: string) => void;
  isConnected: boolean;
}

type Tab = 'create' | 'join';

export default function HomePage({ onCreateRoom, onJoinRoom, isConnected }: Props) {
  const [tab, setTab] = useState<Tab>('create');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || loading || !isConnected) return;

    setLoading(true);
    try {
      if (tab === 'create') {
        await onCreateRoom(name.trim(), avatar);
      } else {
        if (!roomCode.trim()) return;
        await onJoinRoom(roomCode.trim().toUpperCase(), name.trim(), avatar);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <motion.div
            className="text-7xl mb-4 inline-block"
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            🎭
          </motion.div>
          <h1 className="text-5xl font-black text-white mb-2 tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-neon-pink to-neon-cyan">
              HEAD
            </span>
            <span className="text-white">GAME</span>
          </h1>
          <p className="text-white/60 text-lg">猜猜你头顶上是什么？</p>
          <div className="flex justify-center gap-6 mt-3 text-sm text-white/40">
            <span>👥 2-8人</span>
            <span>🎯 多题库</span>
            <span>🎤 语音输入</span>
          </div>
        </motion.div>

        {/* Main card */}
        <motion.div
          className="glass neon-border p-6 rounded-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Tab switcher */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-6">
            {(['create', 'join'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  tab === t
                    ? 'bg-brand-600 text-white shadow-glow'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {t === 'create' ? '🚀 创建房间' : '🔗 加入房间'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar picker */}
            <div>
              <label className="text-sm text-white/60 mb-2 block">选择头像</label>
              <div className="grid grid-cols-10 gap-1.5">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setAvatar(av)}
                    className={`text-2xl w-9 h-9 rounded-lg transition-all duration-150 flex items-center justify-center ${
                      avatar === av
                        ? 'bg-brand-600/70 scale-110 shadow-glow ring-2 ring-brand-400'
                        : 'bg-white/5 hover:bg-white/10 hover:scale-105'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Name input */}
            <div>
              <label className="text-sm text-white/60 mb-1.5 block">你的昵称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入昵称..."
                maxLength={12}
                className="game-input"
                required
              />
            </div>

            {/* Room code input (join mode) */}
            <AnimatePresence>
              {tab === 'join' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="text-sm text-white/60 mb-1.5 block">房间码</label>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="输入6位房间码..."
                    maxLength={6}
                    className="game-input font-mono text-center text-xl tracking-widest"
                    required
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !isConnected || !name.trim() || (tab === 'join' && !roomCode.trim())}
              className="btn-primary w-full py-3.5 text-base mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  处理中...
                </span>
              ) : tab === 'create' ? (
                '🎮 创建房间'
              ) : (
                '🚀 加入游戏'
              )}
            </button>
          </form>

          {!isConnected && (
            <p className="text-center text-red-400/80 text-xs mt-3">正在连接服务器...</p>
          )}
        </motion.div>

        {/* How to play */}
        <motion.div
          className="mt-6 glass p-4 rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-sm font-semibold text-white/70 mb-2">📖 玩法简介</h3>
          <ul className="text-xs text-white/40 space-y-1">
            <li>🎭 每位玩家头顶有一张别人能看到、自己看不到的卡片</li>
            <li>💬 轮流向其他玩家提问来获取线索（只能答是/否）</li>
            <li>💡 随时可以猜测自己头顶内容，猜错扣命</li>
            <li>🏆 最先猜对得分最高，越晚猜对分越低</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
