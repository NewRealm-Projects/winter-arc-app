import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { PWARegister } from './components/PWARegister';
import { getCurrentUser } from './lib/getCurrentUser';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Winter Arc - Fitness Tracker',
  description: 'Progressive Web App für Fitness Tracking',
  themeColor: '#0f172a',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Winter Arc',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authState = await getCurrentUser();

  return (
    <html lang="de" className="dark">
      <body className={inter.className}>
        <AuthProvider
          session={authState.session}
          status={authState.status}
          user={authState.user}
          isOnboarded={authState.isOnboarded}
        >
          {children}
        </AuthProvider>
        <PWARegister />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
