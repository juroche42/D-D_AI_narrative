'use client';

import { Clock, Swords, CheckCircle } from 'lucide-react';

interface RoomStatusBadgeProps {
  status: string;
  size?: 'sm' | 'lg';
}

const STATUS_CONFIG = {
  WAITING: {
    label: 'En préparation',
    icon: Clock,
    classes: 'bg-yellow-950/30 border-yellow-900/40 text-yellow-500',
  },
  IN_PROGRESS: {
    label: 'En cours',
    icon: Swords,
    classes: 'bg-green-950/30 border-green-900/40 text-green-500',
  },
  FINISHED: {
    label: 'Terminée',
    icon: CheckCircle,
    classes: 'bg-white/5 border-white/10 text-gray-500',
  },
} as const;

export function RoomStatusBadge({ status, size = 'sm' }: RoomStatusBadgeProps) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.WAITING;
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-black uppercase tracking-widest ${config.classes} ${
        size === 'lg' ? 'text-xs' : 'text-[10px]'
      }`}
    >
      <Icon size={size === 'lg' ? 14 : 11} />
      {config.label}
    </div>
  );
}
