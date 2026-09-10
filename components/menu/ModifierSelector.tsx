'use client';

import { ChevronDown } from 'lucide-react';
import { localizedGroupName, localizedOptionName, type ModifierSelection } from '@/lib/modifiers';
import type { ModifierGroup } from '@/lib/supabase';
import type { Translator } from '@/lib/translator';

export interface ModifierSelectorProps {
  groups: ModifierGroup[];
  selection: ModifierSelection;
  onSetGroup: (groupId: string, optionIds: string[]) => void;
  lang: string;
  t: Translator;
}

const optionLabel = (option: ModifierGroup['options'][number], lang: string, currency: string): string => {
  const name = localizedOptionName(option, lang);
  return option.priceDelta > 0 ? `${name}  (+${option.priceDelta} ${currency})` : name;
};

export function ModifierSelector({ groups, selection, onSetGroup, lang, t }: ModifierSelectorProps) {
  if (groups.length === 0) return null;

  const fieldClass =
    'w-full px-3.5 py-2.5 bg-[#FDFBF7] border border-[#E6DFD5] text-[#231913] text-sm rounded-xl focus:outline-none focus:border-[#C09E6D]';

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const selected = selection[group.id] ?? [];
        const title = localizedGroupName(group, lang);

        return (
          <div key={group.id}>
            <span className="block font-bold uppercase tracking-wider text-[#8E7A68] text-xs mb-2">{title}</span>

            {group.type === 'single' ? (
              <div className="relative">
                <select
                  value={selected[0] ?? ''}
                  onChange={(e) => onSetGroup(group.id, e.target.value ? [e.target.value] : [])}
                  className={`${fieldClass} appearance-none pr-9 cursor-pointer`}
                  aria-label={title}
                >
                  <option value="">{t('chooseModifier')}</option>
                  {group.options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {optionLabel(option, lang, t('priceCurrency'))}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E7A68]" />
              </div>
            ) : (
              <select
                multiple
                size={Math.min(group.options.length, 4)}
                value={selected}
                onChange={(e) =>
                  onSetGroup(
                    group.id,
                    Array.from(e.target.options).filter((o) => o.selected).map((o) => o.value)
                  )
                }
                className={`${fieldClass} cursor-pointer`}
                aria-label={title}
              >
                {group.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {optionLabel(option, lang, t('priceCurrency'))}
                  </option>
                ))}
              </select>
            )}
          </div>
        );
      })}
    </div>
  );
}
