'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Race, CharClass } from '@/app/generated/prisma/client';
import type { RaceDefinition } from '@/lib/constants/races';
import type { ClassDefinition } from '@/lib/constants/classes';
import { SelectionCard } from './SelectionCard';
import { StepIndicator } from './StepIndicator';
import { CharacterPreview } from './CharacterPreview';

const STEPS = ['Lignée', 'Vocation', 'Identité'] as const;

const DEFAULT_STATS = {
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
};

interface CharacterStepProps {
  races: RaceDefinition[];
  classes: ClassDefinition[];
}

export function CharacterStep({ races, classes }: CharacterStepProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRaceId, setSelectedRaceId] = useState<Race | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<CharClass | null>(null);
  const [heroName, setHeroName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedRace = races.find((r) => r.id === selectedRaceId) ?? null;
  const selectedClass = classes.find((c) => c.id === selectedClassId) ?? null;

  const isNextDisabled =
    (currentStep === 0 && !selectedRaceId) ||
    (currentStep === 1 && !selectedClassId) ||
    (currentStep === 2 && heroName.trim().length < 2) ||
    isSubmitting;

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      return;
    }

    const trimmed = heroName.trim();
    if (trimmed.length < 2) {
      setNameError('Le nom doit contenir au moins 2 caractères.');
      return;
    }
    if (trimmed.length > 30) {
      setNameError('Le nom ne peut pas dépasser 30 caractères.');
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmed,
          race: selectedRaceId,
          class: selectedClassId,
          stats: DEFAULT_STATS,
        }),
      });

      const body = await res.json();

      if (!res.ok) {
        setApiError(body.message ?? 'Une erreur est survenue.');
        return;
      }

      router.push('/');
    } catch {
      setApiError('Une erreur réseau est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleNameChange = (value: string) => {
    setHeroName(value);
    setNameError(null);
  };

  return (
    <div>
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      <div className="bg-[#1a1a1f] border border-white/10 rounded-2xl p-8 mx-36">
        {/* Étape 0 — Lignée */}
        {currentStep === 0 && (
          <div className="grid grid-cols-3 gap-5 mb-8">
            {races.map((race) => (
              <SelectionCard
                key={race.id}
                name={race.name}
                description={race.description}
                tag={race.bonus}
                isSelected={race.id === selectedRaceId}
                onClick={() => setSelectedRaceId(race.id)}
              />
            ))}
          </div>
        )}

        {/* Étape 1 — Vocation */}
        {currentStep === 1 && (
          <div className="grid grid-cols-3 gap-5 mb-8">
            {classes.map((cls) => (
              <SelectionCard
                key={cls.id}
                name={cls.name}
                description={cls.description}
                tag={`COMPÉTENCE : ${cls.competence}`}
                isSelected={cls.id === selectedClassId}
                onClick={() => setSelectedClassId(cls.id)}
              />
            ))}
          </div>
        )}

        {/* Étape 2 — Identité */}
        {currentStep === 2 && (
          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                Nom de votre héros
              </label>
              <input
                type="text"
                value={heroName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Entrez un nom..."
                maxLength={30}
                className="w-full bg-[#0f0f12] border border-white/10 rounded-xl px-4 py-3 text-white
                  placeholder:text-gray-600 focus:outline-none focus:border-red-600 transition-colors"
              />
              {nameError && (
                <p className="mt-1 text-xs text-red-400">{nameError}</p>
              )}
            </div>

            <CharacterPreview
              name={heroName}
              raceName={selectedRace?.name ?? ''}
              className={selectedClass?.name ?? ''}
              stats={DEFAULT_STATS}
            />

            {apiError && (
              <p className="text-red-400 text-sm text-center">{apiError}</p>
            )}
          </div>
        )}

        <hr className="border-white/10 mb-6" />

        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-6 py-4 text-white/40 font-black uppercase tracking-widest text-xs
              transition-all hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Précédent
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={isNextDisabled}
            className="py-4 px-8 bg-red-600 hover:bg-red-500 disabled:opacity-40
              disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase
              tracking-widest text-sm transition-all shadow-lg shadow-red-600/20 active:scale-95"
          >
            {isSubmitting ? 'Création…' : currentStep === STEPS.length - 1 ? 'Finaliser' : 'Suivant'}
          </button>
        </div>
      </div>
    </div>
  );
}
