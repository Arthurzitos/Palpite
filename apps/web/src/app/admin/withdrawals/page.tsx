'use client';

import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  X,
  DollarSign,
  AlertTriangle,
  User,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAdminWithdrawals } from '@/hooks/use-admin-withdrawals';
import { AdminWithdrawal } from '@/lib/api';

type FilterStatus = 'all' | 'pending_approval' | 'completed' | 'rejected' | 'cancelled';

const statusFilters: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending_approval', label: 'Pendentes' },
  { value: 'completed', label: 'Aprovados' },
  { value: 'rejected', label: 'Rejeitados' },
  { value: 'cancelled', label: 'Cancelados' },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  pending_approval: { label: 'Pendente', className: 'bg-yellow-500/10 text-yellow-500' },
  approved: { label: 'Aprovado', className: 'bg-blue-500/10 text-blue-500' },
  completed: { label: 'Concluido', className: 'bg-green-500/10 text-green-500' },
  rejected: { label: 'Rejeitado', className: 'bg-destructive/10 text-destructive' },
  cancelled: { label: 'Cancelado', className: 'bg-muted text-muted-foreground' },
  failed: { label: 'Falhou', className: 'bg-destructive/10 text-destructive' },
};

function WithdrawalStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground' };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', config.className)}>
      {config.label}
    </span>
  );
}

function RiskBadge({ type, label }: { type: 'warning' | 'danger'; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        type === 'warning' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-destructive/10 text-destructive'
      )}
    >
      <AlertTriangle className="h-3 w-3" />
      {label}
    </span>
  );
}

function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  color = 'primary',
}: {
  label: string;
  value: number | string;
  subValue?: string;
  icon: React.ElementType;
  color?: 'primary' | 'green' | 'blue' | 'orange' | 'red';
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-green-500/10 text-green-500',
    blue: 'bg-blue-500/10 text-blue-500',
    orange: 'bg-orange-500/10 text-orange-500',
    red: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-4">
        <div className={cn('rounded-lg p-3', colorClasses[color])}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subValue && <p className="text-sm text-muted-foreground">{subValue}</p>}
        </div>
      </div>
    </div>
  );
}

function WithdrawalActionsMenu({
  withdrawal,
  onApprove,
  onReject,
  isSubmitting,
}: {
  withdrawal: AdminWithdrawal;
  onApprove: () => void;
  onReject: () => void;
  isSubmitting: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isPending = withdrawal.status === 'pending_approval';

  if (!isPending) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-lg p-2 hover:bg-muted"
        disabled={isSubmitting}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-card p-1 shadow-lg">
            <button
              onClick={() => {
                onApprove();
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-green-500 hover:bg-green-500/10"
            >
              <CheckCircle className="h-4 w-4" />
              Aprovar saque
            </button>
            <button
              onClick={() => {
                onReject();
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
            >
              <XCircle className="h-4 w-4" />
              Rejeitar saque
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ApproveModal({
  withdrawal,
  onClose,
  onConfirm,
  isSubmitting,
}: {
  withdrawal: AdminWithdrawal;
  onClose: () => void;
  onConfirm: (notes?: string) => void;
  isSubmitting: boolean;
}) {
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-md rounded-2xl bg-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Aprovar Saque</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="rounded-lg bg-secondary p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Usuario:</span>
              <span className="font-medium">{withdrawal.user.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Email:</span>
              <span className="text-sm">{withdrawal.user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Valor:</span>
              <span className="font-bold text-lg">
                $ {withdrawal.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Endereco:</span>
              <span className="text-sm font-mono truncate max-w-[200px]" title={withdrawal.address}>
                {withdrawal.address}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Rede:</span>
              <span className="text-sm uppercase">{withdrawal.network}</span>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <p className="text-sm font-medium">Contexto do Usuario:</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Membro ha:</span>
                <span className="ml-1 font-medium">{withdrawal.userContext.accountAgeDays} dias</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total depositado:</span>
                <span className="ml-1 font-medium">
                  $ {withdrawal.userContext.totalDeposited.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Total sacado:</span>
                <span className="ml-1 font-medium">
                  $ {withdrawal.userContext.totalWithdrawn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Total de apostas:</span>
                <span className="ml-1 font-medium">{withdrawal.userContext.totalBets}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Notas (opcional)</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observacoes sobre a aprovacao..."
              className="mt-2"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-green-500 hover:bg-green-600"
              onClick={() => onConfirm(notes || undefined)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aprovando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirmar Aprovacao
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RejectModal({
  withdrawal,
  onClose,
  onConfirm,
  isSubmitting,
}: {
  withdrawal: AdminWithdrawal;
  onClose: () => void;
  onConfirm: (reason: string, notes?: string) => void;
  isSubmitting: boolean;
}) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-md rounded-2xl bg-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Rejeitar Saque</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="rounded-lg bg-secondary p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Usuario:</span>
              <span className="font-medium">{withdrawal.user.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Valor:</span>
              <span className="font-bold">
                $ {withdrawal.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">
              Motivo da rejeicao <span className="text-destructive">*</span>
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Atividade suspeita detectada"
              className="mt-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Notas internas (opcional)</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observacoes internas..."
              className="mt-2"
            />
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 p-3">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-yellow-500">
              O saldo permanecera disponivel na conta do usuario.
            </span>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => onConfirm(reason, notes || undefined)}
              disabled={!reason.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejeitando...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Confirmar Rejeicao
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminWithdrawalsPage() {
  const {
    withdrawals,
    stats,
    isLoading,
    isSubmitting,
    error,
    fetchWithdrawals,
    approve,
    reject,
    clearError,
  } = useAdminWithdrawals();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [approveModal, setApproveModal] = useState<AdminWithdrawal | null>(null);
  const [rejectModal, setRejectModal] = useState<AdminWithdrawal | null>(null);

  useEffect(() => {
    fetchWithdrawals({
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: search || undefined,
    });
  }, [fetchWithdrawals, statusFilter, search]);

  const handleApprove = async (notes?: string) => {
    if (!approveModal) return;
    try {
      await approve(approveModal._id, notes);
      setApproveModal(null);
    } catch {
      // Error handled by store
    }
  };

  const handleReject = async (reason: string, notes?: string) => {
    if (!rejectModal) return;
    try {
      await reject(rejectModal._id, reason, notes);
      setRejectModal(null);
    } catch {
      // Error handled by store
    }
  };

  const getRiskBadges = (withdrawal: AdminWithdrawal) => {
    const badges: { type: 'warning' | 'danger'; label: string }[] = [];

    if (withdrawal.userContext.accountAgeDays < 7) {
      badges.push({ type: 'danger', label: 'Conta nova' });
    }

    if (withdrawal.userContext.totalWithdrawn === 0) {
      badges.push({ type: 'warning', label: '1o saque' });
    }

    if (withdrawal.userContext.totalDeposited === 0 && withdrawal.userContext.totalBets > 0) {
      badges.push({ type: 'danger', label: 'Sem depositos' });
    }

    if (withdrawal.amount > 500) {
      badges.push({ type: 'warning', label: 'Valor alto' });
    }

    return badges;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Saques</h1>
        <p className="mt-1 text-muted-foreground">
          Gerencie as solicitacoes de saque dos usuarios
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Pendentes"
            value={stats.pendingCount}
            subValue={`$ ${stats.pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={Clock}
            color="orange"
          />
          <StatCard
            label="Aprovados Hoje"
            value={stats.todayApproved}
            subValue={`$ ${stats.todayApprovedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            label="Rejeitados Hoje"
            value={stats.todayRejected}
            subValue={`$ ${stats.todayRejectedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={XCircle}
            color="red"
          />
          <StatCard
            label="Total Processado"
            value={stats.todayApproved + stats.todayRejected}
            icon={DollarSign}
            color="primary"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
          <button onClick={clearError} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-1 flex-wrap">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  statusFilter === filter.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                {filter.label}
                {filter.value === 'pending_approval' && stats && stats.pendingCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-orange-500 px-1.5 py-0.5 text-xs text-white">
                    {stats.pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Withdrawals List */}
      <div className="rounded-2xl border border-border bg-card">
        {isLoading && withdrawals.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="py-16 text-center">
            <ArrowUpRight className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Nenhum saque encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {withdrawals.map((withdrawal) => {
              const riskBadges = getRiskBadges(withdrawal);
              return (
                <div
                  key={withdrawal._id}
                  className="flex flex-col gap-4 p-4 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{withdrawal.user.username}</span>
                        <WithdrawalStatusBadge status={withdrawal.status} />
                        {riskBadges.map((badge, i) => (
                          <RiskBadge key={i} type={badge.type} label={badge.label} />
                        ))}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{withdrawal.user.email}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(withdrawal.createdAt).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Valor</p>
                      <p className="font-bold text-lg">
                        $ {withdrawal.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-right max-w-[120px]">
                      <p className="text-sm text-muted-foreground">Endereco</p>
                      <p className="font-mono text-sm truncate" title={withdrawal.address}>
                        {withdrawal.address.slice(0, 8)}...{withdrawal.address.slice(-6)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Rede</p>
                      <p className="text-sm uppercase font-medium">{withdrawal.network}</p>
                    </div>
                    <WithdrawalActionsMenu
                      withdrawal={withdrawal}
                      onApprove={() => setApproveModal(withdrawal)}
                      onReject={() => setRejectModal(withdrawal)}
                      isSubmitting={isSubmitting}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {approveModal && (
        <ApproveModal
          withdrawal={approveModal}
          onClose={() => setApproveModal(null)}
          onConfirm={handleApprove}
          isSubmitting={isSubmitting}
        />
      )}

      {rejectModal && (
        <RejectModal
          withdrawal={rejectModal}
          onClose={() => setRejectModal(null)}
          onConfirm={handleReject}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
