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
    <div className="min-h-screen bg-game-gradient bg-grid bg-stars relative overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-800/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold-600/10 rounded-full blur-3xl" />
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-neon-amber/[0.08] rounded-full blur-3xl" />
      </div>

      {/* Connection status */}
      <div className="fixed top-3 right-3 z-50 flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full transition-colors ${
          reconnecting ? 'bg-gold-400 animate-pulse' :
          isConnected  ? 'bg-neon-green animate-pulse' : 'bg-red-500'
        }`} />
        <span className="text-xs text-white/40">
          {reconnecting ? '重新连接中…' : isConnected ? '已连接' : '连接中…'}
        </span>
      </div>

      {/* Reconnecting overlay */}
      <AnimatePresence>
        {reconnecting && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="glass neon-border rounded-2xl px-8 py-6 text-center">
              <div className="text-4xl mb-3 animate-bounce">🔄</div>
              <p className="text-white font-semibold">正在重新连接房间…</p>
              <p className="text-white/40 text-sm mt-1">请稍候</p>
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
