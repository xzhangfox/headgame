import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useSocket } from './hooks/useSocket';
import type { Room, AppPage } from './types';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import ResultsPage from './pages/ResultsPage';

// ── Session persistence ───────────────────────────────────────────────────────
const SESSION_KEYS = {
  roomCode:   'hg_room_code',
  playerName: 'hg_player_name',
  avatar:     'hg_avatar',
} as const;

function saveSession(roomCode: string, playerName: string, avatar: string) {
  localStorage.setItem(SESSION_KEYS.roomCode,   roomCode);
  localStorage.setItem(SESSION_KEYS.playerName, playerName);
  localStorage.setItem(SESSION_KEYS.avatar,     avatar);
}

function loadSession() {
  return {
    roomCode:   localStorage.getItem(SESSION_KEYS.roomCode)   ?? '',
    playerName: localStorage.getItem(SESSION_KEYS.playerName) ?? '',
    avatar:     localStorage.getItem(SESSION_KEYS.avatar)     ?? '',
  };
}

function clearSession() {
  Object.values(SESSION_KEYS).forEach(k => localStorage.removeItem(k));
}

// ── Page transition ───────────────────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, scale: 0.96, y: 20 },
  animate: { opacity: 1, scale: 1,    y: 0,  transition: { duration: 0.4, ease: 'easeOut' } },
  exit:    { opacity: 0, scale: 0.96, y: -20, transition: { duration: 0.3, ease: 'easeIn'  } },
};

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]     = useState<AppPage>('home');
  const [room, setRoom]     = useState<Room | null>(null);
  const [myId, setMyId]     = useState('');
  const [reconnecting, setReconnecting] = useState(false);
  const pageRef = useRef<AppPage>('home');

  const { socket, isConnected, emit, on } = useSocket();

  // Keep pageRef in sync so the connect handler can read the latest value
  useEffect(() => { pageRef.current = page; }, [page]);

  // Update myId whenever the socket connects
  useEffect(() => {
    if (socket?.id) setMyId(socket.id);
  }, [socket?.id, isConnected]);

  // ── Auto-reconnect on socket (re)connect ──────────────────────────────────
  useEffect(() => {
    const handleConnect = async () => {
      const newId = (socket as any)?.id ?? '';
      setMyId(newId);

      const { roomCode, playerName, avatar } = loadSession();
      if (!roomCode || !playerName || !avatar) return;

      // Only attempt reconnect if we're not already in a room (avoids re-running on first connect
      // when user is already in the flow) OR if the socket just reconnected mid-session.
      setReconnecting(true);
      try {
        const res = await emit<{ success: boolean; room?: Room; error?: string }>(
          'reconnect_room', { roomCode, playerName, avatar }
        );

        if (res.success && res.room) {
          setRoom(res.room);
          const targetPage: AppPage =
            res.room.state === 'playing'  ? 'game'    :
            res.room.state === 'finished' ? 'results' : 'lobby';
          setPage(targetPage);
          toast.success('已重新连接到房间 ✦');
        } else {
          // Room gone or player evicted — clear session and show home
          clearSession();
          setRoom(null);
          setPage('home');
          if (pageRef.current !== 'home') {
            toast.error(res.error || '房间已解散，请重新加入');
          }
        }
      } catch {
        clearSession();
        setRoom(null);
        setPage('home');
      } finally {
        setReconnecting(false);
      }
    };

    const unsub = on('connect', handleConnect as (...args: unknown[]) => void);
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [on, emit, socket]);

  // ── Room updates from server ──────────────────────────────────────────────
  useEffect(() => {
    const handleRoomUpdate = ({ room: r }: { room: Room }) => {
      setRoom(r);
      if (r.state === 'playing'  && pageRef.current !== 'game')    setPage('game');
      if (r.state === 'finished' && pageRef.current !== 'results') setPage('results');
    };
    const handleRoomDestroyed = () => {
      clearSession();
      setRoom(null);
      setPage('home');
      toast.error('房间已解散');
    };

    const u1 = on('room_updated',  handleRoomUpdate    as (...args: unknown[]) => void);
    const u2 = on('room_destroyed', handleRoomDestroyed as (...args: unknown[]) => void);
    return () => {
      if (typeof u1 === 'function') u1();
      if (typeof u2 === 'function') u2();
    };
  }, [on]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleCreateRoom = useCallback(async (playerName: string, avatar: string) => {
    const res = await emit<{ success: boolean; room?: Room; error?: string }>(
      'create_room', { playerName, avatar }
    );
    if (res.success && res.room) {
      saveSession(res.room.code, playerName, avatar);
      setRoom(res.room);
      setPage('lobby');
    } else {
      toast.error(res.error || '创建房间失败');
    }
  }, [emit]);

  const handleJoinRoom = useCallback(async (roomCode: string, playerName: string, avatar: string) => {
    const res = await emit<{ success: boolean; room?: Room; error?: string }>(
      'join_room', { roomCode, playerName, avatar }
    );
    if (res.success && res.room) {
      saveSession(roomCode, playerName, avatar);
      setRoom(res.room);
      setPage('lobby');
    } else {
      toast.error(res.error || '加入房间失败');
    }
  }, [emit]);

  const handleLeaveRoom = useCallback(async () => {
    clearSession();           // Intentional leave — clear session immediately
    await emit('leave_room');
    setRoom(null);
    setPage('home');
  }, [emit]);

  const handleStartGame = useCallback(async (settings: Room['settings']) => {
    const res = await emit<{ success: boolean; error?: string }>('start_game', { settings });
    if (!res.success) toast.error(res.error || '开始游戏失败');
  }, [emit]);

  const handleSendMessage = useCallback(async (
    content: string, targetPlayerId?: string, type: 'question' | 'answer' = 'question'
  ) => {
    await emit('send_message', { content, targetPlayerId, type });
  }, [emit]);

  const handleMakeGuess = useCallback(async (guess: string) => {
    const res = await emit<{ success: boolean; correct?: boolean; error?: string; gameOver?: boolean }>(
      'make_guess', { guess }
    );
    if (!res.success) { toast.error(res.error || '猜测失败'); }
    else if (res.correct) { toast.success('猜对了！🎉', { duration: 3000 }); }
    else { toast.error('猜错了，再想想！', { duration: 2000 }); }
    return res;
  }, [emit]);

  const handleEndTurn = useCallback(async () => {
    await emit('end_turn');
  }, [emit]);

  const handleUpdateSettings = useCallback(async (settings: Partial<Room['settings']>) => {
    await emit('update_settings', settings);
  }, [emit]);

  const handlePlayAgain = useCallback(() => {
    setPage('lobby');
    if (room) setRoom({ ...room, state: 'lobby', messages: [] });
  }, [room]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen relative" style={{ background: '#000' }}>
      {/* Subtle ambient — very restrained */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(212,175,55,0.07) 0%, transparent 70%)' }} />
      </div>

      {/* Connection pill */}
      <div className="fixed top-3 right-3 z-50 flex items-center gap-1.5 px-2.5 py-1 rounded-pill"
        style={{ background: 'rgba(28,28,30,0.85)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(84,84,88,0.4)' }}>
        <div className={`w-1.5 h-1.5 rounded-full transition-colors ${
          reconnecting ? 'bg-yellow-400 animate-pulse' :
          isConnected  ? 'bg-neon-green animate-pulse' : 'bg-neon-red'
        }`} />
        <span className="text-caption" style={{ color: 'rgba(235,235,245,0.45)' }}>
          {reconnecting ? '重连中…' : isConnected ? '已连接' : '连接中…'}
        </span>
      </div>

      {/* Reconnecting overlay */}
      <AnimatePresence>
        {reconnecting && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="surface-2 shadow-card-lg rounded-card px-10 py-8 text-center">
              <div className="text-4xl mb-4 animate-bounce">🔄</div>
              <p className="text-headline text-white font-semibold">正在重新连接房间…</p>
              <p className="text-footnote mt-1" style={{ color: 'rgba(235,235,245,0.40)' }}>请稍候</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {page === 'home' && (
          <motion.div key="home" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <HomePage onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} isConnected={isConnected} />
          </motion.div>
        )}
        {page === 'lobby' && room && (
          <motion.div key="lobby" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <LobbyPage room={room} myId={myId} onStartGame={handleStartGame}
              onLeaveRoom={handleLeaveRoom} onUpdateSettings={handleUpdateSettings} />
          </motion.div>
        )}
        {page === 'game' && room && (
          <motion.div key="game" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <GamePage room={room} myId={myId} onSendMessage={handleSendMessage}
              onMakeGuess={handleMakeGuess} onEndTurn={handleEndTurn} onLeaveRoom={handleLeaveRoom} />
          </motion.div>
        )}
        {page === 'results' && room && (
          <motion.div key="results" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <ResultsPage room={room} myId={myId} onPlayAgain={handlePlayAgain} onLeaveRoom={handleLeaveRoom} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
