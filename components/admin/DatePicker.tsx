'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';

type Lang = 'uk' | 'hu' | 'en';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  lang?: string;
  clearLabel?: string;
}

const MONTHS: Record<Lang, string[]> = {
  uk: ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'],
  hu: ['Január', 'Február', 'Március', 'Április', 'Május', 'Június', 'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

const WEEKDAYS: Record<Lang, string[]> = {
  uk: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
  hu: ['Hé', 'Ke', 'Sze', 'Cs', 'Pé', 'Szo', 'Vas'],
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
};

const toDate = (value: string): Date | null => {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

const toISO = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function DatePicker({ value, onChange, placeholder, lang = 'uk', clearLabel }: DatePickerProps) {
  const locale = (lang in MONTHS ? lang : 'uk') as Lang;
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => toDate(value) || new Date());
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = toDate(value);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [open]);

  const grid = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    // Week starts Monday.
    const leading = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < leading; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewDate]);

  const todayISO = toISO(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const formatted = value
    ? `${String(toDate(value)!.getDate()).padStart(2, '0')}.${String(toDate(value)!.getMonth() + 1).padStart(2, '0')}.${toDate(value)!.getFullYear()}`
    : '';

  const pick = (d: Date) => {
    onChange(toISO(d));
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => {
          // Open at the selected (or current) month.
          setViewDate(toDate(value) || new Date());
          setOpen((v) => !v);
        }}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-[#FAF6EE] border border-[#E6DFD5] text-sm text-left text-[#231913] focus:outline-none focus:border-[#C09E6D] rounded-xl transition-colors cursor-pointer"
      >
        <span className={value ? '' : 'text-[#8E7A68]'}>
          {formatted || placeholder || '—'}
        </span>
        <Calendar className="w-4 h-4 text-[#C09E6D] shrink-0" />
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-0 sm:absolute sm:inset-auto sm:top-full sm:left-0 sm:mt-2 sm:p-0 pointer-events-none">
          {/* Backdrop for mobile */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm sm:hidden pointer-events-auto" onClick={() => setOpen(false)} />

          <div className="relative pointer-events-auto w-full max-w-[320px] sm:max-w-[290px] bg-[#FDFBF7] border sm:border-[#E6DFD5] rounded-2xl sm:shadow-xl shadow-none sm:bg-[#FDFBF7] p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="w-8 h-8 rounded-full hover:bg-[#F1ECE3] text-[#4A3B32] flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-xl font-display font-semibold tracking-wide text-[#231913]">
              {MONTHS[locale][month]} {year}
            </div>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="w-8 h-8 rounded-full hover:bg-[#F1ECE3] text-[#4A3B32] flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS[locale].map((w, i) => (
              <div key={i} className="text-[10px] uppercase tracking-wider text-[#8E7A68] font-bold text-center py-1">
                {w}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {grid.map((d, i) => {
              if (!d) return <div key={i} className="h-9" />;
              const iso = toISO(d);
              const isSelected = selected && iso === toISO(selected);
              const isToday = iso === todayISO;
              // Past dates cannot be selected.
              const isDisabled = iso < todayISO;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => { if (!isDisabled) pick(d); }}
                  disabled={isDisabled}
                  className={`h-9 w-9 mx-auto rounded-full flex items-center justify-center text-sm transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#3E2F26] text-[#FAF6EE] font-bold shadow-md'
                      : isToday
                      ? 'text-[#C09E6D] font-bold ring-1 ring-[#C09E6D] hover:bg-[#F1ECE3]'
                      : isDisabled
                      ? 'text-[#C7BCAE] cursor-not-allowed'
                      : 'text-[#4A3B32] hover:bg-[#F1ECE3]'
                  }`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E6DFD5]">
            <button
              type="button"
              onClick={() => { pick(new Date()); }}
              className="text-[11px] uppercase tracking-wider font-semibold text-[#8E7A68] hover:text-[#3E2F26] transition-colors cursor-pointer"
            >
              {lang === 'hu' ? 'Ma' : lang === 'en' ? 'Today' : 'Сьогодні'}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false); }}
                className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider font-semibold text-[#C0453A] hover:text-[#a83329] transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
                {clearLabel || (lang === 'hu' ? 'Törlés' : lang === 'en' ? 'Clear' : 'Очистити')}
              </button>
            )}
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
