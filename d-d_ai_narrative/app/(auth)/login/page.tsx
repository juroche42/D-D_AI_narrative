import type { Metadata } from 'next';

import { LoginForm } from '@/components/auth';

export const metadata: Metadata = {
  title: 'Connexion — D&D AI Narrative',
};

export default function LoginPage() {
  return (
    <div className="min-h-full flex items-center justify-center">
      <div className="max-w-md w-full mx-4 animate-in fade-in zoom-in-95">
        <LoginForm />
      </div>
    </div>
  );
}
