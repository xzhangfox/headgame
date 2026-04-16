import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useSpeech } from '../hooks/useSpeech';
import type { Room, Player, ChatMessage } from '../types';

interface Props {
  room: Room;
  myId: string;
  onSendMessage: (content: string, targetId?: string, type?: 'question' | 'answer') => void;
  onMakeGuess: (guess: string) => Promise<unknown>;
  onEndTurn: () => void;
  onLeaveRoom: () => void;
}

export default function GamePage({ room, myId, onSendMessage, onMakeGuess, onEndTurn, onLeaveRoom }: Props) {
  const [msgInput, setMsgInput] = useState('');
  const [guessInput, setGuessInput] = useState('');
  const [targetId, setTargetId] = useState<string | undefined>(undefined);
  const [msgType, setMsgType] = useState<'question' | 'answer'>('question');
  const [showGuessModal, setShowGuessModal] = useState(false);
  const [isGuessing, setIsGuessing] = useState(false);
  const [turnTime, setTurnTime] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const me = room.players.find(p => p.id === myId);
  const isMyTurn = room.currentTurnPlayerId === myId;
  const currentTurnPlayer = room.players.find(p => p.id === room.currentTurnPlayerId);
  const otherPlayers = room.players.filter(p => p.id !== myId);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room.messages.length]);

  useEffect(() => {
    if (!room.turnStartTime || !room.settings.turnTimeLimitSec) return;
    const update = () => {
      const elapsed = (Date.now() - room.turnStartTime!) / 1000;
      setTurnTime(Math.ceil(Math.max(0, room.settings.turnTimeLimitSec - elapsed)));
    };
    update();
    const id = setInterval(update, 500);
    return () => clearInterval(id);
  }, [room.turnStartTime, room.settings.turnTimeLimitSec]);

  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeech({
    onResult: (text) => { setMsgInput(text); inputRef.current?.focus(); },
    onError: (err) => toast.error(err),
  });

  useEffect(() => { if (transcript) setMsgInput(transcript); }, [transcript]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    onSendMessage(msgInput.trim(), targetId, msgType);
    setMsgInput('');
  };

  const handleGuess = async () => {
    if (!guessInput.trim() || isGuessing) return;
    setIsGuessing(true);
    try {
      await onMakeGuess(guessInput.trim());
      setGuessInput('');
      setShowGuessModal(false);
    } finally {
      setIsGuessing(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="glass-dark border-b border-gold-700/20 px-4 py-2 flex items-center gap-3 shrink-0">
        <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-gold-200 to-gold-500">
          HEADGAME
        </span>
        <span className="text-white/20">|</span>
        <span className="text-white/40 text-sm">第 {room.turnNumber} 轮</span>

        <div className="flex-1" />

        {/* Turn indicator */}
        {currentTurnPlayer && (
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isMyTurn
              ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
              : 'bg-white/8 text-white/50'
          }`}>
            <span>{currentTurnPlayer.avatar}</span>
            <span className="font-medium">
              {isMyTurn ? '你的回合！' : `${currentTurnPlayer.name} 的回合`}
            </span>
          </div>
        )}

        {/* Timer */}
        {turnTime !== null && (
          <div className={`text-sm font-mono font-bold px-2 py-1 rounded-lg ${
            turnTime <= 10 ? 'text-red-400 animate-pulse' : turnTime <= 30 ? 'text-gold-300' : 'text-white/40'
          }`}>
            ⏱️ {turnTime}s
          </div>
        )}

        <button onClick={onLeaveRoom} className="btn-secondary text-xs px-3 py-1.5">离开</button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Left: Players */}
        <div className="md:w-56 lg:w-64 glass-dark border-r border-gold-700/15 flex flex-col overflow-hidden shrink-0">
          <div className="p-3 border-b border-gold-700/15">
            <h3 className="text-xs font-semibold text-white/35 uppercase tracking-wider">玩家</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {room.players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                isMe={player.id === myId}
                isCurrentTurn={player.id === room.currentTurnPlayerId}
                mode={room.settings.mode}
                showHead={player.id !== myId}
                maxLives={room.settings.maxLives}
              />
            ))}
          </div>

          {/* My status */}
          {me && (
            <div className="p-3 border-t border-gold-700/15">
              <div className="flex items-center gap-2 text-sm mb-2">
                <span className="text-xl">{me.avatar}</span>
                <div>
                  <p className="font-semibold text-white">{me.name}</p>
                  <p className="text-xs text-white/30">
                    {'❤️'.repeat(me.lives)}{'🖤'.repeat(Math.max(0, room.settings.maxLives - me.lives))}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-gold-400 font-bold">{me.score}</p>
                  <p className="text-xs text-white/30">分</p>
                </div>
              </div>
              {!me.hasGuessed && me.lives > 0 && (
                <button onClick={() => setShowGuessModal(true)} className="btn-primary w-full text-sm py-2">
                  💡 我猜到了！
                </button>
              )}
              {me.hasGuessed && (
                <div className="text-center py-2 text-sm">
                  {me.lives > 0
                    ? <span className="text-neon-green font-semibold">✅ 已猜对！第{me.guessRank}名</span>
                    : <span className="text-red-400">💀 已淘汰</span>
                  }
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center: Chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <AnimatePresence initial={false}>
              {room.messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} myId={myId} />
              ))}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          {/* Input area */}
          <div className="glass-dark border-t border-gold-700/15 p-3 shrink-0">
            {/* Type & target selector */}
            <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
              <button
                onClick={() => setMsgType('question')}
                className={`text-xs px-3 py-1 rounded-full whitespace-nowrap transition-all ${
                  msgType === 'question'
                    ? 'bg-gold-600/40 text-gold-300 border border-gold-500/50'
                    : 'bg-white/8 text-white/40'
                }`}
              >
                ❓ 提问
              </button>
              <button
                onClick={() => setMsgType('answer')}
                className={`text-xs px-3 py-1 rounded-full whitespace-nowrap transition-all ${
                  msgType === 'answer'
                    ? 'bg-gold-800/50 text-gold-200 border border-gold-600/50'
                    : 'bg-white/8 text-white/40'
                }`}
              >
                💬 回答
              </button>
              <div className="w-px bg-gold-700/20 mx-1" />
              <button
                onClick={() => setTargetId(undefined)}
                className={`text-xs px-3 py-1 rounded-full whitespace-nowrap transition-all ${
                  !targetId ? 'bg-white/15 text-white' : 'bg-white/5 text-white/35'
                }`}
              >
                👥 全体
              </button>
              {otherPlayers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setTargetId(p.id === targetId ? undefined : p.id)}
                  className={`text-xs px-3 py-1 rounded-full whitespace-nowrap flex items-center gap-1 transition-all ${
                    targetId === p.id
                      ? 'bg-gold-600/35 text-gold-300 border border-gold-500/40'
                      : 'bg-white/5 text-white/35'
                  }`}
                >
                  <span>{p.avatar}</span>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  placeholder={
                    msgType === 'question'
                      ? isMyTurn ? '向大家提问...' : '等待轮到你提问...'
                      : '回答问题...'
                  }
                  maxLength={200}
                  className="game-input pr-10"
                />
                {isSupported && (
                  <button
                    type="button"
                    onMouseDown={startListening}
                    onMouseUp={stopListening}
                    onTouchStart={startListening}
                    onTouchEnd={stopListening}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 text-lg transition-all ${
                      isListening ? 'text-red-400 animate-pulse scale-110' : 'text-white/25 hover:text-gold-400'
                    }`}
                    title="按住说话"
                  >
                    🎤
                  </button>
                )}
              </div>
              <button type="submit" disabled={!msgInput.trim()} className="btn-primary px-4">
                发送
              </button>
              {isMyTurn && (
                <button type="button" onClick={onEndTurn} className="btn-secondary px-3 text-sm" title="结束本轮提问">
                  ⏭️
                </button>
              )}
            </form>
            {isListening && (
              <p className="text-xs text-red-400 mt-1 text-center animate-pulse">🎤 正在录音，松开发送...</p>
            )}
          </div>
        </div>
      </div>

      {/* Guess modal */}
      <AnimatePresence>
        {showGuessModal && (
          <motion.div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowGuessModal(false)}
          >
            <motion.div
              className="glass neon-border rounded-2xl p-6 w-full max-w-sm"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
            >
              <h3 className="text-xl font-bold text-white mb-2 text-center">💡 猜测头顶内容</h3>
              <p className="text-white/40 text-sm text-center mb-4">输入你猜测的内容（文字或表情）</p>
              <input
                type="text"
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
                placeholder="输入你的猜测..."
                autoFocus
                className="game-input mb-4 text-center text-lg"
              />
              <div className="flex gap-3">
                <button onClick={() => { setShowGuessModal(false); setGuessInput(''); }} className="btn-secondary flex-1">
                  取消
                </button>
                <button onClick={handleGuess} disabled={!guessInput.trim() || isGuessing} className="btn-primary flex-1">
                  {isGuessing ? '猜测中...' : '🎯 确认猜测'}
                </button>
              </div>
              <p className="text-xs text-white/25 text-center mt-3">猜错一次扣1条命 −10分，请谨慎！</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Player card ── */
function PlayerCard({
  player, isMe, isCurrentTurn, mode, showHead, maxLives,
}: {
  player: Player; isMe: boolean; isCurrentTurn: boolean;
  mode: 'text' | 'emoji'; showHead: boolean; maxLives: number;
}) {
  return (
    <div className={`rounded-xl p-2 transition-all duration-300 border ${
      isCurrentTurn
        ? 'current-turn-glow bg-gold-900/10 border-gold-500/40'
        : 'bg-white/4 border-gold-700/10'
    } ${player.hasGuessed || player.lives <= 0 ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-2">
        {/* Head item */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold shrink-0 ${
          showHead && player.headItem
            ? 'bg-gold-900/40 border border-gold-600/30'
            : 'bg-black/40 border border-white/8'
        }`}>
          {showHead ? (
            mode === 'emoji'
              ? player.headEmoji || '?'
              : <span className="text-xs text-center leading-tight px-0.5">{player.headItem || '?'}</span>
          ) : (
            <span className="text-white/15">?</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-base">{player.avatar}</span>
            <span className="text-sm font-semibold text-white truncate">
              {player.name}
              {isMe && <span className="text-gold-400 text-xs ml-1">(你)</span>}
            </span>
          </div>
          <div className="flex items-center mt-0.5">
            <span className="text-xs text-white/35">
              {'❤️'.repeat(player.lives)}{'🖤'.repeat(Math.max(0, maxLives - player.lives))}
            </span>
            <span className="text-xs text-gold-400/70 font-medium ml-auto">{player.score}分</span>
          </div>
        </div>
      </div>

      {player.hasGuessed && player.lives > 0 && (
        <div className="mt-1.5 text-xs text-neon-green text-center bg-green-900/20 rounded-lg py-0.5">
          ✅ 第{player.guessRank}名猜对
        </div>
      )}
      {player.lives <= 0 && (
        <div className="mt-1.5 text-xs text-red-400 text-center bg-red-900/20 rounded-lg py-0.5">
          💀 已淘汰
        </div>
      )}
      {isCurrentTurn && !player.hasGuessed && player.lives > 0 && (
        <div className="mt-1.5 text-xs text-gold-300 text-center bg-gold-900/20 rounded-lg py-0.5 animate-pulse">
          ▶ 当前回合
        </div>
      )}
    </div>
  );
}

/* ── Message bubble ── */
function MessageBubble({ msg, myId }: { msg: ChatMessage; myId: string }) {
  const isMe = msg.playerId === myId;
  const isSystem = msg.playerId === 'system';

  if (isSystem) {
    return (
      <motion.div className="text-center py-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <span className="text-xs text-gold-600/70 bg-gold-900/20 border border-gold-700/20 px-3 py-1 rounded-full inline-block">
          {msg.content}
        </span>
      </motion.div>
    );
  }

  const typeAccent: Record<string, string> = {
    question:      'border-l-2 border-gold-500',
    answer:        'border-l-2 border-gold-300/60',
    guess_success: 'border border-neon-green/40 bg-green-900/20',
    guess_fail:    'border border-red-500/40 bg-red-900/20',
  };

  return (
    <motion.div
      className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
      initial={{ opacity: 0, x: isMe ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <span className="text-2xl shrink-0 mt-1">{msg.playerAvatar}</span>
      <div className={`max-w-[75%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2">
          {!isMe && <span className="text-xs font-semibold text-white/50">{msg.playerName}</span>}
          {msg.targetPlayerName && <span className="text-xs text-white/25">→ {msg.targetPlayerName}</span>}
          {msg.type === 'question' && <span className="text-xs text-gold-400">❓</span>}
          {msg.type === 'answer'   && <span className="text-xs text-gold-300">💬</span>}
        </div>
        <div className={`px-3 py-2 rounded-xl text-sm ${
          isMe
            ? 'bg-gold-800/40 text-white rounded-tr-sm border border-gold-600/25'
            : 'bg-white/8 text-white rounded-tl-sm'
        } ${typeAccent[msg.type] || ''}`}>
          {msg.content}
        </div>
        <span className="text-xs text-white/18">
          {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
}
