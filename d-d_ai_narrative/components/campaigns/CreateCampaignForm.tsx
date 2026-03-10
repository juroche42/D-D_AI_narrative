'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChevronRight, ChevronLeft, Sparkles, Loader2,
  Eye, EyeOff, Scroll, MapPin, Target, Palette, Users, Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { CreateCampaignSchema, type CreateCampaignInput } from '@/lib/validations/campaign';

const STEPS = [
  { id: 1, label: 'Histoire',      icon: Scroll },
  { id: 2, label: 'Configuration', icon: Palette },
  { id: 3, label: 'Aperçu IA',     icon: Sparkles },
] as const;

const THEMES = [
  { value: 'HEROIC',        label: '⚔️ Héroïque',     desc: 'Aventure épique et glorieuse' },
  { value: 'HORROR',        label: '🩸 Horreur',       desc: 'Tension et mort permanente' },
  { value: 'MYSTERY',       label: '🔍 Mystère',       desc: 'Enquête et révélations' },
  { value: 'INVESTIGATION', label: '🕵️ Investigation', desc: 'Complot et politique' },
] as const;

const DIFFICULTIES = [
  { value: 'EASY',   label: 'Facile',    desc: 'Idéal pour débuter le JDR' },
  { value: 'MEDIUM', label: 'Moyen',     desc: 'Expérience recommandée' },
  { value: 'HARD',   label: 'Difficile', desc: 'Joueurs confirmés uniquement' },
] as const;

export function CreateCampaignForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewPrompt, setPreviewPrompt] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<CreateCampaignInput>({
    resolver: zodResolver(CreateCampaignSchema) as Resolver<CreateCampaignInput>,
    defaultValues: {
      title:             '',
      synopsis:          '',
      startLocation:     '',
      mainQuest:         '',
      theme:             'HEROIC',
      difficulty:        'MEDIUM',
      minPlayers:        2,
      maxPlayers:        6,
      estimatedDuration: 120,
      isPublic:          false,
      isPremium:         false,
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;
  const values = watch();

  const validateStep = async (currentStep: number): Promise<boolean> => {
    if (currentStep === 1) {
      return form.trigger(['title', 'synopsis', 'startLocation', 'mainQuest']);
    }
    if (currentStep === 2) {
      return form.trigger(['theme', 'difficulty', 'minPlayers', 'maxPlayers', 'estimatedDuration']);
    }
    return true;
  };

  const handleNext = async () => {
    const valid = await validateStep(step);
    if (!valid) return;

    if (step === 2) {
      setIsGenerating(true);
      try {
        const res = await fetch('/api/campaigns/preview-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title:         values.title,
            synopsis:      values.synopsis,
            startLocation: values.startLocation,
            mainQuest:     values.mainQuest,
            theme:         values.theme,
            difficulty:    values.difficulty,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setPreviewPrompt(data.data.systemPrompt);
        }
      } finally {
        setIsGenerating(false);
      }
    }

    setStep((s) => s + 1);
  };

  const onSubmit = (data: CreateCampaignInput) => {
    setSubmitError(null);
    startTransition(async () => {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSubmitError(err.error?.message ?? err.error ?? 'Erreur lors de la création');
        return;
      }

      const json = await res.json();
      router.push(`/campaigns/${json.data.id}`);
    });
  };

  return (
    <div className="space-y-8">

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = s.id === step;
          const isDone   = s.id < step;
          return (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                isActive ? 'bg-red-600 text-white' :
                isDone   ? 'bg-white/10 text-gray-400' :
                           'bg-white/5 text-gray-700'
              }`}>
                <Icon size={12} />
                {s.label}
              </div>
              {i < STEPS.length - 1 && (
                <ChevronRight size={14} className={isDone ? 'text-gray-500' : 'text-gray-800'} />
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="bg-[#16161a] border-white/5 rounded-2xl">
          <CardContent className="p-8 space-y-6">

            {/* ── Étape 1 : Histoire ── */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <SectionTitle icon={Scroll} label="Informations narratives" />

                <Field label="Titre de la campagne" error={errors.title?.message}>
                  <Input
                    {...register('title')}
                    placeholder="Ex: La Crypte du Roi Oublié"
                    className="bg-black/30 border-white/10 text-white placeholder:text-gray-700 focus:border-red-800"
                  />
                </Field>

                <Field
                  label="Synopsis"
                  hint="Description courte affichée dans le catalogue (20–1000 caractères)"
                  error={errors.synopsis?.message}
                >
                  <Textarea
                    {...register('synopsis')}
                    rows={4}
                    placeholder="Décrivez l'ambiance et les enjeux de votre aventure..."
                    className="bg-black/30 border-white/10 text-white placeholder:text-gray-700 focus:border-red-800 resize-none"
                  />
                </Field>

                <Field label="Lieu de départ" error={errors.startLocation?.message}>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                    <Input
                      {...register('startLocation')}
                      placeholder="Ex: La taverne du Sanglier Ivre, à Waterdeep"
                      className="pl-9 bg-black/30 border-white/10 text-white placeholder:text-gray-700 focus:border-red-800"
                    />
                  </div>
                </Field>

                <Field
                  label="Quête principale"
                  hint="L'objectif final que les joueurs doivent accomplir"
                  error={errors.mainQuest?.message}
                >
                  <div className="relative">
                    <Target size={14} className="absolute left-3 top-3 text-gray-600" />
                    <Textarea
                      {...register('mainQuest')}
                      rows={3}
                      placeholder="Ex: Retrouver l'Orbe des Âmes avant que le culte ne l'utilise pour invoquer Asmodeus..."
                      className="pl-9 bg-black/30 border-white/10 text-white placeholder:text-gray-700 focus:border-red-800 resize-none"
                    />
                  </div>
                </Field>
              </div>
            )}

            {/* ── Étape 2 : Configuration ── */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <SectionTitle icon={Palette} label="Configuration de la campagne" />

                <Field label="Thème" error={errors.theme?.message}>
                  <div className="grid grid-cols-2 gap-3">
                    {THEMES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setValue('theme', t.value)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          values.theme === t.value
                            ? 'border-red-700 bg-red-950/20'
                            : 'border-white/10 bg-black/20 hover:border-white/20'
                        }`}
                      >
                        <p className="text-sm font-black text-white">{t.label}</p>
                        <p className="text-[10px] text-gray-600 mt-0.5">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Difficulté" error={errors.difficulty?.message}>
                  <div className="grid grid-cols-3 gap-3">
                    {DIFFICULTIES.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setValue('difficulty', d.value)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          values.difficulty === d.value
                            ? 'border-red-700 bg-red-950/20'
                            : 'border-white/10 bg-black/20 hover:border-white/20'
                        }`}
                      >
                        <p className="text-xs font-black text-white uppercase">{d.label}</p>
                        <p className="text-[9px] text-gray-600 mt-0.5 leading-tight">{d.desc}</p>
                      </button>
                    ))}
                  </div>
                </Field>

                <Separator className="bg-white/5" />

                <div className="grid grid-cols-3 gap-4">
                  <Field label="Min joueurs" error={errors.minPlayers?.message}>
                    <div className="relative">
                      <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                      <Input
                        type="number" min={1} max={6}
                        {...register('minPlayers')}
                        className="pl-9 bg-black/30 border-white/10 text-white focus:border-red-800"
                      />
                    </div>
                  </Field>
                  <Field label="Max joueurs" error={errors.maxPlayers?.message}>
                    <Input
                      type="number" min={1} max={6}
                      {...register('maxPlayers')}
                      className="bg-black/30 border-white/10 text-white focus:border-red-800"
                    />
                  </Field>
                  <Field label="Durée (min)" error={errors.estimatedDuration?.message}>
                    <div className="relative">
                      <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                      <Input
                        type="number" min={30} max={3600}
                        {...register('estimatedDuration')}
                        className="pl-9 bg-black/30 border-white/10 text-white focus:border-red-800"
                      />
                    </div>
                  </Field>
                </div>

                <Separator className="bg-white/5" />

                <Field label="Visibilité" hint="Privée par défaut — vous pourrez la publier après création">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setValue('isPublic', false)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${
                        !values.isPublic
                          ? 'border-red-700 bg-red-950/20 text-white'
                          : 'border-white/10 bg-black/20 text-gray-600 hover:border-white/20'
                      }`}
                    >
                      <EyeOff size={13} />
                      Privée
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('isPublic', true)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${
                        values.isPublic
                          ? 'border-red-700 bg-red-950/20 text-white'
                          : 'border-white/10 bg-black/20 text-gray-600 hover:border-white/20'
                      }`}
                    >
                      <Eye size={13} />
                      Publique
                    </button>
                  </div>
                </Field>
              </div>
            )}

            {/* ── Étape 3 : Aperçu IA ── */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <SectionTitle icon={Sparkles} label="Directives du Dungeon Master IA" />

                <p className="text-xs text-gray-500 font-sans leading-relaxed">
                  L&apos;IA a généré les directives narratives à partir de votre description.
                  Ces instructions seront injectées au Dungeon Master à chaque tour de jeu
                  pour maintenir la cohérence de l&apos;univers.
                </p>

                {isGenerating ? (
                  <div className="flex items-center justify-center py-12 gap-3 text-gray-600">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-xs font-black uppercase tracking-widest">
                      L&apos;IA forge les directives...
                    </span>
                  </div>
                ) : previewPrompt ? (
                  <div className="bg-black/40 border border-white/10 rounded-xl p-6 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-700 mb-3">
                      Directives générées — usage interne IA uniquement
                    </p>
                    <p className="text-xs text-gray-400 font-mono leading-relaxed whitespace-pre-wrap">
                      {previewPrompt}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12 text-gray-700">
                    <p className="text-xs font-sans">Aperçu non disponible</p>
                  </div>
                )}

                <Separator className="bg-white/5" />

                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  {([
                    { label: 'Titre',      value: values.title },
                    { label: 'Thème',      value: values.theme },
                    { label: 'Difficulté', value: values.difficulty },
                    { label: 'Joueurs',    value: `${values.minPlayers}–${values.maxPlayers}` },
                    { label: 'Durée',      value: `${values.estimatedDuration} min` },
                    { label: 'Visibilité', value: values.isPublic ? 'Publique' : 'Privée' },
                  ] as const).map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-1 border-b border-white/5">
                      <span className="font-black uppercase tracking-widest text-gray-600">{label}</span>
                      <span className="font-bold text-gray-400 truncate max-w-32">{value}</span>
                    </div>
                  ))}
                </div>

                {submitError && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-500 animate-in fade-in">
                    {submitError}
                  </p>
                )}
              </div>
            )}

          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              disabled={isPending || isGenerating}
              className="border-white/10 hover:bg-white/5 text-gray-400 font-black uppercase tracking-widest text-xs"
            >
              <ChevronLeft size={14} />
              Retour
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isGenerating}
              className="bg-white/10 hover:bg-white/15 text-white font-black uppercase tracking-widest text-xs"
            >
              {isGenerating
                ? <><Loader2 size={14} className="animate-spin" /> Génération...</>
                : <>Continuer <ChevronRight size={14} /></>
              }
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isPending || isGenerating}
              className="bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-xs px-8 shadow-lg shadow-red-600/20"
            >
              {isPending
                ? <><Loader2 size={14} className="animate-spin" /> Création...</>
                : <><Sparkles size={14} /> Créer la campagne</>
              }
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
      <Icon size={14} className="text-red-700" />
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</p>
    </div>
  );
}

function Field({
  label, error, hint, children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="text-[10px] text-gray-700 font-sans">{hint}</p>
      )}
      {error && (
        <p className="text-[10px] font-black uppercase tracking-widest text-red-500 animate-in fade-in">
          {error}
        </p>
      )}
    </div>
  );
}
