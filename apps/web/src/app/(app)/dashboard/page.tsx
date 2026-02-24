'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  Target,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useMyBets, useMyStats } from '@/hooks/use-bets';
import { cn } from '@/lib/utils';
import { Event } from '@/lib/api';

const statusConfig = {
  active: { label: 'Ativa', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  won: { label: 'Ganhou', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
  lost: { label: 'Perdeu', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  refunded: { label: 'Reembolsado', icon: RefreshCw, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
};

export default function DashboardPage() {
  const { user, isAuthenticated, fetchUser } = useAuth();
  const { bets, isLoading: betsLoading } = useMyBets({ limit: 5 });
  const { stats, isLoading: statsLoading } = useMyStats();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold mb-4">Faça login para ver seu dashboard</h1>
        <Button asChild>
          <Link href="/login">Fazer Login</Link>
        </Button>
      </div>
    );
  }

  const isLoading = betsLoading || statsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Olá, {user?.username || 'Usuário'}!
        </h1>
        <p className="text-muted-foreground">
          Acompanhe suas apostas e performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${user?.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0.00'}
            </div>
            <Link
              href="/wallet"
              className="text-xs text-primary hover:underline"
            >
              Depositar
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Apostado</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.totalWagered.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalBets || 0} apostas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganhos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              +${stats?.totalWon.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Win rate: {stats?.winRate || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Apostas Ativas</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {stats?.activeBets || 0}
            </div>
            <Link
              href="/markets"
              className="text-xs text-primary hover:underline"
            >
              Ver mercados
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Apostas Recentes</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/history" className="flex items-center gap-1">
              Ver todas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : bets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground mb-4">
                Você ainda não fez nenhuma aposta
              </p>
              <Button asChild>
                <Link href="/markets">Explorar Mercados</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {bets.map((bet) => {
                const status = statusConfig[bet.status as keyof typeof statusConfig] || statusConfig.active;
                const StatusIcon = status.icon;
                const event = bet.eventId as Event;

                return (
                  <div
                    key={bet._id}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn('rounded-full p-2', status.bg)}>
                        <StatusIcon className={cn('h-4 w-4', status.color)} />
                      </div>
                      <div>
                        <p className="font-medium">
                          {typeof event === 'object' && event?.title
                            ? event.title
                            : 'Evento'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ${bet.amount.toLocaleString('pt-BR')} @ {bet.oddsAtPurchase.toFixed(2)}x
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn('text-sm font-medium', status.color)}>
                        {status.label}
                      </span>
                      {bet.status === 'won' && (
                        <p className="text-sm text-green-500 font-medium">
                          +${bet.payout.toLocaleString('pt-BR')}
                        </p>
                      )}
                      {bet.status === 'active' && (
                        <p className="text-xs text-muted-foreground">
                          Potencial: ${bet.potentialPayout.toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Explorar Mercados</h3>
                <p className="text-sm text-muted-foreground">
                  Encontre novas oportunidades de aposta
                </p>
              </div>
              <Button asChild>
                <Link href="/markets">Ver Mercados</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-500/10 p-3">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Depositar</h3>
                <p className="text-sm text-muted-foreground">
                  Adicione fundos à sua carteira
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/wallet">Ir para Carteira</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
