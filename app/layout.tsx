import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { Telemetry } from './components/Telemetry';
import { PWARegister } from './components/PWARegister';
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <PWARegister />
        <Telemetry />
      </body>
    </html>
  );
}
