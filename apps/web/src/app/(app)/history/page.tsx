'use client';

import { useState } from 'react';
import {
  History,
  ArrowDownToLine,
  ArrowUpFromLine,
  Trophy,
  XCircle,
  Filter,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'bets' | 'deposits' | 'withdrawals' | 'payouts';

interface HistoryItem {
  id: string;
  type: 'bet' | 'deposit' | 'withdrawal' | 'payout' | 'refund';
  title: string;
  description: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  outcome?: 'won' | 'lost';
}

const mockHistory: HistoryItem[] = [
  {
    id: '1',
    type: 'bet',
    title: 'Aposta em "Lula reeleito 2026?"',
    description: 'SIM @ 55¢ • 100 shares',
    amount: -55,
    date: '2026-02-16 10:30',
    status: 'completed',
  },
  {
    id: '2',
    type: 'payout',
    title: 'Pagamento de "ETH Merge 2.0"',
    description: 'NÃO venceu • 100 shares @ 100¢',
    amount: 100,
    date: '2026-02-15 18:45',
    status: 'completed',
    outcome: 'won',
  },
  {
    id: '3',
    type: 'deposit',
    title: 'Depósito via PIX',
    description: 'Chave: pix@prediction.com',
    amount: 500,
    date: '2026-02-15 14:30',
    status: 'completed',
  },
  {
    id: '4',
    type: 'bet',
    title: 'Aposta em "BTC > $150K"',
    description: 'SIM @ 38¢ • 200 shares',
    amount: -76,
    date: '2026-02-14 16:20',
    status: 'completed',
  },
  {
    id: '5',
    type: 'withdrawal',
    title: 'Saque via USDT',
    description: 'TRx7NZc...Kj8pQ',
    amount: -200,
    date: '2026-02-14 10:15',
    status: 'pending',
  },
  {
    id: '6',
    type: 'bet',
    title: 'Aposta em "Copa 2026 Brasil"',
    description: 'SIM @ 28¢ • 150 shares',
    amount: -42,
    date: '2026-02-13 20:00',
    status: 'completed',
  },
  {
    id: '7',
    type: 'deposit',
    title: 'Depósito via BTC',
    description: '0.015 BTC',
    amount: 1000,
    date: '2026-02-13 18:45',
    status: 'completed',
  },
  {
    id: '8',
    type: 'payout',
    title: 'Pagamento de "Oscar 2026 Brasil"',
    description: 'SIM perdeu • 50 shares',
    amount: 0,
    date: '2026-02-12 09:20',
    status: 'completed',
    outcome: 'lost',
  },
  {
    id: '9',
    type: 'refund',
    title: 'Reembolso - Evento Cancelado',
    description: '"Eleição Venezuela 2026"',
    amount: 35,
    date: '2026-02-11 15:00',
    status: 'completed',
  },
];

const filterOptions = [
  { id: 'all', label: 'Todos', icon: History },
  { id: 'bets', label: 'Apostas', icon: Trophy },
  { id: 'deposits', label: 'Depósitos', icon: ArrowDownToLine },
  { id: 'withdrawals', label: 'Saques', icon: ArrowUpFromLine },
  { id: 'payouts', label: 'Pagamentos', icon: Trophy },
];

function getTypeIcon(type: HistoryItem['type'], outcome?: 'won' | 'lost') {
  switch (type) {
    case 'bet':
      return <Trophy className="h-5 w-5 text-blue-400" />;
    case 'deposit':
      return <ArrowDownToLine className="h-5 w-5 text-primary" />;
    case 'withdrawal':
      return <ArrowUpFromLine className="h-5 w-5 text-orange-400" />;
    case 'payout':
      return outcome === 'won' ? (
        <Trophy className="h-5 w-5 text-primary" />
      ) : (
        <XCircle className="h-5 w-5 text-destructive" />
      );
    case 'refund':
      return <ArrowDownToLine className="h-5 w-5 text-yellow-400" />;
    default:
      return <History className="h-5 w-5" />;
  }
}

function getTypeColor(type: HistoryItem['type'], outcome?: 'won' | 'lost') {
  switch (type) {
    case 'bet':
      return 'bg-blue-500/20';
    case 'deposit':
      return 'bg-primary/20';
    case 'withdrawal':
      return 'bg-orange-500/20';
    case 'payout':
      return outcome === 'won' ? 'bg-primary/20' : 'bg-destructive/20';
    case 'refund':
      return 'bg-yellow-500/20';
    default:
      return 'bg-muted';
  }
}

export default function HistoryPage() {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredHistory = mockHistory.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'bets') return item.type === 'bet';
    if (filter === 'deposits') return item.type === 'deposit';
    if (filter === 'withdrawals') return item.type === 'withdrawal';
    if (filter === 'payouts') return item.type === 'payout' || item.type === 'refund';
    return true;
  });

  // Group by date
  const groupedHistory = filteredHistory.reduce((groups, item) => {
    const date = item.date.split(' ')[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, HistoryItem[]>);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
          <History className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Histórico</h1>
          <p className="text-sm text-muted-foreground">
            Todas as suas transações e atividades
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <Button
            key={option.id}
            variant={filter === option.id ? 'default' : 'outline'}
            size="sm"
            className={cn(filter === option.id && 'bg-primary hover:bg-primary/90')}
            onClick={() => setFilter(option.id as FilterType)}
          >
            <option.icon className="mr-2 h-4 w-4" />
            {option.label}
          </Button>
        ))}
      </div>

      {/* History List */}
      <div className="space-y-6">
        {Object.entries(groupedHistory).map(([date, items]) => (
          <div key={date}>
            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {new Date(date).toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </div>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full',
                        getTypeColor(item.type, item.outcome)
                      )}
                    >
                      {getTypeIcon(item.type, item.outcome)}
                    </div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={cn(
                        'font-semibold',
                        item.amount > 0
                          ? 'text-primary'
                          : item.amount < 0
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      {item.amount > 0 && '+'}
                      {item.amount !== 0 &&
                        `R$ ${Math.abs(item.amount).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}`}
                      {item.amount === 0 && 'R$ 0,00'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.date.split(' ')[1]}
                      {item.status === 'pending' && (
                        <span className="ml-2 rounded bg-yellow-500/20 px-1.5 py-0.5 text-yellow-500">
                          Pendente
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredHistory.length === 0 && (
        <div className="flex h-40 items-center justify-center rounded-xl border border-border bg-card">
          <p className="text-muted-foreground">Nenhum registro encontrado</p>
        </div>
      )}
    </div>
  );
}
