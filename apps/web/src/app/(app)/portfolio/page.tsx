'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { betsApi, Bet, BetStats, Event } from '@/lib/api';

type FilterType = 'all' | 'active' | 'won' | 'lost';

interface Position {
  id: string;
  eventId: string;
  eventTitle: string;
  category: string;
  outcome: 'yes' | 'no';
  entryPrice: number;
  currentPrice: number;
  shares: number;
  invested: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  status: 'open' | 'won' | 'lost';
  endsIn?: string;
}

const categoryMap: Record<string, string> = {
  sports: 'Esportes',
  crypto: 'Crypto',
  politics: 'Política',
  entertainment: 'Cultura',
  other: 'Outros',
};

function formatTimeRemaining(closesAt: string): string {
  const now = new Date();
  const closes = new Date(closesAt);
  const diff = closes.getTime() - now.getTime();

  if (diff <= 0) return 'Encerrado';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `Encerra ${days}d`;
  if (hours > 0) return `Encerra ${hours}h`;
  return `Encerra ${minutes}m`;
}

export default function PortfolioPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [filter, setFilter] = useState<FilterType>('all');
  const [positions, setPositions] = useState<Position[]>([]);
  const [stats, setStats] = useState<BetStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setPositions([]);
      setStats(null);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [betsResponse, statsResponse] = await Promise.all([
          betsApi.getMyBets({ limit: 100 }),
          betsApi.getMyStats(),
        ]);

        const transformedPositions: Position[] = betsResponse.bets.map((bet: Bet) => {
          const event = bet.eventId as Event;
          const eventTitle = typeof event === 'object' ? event.title : 'Evento';
          const eventCategory = typeof event === 'object' ? event.category : 'other';
          const eventClosesAt = typeof event === 'object' ? event.closesAt : new Date().toISOString();
          const eventStartsAt = typeof event === 'object' ? event.startsAt : undefined;
          const eventId = typeof event === 'object' ? event._id : String(event);

          // Determine outcome based on bet outcome
          const eventOutcomes = typeof event === 'object' ? event.outcomes : [];
          const betOutcome = eventOutcomes.find(o => o._id === bet.outcomeId);
          const outcomeLabel = betOutcome?.label?.toLowerCase() || 'sim';
          const outcome: 'yes' | 'no' = outcomeLabel === 'não' || outcomeLabel === 'nao' ? 'no' : 'yes';

          // Calculate current odds
          let currentOdds = bet.oddsAtPurchase;
          if (typeof event === 'object' && event.outcomes?.length >= 2) {
            const yesOutcome = event.outcomes[0];
            const noOutcome = event.outcomes[1];
            const totalOdds = (yesOutcome?.odds || 1) + (noOutcome?.odds || 1);
            currentOdds = outcome === 'yes'
              ? Math.round((yesOutcome?.odds || 1) * 100 / totalOdds)
              : Math.round((noOutcome?.odds || 1) * 100 / totalOdds);
          }

          // Calculate P&L
          const entryPrice = Math.round(bet.oddsAtPurchase * 100);
          const currentPrice = bet.status === 'won' ? 100 : bet.status === 'lost' ? 0 : currentOdds;
          const shares = Math.round(bet.amount / (bet.oddsAtPurchase || 1));
          const invested = bet.amount;
          const currentValue = bet.status === 'won' ? bet.payout : bet.status === 'lost' ? 0 : (currentPrice / 100) * shares;
          const pnl = currentValue - invested;
          const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;

          // Determine status
          let status: 'open' | 'won' | 'lost' = 'open';
          if (bet.status === 'won') status = 'won';
          else if (bet.status === 'lost') status = 'lost';

          // Determine if live
          const now = new Date();
          const startsAt = eventStartsAt ? new Date(eventStartsAt) : null;
          const closesAt = new Date(eventClosesAt);
          const isLive = startsAt ? (startsAt <= now && closesAt > now) : false;

          return {
            id: bet._id,
            eventId,
            eventTitle,
            category: categoryMap[eventCategory] || eventCategory,
            outcome,
            entryPrice,
            currentPrice,
            shares,
            invested,
            currentValue,
            pnl,
            pnlPercent,
            status,
            endsIn: status === 'open' ? (isLive ? 'Ao Vivo' : formatTimeRemaining(eventClosesAt)) : undefined,
          };
        });

        setPositions(transformedPositions);
        setStats(statsResponse);
      } catch (err) {
        console.error('Error fetching portfolio data:', err);
        setError('Erro ao carregar dados do portfolio');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, authLoading]);

  const filteredPositions = positions.filter((pos) => {
    if (filter === 'all') return true;
    if (filter === 'active') return pos.status === 'open';
    return pos.status === filter;
  });

  const calculatedStats = {
    totalInvested: positions.reduce((sum, p) => sum + p.invested, 0),
    totalValue: positions.reduce((sum, p) => sum + p.currentValue, 0),
    totalPnl: positions.reduce((sum, p) => sum + p.pnl, 0),
    openPositions: positions.filter((p) => p.status === 'open').length,
    winRate: stats?.winRate || 0,
  };

  const totalPnlPercent =
    calculatedStats.totalInvested > 0
      ? ((calculatedStats.totalPnl / calculatedStats.totalInvested) * 100).toFixed(1)
      : '0';

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="space-y-8">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
              <PieChart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Seu Portfolio</h1>
              <p className="text-sm text-muted-foreground">
                Acompanhe suas posições e performance
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Wallet className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Faça login para ver seu portfolio</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Entre na sua conta para acompanhar suas apostas, ganhos e performance.
            </p>
            <div className="flex gap-4">
              <Link href="/login">
                <Button>Entrar</Button>
              </Link>
              <Link href="/register">
                <Button variant="outline">Criar Conta</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Portfolio Overview */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
            <PieChart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Seu Portfolio</h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe suas posições e performance
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-lg bg-secondary p-4">
            <p className="text-xs text-muted-foreground">Total Investido</p>
            <p className="text-2xl font-bold">
              R$ {calculatedStats.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-lg bg-secondary p-4">
            <p className="text-xs text-muted-foreground">Valor Atual</p>
            <p className="text-2xl font-bold">
              R$ {calculatedStats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-lg bg-secondary p-4">
            <p className="text-xs text-muted-foreground">P&L Total</p>
            <p
              className={cn(
                'text-2xl font-bold',
                calculatedStats.totalPnl >= 0 ? 'text-primary' : 'text-destructive'
              )}
            >
              {calculatedStats.totalPnl >= 0 ? '+' : ''}R${' '}
              {calculatedStats.totalPnl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({totalPnlPercent}%)
            </p>
          </div>
          <div className="rounded-lg bg-secondary p-4">
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold text-primary">
              {calculatedStats.winRate.toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'all', label: 'Todas', icon: BarChart3 },
          { id: 'active', label: 'Abertas', icon: Clock },
          { id: 'won', label: 'Ganhas', icon: CheckCircle2 },
          { id: 'lost', label: 'Perdidas', icon: XCircle },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={filter === tab.id ? 'default' : 'outline'}
            className={cn(filter === tab.id && 'bg-primary hover:bg-primary/90')}
            onClick={() => setFilter(tab.id as FilterType)}
          >
            <tab.icon className="mr-2 h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Positions List */}
      <div className="space-y-4">
        {filteredPositions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 rounded-xl border border-border bg-card">
            <p className="text-muted-foreground mb-2">Nenhuma posição encontrada</p>
            {positions.length === 0 && (
              <Link href="/markets">
                <Button variant="outline" size="sm">
                  Explorar Mercados
                </Button>
              </Link>
            )}
          </div>
        ) : (
          filteredPositions.map((position) => (
            <div
              key={position.id}
              className="rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium uppercase">
                      {position.category}
                    </span>
                    <span
                      className={cn(
                        'rounded px-2 py-0.5 text-xs font-medium',
                        position.outcome === 'yes'
                          ? 'bg-primary/20 text-primary'
                          : 'bg-destructive/20 text-destructive'
                      )}
                    >
                      {position.outcome === 'yes' ? '✓ SIM' : '✗ NÃO'}
                    </span>
                    {position.status === 'open' && position.endsIn && (
                      <span className="text-xs text-muted-foreground">
                        {position.endsIn}
                      </span>
                    )}
                    {position.status === 'won' && (
                      <span className="flex items-center gap-1 text-xs text-primary">
                        <CheckCircle2 className="h-3 w-3" />
                        Ganhou
                      </span>
                    )}
                    {position.status === 'lost' && (
                      <span className="flex items-center gap-1 text-xs text-destructive">
                        <XCircle className="h-3 w-3" />
                        Perdeu
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/markets/${position.eventId}`}
                    className="text-lg font-semibold hover:text-primary transition-colors"
                  >
                    {position.eventTitle}
                  </Link>
                </div>

                <div className="text-right">
                  <p
                    className={cn(
                      'text-xl font-bold',
                      position.pnl >= 0 ? 'text-primary' : 'text-destructive'
                    )}
                  >
                    {position.pnl >= 0 ? '+' : ''}R${' '}
                    {position.pnl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p
                    className={cn(
                      'flex items-center justify-end gap-1 text-sm',
                      position.pnlPercent >= 0 ? 'text-primary' : 'text-destructive'
                    )}
                  >
                    {position.pnlPercent >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {position.pnlPercent >= 0 ? '+' : ''}
                    {position.pnlPercent.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-4 rounded-lg bg-secondary p-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Entrada</p>
                  <p className="font-medium">{position.entryPrice}¢</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Atual</p>
                  <p className="font-medium">{position.currentPrice}¢</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Shares</p>
                  <p className="font-medium">{position.shares}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Investido</p>
                  <p className="font-medium">
                    R$ {position.invested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
