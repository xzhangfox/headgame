import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AVATARS = [
  '🐶','🐱','🐸','🦊','🐼','🦁','🐯','🐻',
  '🦄','🐲','🦋','🐧','🦉','🐙','🦈','🐺',
  '🦅','🐬','🐨','🦚',
];

interface Props {
  onCreateRoom: (name: string, avatar: string) => void;
  onJoinRoom:   (code: string, name: string, avatar: string) => void;
  isConnected:  boolean;
}

type Tab = 'create' | 'join';

export default function HomePage({ onCreateRoom, onJoinRoom, isConnected }: Props) {
  const [tab,      setTab]      = useState<Tab>('create');
  const [name,     setName]     = useState('');
  const [avatar,   setAvatar]   = useState(AVATARS[0]);
  const [roomCode, setRoomCode] = useState('');
  const [loading,  setLoading]  = useState(false);

  const canSubmit =
    !loading && isConnected && name.trim().length > 0 &&
    (tab === 'create' || roomCode.trim().length === 6);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      tab === 'create'
        ? await onCreateRoom(name.trim(), avatar)
        : await onJoinRoom(roomCode.trim().toUpperCase(), name.trim(), avatar);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-12">

      {/* ── Hero ── */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y:   0 }}
        transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <motion.div
          className="text-6xl mb-5 inline-block"
          animate={{ rotate: [0, -8, 8, -8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 }}
        >
          🎭
        </motion.div>

        <h1
          className="text-display text-white mb-3"
          style={{ fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", sans-serif' }}
        >
          Head<span className="text-gold">Game</span>
        </h1>

        <p className="text-callout" style={{ color: 'rgba(235,235,245,0.60)' }}>
          猜猜你头顶上是什么？
        </p>

        <div
          className="flex items-center justify-center gap-5 mt-3 text-footnote"
          style={{ color: 'rgba(235,235,245,0.30)' }}
        >
          <span>👥 2–8人</span>
          <span className="w-px h-3" style={{ background: 'rgba(84,84,88,0.65)' }} />
          <span>🎯 10大题库</span>
          <span className="w-px h-3" style={{ background: 'rgba(84,84,88,0.65)' }} />
          <span>🎤 语音输入</span>
        </div>
      </motion.div>

      {/* ── Form card ── */}
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y:  0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <div className="surface shadow-card-lg overflow-hidden">
          {/* Tab switcher */}
          <div className="p-1.5" style={{ background: 'rgba(118,118,128,0.12)' }}>
            <div className="flex rounded-inner overflow-hidden" style={{ background: 'rgba(118,118,128,0.12)', borderRadius: 10 }}>
              {(['create', 'join'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2 text-footnote font-medium transition-all duration-200 rounded-[9px] ${
                    tab === t
                      ? 'text-black font-semibold'
                      : 'text-apple-label-2'
                  }`}
                  style={tab === t ? {
                    background: 'linear-gradient(180deg,#f5c842 0%,#c79100 100%)',
                  } : {}}
                >
                  {t === 'create' ? '创建房间' : '加入房间'}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Avatar */}
            <div>
              <p className="text-caption mb-2.5" style={{ color: 'rgba(235,235,245,0.60)' }}>
                选择头像
              </p>
              <div className="grid grid-cols-10 gap-1">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setAvatar(av)}
                    className={`text-xl h-8 w-8 rounded-xs transition-all duration-150 flex items-center justify-center ${
                      avatar === av ? 'scale-110' : 'opacity-50 hover:opacity-80'
                    }`}
                    style={avatar === av ? {
                      background: 'rgba(212,175,55,0.18)',
                      boxShadow: '0 0 0 1.5px rgba(212,175,55,0.6)',
                      borderRadius: 7,
                    } : { background: 'transparent' }}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Separator */}
            <div className="separator border-t" />

            {/* Name */}
            <div>
              <label className="text-caption block mb-1.5" style={{ color: 'rgba(235,235,245,0.60)' }}>
                昵称
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入昵称…"
                maxLength={12}
                className="game-input text-body"
                required
              />
            </div>

            {/* Room code */}
            <AnimatePresence>
              {tab === 'join' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 20 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <label className="text-caption block mb-1.5" style={{ color: 'rgba(235,235,245,0.60)' }}>
                    房间码
                  </label>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="6位房间码"
                    maxLength={6}
                    className="game-input font-mono text-center tracking-widest"
                    style={{ fontSize: '1.4rem', letterSpacing: '0.22em' }}
                    required
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  处理中…
                </span>
              ) : tab === 'create' ? '创建房间' : '加入游戏'}
            </button>
          </form>
        </div>

        {/* How to play */}
        <motion.div
          className="mt-5 px-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-caption font-medium mb-2" style={{ color: 'rgba(235,235,245,0.40)' }}>
            玩法简介
          </p>
          <ul className="space-y-1.5 text-caption" style={{ color: 'rgba(235,235,245,0.28)' }}>
            <li>🎭 每人头顶有张只有别人看得到的卡片</li>
            <li>💬 轮流提问获取线索，只能答是/否</li>
            <li>💡 猜错扣命，越早猜对分越高</li>
            <li>🏆 所有人猜出后结算，分最高者获胜</li>
          </ul>
        </motion.div>

        {!isConnected && (
          <p className="text-center text-footnote mt-3" style={{ color: '#ff453a' }}>
            正在连接服务器…
          </p>
        )}
      </motion.div>
    </div>
  );
}
