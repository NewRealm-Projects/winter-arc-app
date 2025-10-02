import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { path: '/', labelKey: 'nav.dashboard', icon: 'ðŸ“Š' },
    { path: '/leaderboard', labelKey: 'nav.group', icon: 'ðŸ‘¥' },
    { path: '/settings', labelKey: 'nav.settings', icon: 'âš™ï¸' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Main Content */}
      <main key={location.pathname} className="flex-1 overflow-y-auto pb-24">
        <div className="animate-fade-in-up">
          {children}
        </div>
      </main>

      {/* Floating Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 flex justify-center pb-4 safe-area-inset-bottom pointer-events-none">
        <div className="pointer-events-auto backdrop-blur-[15px] bg-white/80 dark:bg-gray-800/80 rounded-[30px] px-6 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/20 dark:border-gray-700/30">
          <div className="flex gap-2 items-center">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex flex-col items-center justify-center px-6 py-2 rounded-2xl transition-all duration-200 ${
                    isActive
                      ? 'bg-winter-600/10 dark:bg-winter-400/10 scale-105'
                      : 'hover:scale-110 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span
                    className={`text-3xl mb-1 transition-all duration-200 ${
                      isActive
                        ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                        : 'group-hover:drop-shadow-[0_0_6px_rgba(59,130,246,0.3)]'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className={`text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-winter-600 dark:text-winter-400'
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                  }`}>
                    {t(item.labelKey)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Layout;

