import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { useSocket } from './hooks/useSocket';
import type { Room, AppPage } from './types';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import ResultsPage from './pages/ResultsPage';

const pageVariants = {
  initial: { opacity: 0, scale: 0.96, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.96, y: -20, transition: { duration: 0.3, ease: 'easeIn' } },
};

export default function App() {
  const [page, setPage] = useState<AppPage>('home');
  const [room, setRoom] = useState<Room | null>(null);
  const [myId, setMyId] = useState<string>('');
  const { socket, isConnected, emit, on, off } = useSocket();

  useEffect(() => {
    if (socket) setMyId(socket.id || '');
  }, [socket]);

  useEffect(() => {
    const unsubId = on('connect', () => {
      setMyId((socket as any)?.id || '');
    });
    return () => { if (typeof unsubId === 'function') unsubId(); };
  }, [on, socket]);

  useEffect(() => {
    const handleRoomUpdate = ({ room: updatedRoom }: { room: Room }) => {
      setRoom(updatedRoom);
      if (updatedRoom.state === 'playing' && page !== 'game') {
        setPage('game');
      }
      if (updatedRoom.state === 'finished' && page !== 'results') {
        setPage('results');
      }
    };

    const unsub = on('room_updated', handleRoomUpdate as (...args: unknown[]) => void);
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [on, page]);

  const handleCreateRoom = useCallback(
    async (playerName: string, avatar: string) => {
      const res = await emit<{ success: boolean; room?: Room; error?: string }>(
        'create_room',
        { playerName, avatar }
      );
      if (res.success && res.room) {
        setRoom(res.room);
        setPage('lobby');
      } else {
        toast.error(res.error || '创建房间失败');
      }
    },
    [emit]
  );

  const handleJoinRoom = useCallback(
    async (roomCode: string, playerName: string, avatar: string) => {
      const res = await emit<{ success: boolean; room?: Room; error?: string }>(
        'join_room',
        { roomCode, playerName, avatar }
      );
      if (res.success && res.room) {
        setRoom(res.room);
        setPage('lobby');
      } else {
        toast.error(res.error || '加入房间失败');
      }
    },
    [emit]
  );

  const handleLeaveRoom = useCallback(async () => {
    await emit('leave_room');
    setRoom(null);
    setPage('home');
  }, [emit]);

  const handleStartGame = useCallback(
    async (settings: Room['settings']) => {
      const res = await emit<{ success: boolean; error?: string }>(
        'start_game',
        { settings }
      );
      if (!res.success) {
        toast.error(res.error || '开始游戏失败');
      }
    },
    [emit]
  );

  const handleSendMessage = useCallback(
    async (content: string, targetPlayerId?: string, type: 'question' | 'answer' = 'question') => {
      await emit('send_message', { content, targetPlayerId, type });
    },
    [emit]
  );

  const handleMakeGuess = useCallback(
    async (guess: string) => {
      const res = await emit<{ success: boolean; correct?: boolean; error?: string; gameOver?: boolean }>(
        'make_guess',
        { guess }
      );
      if (!res.success) {
        toast.error(res.error || '猜测失败');
      } else if (res.correct) {
        toast.success('猜对了！🎉', { duration: 3000 });
      } else {
        toast.error('猜错了，再想想！', { duration: 2000 });
      }
      return res;
    },
    [emit]
  );

  const handleEndTurn = useCallback(async () => {
    await emit('end_turn');
  }, [emit]);

  const handleUpdateSettings = useCallback(
    async (settings: Partial<Room['settings']>) => {
      await emit('update_settings', settings);
    },
    [emit]
  );

  const handlePlayAgain = useCallback(() => {
    setPage('lobby');
    // Reset room state back to lobby
    if (room) {
      setRoom({ ...room, state: 'lobby', messages: [] });
    }
  }, [room]);

  return (
    <div className="min-h-screen bg-game-gradient bg-grid bg-stars relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-700/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-pink/10 rounded-full blur-3xl" />
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-neon-cyan/10 rounded-full blur-3xl" />
      </div>

      {/* Connection status */}
      <div className="fixed top-3 right-3 z-50 flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-neon-green animate-pulse' : 'bg-red-500'}`} />
        <span className="text-xs text-white/50">{isConnected ? '已连接' : '连接中...'}</span>
      </div>

      <AnimatePresence mode="wait">
        {page === 'home' && (
          <motion.div key="home" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <HomePage
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
              isConnected={isConnected}
            />
          </motion.div>
        )}
        {page === 'lobby' && room && (
          <motion.div key="lobby" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <LobbyPage
              room={room}
              myId={myId}
              onStartGame={handleStartGame}
              onLeaveRoom={handleLeaveRoom}
              onUpdateSettings={handleUpdateSettings}
            />
          </motion.div>
        )}
        {page === 'game' && room && (
          <motion.div key="game" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <GamePage
              room={room}
              myId={myId}
              onSendMessage={handleSendMessage}
              onMakeGuess={handleMakeGuess}
              onEndTurn={handleEndTurn}
              onLeaveRoom={handleLeaveRoom}
            />
          </motion.div>
        )}
        {page === 'results' && room && (
          <motion.div key="results" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <ResultsPage
              room={room}
              myId={myId}
              onPlayAgain={handlePlayAgain}
              onLeaveRoom={handleLeaveRoom}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
