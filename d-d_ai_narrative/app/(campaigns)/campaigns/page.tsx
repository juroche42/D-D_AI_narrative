import { Suspense } from 'react';
import { CampaignCatalog } from '@/components/campaigns/CampaignCatalog';
import { CampaignFiltersBar } from '@/components/campaigns/CampaignFiltersBar';
import { CampaignCardSkeleton } from '@/components/campaigns/CampaignCard';
import { getPublicCampaigns } from '@/lib/services/campaign/campaignService';
import { CampaignFiltersSchema } from '@/lib/validations/campaign';

interface Props {
  searchParams: Promise<Record<string, string>>;
}

export const metadata = {
  title: 'Campagnes — D&D AI Narrative',
  description: 'Parcourez les aventures disponibles et choisissez votre prochain scénario.',
};

export default async function CampaignsPage({ searchParams }: Props) {
  const params = await searchParams;
  const parsed = CampaignFiltersSchema.safeParse(params);
  const filters = parsed.success ? parsed.data : { page: 1, limit: 12 };

  const data = await getPublicCampaigns(filters);

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">

      <div className="space-y-3">
        <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter">
          Choisir une Aventure
        </h1>
        <p className="text-gray-400 font-sans text-sm leading-relaxed max-w-xl">
          Parcourez les scénarios disponibles. Chaque campagne a été conçue pour offrir
          une expérience narrative unique guidée par le Maître du Jeu IA.
        </p>
      </div>

      <CampaignFiltersBar
        initialTheme={filters.theme}
        initialDifficulty={filters.difficulty}
        initialSearch={filters.search ?? ''}
      />

      <Suspense fallback={
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <CampaignCardSkeleton key={i} />)}
        </div>
      }>
        <CampaignCatalog initialData={data} filters={filters} />
      </Suspense>

    </div>
  );
}
