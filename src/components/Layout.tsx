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
    { path: '/', labelKey: 'nav.dashboard', icon: '📊' },
    { path: '/tracking', labelKey: 'nav.tracking', icon: '✍️' },
    { path: '/leaderboard', labelKey: 'nav.group', icon: '👥' },
    { path: '/settings', labelKey: 'nav.settings', icon: '⚙️' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-16">{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-inset-bottom">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive
                    ? 'text-winter-600 dark:text-winter-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <span className="text-2xl mb-1">{item.icon}</span>
                <span className="text-xs font-medium">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default Layout;
