'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock, Users, Swords, Crown, ArrowLeft,
  MapPin, Target, Scroll, Lock, Loader2, Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { playCampaignAction } from '@/app/(lobby)/lobby/actions';
import type { CampaignPublic } from '@/lib/services/campaign/campaignService';
import { THEME_CONFIG, DIFFICULTY_CONFIG, type CampaignThemeKey, type CampaignDifficultyKey } from '@/lib/constants/campaign';

interface CampaignDetailProps {
  campaign: CampaignPublic;
  isAuthenticated: boolean;
  backHref: string;
  backLabel: string;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function CampaignDetail({ campaign, isAuthenticated, backHref, backLabel }: CampaignDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const theme = THEME_CONFIG[campaign.theme as CampaignThemeKey];
  const difficulty = DIFFICULTY_CONFIG[campaign.difficulty as CampaignDifficultyKey];

  const handlePlay = () => {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=/campaigns/${campaign.id}`);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await playCampaignAction(campaign.id);
      if (!result.success || !result.roomCode) {
        setError(result.error ?? 'Impossible de créer le salon');
        return;
      }
      router.push(`/lobby/${result.roomCode}`);
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">

      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-white transition-colors"
      >
        <ArrowLeft size={12} />
        {backLabel}
      </Link>

      {/* Hero */}
      <div className={`relative rounded-3xl overflow-hidden border border-white/5 bg-gradient-to-br ${theme.accent} to-[#0f0f12] p-8 md:p-12`}>
        <div className="flex flex-wrap gap-3 mb-6">
          <Badge className={`text-xs font-black uppercase tracking-widest border ${theme.bg} ${theme.color}`}>
            {theme.label}
          </Badge>
          <Badge className={`text-xs font-black uppercase tracking-widest border bg-transparent ${difficulty.color} border-white/10`}>
            <Swords size={11} className="mr-1.5" />
            {difficulty.label}
          </Badge>
          {campaign.isPremium && (
            <Badge className="text-xs font-black uppercase tracking-widest bg-amber-950/30 text-amber-400 border border-amber-900/30">
              <Crown size={11} className="mr-1.5" />
              Premium
            </Badge>
          )}
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-tight mb-6">
          {campaign.title}
        </h1>

        <p className="text-base text-gray-300 font-sans leading-relaxed max-w-2xl mb-8">
          {campaign.synopsis}
        </p>

        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
            <Users size={16} className="text-gray-600" />
            {campaign.minPlayers}–{campaign.maxPlayers} joueurs
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
            <Clock size={16} className="text-gray-600" />
            ~{formatDuration(campaign.estimatedDuration)}
          </div>
          <div className={`flex items-center gap-2 text-sm font-bold ${difficulty.color}`}>
            <Swords size={16} />
            {difficulty.label}
          </div>
        </div>
      </div>

      {/* Grille détails + CTA */}
      <div className="grid md:grid-cols-3 gap-6">

        <div className="md:col-span-2 space-y-6">
          <Card className="bg-[#16161a] border-white/5 rounded-2xl">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-600">
                <MapPin size={12} />
                Lieu de départ
              </div>
              <p className="text-white font-bold font-sans">{campaign.startLocation}</p>
            </CardContent>
          </Card>

          <Card className="bg-[#16161a] border-white/5 rounded-2xl">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-600">
                <Target size={12} />
                Quête principale
              </div>
              <p className="text-gray-300 font-sans leading-relaxed">{campaign.mainQuest}</p>
            </CardContent>
          </Card>

          <Card className="bg-[#16161a] border-white/5 rounded-2xl">
            <CardContent className="p-6 space-y-3">
              <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${difficulty.color}`}>
                <Swords size={12} />
                Niveau de difficulté — {difficulty.label}
              </div>
              <p className="text-gray-500 font-sans text-sm leading-relaxed">{difficulty.desc}</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div>
          <Card className="bg-[#16161a] border-white/5 rounded-2xl sticky top-6">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                  Informations
                </p>
                <div className="space-y-2">
                  {([
                    { icon: Users,  label: 'Joueurs',     value: `${campaign.minPlayers} à ${campaign.maxPlayers}`, className: '' },
                    { icon: Clock,  label: 'Durée',       value: `~${formatDuration(campaign.estimatedDuration)}`,   className: '' },
                    { icon: Swords, label: 'Difficulté',  value: difficulty.label,                                    className: difficulty.color },
                    { icon: Scroll, label: 'Thème',       value: theme.label,                                         className: theme.color },
                  ] as const).map(({ icon: Icon, label, value, className }) => (
                    <div key={label} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-2 text-[10px] text-gray-600 font-bold uppercase tracking-wider">
                        <Icon size={11} />
                        {label}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${className || 'text-white'}`}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500 animate-in fade-in">
                  {error}
                </p>
              )}

              {campaign.isPremium ? (
                <div className="space-y-3">
                  <Button
                    disabled
                    className="w-full bg-amber-600/20 text-amber-700 font-black uppercase tracking-widest text-xs cursor-not-allowed border border-amber-900/30"
                  >
                    <Lock size={14} />
                    Accès Premium
                  </Button>
                  <p className="text-[10px] text-center text-gray-700 font-sans">
                    Cette campagne est réservée aux membres Premium
                  </p>
                </div>
              ) : (
                <>
                  <Button
                    onClick={handlePlay}
                    disabled={isPending}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-red-600/20 transition-all active:scale-95"
                  >
                    {isPending
                      ? <><Loader2 size={14} className="animate-spin" /> Création du salon...</>
                      : <><Sparkles size={14} /> Jouer cette campagne</>
                    }
                  </Button>
                  {!isAuthenticated && (
                    <p className="text-[10px] text-center text-gray-700 font-sans">
                      Vous serez redirigé vers la connexion
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
