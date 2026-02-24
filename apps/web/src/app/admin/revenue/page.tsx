'use client';

import { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  Loader2,
  Calendar,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRevenue } from '@/hooks/use-revenue';
import { RakeRecord } from '@/lib/api';

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  color = 'primary',
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  color?: 'primary' | 'green' | 'orange' | 'blue';
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-green-500/10 text-green-500',
    orange: 'bg-orange-500/10 text-orange-500',
    blue: 'bg-blue-500/10 text-blue-500',
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={`rounded-xl p-3 ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function WithdrawModal({
  isOpen,
  onClose,
  availableBalance,
  onWithdraw,
  isWithdrawing,
}: {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  onWithdraw: (amount: number, address: string) => Promise<void>;
  isWithdrawing: boolean;
}) {
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 100) {
      setError('Mínimo para saque é $100');
      return;
    }

    if (numAmount > availableBalance) {
      setError('Valor maior que o saldo disponível');
      return;
    }

    if (!address || address.length < 10) {
      setError('Endereço da carteira inválido');
      return;
    }

    try {
      await onWithdraw(numAmount, address);
      onClose();
      setAmount('');
      setAddress('');
    } catch {
      setError('Erro ao processar saque. Tente novamente.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-card p-6">
        <h2 className="text-xl font-bold">Sacar Lucros</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Saldo disponível: ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">Valor (USD)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100.00"
              min="100"
              step="0.01"
              className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Endereço da Carteira (USDT TRC20)</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="TRX..."
              className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isWithdrawing}>
              {isWithdrawing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Sacar'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminRevenuePage() {
  const {
    stats,
    byPeriod,
    history,
    topEvents,
    pagination,
    isLoading,
    isWithdrawing,
    fetchStats,
    fetchByPeriod,
    fetchHistory,
    fetchTopEvents,
    withdrawRevenue,
  } = useRevenue();

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    fetchStats();
    fetchByPeriod(periodFilter);
    fetchHistory();
    fetchTopEvents();
  }, [fetchStats, fetchByPeriod, fetchHistory, fetchTopEvents, periodFilter]);

  const handleWithdraw = async (amount: number, address: string) => {
    await withdrawRevenue(amount, address);
    await fetchStats();
    await fetchHistory();
  };

  const getEventTitle = (record: RakeRecord): string => {
    if (typeof record.eventId === 'string') {
      return record.eventId;
    }
    return record.eventId?.title || 'Evento desconhecido';
  };

  if (isLoading && !stats) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const revenueStats = stats || {
    totalEarned: 0,
    totalAvailable: 0,
    totalWithdrawn: 0,
    pendingWithdrawal: 0,
    rakeRecordsCount: 0,
    averageRakePerEvent: 0,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Receita</h1>
          <p className="mt-1 text-muted-foreground">
            Gerenciamento de lucros da plataforma
          </p>
        </div>
        <Button
          onClick={() => setShowWithdrawModal(true)}
          disabled={revenueStats.totalAvailable < 100}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Sacar Lucros
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Receita Total"
          value={`$${revenueStats.totalEarned.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Disponível para Saque"
          value={`$${revenueStats.totalAvailable.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          icon={Wallet}
          color="primary"
        />
        <StatCard
          title="Total Sacado"
          value={`$${revenueStats.totalWithdrawn.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          icon={ArrowUpRight}
          color="blue"
        />
        <StatCard
          title="Média por Evento"
          value={`$${revenueStats.averageRakePerEvent.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          description={`${revenueStats.rakeRecordsCount} eventos com rake`}
          color="orange"
        />
      </div>

      {/* Revenue by Period */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Receita por Período</h2>
          <div className="flex gap-2">
            {(['day', 'week', 'month'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setPeriodFilter(period)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  periodFilter === period
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {period === 'day' && 'Dia'}
                {period === 'week' && 'Semana'}
                {period === 'month' && 'Mês'}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {byPeriod.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Nenhum dado disponível
            </p>
          ) : (
            <div className="space-y-3">
              {byPeriod.slice(0, 10).map((item) => (
                <div
                  key={item.period}
                  className="flex items-center justify-between rounded-lg bg-secondary p-4"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{item.period}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-500">
                      +${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.count} evento{item.count !== 1 && 's'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Events */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Top Eventos por Rake</h2>
          <div className="mt-6 space-y-3">
            {topEvents.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                Nenhum evento com rake ainda
              </p>
            ) : (
              topEvents.slice(0, 5).map((record) => (
                <div
                  key={record._id}
                  className="flex items-center justify-between rounded-lg bg-secondary p-4"
                >
                  <div>
                    <p className="font-medium">{getEventTitle(record)}</p>
                    <p className="text-sm text-muted-foreground">
                      Pool: ${record.poolTotal.toLocaleString('en-US')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-500">
                      +${record.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {record.rakePercent}% rake
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent History */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Histórico Recente</h2>
          <div className="mt-6 space-y-3">
            {history.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                Nenhum registro de rake ainda
              </p>
            ) : (
              history.slice(0, 5).map((record) => (
                <div
                  key={record._id}
                  className="flex items-center justify-between rounded-lg bg-secondary p-4"
                >
                  <div>
                    <p className="font-medium">{getEventTitle(record)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(record.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-500">
                      +${record.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        record.status === 'available'
                          ? 'bg-green-500/10 text-green-500'
                          : record.status === 'withdrawn'
                          ? 'bg-blue-500/10 text-blue-500'
                          : 'bg-yellow-500/10 text-yellow-500'
                      }`}
                    >
                      {record.status === 'available' && 'Disponível'}
                      {record.status === 'withdrawn' && 'Sacado'}
                      {record.status === 'pending' && 'Pendente'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          {pagination && pagination.pages > 1 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Mostrando {Math.min(5, pagination.total)} de {pagination.total} registros
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        availableBalance={revenueStats.totalAvailable}
        onWithdraw={handleWithdraw}
        isWithdrawing={isWithdrawing}
      />
    </div>
  );
}
