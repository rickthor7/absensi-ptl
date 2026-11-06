import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/lib/store';
import AppShell from '@/components/layout/AppShell';

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.absenptl.web.id'),
  title: 'Pondok Pesantren Nurul Falah — Presensi GPS & Administrasi SPP Terpadu',
  description:
    'Sistem presensi santri terpadu Pondok Pesantren Nurul Falah, Ketintang, Surabaya berbasis selfie kamera, geotag GPS presisi, dan pembayaran SPP bulanan.',
  keywords: [
    'Absensi Santri',
    'Pondok Pesantren Nurul Falah',
    'Ketintang Surabaya',
    'SPP Santri',
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
    title: 'Pondok Pesantren Nurul Falah — Presensi GPS & Administrasi SPP',
    description:
      'Sistem presensi santri terpadu berbasis selfie kamera & validasi koordinat GPS pondok, serta administrasi pembayaran SPP bulanan.',
    url: 'https://www.absenptl.web.id',
    siteName: 'Pesantren Nurul Falah Ketintang',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Pondok Pesantren Nurul Falah Surabaya — Presensi & Administrasi SPP',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pondok Pesantren Nurul Falah — Presensi GPS & Administrasi SPP',
    description:
      'Sistem presensi santri terpadu berbasis selfie kamera, geotag GPS presisi, dan administrasi pembayaran SPP bulanan.',
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
      <body className="min-h-full flex flex-col bg-[#F4F7F5] text-stone-900 dark:bg-[#07130F] dark:text-[#E8F0EC] antialiased transition-colors duration-200">
        <StoreProvider>
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  );
}
