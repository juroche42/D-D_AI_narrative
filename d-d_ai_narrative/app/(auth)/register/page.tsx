import type { Metadata } from 'next';

import { RegisterForm } from '@/components/auth';

export const metadata: Metadata = {
  title: 'Inscription — D&D AI Narrative',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#0f0f12] py-20">
      <div className="max-w-md mx-auto animate-in fade-in zoom-in-95">
        <RegisterForm />
      </div>
    </div>
  );
}
