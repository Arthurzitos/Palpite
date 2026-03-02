'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Radio,
  TrendingUp,
  Flame,
  Sparkles,
  LayoutGrid,
  Landmark,
  Bitcoin,
  Trophy,
  Palette,
  LineChart,
  Globe,
  Wallet,
  History,
  PieChart,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@prediction-market/shared';

const navigation = [
  { name: 'Mercados', href: '/markets', icon: BarChart3 },
  { name: 'Ao Vivo', href: '/markets?filter=live', icon: Radio, badge: 3 },
  { name: 'Trending', href: '/markets?filter=trending', icon: TrendingUp },
  { name: 'Populares', href: '/markets?filter=popular', icon: Flame },
  { name: 'Novos', href: '/markets?filter=new', icon: Sparkles },
];

const categories = [
  { name: 'Todos', href: '/markets', icon: LayoutGrid },
  { name: 'Política', href: '/markets?category=politica', icon: Landmark },
  { name: 'Crypto', href: '/markets?category=crypto', icon: Bitcoin, prefix: '₿' },
  { name: 'Esportes', href: '/markets?category=esportes', icon: Trophy },
  { name: 'Cultura', href: '/markets?category=cultura', icon: Palette },
  { name: 'Economia', href: '/markets?category=economia', icon: LineChart },
  { name: 'Mundo', href: '/markets?category=mundo', icon: Globe },
];

const userLinks = [
  { name: 'Carteira', href: '/wallet', icon: Wallet },
  { name: 'Histórico', href: '/history', icon: History },
  { name: 'Portfolio', href: '/portfolio', icon: PieChart },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === UserRole.ADMIN;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[var(--sidebar-width)] border-r border-border bg-background hidden lg:block">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 px-6">
          <div className="flex gap-0.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          </div>
          <Link href="/" className="text-xl font-bold">
            pal<span className="text-primary">pite</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href === '/markets' && pathname === '/markets');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
                {item.badge && (
                  <span
                    className={cn(
                      'ml-auto rounded-full px-2 py-0.5 text-xs font-medium',
                      isActive
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-destructive text-destructive-foreground'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Categories */}
          <div className="pt-6">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Categorias
            </p>
            {categories.map((item) => {
              const isActive = pathname + (typeof window !== 'undefined' ? window.location.search : '') === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Links */}
        <div className="border-t border-border px-3 py-4">
          {userLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary border-l-2 border-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Admin Link */}
        {isAdmin && (
          <div className="border-t border-border px-3 py-4">
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                pathname.startsWith('/admin')
                  ? 'bg-yellow-500/20 text-yellow-500 border-l-2 border-yellow-500'
                  : 'text-yellow-500 hover:bg-yellow-500/10'
              )}
            >
              <Settings className="h-5 w-5" />
              Admin
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
