'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Calendar,
  Users,
  DollarSign,
  Activity,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/hooks/use-admin';
import { useRevenue } from '@/hooks/use-revenue';

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'primary',
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
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
          {trend && (
            <p className="mt-1 flex items-center gap-1 text-sm text-primary">
              <TrendingUp className="h-4 w-4" />
              {trend}
            </p>
          )}
        </div>
        <div className={`rounded-xl p-3 ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { dashboardStats, events, isLoading, fetchDashboard, fetchEvents } = useAdmin();
  const { stats: revenueStats, fetchStats: fetchRevenueStats } = useRevenue();

  useEffect(() => {
    fetchDashboard();
    fetchEvents({ limit: 5 });
    fetchRevenueStats();
  }, [fetchDashboard, fetchEvents, fetchRevenueStats]);

  if (isLoading && !dashboardStats) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = dashboardStats || {
    totalEvents: 0,
    openEvents: 0,
    resolvedEvents: 0,
    totalVolume: 0,
    totalUsers: 0,
    totalBets: 0,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Visão geral da plataforma
          </p>
        </div>
        <Link href="/admin/events/new">
          <Button className="gap-2">
            <Calendar className="h-4 w-4" />
            Criar Evento
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Volume Total"
          value={`$${stats.totalVolume.toLocaleString('en-US')}`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Receita (Rake)"
          value={`$${(revenueStats?.totalEarned || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          trend={revenueStats?.totalAvailable ? `$${revenueStats.totalAvailable.toFixed(2)} disponível` : undefined}
          color="green"
        />
        <StatCard
          title="Eventos Ativos"
          value={stats.openEvents}
          icon={Calendar}
          color="primary"
        />
        <StatCard
          title="Total de Apostas"
          value={stats.totalBets.toLocaleString('en-US')}
          icon={Activity}
          color="orange"
        />
        <StatCard
          title="Usuários"
          value={stats.totalUsers.toLocaleString('en-US')}
          icon={Users}
          color="blue"
        />
      </div>

      {/* Recent Events */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Eventos Recentes</h2>
          <Link
            href="/admin/events"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Ver todos
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 space-y-4">
          {events.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Nenhum evento encontrado
            </p>
          ) : (
            events.slice(0, 5).map((event) => (
              <Link
                key={event._id}
                href={`/admin/events/${event._id}`}
                className="flex items-center justify-between rounded-lg bg-secondary p-4 transition-colors hover:bg-muted"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.outcomes.length} outcomes • ${event.totalPool.toLocaleString('en-US')} pool
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      event.status === 'open'
                        ? 'bg-green-500/10 text-green-500'
                        : event.status === 'locked'
                        ? 'bg-yellow-500/10 text-yellow-500'
                        : event.status === 'resolved'
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'bg-destructive/10 text-destructive'
                    }`}
                  >
                    {event.status === 'open' && 'Aberto'}
                    {event.status === 'locked' && 'Bloqueado'}
                    {event.status === 'resolved' && 'Resolvido'}
                    {event.status === 'cancelled' && 'Cancelado'}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Events by Status */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Eventos por Status</h2>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm text-muted-foreground">Abertos</span>
              </div>
              <span className="font-semibold">{stats.openEvents}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-sm text-muted-foreground">Resolvidos</span>
              </div>
              <span className="font-semibold">{stats.resolvedEvents}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
              <span className="font-semibold">{stats.totalEvents}</span>
            </div>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Resumo de Atividade</h2>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Volume médio por evento</span>
              <span className="font-semibold">
                ${stats.totalEvents > 0 ? Math.round(stats.totalVolume / stats.totalEvents).toLocaleString('en-US') : 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Apostas por evento</span>
              <span className="font-semibold">
                {stats.totalEvents > 0 ? Math.round(stats.totalBets / stats.totalEvents) : 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Taxa de resolução</span>
              <span className="font-semibold">
                {stats.totalEvents > 0 ? Math.round((stats.resolvedEvents / stats.totalEvents) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
