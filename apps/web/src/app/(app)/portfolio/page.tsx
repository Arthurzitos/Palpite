'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'open' | 'won' | 'lost';

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

const mockPositions: Position[] = [
  {
    id: '1',
    eventId: '1',
    eventTitle: 'Lula será reeleito presidente em 2026?',
    category: 'Política',
    outcome: 'yes',
    entryPrice: 55,
    currentPrice: 67,
    shares: 100,
    invested: 55,
    currentValue: 67,
    pnl: 12,
    pnlPercent: 21.8,
    status: 'open',
    endsIn: 'Ao Vivo',
  },
  {
    id: '2',
    eventId: '2',
    eventTitle: 'Bitcoin ultrapassa $150K antes de Julho 2026?',
    category: 'Crypto',
    outcome: 'yes',
    entryPrice: 38,
    currentPrice: 42,
    shares: 200,
    invested: 76,
    currentValue: 84,
    pnl: 8,
    pnlPercent: 10.5,
    status: 'open',
    endsIn: 'Encerra 4m',
  },
  {
    id: '3',
    eventId: '3',
    eventTitle: 'Brasil vence a Copa do Mundo 2026?',
    category: 'Esportes',
    outcome: 'yes',
    entryPrice: 28,
    currentPrice: 32,
    shares: 150,
    invested: 42,
    currentValue: 48,
    pnl: 6,
    pnlPercent: 14.3,
    status: 'open',
    endsIn: 'Encerra 120d',
  },
  {
    id: '4',
    eventId: '10',
    eventTitle: 'Ethereum merge 2.0 até Março 2026?',
    category: 'Crypto',
    outcome: 'no',
    entryPrice: 45,
    currentPrice: 100,
    shares: 100,
    invested: 45,
    currentValue: 100,
    pnl: 55,
    pnlPercent: 122.2,
    status: 'won',
  },
  {
    id: '5',
    eventId: '11',
    eventTitle: 'Trump preso até Dezembro 2025?',
    category: 'Política',
    outcome: 'yes',
    entryPrice: 60,
    currentPrice: 0,
    shares: 50,
    invested: 30,
    currentValue: 0,
    pnl: -30,
    pnlPercent: -100,
    status: 'lost',
  },
];

export default function PortfolioPage() {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredPositions = mockPositions.filter((pos) => {
    if (filter === 'all') return true;
    return pos.status === filter;
  });

  const stats = {
    totalInvested: mockPositions.reduce((sum, p) => sum + p.invested, 0),
    totalValue: mockPositions.reduce((sum, p) => sum + p.currentValue, 0),
    totalPnl: mockPositions.reduce((sum, p) => sum + p.pnl, 0),
    openPositions: mockPositions.filter((p) => p.status === 'open').length,
    winRate:
      (mockPositions.filter((p) => p.status === 'won').length /
        mockPositions.filter((p) => p.status !== 'open').length) *
        100 || 0,
  };

  const totalPnlPercent =
    stats.totalInvested > 0
      ? ((stats.totalPnl / stats.totalInvested) * 100).toFixed(1)
      : '0';

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
              R$ {stats.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-lg bg-secondary p-4">
            <p className="text-xs text-muted-foreground">Valor Atual</p>
            <p className="text-2xl font-bold">
              R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-lg bg-secondary p-4">
            <p className="text-xs text-muted-foreground">P&L Total</p>
            <p
              className={cn(
                'text-2xl font-bold',
                stats.totalPnl >= 0 ? 'text-primary' : 'text-destructive'
              )}
            >
              {stats.totalPnl >= 0 ? '+' : ''}R${' '}
              {stats.totalPnl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({totalPnlPercent}%)
            </p>
          </div>
          <div className="rounded-lg bg-secondary p-4">
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold text-primary">
              {stats.winRate.toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'all', label: 'Todas', icon: BarChart3 },
          { id: 'open', label: 'Abertas', icon: Clock },
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
          <div className="flex h-40 items-center justify-center rounded-xl border border-border bg-card">
            <p className="text-muted-foreground">Nenhuma posição encontrada</p>
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
