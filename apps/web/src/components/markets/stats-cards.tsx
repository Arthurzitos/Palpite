'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCard {
  label: string;
  value: string;
  change?: number;
  prefix?: string;
}

interface StatsCardsProps {
  stats?: StatCard[];
}

const defaultStats: StatCard[] = [
  { label: 'MERCADOS ATIVOS', value: '456', change: 12 },
  { label: 'VOLUME 24H', value: '8.2M', prefix: 'R$', change: 23 },
  { label: 'TRADERS ONLINE', value: '1.2K', change: 5 },
  { label: 'RESOLUÇÃO PENDENTE', value: '12', change: -3 },
];

export function StatsCards({ stats = defaultStats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="flex items-center justify-between rounded-xl border border-border bg-card/50 p-4"
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-1 text-2xl font-bold font-mono tracking-tight">
              {stat.prefix && (
                <span className="text-muted-foreground">{stat.prefix} </span>
              )}
              {stat.value}
            </p>
          </div>
          {stat.change !== undefined && (
            <div
              className={cn(
                'flex items-center gap-0.5 text-sm font-medium',
                stat.change >= 0 ? 'text-primary' : 'text-destructive'
              )}
            >
              <span className="text-muted-foreground">~</span>
              {stat.change >= 0 ? '+' : ''}
              {stat.change}%
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
