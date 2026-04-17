import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useSpeech } from '../hooks/useSpeech';
import type { Room, Player, ChatMessage } from '../types';

interface Props {
  room:           Room;
  myId:           string;
  onSendMessage:  (content: string, targetId?: string, type?: 'question' | 'answer') => void;
  onMakeGuess:    (guess: string) => Promise<unknown>;
  onEndTurn:      () => void;
  onLeaveRoom:    () => void;
}

export default function GamePage({ room, myId, onSendMessage, onMakeGuess, onEndTurn, onLeaveRoom }: Props) {
  const [msgInput,       setMsgInput]       = useState('');
  const [guessInput,     setGuessInput]     = useState('');
  const [targetId,       setTargetId]       = useState<string | undefined>();
  const [msgType,        setMsgType]        = useState<'question' | 'answer'>('question');
  const [showGuessModal, setShowGuessModal] = useState(false);
  const [isGuessing,     setIsGuessing]     = useState(false);
  const [turnTime,       setTurnTime]       = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  const me                = room.players.find(p => p.id === myId);
  const isMyTurn          = room.currentTurnPlayerId === myId;
  const currentPlayer     = room.players.find(p => p.id === room.currentTurnPlayerId);
  const otherPlayers      = room.players.filter(p => p.id !== myId);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room.messages.length]);

  useEffect(() => {
    if (!room.turnStartTime || !room.settings.turnTimeLimitSec) return;
    const tick = () => setTurnTime(Math.ceil(Math.max(0,
      room.settings.turnTimeLimitSec - (Date.now() - room.turnStartTime!) / 1000
    )));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [room.turnStartTime, room.settings.turnTimeLimitSec]);

  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeech({
    onResult: (t) => { setMsgInput(t); inputRef.current?.focus(); },
    onError:  (e) => toast.error(e),
  });
  useEffect(() => { if (transcript) setMsgInput(transcript); }, [transcript]);

  const handleSend = (e: React.FormEvent) => {
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

  const timerColor =
    turnTime !== null && turnTime <= 10 ? '#ff453a' :
    turnTime !== null && turnTime <= 30 ? '#d4af37' :
    'rgba(235,235,245,0.40)';

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#000' }}>

      {/* ── Nav bar (Apple translucent) ── */}
      <div className="nav-bar px-4 py-0 flex items-center gap-3 shrink-0" style={{ height: 48 }}>
        <span className="text-headline text-white" style={{ letterSpacing: '-0.02em' }}>
          Head<span className="text-gold">Game</span>
        </span>
        <span style={{ color: 'rgba(84,84,88,0.65)', margin: '0 2px' }}>|</span>
        <span className="text-caption" style={{ color: 'rgba(235,235,245,0.40)' }}>
          第 {room.turnNumber} 轮
        </span>

        <div className="flex-1" />

        {/* Turn badge */}
        {currentPlayer && (
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-pill text-caption font-medium"
            style={isMyTurn ? {
              background: 'rgba(212,175,55,0.18)',
              color: '#ffd700',
              border: '1px solid rgba(212,175,55,0.45)',
            } : {
              background: 'rgba(118,118,128,0.16)',
              color: 'rgba(235,235,245,0.50)',
            }}
          >
            <span>{currentPlayer.avatar}</span>
            <span>{isMyTurn ? '你的回合' : `${currentPlayer.name} 的回合`}</span>
          </div>
        )}

        {/* Timer */}
        {turnTime !== null && (
          <span className="text-footnote font-mono font-semibold tabular-nums"
            style={{ color: timerColor, minWidth: 44, textAlign: 'right',
              ...(turnTime <= 10 ? { animation: 'none' } : {}) }}>
            {turnTime}s
          </span>
        )}

        <button onClick={onLeaveRoom} className="btn-chip ml-1">离开</button>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-hidden flex" style={{ minHeight: 0 }}>

        {/* Left: Players */}
        <div className="w-52 lg:w-60 flex flex-col overflow-hidden shrink-0 border-r separator">
          <div className="px-3 py-2.5 border-b separator">
            <p className="text-caption font-semibold" style={{ color: 'rgba(235,235,245,0.35)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              玩家
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {room.players.map((p) => (
              <PlayerCard
                key={p.id}
                player={p}
                isMe={p.id === myId}
                isCurrentTurn={p.id === room.currentTurnPlayerId}
                mode={room.settings.mode}
                maxLives={room.settings.maxLives}
              />
            ))}
          </div>

          {/* My status strip */}
          {me && (
            <div className="border-t separator p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{me.avatar}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-subhead font-medium text-white truncate">{me.name}</p>
                  <p className="text-caption" style={{ color: 'rgba(235,235,245,0.40)' }}>
                    {'❤️'.repeat(me.lives)}{'🖤'.repeat(Math.max(0, room.settings.maxLives - me.lives))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-headline font-bold text-gold">{me.score}</p>
                  <p className="text-caption" style={{ color: 'rgba(235,235,245,0.35)' }}>分</p>
                </div>
              </div>

              {!me.hasGuessed && me.lives > 0 && (
                <button onClick={() => setShowGuessModal(true)} className="btn-primary w-full py-2 text-sm">
                  我猜到了
                </button>
              )}
              {me.hasGuessed && me.lives > 0 && (
                <div className="text-center py-1.5 text-footnote" style={{ color: '#30d158' }}>
                  ✓ 已猜对，第 {me.guessRank} 名
                </div>
              )}
              {me.lives <= 0 && (
                <div className="text-center py-1.5 text-footnote" style={{ color: '#ff453a' }}>
                  已淘汰
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center: Chat */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ minWidth: 0 }}>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            <AnimatePresence initial={false}>
              {room.messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} myId={myId} />
              ))}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t separator px-4 py-3 shrink-0"
            style={{ background: 'rgba(28,28,30,0.85)', backdropFilter: 'blur(12px)' }}>

            {/* Type + target chips */}
            <div className="flex gap-2 mb-2.5 overflow-x-auto pb-0.5">
              <button onClick={() => setMsgType('question')}
                className={`btn-chip ${msgType === 'question' ? 'active' : ''}`}>
                ❓ 提问
              </button>
              <button onClick={() => setMsgType('answer')}
                className={`btn-chip ${msgType === 'answer' ? 'active' : ''}`}>
                💬 回答
              </button>
              <div className="w-px self-stretch" style={{ background: 'rgba(84,84,88,0.5)', margin: '0 2px' }} />
              <button onClick={() => setTargetId(undefined)}
                className={`btn-chip ${!targetId ? 'active' : ''}`}>
                全体
              </button>
              {otherPlayers.map((p) => (
                <button key={p.id}
                  onClick={() => setTargetId(p.id === targetId ? undefined : p.id)}
                  className={`btn-chip ${targetId === p.id ? 'active' : ''}`}>
                  {p.avatar} {p.name}
                </button>
              ))}
            </div>

            <form onSubmit={handleSend} className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  placeholder={
                    msgType === 'question'
                      ? isMyTurn ? '向大家提问…' : '等待轮到你…'
                      : '回答问题…'
                  }
                  maxLength={200}
                  className="game-input pr-10 text-body"
                />
                {isSupported && (
                  <button type="button"
                    onMouseDown={startListening} onMouseUp={stopListening}
                    onTouchStart={startListening} onTouchEnd={stopListening}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-lg transition-all"
                    style={{ color: isListening ? '#ff453a' : 'rgba(235,235,245,0.25)' }}
                    title="按住说话">
                    🎤
                  </button>
                )}
              </div>
              <button type="submit" disabled={!msgInput.trim()} className="btn-primary px-4 py-2">
                发送
              </button>
              {isMyTurn && (
                <button type="button" onClick={onEndTurn} className="btn-secondary px-3" title="跳过本轮">
                  ⏭
                </button>
              )}
            </form>

            {isListening && (
              <p className="text-caption text-center mt-1.5 animate-pulse" style={{ color: '#ff453a' }}>
                🎤 录音中，松开发送…
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Guess modal ── */}
      <AnimatePresence>
        {showGuessModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowGuessModal(false)}
          >
            <motion.div
              className="surface-2 shadow-card-lg w-full max-w-sm rounded-card overflow-hidden"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0,  opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-9 h-1 rounded-pill"
                  style={{ background: 'rgba(235,235,245,0.20)' }} />
              </div>

              <div className="px-5 pb-6 pt-2">
                <h3 className="text-title-2 font-semibold text-white text-center mb-1">猜测头顶内容</h3>
                <p className="text-footnote text-center mb-5" style={{ color: 'rgba(235,235,245,0.40)' }}>
                  输入你猜测的内容（文字或表情）
                </p>
                <input
                  type="text"
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
                  placeholder="你的猜测…"
                  autoFocus
                  className="game-input text-center mb-4"
                  style={{ fontSize: '1.25rem', letterSpacing: '0.02em' }}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowGuessModal(false); setGuessInput(''); }}
                    className="btn-secondary flex-1 py-3">
                    取消
                  </button>
                  <button
                    onClick={handleGuess}
                    disabled={!guessInput.trim() || isGuessing}
                    className="btn-primary flex-1 py-3">
                    {isGuessing ? '猜测中…' : '确认猜测'}
                  </button>
                </div>
                <p className="text-caption text-center mt-3"
                  style={{ color: 'rgba(235,235,245,0.25)' }}>
                  猜错扣 1 条命 −10 分
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Player card ── */
function PlayerCard({ player, isMe, isCurrentTurn, mode, maxLives }: {
  player: Player; isMe: boolean; isCurrentTurn: boolean;
  mode: 'text' | 'emoji'; maxLives: number;
}) {
  const eliminated = player.lives <= 0;

  return (
    <div
      className={`rounded-inner p-2.5 transition-all duration-300 ${eliminated ? 'opacity-40' : ''}`}
      style={isCurrentTurn ? {
        background: 'rgba(212,175,55,0.10)',
        border: '1px solid rgba(212,175,55,0.35)',
        borderRadius: 10,
        boxShadow: '0 0 12px rgba(212,175,55,0.15)',
      } : {
        background: 'rgba(118,118,128,0.10)',
        border: '1px solid rgba(84,84,88,0.30)',
        borderRadius: 10,
      }}
    >
      <div className="flex items-center gap-2">
        {/* Head item */}
        <div
          className="w-9 h-9 rounded-xs flex items-center justify-center text-lg font-bold shrink-0"
          style={{
            background: player.headItem && player.id !== (isMe ? player.id : '')
              ? 'rgba(212,175,55,0.10)'
              : 'rgba(84,84,88,0.20)',
            border: '1px solid rgba(84,84,88,0.35)',
            borderRadius: 8,
          }}
        >
          {player.headItem ? (
            mode === 'emoji'
              ? player.headEmoji
              : <span className="text-xs leading-tight px-0.5">{player.headItem}</span>
          ) : (
            <span style={{ color: 'rgba(235,235,245,0.20)', fontSize: '1rem' }}>?</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-lg leading-none">{player.avatar}</span>
            <span className="text-footnote font-medium text-white truncate">
              {player.name}
              {isMe && <span className="text-gold ml-1 text-caption"> 你</span>}
            </span>
          </div>
          <div className="flex items-center mt-0.5">
            <span className="text-caption" style={{ color: 'rgba(235,235,245,0.35)' }}>
              {'❤️'.repeat(player.lives)}{'🖤'.repeat(Math.max(0, maxLives - player.lives))}
            </span>
            <span className="ml-auto text-caption text-gold font-semibold">{player.score}</span>
          </div>
        </div>
      </div>

      {isCurrentTurn && !player.hasGuessed && player.lives > 0 && (
        <div className="mt-1.5 text-caption text-center py-0.5 rounded-pill"
          style={{ background: 'rgba(212,175,55,0.12)', color: '#d4af37' }}>
          当前回合
        </div>
      )}
      {player.hasGuessed && player.lives > 0 && (
        <div className="mt-1.5 text-caption text-center py-0.5 rounded-pill"
          style={{ background: 'rgba(48,209,88,0.12)', color: '#30d158' }}>
          ✓ 第 {player.guessRank} 名
        </div>
      )}
      {player.lives <= 0 && (
        <div className="mt-1.5 text-caption text-center py-0.5 rounded-pill"
          style={{ background: 'rgba(255,69,58,0.12)', color: '#ff453a' }}>
          已淘汰
        </div>
      )}
    </div>
  );
}

/* ── Message bubble ── */
function MessageBubble({ msg, myId }: { msg: ChatMessage; myId: string }) {
  const isMe     = msg.playerId === myId;
  const isSystem = msg.playerId === 'system';

  if (isSystem) {
    return (
      <motion.div className="flex justify-center py-0.5 msg-in"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <span className="text-caption px-3 py-1 rounded-pill"
          style={{
            background: 'rgba(212,175,55,0.10)',
            color: 'rgba(212,175,55,0.70)',
            border: '1px solid rgba(212,175,55,0.18)',
          }}>
          {msg.content}
        </span>
      </motion.div>
    );
  }

  // Special types
  const isSuccess = msg.type === 'guess_success';
  const isFail    = msg.type === 'guess_fail';

  return (
    <motion.div
      className={`flex gap-2 msg-in ${isMe ? 'flex-row-reverse' : ''}`}
      initial={{ opacity: 0, x: isMe ? 12 : -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18 }}
    >
      <span className="text-2xl shrink-0 mt-1 leading-none">{msg.playerAvatar}</span>

      <div className={`max-w-[72%] flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
        {/* Name + meta */}
        {!isMe && (
          <div className="flex items-center gap-1.5 px-1">
            <span className="text-caption font-medium" style={{ color: 'rgba(235,235,245,0.50)' }}>
              {msg.playerName}
            </span>
            {msg.targetPlayerName && (
              <span className="text-caption" style={{ color: 'rgba(235,235,245,0.25)' }}>
                → {msg.targetPlayerName}
              </span>
            )}
            {msg.type === 'question' && (
              <span className="text-caption text-gold opacity-70">问</span>
            )}
          </div>
        )}

        {/* Bubble */}
        <div
          className="px-3.5 py-2 text-body"
          style={
            isSuccess ? {
              background: 'rgba(48,209,88,0.14)',
              border: '1px solid rgba(48,209,88,0.30)',
              color: '#fff',
              borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            } : isFail ? {
              background: 'rgba(255,69,58,0.12)',
              border: '1px solid rgba(255,69,58,0.28)',
              color: '#fff',
              borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            } : isMe ? {
              background: 'rgba(212,175,55,0.22)',
              border: '1px solid rgba(212,175,55,0.25)',
              color: '#fff',
              borderRadius: '18px 18px 4px 18px',
            } : {
              background: '#2c2c2e',
              color: '#fff',
              borderRadius: '18px 18px 18px 4px',
            }
          }
        >
          {msg.content}
        </div>

        <span className="px-1 text-caption"
          style={{ color: 'rgba(235,235,245,0.20)' }}>
          {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
}
