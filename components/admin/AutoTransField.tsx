'use client';

import { useState } from 'react';
import { Languages, Loader2 } from 'lucide-react';

export type LangCode = 'uk' | 'hu' | 'en';

export interface AutoTransFieldProps {
  /** Label of the field group (rendered with a header row). Omit to render bare. */
  label?: string;
  /** Text currently stored for the *default/source* language. */
  sourceText: string;
  /** Text currently stored for the *current* language. */
  currentValue: string;
  sourceLang: LangCode;
  currentLang: LangCode;
  /** Unique id of this field group (used for the session overrides). */
  baseId: string;
  /** Session overrides map (persists while the cabinet is open). */
  session: Record<string, string>;
  /** Merge new session overrides. */
  onSession: (next: Record<string, string>) => void;
  /** Write into the current-language form field. */
  onChange: (text: string) => void;
  multiline?: boolean;
  /** Default visible rows for a multiline field. */
  rows?: number;
  /** Slightly larger text (used for greeting fields). */
  biggerText?: boolean;
  placeholder?: string;
  required?: boolean;
}

export function AutoTransField({
  label,
  sourceText,
  currentValue,
  sourceLang,
  currentLang,
  baseId,
  session,
  onSession,
  onChange,
  multiline,
  rows,
  biggerText,
  placeholder,
  required,
}: AutoTransFieldProps) {
  const [busy, setBusy] = useState(false);
  const key = `${baseId}:${currentLang}`;

  const isSource = currentLang === sourceLang;
  // For other languages show the stored translation when it exists (even after a
  // reload), and fall back to the default-language text only if there is none.
  const display = isSource
    ? currentValue
    : currentValue && currentValue.trim()
    ? currentValue
    : (session[key] ?? sourceText);

  const translate = async () => {
    if (busy || !sourceText.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sourceText, target: currentLang }),
      });
      const data = await res.json().catch(() => ({}));
      const translated: string = data?.translated ?? sourceText;
      onChange(translated);
      onSession({ ...session, [key]: translated });
    } finally {
      setBusy(false);
    }
  };

  const handleChange = (value: string) => {
    onChange(value);
    if (!isSource) {
      onSession({ ...session, [key]: value });
    }
  };

  const fieldClass =
    'w-full px-3 bg-[#FDFBF7] border border-[#E6DFD5] text-[#231913] focus:outline-none focus:border-[#C09E6D]';
  const showTranslate = !isSource && sourceText.trim().length > 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="block text-xs uppercase tracking-wider text-[#8E7A68] font-semibold">{label ?? ''}</label>
      </div>

      <div className="relative">
        {multiline ? (
          <textarea
            value={display}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            rows={rows ?? 4}
            className={`${fieldClass} ${biggerText ? 'text-sm' : 'text-xs'} rounded-xl py-2.5 ${showTranslate ? 'pr-12' : ''}`}
          />
        ) : (
          <input
            type="text"
            value={display}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className={`${fieldClass} text-sm rounded-xl py-2.5 ${showTranslate ? 'pr-12' : ''}`}
          />
        )}

        {showTranslate && (
          <button
            type="button"
            onClick={translate}
            disabled={busy}
            title="Auto-translate"
            aria-label="Auto-translate"
            className={`absolute right-1.5 ${multiline ? 'top-1.5' : 'top-1/2 -translate-y-1/2'} w-8 h-8 rounded-full bg-[#C09E6D]/15 text-[#3E2F26] hover:bg-[#C09E6D]/30 active:scale-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center`}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin text-[#C09E6D]" /> : <Languages className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
