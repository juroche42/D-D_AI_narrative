import Link from 'next/link';
import { Dice5, Play, Scroll, Users, Sword } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-20 animate-in fade-in duration-700">
      <section className="relative flex h-[500px] items-center justify-center overflow-hidden rounded-[2.5rem] border border-red-900/30 p-8 text-center shadow-2xl shadow-red-950/20 md:h-[600px]">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0f0f12] via-[#0f0f12]/60 to-transparent" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1599739291060-4578e77dac5d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40" />

        <div className="relative z-20 mx-auto max-w-3xl space-y-8">
          <div className="flex justify-center">
            <span className="rounded-full border border-red-500/30 bg-red-600/20 px-2.5 py-0.5 text-[7px] font-black uppercase tracking-[0.12em] text-red-500 backdrop-blur-sm sm:px-6 sm:py-1.5 sm:text-[10px] sm:tracking-[0.3em]">
              Maître du Jeu IA de Nouvelle Génération
            </span>
          </div>
          <h1 className="text-5xl font-black uppercase italic leading-[0.9] tracking-tighter text-white md:text-8xl">
            <span className="block">Forgez votre</span>
            <span className="block text-red-500">propre</span>
            <span className="block">épopée.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg font-sans leading-relaxed text-gray-400 md:text-xl">
            Vivez des aventures infinies où chaque décision compte. L&apos;IA adapte le monde en temps réel selon vos choix.
          </p>
          <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
            <Link
              href="/lobby"
              className="shrink-0 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-[9px] font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-red-600/20 transition-all active:scale-95 hover:bg-red-500 sm:px-12 sm:py-5 sm:text-lg sm:tracking-widest"
            >
              Lancer l&apos;aventure <Play size={20} fill="currentColor" />
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-10">
        <div className="space-y-3 text-center">
          <h3 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight text-white">
            Fonctionnalités Clés
          </h3>
          <p className="mx-auto max-w-3xl text-sm md:text-base font-sans leading-relaxed text-gray-400">
            Un Dungeon Master IA qui génère des scénarios dynamiques, mémorise vos actions
            via une mémoire vectorielle, et adapte l&apos;histoire en temps réel.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {[
            {
              title: 'Narration IA',
              icon: Scroll,
              desc: 'Un moteur RAG indexé sur le SRD 5.1 pour une cohérence totale avec les règles officielles.',
            },
            {
              title: 'Multijoueur Temps Réel',
              icon: Users,
              desc: "Interagissez avec vos amis grâce au flux SSE. Pas de rafraîchissement, juste de l'action.",
            },
            {
              title: 'Zéro Préparation',
              icon: Sword,
              desc: "Oubliez les heures de lecture de manuels. L'IA gère la complexité, vous vivez l'aventure.",
            },
          ].map(({ title, icon: Icon, desc }) => (
            <div
              key={title}
              className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#16161a] p-6 transition-all shadow-xl hover:border-red-900/40"
            >
              <div className="absolute right-0 top-0 p-4 opacity-5 transition-opacity group-hover:opacity-10">
                <Dice5 size={120} />
              </div>
              <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-900/30 bg-red-600/10 transition-transform group-hover:rotate-12">
                <Icon className="text-red-500" size={20} />
              </div>
              <h3 className="mb-4 text-2xl font-bold uppercase tracking-tight text-white">{title}</h3>
              <p className="text-sm font-sans leading-relaxed text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-10">
        <div className="space-y-3 text-center">
          <h3 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight text-white">
            Comment Ça Marche
          </h3>
          <p className="mx-auto max-w-3xl text-sm md:text-base font-sans leading-relaxed text-gray-400">
            En quelques minutes, vous passez de l&apos;idée à l&apos;aventure. C&apos;est simple,
            clair, et pensé pour que tout le monde comprenne.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              step: '01',
              title: 'Créez un salon',
              desc: 'Créez votre groupe et partagez un code pour inviter vos amis.',
            },
            {
              step: '02',
              title: 'Définissez la campagne',
              desc: "Donnez le ton de l'aventure et choisissez ce qui vous fait vibrer.",
            },
            {
              step: '03',
              title: 'Lancez la partie',
              desc: "Jouez, décidez, et laissez l'histoire évoluer au fil de vos choix.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="relative overflow-hidden rounded-2xl border border-white/5 bg-black/20 p-6 shadow-xl"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-red-900/30 bg-red-600/10 font-black text-red-500">
                {item.step}
              </div>
              <h4 className="mb-3 text-xl font-black uppercase italic tracking-tight text-white">
                {item.title}
              </h4>
              <p className="text-sm font-sans leading-relaxed text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
