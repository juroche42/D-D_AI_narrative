import type { Metadata } from 'next';

import { AlphaGateForm } from '@/components/alpha';

export const metadata: Metadata = {
  title: 'Accès Alpha — D&D AI Narrative',
};

export default async function AlphaGatePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex-1 w-full flex items-center justify-center">
      <div className="max-w-md w-full mx-4 animate-in fade-in zoom-in-95">
        <AlphaGateForm next={next ?? '/'} />
      </div>
    </div>
  );
}
