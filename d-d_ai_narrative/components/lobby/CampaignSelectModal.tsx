'use client';

import { useState, useEffect, useTransition } from 'react';
import { X, Search, Crown, Swords, Clock, Users, Check, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { selectCampaignAction } from '@/app/(lobby)/lobby/actions';
import { THEME_CONFIG, DIFFICULTY_CONFIG, type CampaignThemeKey, type CampaignDifficultyKey } from '@/lib/constants/campaign';
import type { CampaignPublic } from '@/lib/services/campaign/campaignService';

interface CampaignSelectModalProps {
  roomCode: string;
  currentCampaignId?: string | null;
  onClose: () => void;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? (m > 0 ? `${h}h${m}` : `${h}h`) : `${m}min`;
}

export function CampaignSelectModal({
  roomCode,
  currentCampaignId,
  onClose,
}: CampaignSelectModalProps) {
  const [campaigns, setCampaigns] = useState<CampaignPublic[]>([]);
  const [search,    setSearch]    = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = (q: string) => {
    setIsLoading(true);
    const url = `/api/rooms/${roomCode}/campaigns?limit=50${q ? `&search=${encodeURIComponent(q)}` : ''}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setCampaigns(data.data?.campaigns ?? []);
      })
      .catch(() => setError('Impossible de charger les campagnes'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchCampaigns('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchCampaigns(search), 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleSelect = (campaignId: string | null) => {
    setError(null);
    startTransition(async () => {
      const result = await selectCampaignAction(roomCode, campaignId);
      if (!result.success) {
        setError(result.error ?? 'Erreur lors de la sélection');
        return;
      }
      onClose();
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#16161a] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="text-xl font-black text-white uppercase italic">
              Choisir un Scénario
            </h2>
            <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mt-1">
              {campaigns.length} aventures disponibles
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-600 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Recherche */}
        <div className="px-6 py-4 border-b border-white/5">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une aventure..."
              autoFocus
              className="pl-9 bg-black/30 border-white/10 text-white placeholder:text-gray-700 focus:border-red-800"
            />
          </div>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-600">
              <Loader2 size={20} className="animate-spin mr-2" />
              <span className="text-xs font-black uppercase tracking-widest">Chargement...</span>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-700">
              <p className="text-sm font-black uppercase">Aucun résultat</p>
            </div>
          ) : (
            <>
              {/* Option désélectionner */}
              {currentCampaignId && (
                <button
                  onClick={() => handleSelect(null)}
                  disabled={isPending}
                  className="w-full p-4 rounded-xl border border-white/10 hover:border-red-900/30 bg-black/20 text-left transition-all disabled:opacity-50"
                >
                  <p className="text-xs font-black text-gray-500 uppercase tracking-widest">
                    Retirer la campagne sélectionnée
                  </p>
                </button>
              )}

              {campaigns.map((campaign) => {
                const theme      = THEME_CONFIG[campaign.theme as CampaignThemeKey];
                const difficulty = DIFFICULTY_CONFIG[campaign.difficulty as CampaignDifficultyKey];
                const isSelected = campaign.id === currentCampaignId;

                return (
                  <button
                    key={campaign.id}
                    onClick={() => handleSelect(campaign.id)}
                    disabled={isPending || isSelected}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-red-700 bg-red-950/20 cursor-default'
                        : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-black/40 disabled:opacity-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className={`text-[9px] font-black uppercase tracking-widest border px-1.5 py-0.5 rounded ${theme?.bg ?? ''} ${theme?.color ?? 'text-gray-400'}`}>
                            {theme?.label ?? campaign.theme}
                          </span>
                          {campaign.isPremium && (
                            <span className="text-[9px] font-black uppercase tracking-widest bg-amber-950/30 text-amber-400 border border-amber-900/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Crown size={8} />Premium
                            </span>
                          )}
                          <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${difficulty?.color ?? 'text-gray-400'}`}>
                            <Swords size={9} />{difficulty?.label ?? campaign.difficulty}
                          </span>
                        </div>

                        {/* Titre */}
                        <p className={`text-sm font-black uppercase italic leading-tight ${isSelected ? 'text-red-400' : 'text-white'}`}>
                          {campaign.title}
                        </p>

                        {/* Synopsis */}
                        <p className="text-[10px] text-gray-600 font-sans leading-relaxed line-clamp-2">
                          {campaign.synopsis}
                        </p>

                        {/* Stats */}
                        <div className="flex gap-4 pt-1">
                          <span className="text-[9px] font-bold text-gray-700 flex items-center gap-1">
                            <Users size={9} />{campaign.minPlayers}–{campaign.maxPlayers}
                          </span>
                          <span className="text-[9px] font-bold text-gray-700 flex items-center gap-1">
                            <Clock size={9} />~{formatDuration(campaign.estimatedDuration)}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <Check size={18} className="text-red-500 shrink-0 mt-1" />
                      )}
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Erreur */}
        {error && (
          <div className="px-6 py-3 border-t border-white/5">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-500">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex justify-end">
          <button
            onClick={onClose}
            className="text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-white transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
