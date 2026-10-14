import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/lib/store';
import Navbar from '@/components/layout/Navbar';
import MobileNav from '@/components/layout/MobileNav';

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Absensi Santri - Pondok Pesantren Nurul Falah Ketintang Surabaya',
  description:
    'Sistem absensi santri terpadu Pondok Pesantren Nurul Falah, Ketintang, Surabaya berbasis selfie kamera dan geotag lokasi presisi.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0B3D2E',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className={`${jakartaSans.variable} h-full`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('absensi_santri_theme');
                  if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--cream-bg)] text-[var(--text-primary)] dark:bg-[#080F0C] dark:text-[#E8F0EC] antialiased transition-colors duration-300">
        <StoreProvider>
          <Navbar />
          <main className="flex-1 pb-20 lg:pb-12">{children}</main>
          <MobileNav />
        </StoreProvider>
      </body>
    </html>
  );
}
