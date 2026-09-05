'use client';

/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Check, X, FileCode2, ChevronDown, Loader2, Save } from 'lucide-react';
import type { Translator } from '@/lib/translator';

interface QrGeneratorProps {
  tableNumber: string;
  qrCodeDataUrl: string;
  t: Translator;
  onTableNumberChange: (value: string) => void;
  /** Optional fixed card height (used to match the sidebar on lg+). */
  fixedHeight?: number;
  /** Whether the table number is shown in the header/greeting (admin toggle). */
  showTableNumber?: boolean;
  onShowTableNumberChange?: (value: boolean) => void;
  /** Persist the currently generated QR into the "Готові QR-коди" list/DB. */
  onSaveQr?: () => void;
}

export function QrGenerator({ tableNumber, qrCodeDataUrl, t, onTableNumberChange, fixedHeight, showTableNumber, onShowTableNumberChange, onSaveQr }: QrGeneratorProps) {
  const [downloading, setDownloading] = useState<'png' | 'svg' | null>(null);
  const [formatOpen, setFormatOpen] = useState(false);
  const downloadBtnRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  const toggleFormat = () => {
    if (formatOpen) {
      setFormatOpen(false);
      return;
    }
    const rect = downloadBtnRef.current?.getBoundingClientRect();
    if (rect) {
      // Fixed position relative to the viewport → the menu is never clipped
      // by the section/card overflow.
      setMenuPos({ top: rect.bottom + 6, left: Math.max(8, rect.left) });
    }
    setFormatOpen(true);
  };

  const qrUrl = () => (typeof window !== 'undefined' ? `${window.location.origin}?table=${tableNumber}` : '');

  const triggerDownload = (blob: Blob, filename: string) => {
    const a = document.createElement('a');
    const objectUrl = URL.createObjectURL(blob);
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  };

  const downloadPngHi = async () => {
    if (!qrCodeDataUrl || downloading) return;
    setDownloading('png');
    try {
      const dataUrl = await QRCode.toDataURL(qrUrl(), {
        width: 2048,
        margin: 2,
        color: { dark: '#3E2F26', light: '#FAF6EE' },
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      triggerDownload(blob, `svit_kavy_menu_table_${tableNumber}.png`);
    } catch (err) {
      console.error('PNG export failed', err);
    } finally {
      setDownloading(null);
    }
  };

  const downloadSvg = async () => {
    if (!qrCodeDataUrl || downloading) return;
    setDownloading('svg');
    try {
      const svg = await QRCode.toString(qrUrl(), {
        type: 'svg',
        margin: 2,
        color: { dark: '#3E2F26', light: '#FAF6EE' },
      });
      triggerDownload(new Blob([svg], { type: 'image/svg+xml' }), `svit_kavy_menu_table_${tableNumber}.svg`);
    } catch (err) {
      console.error('SVG export failed', err);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div
      className="bg-[#FDFBF7] p-6 md:p-8 border border-[#E6DFD5] premium-shadow rounded-2xl lg:flex lg:flex-col lg:min-h-0"
      style={fixedHeight ? { height: fixedHeight } : undefined}
    >
      <h2 className="text-2xl font-display font-medium text-[#231913] mb-4 tracking-wide pb-2 border-b border-[#E6DFD5] shrink-0">
        {t('qrGenerator')}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 lg:gap-2 items-center lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
        <div className="md:col-span-5 flex flex-col lg:col-span-3 lg:items-start">
          {/* Square frame: on mobile it fills the full content width (aspect 1:1),
              on lg+ it collapses to a compact square aligned left. */}
          <div className="w-full aspect-square lg:aspect-auto lg:w-36 lg:h-36 bg-white border-2 border-[#C09E6D] shadow-sm rounded-2xl p-4 lg:p-2 flex items-center justify-center">
            {qrCodeDataUrl ? (
              <div className="relative w-full h-full">
                <img
                  src={qrCodeDataUrl}
                  alt={`QR Code for table ${tableNumber}`}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center text-xs text-[#8E7A68] rounded-xl">
                Генерація...
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-7 space-y-5 lg:col-span-9 lg:space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#8E7A68] font-bold mb-2">
              {t('tableNumber')}
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="number"
                min="1"
                max="100"
                value={tableNumber}
                onChange={(e) => onTableNumberChange(e.target.value)}
                className="w-20 px-3 py-1.5 bg-[#FAF6EE] border border-[#E6DFD5] text-center font-bold text-base text-[#231913] focus:outline-none focus:border-[#C09E6D] rounded-lg"
              />
              <div className="flex-1 min-w-0 lg:flex-none flex">
                <button
                  ref={downloadBtnRef}
                  type="button"
                  disabled={!qrCodeDataUrl || !!downloading}
                  onClick={toggleFormat}
                  className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#C09E6D] text-white text-[11px] uppercase tracking-widest font-semibold hover:bg-[#ad8b5b] transition-colors rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloading ? <Loader2 className="w-4 h-4 animate-spin text-[#FAF6EE]" /> : <Download className="w-4 h-4" />}
                  {downloading ? t('saving') : t('downloadQR')}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${formatOpen ? 'rotate-180' : ''}`} />
                </button>

                {formatOpen && !downloading && menuPos && (
                  <>
                    <div className="fixed inset-0 z-[110]" onClick={() => setFormatOpen(false)} />
                    <div
                      className="fixed z-[120] w-56 bg-[#FDFBF7] border border-[#E6DFD5] rounded-xl shadow-2xl overflow-hidden py-1"
                      style={{ top: menuPos.top, left: menuPos.left }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setFormatOpen(false);
                          downloadPngHi();
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-semibold text-[#3E2F26] hover:bg-[#F1ECE3] transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-[#C09E6D] shrink-0" />
                        {t('downloadPngHi')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormatOpen(false);
                          downloadSvg();
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-semibold text-[#3E2F26] hover:bg-[#F1ECE3] transition-colors cursor-pointer"
                      >
                        <FileCode2 className="w-4 h-4 text-[#C09E6D] shrink-0" />
                        {t('downloadSvg')}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {onSaveQr && (
                <button
                  type="button"
                  disabled={!qrCodeDataUrl || !!downloading}
                  onClick={onSaveQr}
                  className="hidden lg:inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3E2F26] text-[#FAF6EE] text-[11px] uppercase tracking-widest font-semibold hover:bg-[#231913] transition-colors rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {t('saveQrButton')}
                </button>
              )}
            </div>
            <p className="text-[11px] text-[#8E7A68] mt-1.5 leading-relaxed">
              Змініть номер столика, щоб згенерувати унікальний код. Коли клієнт сканує цей код, додаток автоматично привітає його за обраним столиком.
            </p>

            {typeof showTableNumber === 'boolean' && onShowTableNumberChange && (
              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-[#231913] leading-snug min-w-0">
                  {t('addTableToGreetingHeader')}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showTableNumber}
                  aria-label={t('addTableToGreetingHeader')}
                  onClick={() => onShowTableNumberChange(!showTableNumber)}
                  className={`relative inline-flex shrink-0 w-12 h-7 rounded-full transition-colors duration-200 cursor-pointer border ${
                    showTableNumber ? 'bg-[#C09E6D] border-[#C09E6D]' : 'bg-[#E6DFD5] border-[#D5CBBF]'
                  }`}
                >
                  <span
                    className={`absolute top-1/2 -translate-y-1/2 left-0.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-200 ${
                      showTableNumber ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  >
                    {showTableNumber ? <Check className="w-3.5 h-3.5 text-[#3E2F26] stroke-[3]" /> : <X className="w-3.5 h-3.5 text-[#8E7A68]" />}
                  </span>
                </button>
              </div>
            )}

            {onSaveQr && (
              <button
                type="button"
                disabled={!qrCodeDataUrl || !!downloading}
                onClick={onSaveQr}
                className="mt-5 w-full lg:hidden inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3E2F26] text-[#FAF6EE] text-[11px] uppercase tracking-widest font-semibold hover:bg-[#231913] transition-colors rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {t('saveQrButton')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
