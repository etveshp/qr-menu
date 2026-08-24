'use client';

import { Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Видалити',
  cancelLabel = 'Скасувати',
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#FDFBF7] rounded-3xl border border-[#E6DFD5] shadow-2xl p-6 sm:p-7 text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 border border-red-200 text-red-700 flex items-center justify-center mx-auto mb-4 shadow-xs">
          <Trash2 className="w-7 h-7" />
        </div>
        <h3 className="font-display font-medium text-xl text-[#231913] mb-2">{title}</h3>
        <p className="text-xs text-[#8E7A68] leading-relaxed mb-6">{message}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 bg-[#FAF6EE] hover:bg-[#F1ECE3] text-[#3E2F26] text-xs font-semibold uppercase tracking-wider rounded-xl border border-[#E6DFD5] transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-md transition-colors cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
