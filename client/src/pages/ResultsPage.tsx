import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Room } from '../types';

interface Props {
  room: Room;
  myId: string;
  onPlayAgain: () => void;
  onLeaveRoom: () => void;
}

const RANK_MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];

function Confetti() {
  const pieces = Array.from({ length: 35 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: ['#ffd700', '#e6ac00', '#c79100', '#fff176', '#ffca28', '#ffe082'][
      Math.floor(Math.random() * 6)
    ],
    delay:    Math.random() * 2,
    duration: 2 + Math.random() * 2,
    size:     5 + Math.random() * 10,
    shape:    Math.random() > 0.5 ? 'rounded-sm' : 'rounded-full',
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className={`absolute ${p.shape}`}
          style={{ left: `${p.x}%`, top: -20, width: p.size, height: p.size, background: p.color }}
          animate={{ y: ['0vh', '110vh'], rotate: [0, 720], opacity: [1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, repeatDelay: 1, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

export default function ResultsPage({ room, myId, onPlayAgain, onLeaveRoom }: Props) {
  const [showConfetti, setShowConfetti] = useState(true);
  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
  const winner  = sortedPlayers[0];
  const iWon    = winner?.id === myId;
  const me      = room.players.find(p => p.id === myId);
  const myRank  = sortedPlayers.findIndex(p => p.id === myId) + 1;

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 6000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {showConfetti && <Confetti />}

      <div className="w-full max-w-xl relative z-20">
        {/* Header */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
        >
          <div className="text-7xl mb-3 inline-block">
            {iWon ? '🏆' : '🎮'}
          </div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold-200 via-neon-gold to-gold-500 mb-2">
            游戏结束！
          </h1>
          {winner && (
            <p className="text-white/60 text-lg">
              🥇 冠军：
              <span className="font-bold text-white">{winner.avatar} {winner.name}</span>
              <span className="text-gold-400 ml-2 font-bold">{winner.score}分</span>
            </p>
          )}
          {iWon && (
            <motion.p
              className="text-neon-gold text-xl font-bold mt-2 text-glow"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: 3, duration: 0.5 }}
            >
              🎉 恭喜你获胜！
            </motion.p>
          )}
        </motion.div>

        {/* Scoreboard */}
        <motion.div
          className="glass neon-border rounded-2xl p-4 mb-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xs font-semibold text-white/40 mb-3 text-center uppercase tracking-wider">最终排名</h2>
          <div className="space-y-2">
            {sortedPlayers.map((player, i) => (
              <motion.div
                key={player.id}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
                  player.id === myId
                    ? 'bg-gold-900/30 border-gold-500/50'
                    : i === 0
                    ? 'bg-gold-900/20 border-gold-600/30'
                    : 'bg-white/4 border-white/5'
                }`}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
              >
                <span className="text-2xl w-8 text-center">{RANK_MEDALS[i]}</span>
                <span className="text-2xl">{player.avatar}</span>
                <div className="flex-1">
                  <p className="font-semibold text-white">
                    {player.name}
                    {player.id === myId && <span className="text-gold-400 text-xs ml-1">(你)</span>}
                  </p>
                  {player.headItem && (
                    <p className="text-xs text-white/35 mt-0.5">
                      头顶：{player.headEmoji} {player.headItem}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-black text-xl text-gold-400">{player.score}</p>
                  <p className="text-xs text-white/30">分</p>
                </div>
                <div className="ml-2">
                  {player.hasGuessed && player.lives > 0
                    ? <span className="text-xs text-neon-green">✅ 第{player.guessRank}名</span>
                    : <span className="text-xs text-red-400">💀 淘汰</span>
                  }
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* My stats */}
        {me && (
          <motion.div
            className="glass rounded-2xl p-4 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="text-xs text-white/35 mb-3 text-center uppercase tracking-wider">你的战绩</h3>
            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                { label: '最终得分', value: me.score,         unit: '分', color: 'text-gold-400' },
                { label: '排名',     value: `第${myRank}`,    unit: '名', color: 'text-gold-300' },
                { label: '剩余生命', value: me.lives,         unit: '条', color: 'text-red-400'  },
                { label: '错误猜测', value: me.wrongGuesses,  unit: '次', color: 'text-white/50' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/4 border border-gold-700/15 rounded-xl p-2">
                  <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-white/25">{stat.unit}</p>
                  <p className="text-xs text-white/35 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <button onClick={onLeaveRoom} className="btn-secondary flex-shrink-0">🏠 回主页</button>
          <button onClick={onPlayAgain} className="btn-primary flex-1 py-3.5 text-base">🔄 再来一局</button>
        </motion.div>
      </div>
    </div>
  );
}
