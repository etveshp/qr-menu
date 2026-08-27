'use client';

/* eslint-disable @next/next/no-img-element */

import { Download } from 'lucide-react';
import type { Translator } from '@/lib/translator';

interface QrGeneratorProps {
  tableNumber: string;
  qrCodeDataUrl: string;
  t: Translator;
  onTableNumberChange: (value: string) => void;
}

export function QrGenerator({ tableNumber, qrCodeDataUrl, t, onTableNumberChange }: QrGeneratorProps) {
  return (
    <div className="bg-[#FDFBF7] p-6 md:p-8 border border-[#E6DFD5] premium-shadow rounded-2xl">
      <h2 className="text-2xl font-display font-medium text-[#231913] mb-6 tracking-wide pb-2 border-b border-[#E6DFD5]">
        {t('qrGenerator')}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        <div className="md:col-span-5 flex flex-col items-center">
          <div className="p-4 bg-white border-2 border-[#C09E6D] shadow-sm flex items-center justify-center rounded-2xl">
            {qrCodeDataUrl ? (
              <div className="relative w-64 h-64">
                <img
                  src={qrCodeDataUrl}
                  alt={`QR Code for table ${tableNumber}`}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-64 h-64 bg-gray-100 animate-pulse flex items-center justify-center text-xs text-[#8E7A68] rounded-2xl">
                Генерація...
              </div>
            )}
          </div>
          <p className="mt-3 text-xs tracking-wider uppercase font-semibold text-[#8E7A68]">
            {t('tableShort')} №{tableNumber}
          </p>
        </div>

        <div className="md:col-span-7 space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#8E7A68] font-bold mb-2">
              {t('tableNumber')}
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={tableNumber}
              onChange={(e) => onTableNumberChange(e.target.value)}
              className="w-32 px-4 py-2.5 bg-[#FAF6EE] border border-[#E6DFD5] text-center font-bold text-lg text-[#231913] focus:outline-none focus:border-[#C09E6D] rounded-xl"
            />
            <p className="text-[11px] text-[#8E7A68] mt-1.5 leading-relaxed">
              Змініть номер столика, щоб згенерувати унікальний код. Коли клієнт сканує цей код, додаток автоматично привітає його за обраним столиком.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-[#E6DFD5]">
            <a
              href={qrCodeDataUrl}
              download={`svit_kavy_menu_table_${tableNumber}.png`}
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#3E2F26] text-[#FAF6EE] text-xs uppercase tracking-widest font-semibold hover:bg-[#231913] transition-colors rounded-xl"
            >
              <Download className="w-4 h-4" />
              {t('downloadQR')}
            </a>

            <button
              onClick={() => {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>Table ${tableNumber} QR Code</title>
                        <style>
                          body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background-color: #ffffff; color: #333333; }
                          h1 { font-size: 24px; margin-bottom: 5px; font-weight: 500; }
                          h2 { font-size: 16px; margin-top: 0; color: #777; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 2px; }
                          img { width: 320px; height: 320px; border: 4px solid #C09E6D; padding: 10px; border-radius: 16px; }
                          p { font-size: 14px; margin-top: 15px; color: #555; }
                        </style>
                      </head>
                      <body>
                        <h1>Світ Кави QR Меню</h1>
                        <h2>Table ${tableNumber}</h2>
                        <img src="${qrCodeDataUrl}" />
                        <p>Scan for beautiful interactive digital menu</p>
                        <script>window.onload = function() { window.print(); }</script>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                }
              }}
              className="px-5 py-3 bg-[#FAF6EE] border border-[#E6DFD5] text-[#3E2F26] text-xs uppercase tracking-widest font-semibold hover:bg-[#F1ECE3] transition-colors rounded-xl"
            >
              Роздрукувати
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
