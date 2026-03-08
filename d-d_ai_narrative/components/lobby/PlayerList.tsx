'use client';

import { Crown, User, AlertCircle, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRoomPlayers } from '@/hooks/useRoomPlayers';
import type { SSEPlayer } from '@/lib/sse/sseManager';

interface PlayerListProps {
  roomCode: string;
  currentUserId: string;
  maxPlayers: number;
}

export function PlayerList({ roomCode, currentUserId, maxPlayers }: PlayerListProps) {
  const { players, status, error } = useRoomPlayers(roomCode);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
        <h3 className="text-xl font-black text-white uppercase italic tracking-tight">
          Confrérie ({players.length}/{maxPlayers})
        </h3>
        <ConnectionBadge status={status} />
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-900/30 rounded-lg px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
            <AlertCircle size={12} />
            {error}
          </p>
        </div>
      )}

      {players.map((player) => (
        <PlayerCard
          key={player.userId}
          player={player}
          isCurrentUser={player.userId === currentUserId}
        />
      ))}

      {Array.from({ length: Math.max(0, Math.min(maxPlayers - players.length, 4)) }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className="p-4 bg-black/10 rounded-xl border border-dashed border-white/5 flex items-center gap-3 text-gray-800"
        >
          <div className="w-10 h-10 rounded-lg border border-dashed border-white/5 flex items-center justify-center">
            <User size={16} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest italic">
            {"En attente d'un héros..."}
          </p>
        </div>
      ))}

      <div className="mt-8 pt-6 border-t border-white/5 space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">
          Invitez vos alliés
        </p>
        <p className="text-[10px] text-gray-700 font-sans leading-relaxed">
          Partagez le code{' '}
          <span className="font-mono text-red-700 font-bold">{roomCode}</span>
          {' '}ou le lien pour rejoindre.
        </p>
      </div>
    </div>
  );
}

function PlayerCard({ player, isCurrentUser }: { player: SSEPlayer; isCurrentUser: boolean }) {
  return (
    <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shadow-lg ${
            player.isHost ? 'bg-red-900/40 border-red-900/20' : 'bg-white/5 border-white/10'
          }`}>
            {player.isHost
              ? <Crown size={18} className="text-red-500" />
              : <User size={18} className="text-gray-500" />
            }
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              {player.username}
              {isCurrentUser && (
                <span className="text-gray-500 font-normal text-xs ml-1">(Vous)</span>
              )}
            </p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              {player.isHost ? 'Host' : 'Joueur'}
            </p>
          </div>
        </div>
        <Badge className="text-[9px] font-black uppercase bg-white/5 text-gray-500 border border-white/10 hover:bg-white/5">
          En ligne
        </Badge>
      </div>

      <div className={`flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-dashed ${
        player.characterId ? 'border-green-900/30 text-green-600' : 'border-white/10 text-gray-600'
      }`}>
        <AlertCircle size={14} />
        <p className="text-[10px] font-bold uppercase tracking-wide italic">
          {player.characterId ? 'Héros choisi' : 'Destin non scellé'}
        </p>
      </div>
    </div>
  );
}

type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'error';

function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  const config: Record<ConnectionStatus, { icon: React.ReactNode; label: string; color: string }> = {
    connecting:   { icon: <Loader2 size={12} className="animate-spin" />, label: 'Connexion...', color: 'text-yellow-500' },
    connected:    { icon: <Wifi size={12} />,                             label: 'En direct',    color: 'text-green-500' },
    reconnecting: { icon: <Loader2 size={12} className="animate-spin" />, label: 'Reconnexion', color: 'text-yellow-500' },
    error:        { icon: <WifiOff size={12} />,                          label: 'Déconnecté',   color: 'text-red-500' },
  };

  const { icon, label, color } = config[status];

  return (
    <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${color}`}>
      {icon}
      {label}
    </div>
  );
}
