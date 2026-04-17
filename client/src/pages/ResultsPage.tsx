import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Room } from '../types';

interface Props {
  room:        Room;
  myId:        string;
  onPlayAgain: () => void;
  onLeaveRoom: () => void;
}

const MEDALS = ['🥇', '🥈', '🥉', '4', '5', '6', '7', '8'];

function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    x:        Math.random() * 100,
    color:    ['#ffd700', '#d4af37', '#f5c842', '#ffe566', '#c79100'][i % 5],
    delay:    Math.random() * 1.8,
    duration: 2.2 + Math.random() * 1.5,
    size:     5 + Math.random() * 8,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
      {pieces.map((p) => (
        <motion.div key={p.id}
          className="absolute rounded-sm"
          style={{ left: `${p.x}%`, top: -20, width: p.size, height: p.size, background: p.color }}
          animate={{ y: ['0vh', '110vh'], rotate: [0, 720], opacity: [1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, repeatDelay: 0.5, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

export default function ResultsPage({ room, myId, onPlayAgain, onLeaveRoom }: Props) {
  const [showConfetti, setShowConfetti] = useState(true);

  const sorted  = [...room.players].sort((a, b) => b.score - a.score);
  const winner  = sorted[0];
  const me      = room.players.find(p => p.id === myId);
  const myRank  = sorted.findIndex(p => p.id === myId) + 1;
  const iWon    = winner?.id === myId;

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-12 relative">
      {showConfetti && <Confetti />}

      <div className="w-full max-w-md relative z-20">

        {/* ── Winner hero ── */}
        <motion.div className="text-center mb-10"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, type: 'spring', stiffness: 200 }}
        >
          <div className="text-7xl mb-4">{iWon ? '🏆' : '🎮'}</div>

          <h1
            className="text-display text-white mb-3"
            style={{ fontFamily: '-apple-system,"SF Pro Display","Helvetica Neue",sans-serif' }}
          >
            游戏结束
          </h1>

          {winner && (
            <p className="text-callout" style={{ color: 'rgba(235,235,245,0.55)' }}>
              冠军：
              <span className="text-white font-semibold">{winner.avatar} {winner.name}</span>
              <span className="text-gold font-bold ml-2">{winner.score} 分</span>
            </p>
          )}

          {iWon && (
            <motion.p
              className="text-title-2 font-semibold text-gold mt-2"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ repeat: 3, duration: 0.6, delay: 0.5 }}
            >
              恭喜你获胜！
            </motion.p>
          )}
        </motion.div>

        {/* ── Scoreboard ── */}
        <motion.div className="surface shadow-card-lg mb-4 overflow-hidden"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}>

          <div className="px-5 py-3 border-b separator">
            <p className="text-footnote font-semibold" style={{ color: 'rgba(235,235,245,0.40)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              最终排名
            </p>
          </div>

          <div className="divide-y" style={{ borderColor: 'rgba(84,84,88,0.35)' }}>
            {sorted.map((p, i) => (
              <motion.div
                key={p.id}
                className="flex items-center gap-3 px-5 py-3.5"
                style={p.id === myId ? { background: 'rgba(212,175,55,0.07)' } : {}}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.32 + i * 0.07 }}
              >
                <span className="text-xl w-7 text-center shrink-0">
                  {i < 3 ? MEDALS[i] : <span className="text-footnote" style={{ color: 'rgba(235,235,245,0.30)' }}>{i + 1}</span>}
                </span>
                <span className="text-2xl shrink-0">{p.avatar}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium text-white truncate">
                    {p.name}
                    {p.id === myId && <span className="text-gold text-caption ml-1">你</span>}
                  </p>
                  {p.headItem && (
                    <p className="text-caption truncate" style={{ color: 'rgba(235,235,245,0.35)' }}>
                      {p.headEmoji} {p.headItem}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-headline font-bold text-gold">{p.score}</p>
                  {p.hasGuessed && p.lives > 0
                    ? <p className="text-caption" style={{ color: '#30d158' }}>第 {p.guessRank} 名</p>
                    : <p className="text-caption" style={{ color: '#ff453a' }}>淘汰</p>
                  }
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── My stats ── */}
        {me && (
          <motion.div className="surface shadow-card mb-5 p-4"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}>
            <p className="text-caption font-semibold mb-3 text-center"
              style={{ color: 'rgba(235,235,245,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              你的战绩
            </p>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: '得分',     value: me.score,         color: '#d4af37' },
                { label: '排名',     value: `#${myRank}`,     color: '#ffd700' },
                { label: '剩余命',   value: me.lives,         color: '#ff453a' },
                { label: '猜错次',   value: me.wrongGuesses,  color: 'rgba(235,235,245,0.40)' },
              ].map((s) => (
                <div key={s.label} className="surface-3 rounded-inner py-3 px-1">
                  <p className="text-title-2 font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-caption mt-0.5" style={{ color: 'rgba(235,235,245,0.30)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Actions ── */}
        <motion.div className="flex gap-3"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}>
          <button onClick={onLeaveRoom} className="btn-secondary flex-shrink-0 px-5 py-3">
            回主页
          </button>
          <button onClick={onPlayAgain} className="btn-primary flex-1 py-3">
            再来一局
          </button>
        </motion.div>
      </div>
    </div>
  );
}
