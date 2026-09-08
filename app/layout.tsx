import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import './globals.css'; // Global styles
import { ToastProvider } from '@/components/Toast';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#FAF6EE',
};

const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-display',
});

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://svitkavyqrmenu-five.vercel.app'),
  title: 'Світ Кави QR Меню',
  description: 'Вишукане цифрове меню Світ Кави. Обирайте найкращі напої та десерти за вашим столиком.',
  openGraph: {
    title: 'Світ Кави QR Меню',
    description: 'Вишукане цифрове меню Світ Кави. Обирайте найкращі напої та десерти за вашим столиком.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Світ Кави QR Меню',
    description: 'Вишукане цифрове меню Світ Кави.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="uk" className={`${cormorant.variable} ${manrope.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased text-[#4A3B32] bg-[#FAF8F5]">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}


