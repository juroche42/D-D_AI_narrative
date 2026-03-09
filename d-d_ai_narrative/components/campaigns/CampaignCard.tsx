'use client';

import Link from 'next/link';
import { Clock, Users, Swords, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { CampaignPublic } from '@/lib/services/campaign/campaignService';
import { THEME_CONFIG, DIFFICULTY_CONFIG, type CampaignThemeKey, type CampaignDifficultyKey } from '@/lib/constants/campaign';

interface CampaignCardProps {
  campaign: CampaignPublic;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const theme = THEME_CONFIG[campaign.theme as CampaignThemeKey];
  const difficulty = DIFFICULTY_CONFIG[campaign.difficulty as CampaignDifficultyKey];

  return (
    <Link href={`/campaigns/${campaign.id}`} className="block group">
      <Card className="bg-[#16161a] border-white/5 rounded-2xl overflow-hidden hover:border-red-900/30 transition-all duration-300 hover:shadow-xl hover:shadow-red-900/5 hover:-translate-y-0.5 h-full">
        <CardContent className="p-0 flex flex-col h-full">

          <div className={`h-1 w-full ${theme.bar}`} />

          <div className="p-6 flex flex-col gap-4 flex-grow">

            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <Badge className={`text-[9px] font-black uppercase tracking-widest border ${theme.bg} ${theme.color}`}>
                  {theme.label}
                </Badge>
                {campaign.isPremium && (
                  <Badge className="text-[9px] font-black uppercase tracking-widest bg-amber-950/30 text-amber-400 border border-amber-900/30 flex items-center gap-1">
                    <Crown size={9} />
                    Premium
                  </Badge>
                )}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest flex-shrink-0 ${difficulty.color}`}>
                <Swords size={10} className="inline mr-1" />
                {difficulty.label}
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-white uppercase italic tracking-tight leading-tight group-hover:text-red-400 transition-colors line-clamp-2">
                {campaign.title}
              </h3>
              <p className="text-xs text-gray-500 font-sans leading-relaxed line-clamp-3">
                {campaign.synopsis}
              </p>
            </div>

            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-700 italic line-clamp-1">
              📍 {campaign.startLocation}
            </p>

            <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                <Users size={11} />
                {campaign.minPlayers}–{campaign.maxPlayers} joueurs
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                <Clock size={11} />
                ~{formatDuration(campaign.estimatedDuration)}
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function CampaignCardSkeleton() {
  return (
    <Card className="bg-[#16161a] border-white/5 rounded-2xl overflow-hidden h-[280px]">
      <CardContent className="p-0">
        <Skeleton className="h-1 w-full bg-white/5" />
        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-4 w-16 bg-white/5 rounded" />
            <Skeleton className="h-4 w-12 bg-white/5 rounded" />
          </div>
          <Skeleton className="h-6 w-3/4 bg-white/5 rounded" />
          <Skeleton className="h-12 w-full bg-white/5 rounded" />
          <Skeleton className="h-3 w-1/2 bg-white/5 rounded" />
          <div className="flex justify-between pt-4 border-t border-white/5">
            <Skeleton className="h-3 w-20 bg-white/5 rounded" />
            <Skeleton className="h-3 w-16 bg-white/5 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
