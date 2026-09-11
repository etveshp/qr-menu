import Link from 'next/link';
import { Coffee } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF6EE] text-[#3E2F26] px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-[#F1ECE3] flex items-center justify-center mb-5">
        <Coffee className="w-7 h-7 text-[#C09E6D]" />
      </div>
      <h1 className="font-display text-3xl sm:text-4xl font-medium text-[#231913] mb-2">
        Сторінку не знайдено
      </h1>
      <p className="text-sm text-[#8E7A68] max-w-md mb-7">
        Можливо, посилання застаріло. Поверніться до меню, щоб продовжити.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-xl bg-[#C09E6D] hover:bg-[#ad8b5b] text-white text-sm font-semibold shadow-md active:scale-95 transition-all"
      >
        До меню
      </Link>
    </div>
  );
}
