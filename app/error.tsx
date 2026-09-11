'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF6EE] text-[#3E2F26] px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-[#F1ECE3] flex items-center justify-center mb-5">
        <AlertTriangle className="w-7 h-7 text-[#C09E6D]" />
      </div>
      <h1 className="font-display text-3xl sm:text-4xl font-medium text-[#231913] mb-2">
        Щось пішло не так
      </h1>
      <p className="text-sm text-[#8E7A68] max-w-md mb-7">
        Сталася помилка. Спробуйте оновити сторінку або повернутися до меню.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="px-6 py-3 rounded-xl bg-[#C09E6D] hover:bg-[#ad8b5b] text-white text-sm font-semibold shadow-md active:scale-95 transition-all"
        >
          Спробувати знову
        </button>
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-[#F1ECE3] hover:bg-[#E6DFD5] text-[#3E2F26] text-sm font-semibold active:scale-95 transition-all"
        >
          До меню
        </Link>
      </div>
    </div>
  );
}
