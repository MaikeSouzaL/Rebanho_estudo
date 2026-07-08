import type { Metadata, Viewport } from 'next';
import { Inter, Merriweather } from 'next/font/google';
import { PwaRegister } from '@/components/PwaRegister';
import { SplashScreen } from '@/components/SplashScreen';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EBD · O Rebanho de Jesus Cristo',
  description:
    'Escola Bíblica Dominical da Igreja Pentecostal O Rebanho de Jesus Cristo: leitura fluida, narração, versículos interativos e revisão. Funciona offline.',
  applicationName: 'EBD Rebanho',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EBD Rebanho',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0c2a47',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${merriweather.variable} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-bg text-ink antialiased">
        <PwaRegister />
        <SplashScreen />
        {children}
      </body>
    </html>
  );
}
