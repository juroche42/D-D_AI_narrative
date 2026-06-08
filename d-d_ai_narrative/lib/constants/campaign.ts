export const THEME_CONFIG = {
  HEROIC:        { label: 'Héroïque',     color: 'text-yellow-500', bg: 'bg-yellow-950/20 border-yellow-900/30', bar: 'bg-yellow-600/60', accent: 'from-yellow-950/30' },
  HORROR:        { label: 'Horreur',      color: 'text-red-500',    bg: 'bg-red-950/20    border-red-900/30',    bar: 'bg-red-600/60',    accent: 'from-red-950/30' },
  MYSTERY:       { label: 'Mystère',      color: 'text-purple-400', bg: 'bg-purple-950/20 border-purple-900/30', bar: 'bg-purple-600/60', accent: 'from-purple-950/30' },
  INVESTIGATION: { label: 'Investigation',color: 'text-blue-400',   bg: 'bg-blue-950/20   border-blue-900/30',   bar: 'bg-blue-600/60',   accent: 'from-blue-950/30' },
} as const;

export const DIFFICULTY_CONFIG = {
  EASY:   { label: 'Facile',    color: 'text-green-500',  desc: "Idéal pour découvrir le JDR. L'IA guide et pardonne les erreurs." },
  MEDIUM: { label: 'Moyen',     color: 'text-yellow-500', desc: 'Quelques sessions de JDR recommandées. Tactique et roleplay requis.' },
  HARD:   { label: 'Difficile', color: 'text-red-500',    desc: 'Joueurs expérimentés. La mort est permanente, chaque décision compte.' },
} as const;

export type CampaignThemeKey = keyof typeof THEME_CONFIG;
export type CampaignDifficultyKey = keyof typeof DIFFICULTY_CONFIG;
