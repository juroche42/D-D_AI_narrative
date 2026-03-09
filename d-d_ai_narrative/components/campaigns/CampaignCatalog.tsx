'use client';

import { useEffect, useState, useTransition } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, Scroll } from 'lucide-react';
import { CampaignCard } from './CampaignCard';
import { Button } from '@/components/ui/button';
import type { CampaignPublic } from '@/lib/services/campaign/campaignService';

interface PaginatedData {
  campaigns: CampaignPublic[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface CampaignCatalogProps {
  initialData: PaginatedData;
  filters: Record<string, unknown>;
}

export function CampaignCatalog({ initialData }: CampaignCatalogProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [data, setData] = useState<PaginatedData>(initialData);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const res = await fetch(`/api/campaigns?${searchParams.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    });
  }, [searchParams]);

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.push(`${pathname}?${params.toString()}`);
  };

  if (data.campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <Scroll size={48} className="text-gray-800" />
        <p className="text-xl font-black text-gray-700 uppercase italic">
          Aucune aventure trouvée
        </p>
        <p className="text-xs text-gray-700 font-sans">
          Essayez d&apos;autres filtres ou effacez votre recherche
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">
        {data.total} aventure{data.total > 1 ? 's' : ''} disponible{data.total > 1 ? 's' : ''}
        {data.totalPages > 1 && ` — page ${data.page}/${data.totalPages}`}
      </p>

      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-200 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
        {data.campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={!data.hasPrev || isPending}
            onClick={() => goToPage(data.page - 1)}
            className="border-white/10 hover:bg-white/5 text-gray-400 font-black uppercase tracking-widest text-xs"
          >
            <ChevronLeft size={14} />
            Précédent
          </Button>

          <div className="flex items-center gap-2">
            {Array.from({ length: data.totalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - data.page) <= 2)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  disabled={isPending}
                  className={`w-8 h-8 rounded-lg text-xs font-black uppercase transition-all ${
                    p === data.page
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                      : 'text-gray-600 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {p}
                </button>
              ))
            }
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={!data.hasNext || isPending}
            onClick={() => goToPage(data.page + 1)}
            className="border-white/10 hover:bg-white/5 text-gray-400 font-black uppercase tracking-widest text-xs"
          >
            Suivant
            <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}
