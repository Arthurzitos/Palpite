'use client';

import Link from 'next/link';
import { Search, Bell, LogIn, Wallet, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';

export function Header() {
  const { user, isAuthenticated } = useAuth();

  const balance = user?.balance ?? 1234;

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between gap-4 px-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar mercados..."
            className="h-10 pl-10 bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-primary rounded-lg"
          />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Balance */}
              <Link
                href="/wallet"
                className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 hover:bg-muted transition-colors"
              >
                <Wallet className="h-4 w-4 text-primary" />
                <span className="font-semibold">
                  R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Link>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500 text-[10px] font-bold text-black">
                  2
                </span>
              </Button>

              {/* User Menu */}
              <Button variant="ghost" size="sm" asChild>
                <Link href="/profile">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </Link>
              </Button>
            </>
          ) : (
            <Button asChild className="bg-primary hover:bg-primary/90 rounded-full px-5">
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Entrar
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
