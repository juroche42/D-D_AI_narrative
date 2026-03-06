import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Créer un personnage',
};

export default async function CreateCharacterPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return <>
      <h1 className="text-3xl font-bold mb-6">Créer un personnage</h1>
  </>;
}


