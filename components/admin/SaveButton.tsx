'use client';

import { Check, Loader2 } from 'lucide-react';

export type SaveStatus = 'idle' | 'saving' | 'saved';

interface SaveButtonProps {
  status: SaveStatus;
  onClick: () => void;
  idleText: string;
  savingText?: string;
  savedText?: string;
  disabled?: boolean;
}

export function SaveButton({
  status,
  onClick,
  idleText,
  savingText = 'Збереження...',
  savedText = 'Збережено!',
  disabled,
}: SaveButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || status === 'saving'}
      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
        status === 'saved'
          ? 'bg-[#C09E6D]/20 text-[#C09E6D] border border-[#C09E6D]/40'
          : 'bg-[#C09E6D] hover:bg-[#ad8b5b] text-white shadow-md'
      } ${disabled && status === 'idle' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {status === 'saving' && <Loader2 className="w-4.5 h-4.5 animate-spin" />}
      {status === 'saved' && <Check className="w-4.5 h-4.5" />}
      {status === 'saving' ? savingText : status === 'saved' ? savedText : idleText}
    </button>
  );
}