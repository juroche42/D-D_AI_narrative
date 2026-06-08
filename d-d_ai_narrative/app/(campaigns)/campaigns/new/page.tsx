import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { CreateCampaignForm } from '@/components/campaigns/CreateCampaignForm';

export const metadata: Metadata = {
  title: 'Créer une campagne — D&D AI Narrative',
  description: "Forgez votre propre aventure D&D avec génération automatique des directives narratives par l'IA.",
};

export default async function NewCampaignPage() {
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=/campaigns/new');

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="space-y-3">
        <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter">
          Forger une Aventure
        </h1>
        <p className="text-gray-400 font-sans text-sm leading-relaxed">
          Créez votre propre scénario. L&apos;IA Dungeon Master génèrera automatiquement
          les directives narratives à partir de votre description.
        </p>
      </div>
      <CreateCampaignForm />
    </div>
  );
}
