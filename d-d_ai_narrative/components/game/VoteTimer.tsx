'use client';

import { Clock } from 'lucide-react';

interface VoteTimerProps {
  secondsLeft: number;
  progress:    number;  // 1.0 → 0.0
  isExpired:   boolean;
}

export function VoteTimer({ secondsLeft, progress, isExpired }: VoteTimerProps) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const display = `${minutes}:${String(seconds).padStart(2, '0')}`;

  const colorClass =
    isExpired || secondsLeft <= 15 ? 'text-red-500'
    : secondsLeft <= 30            ? 'text-orange-400'
    : 'text-gray-500';

  const barClass =
    isExpired || secondsLeft <= 15 ? 'bg-red-600'
    : secondsLeft <= 30            ? 'bg-orange-500'
    : 'bg-gray-500';

  return (
    <div className="flex flex-col gap-1 min-w-[64px]">
      <div className={`flex items-center gap-1.5 ${colorClass}`}>
        <Clock size={12} />
        <span className="text-[10px] font-black uppercase tracking-widest font-mono">
          {display}
        </span>
      </div>
      <div className="h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-none ${barClass}`}
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  );
}
