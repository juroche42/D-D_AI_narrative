'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useTransition, useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface CampaignFiltersBarProps {
  initialTheme?: string;
  initialDifficulty?: string;
  initialSearch?: string;
}

const THEMES = [
  { value: 'HEROIC',        label: 'Héroïque' },
  { value: 'HORROR',        label: 'Horreur' },
  { value: 'MYSTERY',       label: 'Mystère' },
  { value: 'INVESTIGATION', label: 'Investigation' },
];

const DIFFICULTIES = [
  { value: 'EASY',   label: 'Facile',    color: 'text-green-500' },
  { value: 'MEDIUM', label: 'Moyen',     color: 'text-yellow-500' },
  { value: 'HARD',   label: 'Difficile', color: 'text-red-500' },
];

export function CampaignFiltersBar({
  initialTheme,
  initialDifficulty,
  initialSearch = '',
}: CampaignFiltersBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);

  const updateParams = useCallback((updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');

    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [router, pathname, searchParams]);

  const handleSearchSubmit = () => {
    updateParams({ search: search || undefined });
  };

  const clearAll = () => {
    setSearch('');
    startTransition(() => router.push(pathname));
  };

  const hasActiveFilters = initialTheme || initialDifficulty || initialSearch;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">

        <div className="relative flex-grow">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
            onBlur={handleSearchSubmit}
            placeholder="Rechercher une campagne..."
            className="pl-9 bg-black/30 border-white/10 text-white placeholder:text-gray-700 focus:border-red-800 focus:ring-red-900/20 font-sans"
          />
          {isPending && (
            <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 animate-spin" />
          )}
        </div>

        <Select
          value={initialTheme ?? 'all'}
          onValueChange={(v) => updateParams({ theme: v === 'all' ? undefined : v })}
        >
          <SelectTrigger className="w-full sm:w-48 bg-black/30 border-white/10 text-white font-black uppercase tracking-widest text-xs">
            <SelectValue placeholder="Tous les thèmes" />
          </SelectTrigger>
          <SelectContent className="bg-[#16161a] border-white/10">
            <SelectItem value="all" className="text-gray-400 font-black uppercase tracking-widest text-xs">
              Tous les thèmes
            </SelectItem>
            {THEMES.map((t) => (
              <SelectItem key={t.value} value={t.value} className="text-white font-bold text-xs">
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={initialDifficulty ?? 'all'}
          onValueChange={(v) => updateParams({ difficulty: v === 'all' ? undefined : v })}
        >
          <SelectTrigger className="w-full sm:w-44 bg-black/30 border-white/10 text-white font-black uppercase tracking-widest text-xs">
            <SelectValue placeholder="Toutes difficultés" />
          </SelectTrigger>
          <SelectContent className="bg-[#16161a] border-white/10">
            <SelectItem value="all" className="text-gray-400 font-black uppercase tracking-widest text-xs">
              Toutes difficultés
            </SelectItem>
            {DIFFICULTIES.map((d) => (
              <SelectItem key={d.value} value={d.value} className={`font-bold text-xs ${d.color}`}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-4 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-red-500 border border-white/10 hover:border-red-900/40 rounded-lg transition-colors whitespace-nowrap"
          >
            <X size={12} />
            Tout effacer
          </button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {initialTheme && (
            <Badge className="bg-red-900/20 text-red-400 border border-red-900/30 font-black uppercase tracking-widest text-[9px]">
              {THEMES.find((t) => t.value === initialTheme)?.label}
            </Badge>
          )}
          {initialDifficulty && (
            <Badge className="bg-white/5 text-gray-400 border border-white/10 font-black uppercase tracking-widest text-[9px]">
              {DIFFICULTIES.find((d) => d.value === initialDifficulty)?.label}
            </Badge>
          )}
          {initialSearch && (
            <Badge className="bg-white/5 text-gray-400 border border-white/10 font-black uppercase tracking-widest text-[9px]">
              &quot;{initialSearch}&quot;
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
