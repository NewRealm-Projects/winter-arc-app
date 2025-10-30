'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '../hooks/useTranslation';
import { useIsMobile } from '../hooks/useIsMobile';
import { useStore } from '../store/useStore';
import { UserAvatar } from './ui/UserAvatar';

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const user = useStore((state) => state.user);

  // Hide BottomNav on mobile dashboard
  const hiddenNavOnMobileDashboard = isMobile && pathname === '/';

  const navItems = [
    { path: '/', labelKey: 'nav.dashboard', icon: '🏠' },
    { path: '/leaderboard', labelKey: 'nav.group', icon: '👥' },
    { path: '/input', labelKey: 'nav.input', icon: '📝' },
    { path: '/settings', labelKey: 'nav.settings', icon: user?.photoURL ? null : '⚙️', showAvatar: true },
  ];

  return (
    <div className="flex flex-col h-screen" data-testid="app-layout">
      {/* Main Content */}
      <main
        key={pathname}
        className="flex-1 overflow-y-auto transition-opacity duration-200"
      >
        <div className="animate-fade-in-up">{children}</div>
      </main>

      {/* Floating Bottom Navigation - Solid Modern Style - Hidden on mobile dashboard */}
      {!hiddenNavOnMobileDashboard && (
        <nav
          className="fixed left-1/2 -translate-x-1/2 bottom-5 z-50 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg px-4 py-2"
          data-testid="bottom-navigation"
        >
          <div className="flex items-center justify-center gap-4 animate-fade-in-up delay-400">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              const slug = item.path.replace(/^\//, '').replace(/\//g, '-') || 'dashboard';
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`touchable flex items-center justify-center w-12 h-12 rounded-[18px] transition-all duration-200 ${isActive
                      ? 'bg-blue-500 dark:bg-blue-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  aria-label={t(item.labelKey)}
                  data-testid={`nav-link-${slug}`}
                >
                  {item.showAvatar && user ? (
                    <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                      <UserAvatar user={user} size="sm" />
                    </div>
                  ) : (
                    <span
                      className={`text-2xl flex items-center justify-center transition-transform duration-200 ${isActive ? 'scale-110' : ''
                        }`}
                    >
                      {item.icon}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

export default Layout;

