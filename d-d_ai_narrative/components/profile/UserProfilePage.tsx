'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ChevronRight,
  Loader2,
  Sparkles,
  User,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EditUsernameModal } from '@/components/profile/EditUsernameModal';
import { ChangePasswordModal } from '@/components/profile/ChangePasswordModal';
import { LogoutButton } from '@/components/layout/LogoutButton';

type UserMeApiResponse = {
  success: boolean;
  data: {
    id: string;
    username: string;
    createdAt: string;
    updatedAt: string;
    profile: {
      id: string;
      avatarUrl: string;
      bio: string;
      language: 'FR' | 'EN';
      darkMode: boolean;
      totalGames: number;
      totalTurns: number;
      monstersDefeated: number;
      naturalCrits: number;
      updatedAt: string;
    };
  } | null;
  message: string;
  error: { code: string; details?: unknown } | null;
};

const THEME = {
  bg: 'bg-[#0f0f12]',
  surface: 'bg-[#16161a]',
  border: 'border-red-900/30',
  borderLight: 'border-white/5',
  textMain: 'text-gray-200',
  textMuted: 'text-gray-500',
};

export function UserProfilePage() {
  const [user, setUser] = useState<UserMeApiResponse['data']>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [activePanel, setActivePanel] = useState<'username' | 'password' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [username, setUsername] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const level = useMemo(() => {
    if (!user) return 1;
    return Math.max(1, Math.floor(user.profile.totalGames / 3) + 1);
  }, [user]);

  const applyUser = useCallback((data: NonNullable<UserMeApiResponse['data']>) => {
    setUser(data);
    setUsername(data.username);
  }, []);

  const formButtonClass =
    'bg-red-600 hover:bg-red-500 text-white font-bold uppercase text-sm tracking-widest rounded-lg px-6 py-2.5 h-auto';
  const actionButtonClass =
    'bg-transparent border border-white/20 hover:bg-white/5 text-gray-200 font-bold uppercase text-sm tracking-widest rounded-lg px-6 py-2.5 h-auto';

  const fetchProfile = useCallback(
    async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/users/me');
        const json = (await res.json()) as UserMeApiResponse;

        if (!res.ok || !json.success || !json.data) {
          setUser(null);
          setError(json.message || 'Impossible de charger le profil');
          return;
        }

        applyUser(json.data);
      } catch {
        setUser(null);
        setError('Erreur réseau lors du chargement du profil');
      } finally {
        setLoading(false);
      }
    },
    [applyUser],
  );

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const saveProfile = async () => {
    setSavingProfile(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
      const json = (await res.json()) as UserMeApiResponse;

      if (!res.ok || !json.success || !json.data) {
        setError(json.message || 'Impossible de mettre à jour le profil');
        return;
      }

      applyUser(json.data);
      setActivePanel(null);
      setSuccess('Profil mis à jour');
    } catch {
      setError('Erreur réseau lors de la mise à jour du profil');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    setSavingPassword(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      });
      const json = (await res.json()) as UserMeApiResponse;

      if (!res.ok || !json.success || !json.data) {
        setError(json.message || 'Impossible de mettre à jour le mot de passe');
        return;
      }

      applyUser(json.data);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setActivePanel(null);
      setSuccess('Mot de passe mis à jour');
    } catch {
      setError('Erreur réseau lors de la mise à jour du mot de passe');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className={`min-h-screen ${THEME.bg} ${THEME.textMain}`}>
      <main className="max-w-5xl mx-auto py-12 px-4 space-y-8 animate-in fade-in">
        <Card className={`p-10 flex flex-col md:flex-row items-center gap-10 border-double border-4 ${THEME.border} ${THEME.surface}`}>
          <div className="w-40 h-40 rounded-3xl bg-red-900/10 border-4 border-red-900 flex items-center justify-center text-red-600 shadow-2xl relative">
            <User size={80} />
            <div className="absolute -bottom-3 bg-red-700 text-white px-4 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest shadow-lg border border-red-500">
              Nv. {level}
            </div>
          </div>

          <div className="text-center md:text-left space-y-6 flex-grow">
            {loading ? (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
              </div>
            ) : (
              <>
                <div>
                  <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter">
                    {user?.username ?? 'Inconnu'}
                  </h2>
                </div>

                <div className="flex flex-nowrap justify-center md:justify-start gap-3">
                  <Button
                    className={actionButtonClass}
                    onClick={() => setActivePanel((v) => (v === 'username' ? null : 'username'))}
                  >
                    Modifier le pseudo
                  </Button>
                  <Button
                    className={actionButtonClass}
                    onClick={() => setActivePanel((v) => (v === 'password' ? null : 'password'))}
                  >
                    Changer mot de passe
                  </Button>
                  <LogoutButton variant="profile" />
                </div>
              </>
            )}
          </div>
        </Card>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-300 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {success}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <Card className={`p-8 space-y-6 ${THEME.surface} ${THEME.borderLight}`}>
            <h3 className="text-xl font-bold text-white uppercase italic border-b border-white/5 pb-4 tracking-tight">
              Historique des Sessions
            </h3>
            <div className="space-y-4">
              {(user?.profile.totalGames ?? 0) === 0 ? (
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-sm text-gray-300">Aucune session pour le moment.</p>
                </div>
              ) : (
                Array.from({ length: Math.min(user?.profile.totalGames ?? 0, 3) }).map((_, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/[0.07] transition-all"
                  >
                    <div>
                      <p className="font-black text-sm text-white uppercase italic tracking-tight">
                        Session #{i + 1}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                        Historique de partie
                      </p>
                    </div>
                    <ChevronRight size={18} className="text-red-900" />
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className={`p-8 space-y-6 ${THEME.surface} ${THEME.borderLight}`}>
            <h3 className="text-xl font-bold text-white uppercase italic border-b border-white/5 pb-4 tracking-tight">
              Statistiques globales
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Stat
                label="Monstres occis"
                value={user?.profile.monstersDefeated ?? 0}
                icon={<AlertCircle size={16} />}
              />
              <Stat
                label="Coups critiques"
                value={user?.profile.naturalCrits ?? 0}
                icon={<Sparkles size={16} />}
              />
            </div>
          </Card>
        </div>

      </main>

      <EditUsernameModal
        isOpen={activePanel === 'username' && !!user}
        username={username}
        loading={savingProfile}
        onClose={() => setActivePanel(null)}
        onUsernameChange={setUsername}
        onSave={saveProfile}
        buttonClassName={formButtonClass}
      />

      <ChangePasswordModal
        isOpen={activePanel === 'password' && !!user}
        currentPassword={currentPassword}
        newPassword={newPassword}
        confirmNewPassword={confirmNewPassword}
        loading={savingPassword}
        onClose={() => setActivePanel(null)}
        onCurrentPasswordChange={setCurrentPassword}
        onNewPasswordChange={setNewPassword}
        onConfirmNewPasswordChange={setConfirmNewPassword}
        onSave={savePassword}
        buttonClassName={formButtonClass}
      />
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-black/20 p-4 rounded-xl text-center border border-red-900/10 shadow-inner">
      <p className="text-[9px] font-black text-gray-500 uppercase mb-1 tracking-widest flex items-center justify-center gap-1">
        <span className="text-gray-400">{icon}</span>
        {label}
      </p>
      <p className="text-3xl font-black text-gray-200 italic">{value}</p>
    </div>
  );
}
