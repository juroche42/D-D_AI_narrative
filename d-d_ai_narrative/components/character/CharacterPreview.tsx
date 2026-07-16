import { User } from 'lucide-react';

const STAT_LABELS = [
  { key: 'strength', label: 'FOR' },
  { key: 'dexterity', label: 'DEX' },
  { key: 'constitution', label: 'CON' },
  { key: 'intelligence', label: 'INT' },
  { key: 'wisdom', label: 'SAG' },
  { key: 'charisma', label: 'CHA' },
] as const;

interface CharacterPreviewProps {
  name: string;
  raceName: string;
  className: string;
  stats: Record<string, number>;
}

export function CharacterPreview({ name, raceName, className, stats }: CharacterPreviewProps) {
  return (
    <div className="flex items-center justify-between gap-6 bg-[#0f0f12] rounded-2xl p-5 border border-white/5">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-14 h-14 flex-shrink-0 bg-red-900/40 rounded-xl flex items-center justify-center border border-red-900/30">
          <User className="text-red-500" size={24} />
        </div>
        <div className="min-w-0">
          <p className="font-black text-white text-xl truncate">{name || '—'}</p>
          <p className="text-xs text-gray-500 uppercase tracking-widest">
            {raceName} {className}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 flex-shrink-0">
        {STAT_LABELS.map(({ key, label }) => (
          <div
            key={key}
            className="flex flex-col items-center bg-[#1a1a1f] rounded-lg px-3 py-2 min-w-[48px]"
          >
            <span className="text-[10px] font-black text-gray-500 tracking-wider">{label}</span>
            <span className="text-base font-black text-white">{stats[key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
