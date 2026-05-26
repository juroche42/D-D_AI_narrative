import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { CharacterStep } from "@/components/character/CharacterStep";
import { RACE_DEFINITIONS } from "@/lib/constants/races";
import { CLASS_DEFINITIONS} from "@/lib/constants/classes";

export const metadata: Metadata = {
  title: 'Votre incarnation - D&D AI Narrative',
};

export default async function CreateCharacterPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return <>
    <h1 className="text-3xl font-bold mb-6 uppercase italic text-center">Votre incarnation</h1>
    <CharacterStep
        races={RACE_DEFINITIONS}
        classes={CLASS_DEFINITIONS}
    />
  </>;
}




