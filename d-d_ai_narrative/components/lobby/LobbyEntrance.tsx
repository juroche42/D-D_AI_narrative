'use client';

import { useState, useTransition } from 'react';
import { Loader2, Plus, Users, ArrowRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createRoomAction, joinRoomAction } from '@/app/(lobby)/lobby/actions';
import { Input } from '@/components/ui/input';

interface LobbyEntranceProps {
  username: string;
}

export function LobbyEntrance({ username }: LobbyEntranceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isPendingCreate, startCreate] = useTransition();
  const [isPendingJoin, startJoin] = useTransition();
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);

  const urlError = searchParams.get('error');

  const handleCreate = () => {
    setCreateError(null);
    startCreate(async () => {
      const result = await createRoomAction();
      if (!result.success || !result.room) {
        setCreateError(result.error ?? 'Une erreur est survenue');
        return;
      }
      router.push(`/lobby/${result.room.code}`);
    });
  };

  const handleJoin = () => {
    if (!joinCode.trim()) {
      setJoinError("Saisissez un code d'invitation");
      return;
    }
    setJoinError(null);
    startJoin(async () => {
      const result = await joinRoomAction(joinCode);
      if (!result.success || !result.room) {
        setJoinError(result.error ?? 'Impossible de rejoindre ce salon');
        return;
      }
      router.push(`/lobby/${result.room.code}`);
    });
  };

  return (
    <div className="max-w-xl mx-auto mt-20 text-center space-y-8 animate-in fade-in duration-700">
      <div className="space-y-3">
        <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter">
          {"Salon d'attente"}
        </h2>
        <p className="text-gray-400 font-sans text-sm leading-relaxed">
          {"Préparez votre groupe avant de plonger dans l'abysse."}
        </p>
      </div>

      {urlError && (
        <div className="bg-red-900/20 border border-red-900/40 rounded-xl px-4 py-3 animate-in fade-in">
          <p className="text-xs font-black uppercase tracking-widest text-red-400">{urlError}</p>
        </div>
      )}

      {createError && (
        <div className="bg-red-900/20 border border-red-900/40 rounded-xl px-4 py-3 animate-in fade-in">
          <p className="text-xs font-black uppercase tracking-widest text-red-400">{createError}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Créer un salon */}
        <button
          onClick={handleCreate}
          disabled={isPendingCreate || isPendingJoin}
          className="flex flex-col items-center justify-center gap-3 py-10 px-6 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-lg shadow-red-600/20 active:scale-95"
        >
          {isPendingCreate ? <Loader2 size={28} className="animate-spin" /> : <Plus size={28} />}
          {isPendingCreate ? 'Création...' : 'Créer un Salon'}
        </button>

        {/* Rejoindre */}
        <button
          onClick={() => { setShowJoinInput(!showJoinInput); setJoinError(null); }}
          disabled={isPendingCreate || isPendingJoin}
          className="flex flex-col items-center justify-center gap-3 py-10 px-6 bg-transparent border border-white/20 hover:border-white/40 hover:bg-white/5 text-gray-300 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Users size={28} />
          Rejoindre
        </button>
      </div>

      {showJoinInput && (
        <div className="bg-[#16161a] border border-white/10 rounded-2xl p-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <p className="text-xs font-black uppercase tracking-widest text-gray-500">
            Code d&apos;invitation
          </p>

          <div className="flex gap-3">
            <Input
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase().slice(0, 6));
                setJoinError(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder="EX: X4K9PZ"
              maxLength={6}
              className="font-mono font-black text-lg tracking-widest text-center bg-black/40 border-white/10 text-white placeholder:text-gray-700 focus:border-red-700 focus:ring-red-900/30 uppercase h-14"
              autoFocus
            />
            <button
              onClick={handleJoin}
              disabled={isPendingJoin || joinCode.length < 6}
              className="px-6 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isPendingJoin
                ? <Loader2 size={16} className="animate-spin" />
                : <ArrowRight size={16} />
              }
              {isPendingJoin ? '' : 'Go'}
            </button>
          </div>

          {joinError && (
            <p className="text-xs font-black uppercase tracking-widest text-red-500 animate-in fade-in">
              {joinError}
            </p>
          )}
        </div>
      )}

      <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">
        Connecté en tant que <span className="text-red-700">{username}</span>
      </p>
    </div>
  );
}
