'use client';

import { useState } from 'react';
import type { RaceDefinition } from '@/lib/constants/races';

interface CharacterStepProps {
    races: RaceDefinition[];
    onNext?: (selectedRace: RaceDefinition) => void;
    onPrev?: () => void;
}

export function CharacterStep({ races, onNext, onPrev }: CharacterStepProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const selectedRace = races.find((r) => r.id === selectedId) ?? null;

    return (
        <div className="bg-[#1a1a1f] border border-white/10 rounded-2xl p-8 mx-36">
            {/* Race Grid */}
            <div className="grid grid-cols-3 gap-5 mb-8">
                {races.map((race) => {
                    const isSelected = race.id === selectedId;
                    return (
                        <button
                            key={race.id}
                            onClick={() => setSelectedId(race.id)}
                            className={`
                relative text-left bg-[#1a1a1f] rounded-2xl py-7 px-6 space-y-3
                border transition-all duration-200
                ${
                                isSelected
                                    ? 'border-red-600 shadow-[inset_0_0_0_1px_rgb(220,38,38)] bg-[#1f1618]'
                                    : 'border-white/10 hover:border-white/25'
                            }
              `}
                        >
                            <div className="space-y-1.5">
                                <p className="text-lg font-black text-white tracking-wide uppercase">
                                    {race.name}
                                </p>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    {race.description}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Divider */}
            <hr className="border-white/10 mb-6" />

            {/* Navigation */}
            <div className="flex justify-between items-center">
                <button
                    onClick={onPrev}
                    disabled={!onPrev}
                    className="px-6 py-4 text-white/40 font-black uppercase tracking-widest text-xs
            transition-all hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    Précédent
                </button>

                <button
                    onClick={() => selectedRace && onNext?.(selectedRace)}
                    disabled={!selectedRace}
                    className="py-4 px-8 bg-red-600 hover:bg-red-500 disabled:opacity-40
            disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase
            tracking-widest text-sm transition-all shadow-lg shadow-red-600/20
            active:scale-95"
                >
                    Suivant
                </button>
            </div>
        </div>
    );
}