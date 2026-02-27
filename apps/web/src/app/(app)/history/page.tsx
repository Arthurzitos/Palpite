'use client';

import { useState, useEffect } from 'react';
import {
  History,
  ArrowDownToLine,
  ArrowUpFromLine,
  Trophy,
  XCircle,
  Calendar,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { walletApi, Transaction } from '@/lib/api';

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

function transformTransaction(transaction: Transaction): HistoryItem {
  const typeLabels: Record<string, string> = {
    deposit: 'Depósito',
    withdrawal: 'Saque',
    bet: 'Aposta',
    payout: 'Pagamento',
    refund: 'Reembolso',
    fee: 'Taxa',
  };

  let title = typeLabels[transaction.type] || transaction.type;
  let description = '';

  if (transaction.type === 'deposit') {
    title = 'Depósito';
    description = transaction.reference || 'Depósito realizado';
  } else if (transaction.type === 'withdrawal') {
    title = 'Saque';
    description = transaction.reference || 'Saque solicitado';
  } else if (transaction.type === 'bet') {
    title = 'Aposta realizada';
    description = transaction.reference || 'Aposta em evento';
  } else if (transaction.type === 'payout') {
    title = 'Pagamento recebido';
    description = transaction.reference || 'Aposta vencedora';
  } else if (transaction.type === 'refund') {
    title = 'Reembolso';
    description = transaction.reference || 'Evento cancelado';
  }

  return {
    id: transaction._id,
    type: transaction.type as HistoryItem['type'],
    title,
    description,
    amount: transaction.type === 'withdrawal' || transaction.type === 'bet'
      ? -Math.abs(transaction.amount)
      : transaction.amount,
    date: new Date(transaction.createdAt).toLocaleString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).replace(',', ''),
    status: transaction.status,
    outcome: transaction.type === 'payout' ? 'won' : undefined,
  };
}

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
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await walletApi.getTransactions(1, 100);
        const transformedHistory = data.transactions.map(transformTransaction);
        setHistory(transformedHistory);
      } catch (err) {
        setError('Erro ao carregar histórico');
        console.error('Error fetching history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const filteredHistory = history.filter((item) => {
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

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

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
              {new Date(date.split('/').reverse().join('-')).toLocaleDateString('pt-BR', {
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
