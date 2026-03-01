import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import { Navbar } from '@/components/layout';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'D&D AI Narrative',
  description: 'Créez et vivez des aventures narratives propulsées par l\'IA',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[#0f0f12] text-gray-200 selection:bg-red-500/30 overflow-x-hidden`}
      >
        <Providers>
          <Navbar />
          <main className="max-w-7xl mx-auto p-4 md:p-6 min-h-[calc(100vh-160px)]">
            {children}
          </main>
          <footer className="mt-20 border-t border-red-900/30 py-10 px-6 bg-[#0a0a0c] text-center text-gray-400">
            <div className="max-w-4xl mx-auto space-y-4">
              <p className="text-sm">© 2026 Matcha Latte — Projet D&amp;D AI-Narrative (MVP)</p>
              <div className="flex justify-center gap-6 text-[10px] uppercase font-black tracking-widest opacity-50">
                <span>Accessibilité RGAA</span>
                <span>Confidentialité RGPD</span>
                <span>Green IT</span>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
