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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.absenptl.web.id'),
  title: 'Pondok Pesantren Nurul Falah — Presensi GPS & Keuangan SPP Terpadu',
  description:
    'Sistem presensi santri terpadu Pondok Pesantren Nurul Falah, Ketintang, Surabaya berbasis selfie kamera, geotag GPS presisi, pembayaran SPP bulanan, dan transparansi keuangan kas terbuka.',
  keywords: [
    'Absensi Santri',
    'Pondok Pesantren Nurul Falah',
    'Ketintang Surabaya',
    'SPP Santri',
    'Transparansi Keuangan Pesantren',
    'Presensi GPS',
    'Absen PTL',
  ],
  alternates: {
    canonical: 'https://www.absenptl.web.id',
  },
  icons: {
    icon: [
      { url: '/icon.jpg', sizes: '512x512', type: 'image/jpeg' },
    ],
    apple: [
      { url: '/apple-icon.jpg', sizes: '512x512', type: 'image/jpeg' },
    ],
  },
  openGraph: {
    title: 'Pondok Pesantren Nurul Falah — Presensi GPS & Keuangan SPP',
    description:
      'Sistem presensi santri terpadu berbasis selfie kamera & validasi koordinat GPS pondok, pembayaran SPP bulanan, dan transparansi keuangan publik.',
    url: 'https://www.absenptl.web.id',
    siteName: 'Pesantren Nurul Falah Ketintang',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Pondok Pesantren Nurul Falah Surabaya — Presensi & Keuangan SPP',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pondok Pesantren Nurul Falah — Presensi GPS & Keuangan SPP',
    description:
      'Sistem presensi santri terpadu berbasis selfie kamera, geotag GPS presisi, pembayaran SPP bulanan, dan transparansi kas terbuka.',
    images: ['/og-image.jpg'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#082F23',
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
