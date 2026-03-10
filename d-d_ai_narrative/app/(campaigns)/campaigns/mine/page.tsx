import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getMyCampaigns } from '@/lib/services/campaign/campaignService';
import { CampaignCard } from '@/components/campaigns/CampaignCard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mes Campagnes — D&D AI Narrative',
  description: 'Vos campagnes créées, publiques et privées.',
};

export default async function MyCampaignsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=/campaigns/mine');

  const campaigns = await getMyCampaigns(session.user.id);

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter">
            Mes Campagnes
          </h1>
          <p className="text-gray-400 font-sans text-sm leading-relaxed max-w-xl">
            Vos campagnes créées — publiques et privées.
          </p>
        </div>
        <Link
          href="/campaigns/new"
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-red-600/20"
        >
          <Plus size={14} />
          Créer
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <p className="text-gray-600 text-sm font-sans">
          Vous n&apos;avez pas encore créé de campagne.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      )}
    </div>
  );
}
