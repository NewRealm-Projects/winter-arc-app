import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import FloatingActionButton from './FloatingActionButton';

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { path: '/', labelKey: 'nav.dashboard', icon: '🏠' },
    { path: '/leaderboard', labelKey: 'nav.group', icon: '👥' },
    { path: '/notes', labelKey: 'nav.notes', icon: '📝' },
    { path: '/settings', labelKey: 'nav.settings', icon: '⚙️' },
  ];

  return (
    <div className="flex flex-col h-screen">
      {/* Main Content */}
      <main
        key={location.pathname}
        className="flex-1 overflow-y-auto pb-20 md:pb-24 transition-opacity duration-200"
      >
        <div className="animate-fade-in-up">{children}</div>
      </main>

      {/* Floating Bottom Navigation - Glassmorphism Style */}
      <nav className="fixed left-1/2 -translate-x-1/2 bottom-5 z-50 rounded-2xl bg-white/5 dark:bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_6px_24px_rgba(0,0,0,0.25)] px-4 py-2">
        <div className="flex items-center justify-center gap-4 animate-fade-in-up delay-400">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`touchable flex items-center justify-center w-12 h-12 rounded-[18px] transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-b from-violet-600/40 to-blue-500/40 text-blue-100 shadow-[0_8px_24px_rgba(59,130,246,0.45)]'
                    : 'text-blue-100/70 hover:bg-white/10'
                }`}
                aria-label={t(item.labelKey)}
              >
                <span
                  className={`text-2xl flex items-center justify-center transition-transform duration-200 ${
                    isActive ? 'scale-110' : ''
                  }`}
                >
                  {item.icon}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Floating Action Button with Radial Menu */}
      <FloatingActionButton />
    </div>
  );
}

export default Layout;
