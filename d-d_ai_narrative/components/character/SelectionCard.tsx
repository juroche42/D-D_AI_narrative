interface SelectionCardProps {
  name: string;
  description: string;
  tag: string;
  isSelected: boolean;
  onClick: () => void;
}

export function SelectionCard({ name, description, tag, isSelected, onClick }: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        text-left rounded-2xl py-7 px-6 space-y-3 border transition-all duration-200
        ${isSelected
          ? 'border-red-600 shadow-[inset_0_0_0_1px_rgb(220,38,38)] bg-[#1f1618]'
          : 'bg-[#1a1a1f] border-white/10 hover:border-white/25'}
      `}
    >
      <p className="text-lg font-black text-white tracking-wide uppercase">{name}</p>
      <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
      <p className="text-xs font-black text-red-500 tracking-widest uppercase">{tag}</p>
    </button>
  );
}
