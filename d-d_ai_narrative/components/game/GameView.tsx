'use client';

import { useEffect } from 'react';
import { Loader2, Swords } from 'lucide-react';
import { useNarrativeStream } from '@/hooks/useNarrativeStream';

interface GameViewProps {
  roomCode: string;
  roomName: string;
}

export function GameView({ roomCode, roomName }: GameViewProps) {
  const { text, status, error, startStream } = useNarrativeStream();

  useEffect(() => {
    startStream(roomCode);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  return (
    <div className="min-h-screen bg-[#0d0d10] flex flex-col">

      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center gap-3">
        <Swords size={18} className="text-red-600" />
        <h1 className="text-sm font-black uppercase italic tracking-widest text-white">
          {roomName}
        </h1>
        <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-green-500 border border-green-900/40 bg-green-950/20 px-2 py-0.5 rounded">
          En cours
        </span>
      </header>

      {/* Narration area */}
      <main className="flex-1 flex flex-col items-center justify-start px-6 py-12 max-w-3xl mx-auto w-full">

        {status === 'idle' && (
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-xs font-black uppercase tracking-widest">Initialisation...</span>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-6 text-center">
            <p className="text-xs font-black uppercase tracking-widest text-red-500">{error}</p>
          </div>
        )}

        {(status === 'streaming' || status === 'done') && (
          <div className="w-full space-y-6">
            <div className="bg-[#16161a] border border-white/5 rounded-2xl p-8 shadow-xl">
              <p className="text-sm font-sans text-gray-300 leading-relaxed whitespace-pre-wrap">
                {text}
                {status === 'streaming' && (
                  <span className="inline-block w-0.5 h-4 bg-red-500 ml-0.5 animate-pulse align-middle" />
                )}
              </p>
            </div>

            {status === 'done' && (
              <p className="text-center text-[9px] font-black uppercase tracking-widest text-gray-700">
                — Fin de l&apos;introduction —
              </p>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
