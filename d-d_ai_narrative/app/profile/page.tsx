import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { UserProfilePage } from '@/components/profile';
import { auth } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Profil — D&D AI Narrative',
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  return <UserProfilePage />;
}
