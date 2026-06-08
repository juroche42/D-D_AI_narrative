import { notFound } from 'next/navigation';
import { getCampaignById } from '@/lib/services/campaign/campaignService';
import { CampaignDetail } from '@/components/campaigns/CampaignDetail';
import { auth } from '@/lib/auth';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const { systemPrompt: _, ...campaign } = await getCampaignById(id);
    return {
      title: `${campaign.title} — D&D AI Narrative`,
      description: campaign.synopsis,
    };
  } catch {
    return { title: 'Campagne introuvable — D&D AI Narrative' };
  }
}

export default async function CampaignDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  let campaign;
  let backHref = '/campaigns';
  let backLabel = 'Retour au catalogue';
  try {
    const { systemPrompt: _, ...publicData } = await getCampaignById(id);
    const isOwner = session?.user?.id === publicData.creatorId;
    if (!publicData.isPublic && !isOwner) notFound();
    if (isOwner && !publicData.isPublic) {
      backHref  = '/campaigns/mine';
      backLabel = 'Mes campagnes';
    }
    campaign = publicData;
  } catch {
    notFound();
  }

  return (
    <CampaignDetail
      campaign={campaign}
      isAuthenticated={!!session?.user}
      backHref={backHref}
      backLabel={backLabel}
    />
  );
}
