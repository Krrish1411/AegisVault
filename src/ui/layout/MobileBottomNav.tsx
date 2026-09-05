import { NavLink } from 'react-router-dom';
import { Shield, Key, CreditCard, ShieldCheck, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const tabs = [
    { to: '/dashboard', label: 'Vault', icon: Shield },
    { to: '/passwords', label: 'Logins', icon: Key },
    { to: '/cards', label: 'Cards', icon: CreditCard },
    { to: '/security-center', label: 'Security', icon: ShieldCheck },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-line bg-card/95 backdrop-blur-md px-2 safe-area-bottom shadow-lg select-none"
    >
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center min-w-[56px] min-h-[44px] px-2 py-1 rounded-xl text-[10px] font-medium transition-all active:scale-95',
                isActive
                  ? 'text-pine-700 dark:text-pine-300 font-bold bg-pine-50/90 dark:bg-pine-950/60 border border-pine-200/60 dark:border-pine-800/60 shadow-xs'
                  : 'text-ink/60 hover:text-ink'
              )
            }
          >
            <IconComponent className="h-5 w-5 mb-0.5" />
            <span>{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
