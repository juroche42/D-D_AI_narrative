'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Eye, EyeOff } from 'lucide-react';

import { RegisterSchema, type RegisterInput } from '@/lib/validations/auth';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const PASSWORD_CRITERIA = [
  { label: '8 caractères minimum', test: (p: string) => p.length >= 8 },
  { label: 'Une majuscule', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Un chiffre', test: (p: string) => /[0-9]/.test(p) },
];

function PasswordCriteria({ password, visible }: { password: string; visible: boolean }) {
  if (!visible) return null;

  return (
    <ul className="mt-2 space-y-1">
      {PASSWORD_CRITERIA.map(({ label, test }) => {
        const ok = test(password);
        return (
          <li
            key={label}
            className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${ok ? 'text-green-500' : 'text-gray-500'}`}
          >
            <span aria-hidden="true">{ok ? '✓' : '○'}</span>
            {label}
          </li>
        );
      })}
    </ul>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { username: '', password: '', confirmPassword: '' },
  });

  const passwordValue = form.watch('password');

  const onSubmit = async (values: RegisterInput) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const json = await res.json();

      if (!res.ok) {
        if (json.error?.code === 'CONFLICT') {
          form.setError('username', { message: 'Ce pseudo est déjà pris' });
        } else if (json.error?.code === 'VALIDATION_ERROR') {
          Object.entries(json.error.details?.fieldErrors ?? {}).forEach(([field, messages]) => {
            form.setError(field as keyof RegisterInput, {
              message: (messages as string[])[0],
            });
          });
        } else {
          form.setError('root', { message: 'Une erreur est survenue, réessaie.' });
        }
        return;
      }

      router.push('/login?registered=true');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-[#16161a] border border-white/5 rounded-2xl">
      <CardHeader className="pb-4 pt-10 px-10">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
          D&amp;D AI Narrative
        </p>
        <h1 className="mt-3 text-3xl font-black text-white uppercase italic tracking-tight">
          Inscription
        </h1>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
          Commencez votre légende
        </p>
      </CardHeader>

      <CardContent className="px-10 pb-10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Pseudo */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase tracking-widest text-gray-500">
                    Pseudo
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="ThorinRochefer"
                      autoComplete="username"
                      className="bg-black/40 border-white/5 rounded-xl px-4 py-3 h-auto text-gray-200 placeholder:text-gray-600 focus-visible:ring-red-600/20 focus-visible:border-red-600"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mot de passe */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase tracking-widest text-gray-500">
                    Mot de passe
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="bg-black/40 border-white/5 rounded-xl px-4 py-3 h-auto text-gray-200 placeholder:text-gray-600 focus-visible:ring-red-600/20 focus-visible:border-red-600 pr-10"
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        aria-pressed={showPassword}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </FormControl>
                  <PasswordCriteria password={passwordValue} visible={passwordFocused || !!passwordValue} />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirmer le mot de passe */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase tracking-widest text-gray-500">
                    Confirmer le mot de passe
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="bg-black/40 border-white/5 rounded-xl px-4 py-3 h-auto text-gray-200 placeholder:text-gray-600 focus-visible:ring-red-600/20 focus-visible:border-red-600 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        aria-label={showConfirm ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        aria-pressed={showConfirm}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Erreur globale */}
            {form.formState.errors.root && (
              <p aria-live="polite" className="text-sm font-medium text-red-500">
                {form.formState.errors.root.message}
              </p>
            )}

            {/* Bouton submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold uppercase text-sm tracking-widest rounded-lg px-6 py-2.5 h-auto mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer mon compte'
              )}
            </Button>

            {/* Lien vers login */}
            <p className="text-center">
              <a
                href="/login"
                className="text-[10px] font-black uppercase text-gray-500 hover:text-red-500 transition-colors"
              >
                Déjà un compte ? Se connecter
              </a>
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
