'use client';

import { useState } from 'react';
import { Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface ChangePasswordModalProps {
  isOpen: boolean;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  loading: boolean;
  onClose: () => void;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmNewPasswordChange: (value: string) => void;
  onSave: () => void;
  buttonClassName: string;
}

const PASSWORD_CRITERIA = [
  { label: '8 caractères minimum', test: (p: string) => p.length >= 8 },
  { label: 'Une majuscule', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Un chiffre', test: (p: string) => /[0-9]/.test(p) },
];

export function ChangePasswordModal({
  isOpen,
  currentPassword,
  newPassword,
  confirmNewPassword,
  loading,
  onClose,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmNewPasswordChange,
  onSave,
  buttonClassName,
}: ChangePasswordModalProps) {
  const [passwordFocused, setPasswordFocused] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-lg p-8 space-y-4 bg-[#16161a] border border-white/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h3 className="text-xl font-bold text-white uppercase italic tracking-tight">
            Changement mot de passe
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <Field label="Mot de passe actuel">
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => onCurrentPasswordChange(e.target.value)}
            className="bg-black/40 border-white/10"
          />
        </Field>

        <Field label="Nouveau mot de passe">
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => onNewPasswordChange(e.target.value)}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            className="bg-black/40 border-white/10"
          />
          <PasswordCriteria
            password={newPassword}
            visible={passwordFocused || !!newPassword}
          />
        </Field>

        <Field label="Confirmation">
          <Input
            type="password"
            value={confirmNewPassword}
            onChange={(e) => onConfirmNewPasswordChange(e.target.value)}
            className="bg-black/40 border-white/10"
          />
        </Field>

        <Button onClick={onSave} disabled={loading} className={`w-full ${buttonClassName}`}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            'Mettre à jour le mot de passe'
          )}
        </Button>
      </Card>
    </div>
  );
}

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 w-full">
      <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">{label}</label>
      {children}
    </div>
  );
}
