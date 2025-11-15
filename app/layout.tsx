import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { Telemetry } from './components/Telemetry';
import { ThemeProvider } from '@/app/contexts/ThemeContext';
import { PWARegister } from './components/PWARegister';
import { getCurrentUser } from './lib/getCurrentUser';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Winter Arc - Fitness Tracker',
  description: 'Progressive Web App für Fitness Tracking',
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f172a',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authState = await getCurrentUser();

  return (
    <html lang="de" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider
            session={authState.session}
            status={authState.status}
            user={authState.user}
            isOnboarded={authState.isOnboarded}
          >
            {children}
          </AuthProvider>
        </ThemeProvider>
        <PWARegister />
        <Telemetry />
      </body>
    </html>
  );
}
