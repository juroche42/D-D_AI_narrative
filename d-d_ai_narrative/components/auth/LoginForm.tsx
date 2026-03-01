'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import { LoginSchema, type LoginInput } from '@/lib/validations/auth';
import { loginAction } from '@/app/(auth)/login/actions';
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

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (values: LoginInput) => {
    setIsLoading(true);
    try {
      const result = await loginAction(values);
      if (result?.error) {
        form.setError('root', { message: result.error });
      }
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
          Connexion
        </h1>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
          Reprenez votre quête
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
                    <Input
                      {...field}
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="bg-black/40 border-white/5 rounded-xl px-4 py-3 h-auto text-gray-200 placeholder:text-gray-600 focus-visible:ring-red-600/20 focus-visible:border-red-600"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Erreur globale (identifiants incorrects) */}
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
                  Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </Button>

            {/* Lien vers register */}
            <p className="text-center">
              <a
                href="/register"
                className="text-[10px] font-black uppercase text-gray-500 hover:text-red-500 transition-colors"
              >
                Pas encore de compte ? S&apos;inscrire
              </a>
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
