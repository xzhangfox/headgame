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

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room.messages.length]);

  // Turn timer countdown
  useEffect(() => {
    if (!room.turnStartTime || !room.settings.turnTimeLimitSec) return;
    const update = () => {
      const elapsed = (Date.now() - room.turnStartTime!) / 1000;
      const remaining = Math.max(0, room.settings.turnTimeLimitSec - elapsed);
      setTurnTime(Math.ceil(remaining));
    };
    update();
    const interval = setInterval(update, 500);
    return () => clearInterval(interval);
  }, [room.turnStartTime, room.settings.turnTimeLimitSec]);

  // Voice speech hook
  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeech({
    onResult: (text) => {
      setMsgInput(text);
      inputRef.current?.focus();
    },
    onError: (err) => toast.error(err),
  });

  // Update input when transcript changes
  useEffect(() => {
    if (transcript) setMsgInput(transcript);
  }, [transcript]);

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

  const otherPlayers = room.players.filter(p => p.id !== myId);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="glass-dark border-b border-white/10 px-4 py-2 flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-neon-cyan">
            HEADGAME
          </span>
          <span className="text-white/30">|</span>
          <span className="text-white/50 text-sm">第 {room.turnNumber} 轮</span>
        </div>
        <div className="flex-1" />

        {/* Turn indicator */}
        {currentTurnPlayer && (
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isMyTurn ? 'bg-neon-yellow/20 text-neon-yellow border border-neon-yellow/40' : 'bg-white/10 text-white/60'
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
            turnTime <= 10 ? 'text-red-400 animate-pulse' : turnTime <= 30 ? 'text-neon-yellow' : 'text-white/60'
          }`}>
            ⏱️ {turnTime}s
          </div>
        )}

        <button onClick={onLeaveRoom} className="btn-secondary text-xs px-3 py-1.5">离开</button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-0">
        {/* Left: Players */}
        <div className="md:w-56 lg:w-64 glass-dark border-r border-white/10 flex flex-col overflow-hidden shrink-0">
          <div className="p-3 border-b border-white/10">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">玩家</h3>
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
              />
            ))}
          </div>

          {/* My info */}
          {me && (
            <div className="p-3 border-t border-white/10">
              <div className="flex items-center gap-2 text-sm mb-2">
                <span className="text-xl">{me.avatar}</span>
                <div>
                  <p className="font-semibold text-white">{me.name}</p>
                  <p className="text-xs text-white/40">{'❤️'.repeat(me.lives)}{'🖤'.repeat(Math.max(0, room.settings.maxLives - me.lives))}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-neon-yellow font-bold">{me.score}</p>
                  <p className="text-xs text-white/40">分</p>
                </div>
              </div>
              {!me.hasGuessed && me.lives > 0 && (
                <button
                  onClick={() => setShowGuessModal(true)}
                  className="btn-primary w-full text-sm py-2"
                >
                  💡 我猜到了！
                </button>
              )}
              {me.hasGuessed && (
                <div className="text-center py-2 text-sm">
                  {me.lives > 0 ? (
                    <span className="text-neon-green font-semibold">✅ 已猜对！第{me.guessRank}名</span>
                  ) : (
                    <span className="text-red-400">💀 已淘汰</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center: Chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <AnimatePresence initial={false}>
              {room.messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} myId={myId} />
              ))}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          {/* Input area */}
          <div className="glass-dark border-t border-white/10 p-3 shrink-0">
            {/* Target selector */}
            <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
              <button
                onClick={() => setMsgType('question')}
                className={`text-xs px-3 py-1 rounded-full whitespace-nowrap transition-all ${
                  msgType === 'question' ? 'bg-brand-600 text-white' : 'bg-white/10 text-white/50'
                }`}
              >
                ❓ 提问
              </button>
              <button
                onClick={() => setMsgType('answer')}
                className={`text-xs px-3 py-1 rounded-full whitespace-nowrap transition-all ${
                  msgType === 'answer' ? 'bg-neon-cyan/30 text-neon-cyan border border-neon-cyan/40' : 'bg-white/10 text-white/50'
                }`}
              >
                💬 回答
              </button>
              <div className="w-px bg-white/10 mx-1" />
              <button
                onClick={() => setTargetId(undefined)}
                className={`text-xs px-3 py-1 rounded-full whitespace-nowrap transition-all ${
                  !targetId ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40'
                }`}
              >
                👥 全体
              </button>
              {otherPlayers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setTargetId(p.id === targetId ? undefined : p.id)}
                  className={`text-xs px-3 py-1 rounded-full whitespace-nowrap transition-all flex items-center gap-1 ${
                    targetId === p.id ? 'bg-brand-600/60 text-white' : 'bg-white/5 text-white/40'
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
                      isListening ? 'text-red-400 animate-pulse scale-110' : 'text-white/30 hover:text-white/60'
                    }`}
                    title="按住说话"
                  >
                    🎤
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={!msgInput.trim()}
                className="btn-primary px-4"
              >
                发送
              </button>
              {isMyTurn && (
                <button
                  type="button"
                  onClick={onEndTurn}
                  className="btn-secondary px-3 text-sm"
                  title="结束本轮提问"
                >
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
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
              <p className="text-white/50 text-sm text-center mb-4">
                输入你猜测的内容（文字或表情）
              </p>
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
                <button
                  onClick={() => { setShowGuessModal(false); setGuessInput(''); }}
                  className="btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  onClick={handleGuess}
                  disabled={!guessInput.trim() || isGuessing}
                  className="btn-primary flex-1"
                >
                  {isGuessing ? '猜测中...' : '🎯 确认猜测'}
                </button>
              </div>
              <p className="text-xs text-white/30 text-center mt-3">
                猜错一次扣1条命 -10分，请谨慎！
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Player card component
function PlayerCard({
  player, isMe, isCurrentTurn, mode, showHead,
}: {
  player: Player; isMe: boolean; isCurrentTurn: boolean; mode: 'text' | 'emoji'; showHead: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-2 transition-all duration-300 ${
        isCurrentTurn
          ? 'current-turn-glow bg-neon-yellow/5 border border-neon-yellow/40'
          : 'bg-white/5 border border-white/5'
      } ${player.hasGuessed || player.lives <= 0 ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-2">
        {/* Head item display */}
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold shrink-0 ${
            showHead && player.headItem
              ? 'bg-white/15 border border-white/20'
              : 'bg-black/30 border border-white/10'
          }`}
        >
          {showHead ? (
            mode === 'emoji' ? player.headEmoji || '?' : (
              <span className="text-xs text-center leading-tight px-0.5">{player.headItem || '?'}</span>
            )
          ) : (
            <span className="text-white/20">?</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-base">{player.avatar}</span>
            <span className="text-sm font-semibold text-white truncate">
              {player.name}
              {isMe && <span className="text-brand-300 text-xs ml-1">(你)</span>}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-white/40">
              {'❤️'.repeat(player.lives)}{'🖤'.repeat(Math.max(0, 3 - player.lives))}
            </span>
            <span className="text-xs text-neon-yellow/80 font-medium ml-auto">{player.score}分</span>
          </div>
        </div>
      </div>

      {player.hasGuessed && player.lives > 0 && (
        <div className="mt-1.5 text-xs text-neon-green text-center bg-neon-green/10 rounded-lg py-0.5">
          ✅ 第{player.guessRank}名猜对
        </div>
      )}
      {player.lives <= 0 && (
        <div className="mt-1.5 text-xs text-red-400 text-center bg-red-400/10 rounded-lg py-0.5">
          💀 已淘汰
        </div>
      )}
      {isCurrentTurn && !player.hasGuessed && (
        <div className="mt-1.5 text-xs text-neon-yellow text-center bg-neon-yellow/10 rounded-lg py-0.5 animate-pulse">
          ▶ 当前回合
        </div>
      )}
    </div>
  );
}

// Message bubble component
function MessageBubble({ msg, myId }: { msg: ChatMessage; myId: string }) {
  const isMe = msg.playerId === myId;
  const isSystem = msg.playerId === 'system';

  if (isSystem) {
    return (
      <motion.div
        className="text-center py-1"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="text-xs text-white/35 bg-white/5 px-3 py-1 rounded-full inline-block">
          {msg.content}
        </span>
      </motion.div>
    );
  }

  const typeStyles: Record<string, string> = {
    question: 'border-l-2 border-brand-400',
    answer: 'border-l-2 border-neon-cyan',
    guess_success: 'border border-neon-green/50 bg-neon-green/10',
    guess_fail: 'border border-red-400/50 bg-red-400/10',
  };

  return (
    <motion.div
      className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
      initial={{ opacity: 0, x: isMe ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <span className="text-2xl shrink-0 mt-1">{msg.playerAvatar}</span>
      <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className="flex items-center gap-2">
          {!isMe && (
            <span className="text-xs font-semibold text-white/60">{msg.playerName}</span>
          )}
          {msg.targetPlayerName && (
            <span className="text-xs text-white/30">→ {msg.targetPlayerName}</span>
          )}
          {msg.type === 'question' && <span className="text-xs text-brand-300">❓</span>}
          {msg.type === 'answer' && <span className="text-xs text-neon-cyan">💬</span>}
        </div>
        <div
          className={`px-3 py-2 rounded-xl text-sm ${
            isMe
              ? 'bg-brand-600/60 text-white rounded-tr-sm'
              : 'bg-white/10 text-white rounded-tl-sm'
          } ${typeStyles[msg.type] || ''}`}
        >
          {msg.content}
        </div>
        <span className="text-xs text-white/20">
          {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
}
