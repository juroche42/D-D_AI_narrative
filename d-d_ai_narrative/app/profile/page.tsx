import type { Metadata } from 'next';

import { UserProfilePage } from '@/components/profile';

export const metadata: Metadata = {
  title: 'Profil — D&D AI Narrative',
};

export default function ProfilePage() {
  return <UserProfilePage />;
}
