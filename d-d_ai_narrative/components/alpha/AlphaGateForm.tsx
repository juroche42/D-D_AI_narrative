'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import { AlphaGateSchema, type AlphaGateInput } from '@/lib/validations/alphaGate';
import { submitAlphaCode } from '@/app/alpha-gate/actions';
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

export function AlphaGateForm({ next }: { next: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AlphaGateInput>({
    resolver: zodResolver(AlphaGateSchema),
    defaultValues: { code: '' },
  });

  const onSubmit = async (values: AlphaGateInput) => {
    setIsLoading(true);
    try {
      const result = await submitAlphaCode(values, next);
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
          Accès Alpha
        </h1>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
          Réservé aux testeurs
        </p>
      </CardHeader>

      <CardContent className="px-10 pb-10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase tracking-widest text-gray-500">
                    Code d&apos;accès
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="••••••••"
                      autoComplete="off"
                      className="bg-black/40 border-white/5 rounded-xl px-4 py-3 h-auto text-gray-200 placeholder:text-gray-600 focus-visible:ring-red-600/20 focus-visible:border-red-600"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <p aria-live="polite" className="text-sm font-medium text-red-500">
                {form.formState.errors.root.message}
              </p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold uppercase text-sm tracking-widest rounded-lg px-6 py-2.5 h-auto mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vérification...
                </>
              ) : (
                'Entrer'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
