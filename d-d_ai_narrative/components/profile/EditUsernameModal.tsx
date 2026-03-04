'use client';

import { Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface EditUsernameModalProps {
  isOpen: boolean;
  username: string;
  loading: boolean;
  onClose: () => void;
  onUsernameChange: (value: string) => void;
  onSave: () => void;
  buttonClassName: string;
}

export function EditUsernameModal({
  isOpen,
  username,
  loading,
  onClose,
  onUsernameChange,
  onSave,
  buttonClassName,
}: EditUsernameModalProps) {
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
          <h3 className="text-xl font-bold text-white uppercase italic tracking-tight">Modifier le pseudo</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-1.5 w-full">
          <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-1">Pseudo</label>
          <Input
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            className="bg-black/40 border-white/10"
          />
        </div>

        <Button onClick={onSave} disabled={loading} className={`w-full ${buttonClassName}`}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            'Enregistrer le pseudo'
          )}
        </Button>
      </Card>
    </div>
  );
}
