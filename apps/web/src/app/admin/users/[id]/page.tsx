'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Shield,
  ShieldOff,
  DollarSign,
  Loader2,
  AlertCircle,
  X,
  TrendingUp,
  TrendingDown,
  Calendar,
  Mail,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAdminUsers } from '@/hooks/use-admin-users';
import { AdminUser, Bet, Event } from '@/lib/api';
import { UserRole } from '@prediction-market/shared';

function BetStatusBadge({ status }: { status: string }) {
  const statusConfig = {
    active: { label: 'Ativa', className: 'bg-blue-500/10 text-blue-500' },
    won: { label: 'Ganhou', className: 'bg-green-500/10 text-green-500' },
    lost: { label: 'Perdeu', className: 'bg-destructive/10 text-destructive' },
    refunded: { label: 'Reembolsada', className: 'bg-yellow-500/10 text-yellow-500' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', config.className)}>
      {config.label}
    </span>
  );
}

function ToggleRoleModal({
  user,
  onClose,
  onConfirm,
  isSubmitting,
}: {
  user: AdminUser;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}) {
  const isAdmin = user.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-md rounded-2xl bg-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {isAdmin ? 'Remover Admin' : 'Tornar Admin'}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <p className="text-muted-foreground">
            {isAdmin
              ? `Tem certeza que deseja remover as permissoes de admin de ${user.username}?`
              : `Tem certeza que deseja tornar ${user.username} um administrador?`}
          </p>

          {!isAdmin && (
            <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 p-3">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-yellow-500">
                Administradores tem acesso total ao painel de controle.
              </span>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant={isAdmin ? 'destructive' : 'default'}
              className="flex-1"
              onClick={onConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : isAdmin ? (
                'Remover Admin'
              ) : (
                'Tornar Admin'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdjustBalanceModal({
  user,
  onClose,
  onConfirm,
  isSubmitting,
}: {
  user: AdminUser;
  onClose: () => void;
  onConfirm: (amount: number, operation: 'add' | 'subtract', reason?: string) => void;
  isSubmitting: boolean;
}) {
  const [amount, setAmount] = useState('');
  const [operation, setOperation] = useState<'add' | 'subtract'>('add');
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (numAmount > 0) {
      onConfirm(numAmount, operation, reason || undefined);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-md rounded-2xl bg-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Ajustar Saldo</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="rounded-lg bg-secondary p-4">
            <p className="text-sm text-muted-foreground">Usuario: {user.username}</p>
            <p className="mt-1 text-xl font-bold">
              Saldo atual: R$ {(user.balance ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Operacao</label>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setOperation('add')}
                className={cn(
                  'flex-1 rounded-lg border p-3 text-sm font-medium transition-colors',
                  operation === 'add'
                    ? 'border-green-500 bg-green-500/10 text-green-500'
                    : 'border-border hover:border-muted-foreground'
                )}
              >
                Creditar
              </button>
              <button
                onClick={() => setOperation('subtract')}
                className={cn(
                  'flex-1 rounded-lg border p-3 text-sm font-medium transition-colors',
                  operation === 'subtract'
                    ? 'border-destructive bg-destructive/10 text-destructive'
                    : 'border-border hover:border-muted-foreground'
                )}
              >
                Debitar
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Valor (R$)</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              className="mt-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Motivo (opcional)</label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Bonus, correcao, etc."
              className="mt-2"
            />
          </div>

          {operation === 'subtract' && parseFloat(amount) > user.balance && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">
                O valor excede o saldo disponivel do usuario.
              </span>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={
                !amount ||
                parseFloat(amount) <= 0 ||
                isSubmitting ||
                (operation === 'subtract' && parseFloat(amount) > user.balance)
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ajustando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = params.id as string;

  const {
    selectedUser: user,
    userBets,
    isLoading,
    isSubmitting,
    error,
    fetchUserById,
    fetchUserBets,
    updateUserRole,
    adjustUserBalance,
    clearError,
  } = useAdminUsers();

  const [showToggleRoleModal, setShowToggleRoleModal] = useState(false);
  const [showAdjustBalanceModal, setShowAdjustBalanceModal] = useState(false);

  useEffect(() => {
    fetchUserById(userId);
    fetchUserBets(userId);
  }, [userId, fetchUserById, fetchUserBets]);

  const handleToggleRole = async () => {
    if (!user) return;
    try {
      const newRole = user.role === 'admin' ? UserRole.USER : UserRole.ADMIN;
      await updateUserRole(user._id, newRole);
      setShowToggleRoleModal(false);
    } catch {
      // Error handled by store
    }
  };

  const handleAdjustBalance = async (
    amount: number,
    operation: 'add' | 'subtract',
    reason?: string
  ) => {
    if (!user) return;
    try {
      await adjustUserBalance(user._id, { amount, operation, reason });
      setShowAdjustBalanceModal(false);
    } catch {
      // Error handled by store
    }
  };

  if (isLoading && !user) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">Usuario nao encontrado</p>
        <Link href="/admin/users">
          <Button className="mt-4">Voltar para usuarios</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar para usuarios
          </Link>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <span className="text-2xl font-bold text-primary">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">{user.username}</h1>
              <div className="mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    user.role === 'admin'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {user.role === 'admin' ? 'Admin' : 'Usuario'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAdjustBalanceModal(true)}>
            <DollarSign className="mr-2 h-4 w-4" />
            Ajustar Saldo
          </Button>
          <Button
            variant={user.role === 'admin' ? 'destructive' : 'default'}
            onClick={() => setShowToggleRoleModal(true)}
          >
            {user.role === 'admin' ? (
              <>
                <ShieldOff className="mr-2 h-4 w-4" />
                Remover Admin
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Tornar Admin
              </>
            )}
          </Button>
        </div>
      </div>

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

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo</p>
              <p className="text-xl font-bold">
                R$ {(user.balance ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Apostado</p>
              <p className="text-xl font-bold">
                R$ {(user.totalWagered ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Ganho</p>
              <p className="text-xl font-bold">
                R$ {(user.totalWon ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/10 p-2">
              <Calendar className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Membro desde</p>
              <p className="text-xl font-bold">
                {new Date(user.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Info */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Informacoes Financeiras</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-secondary p-4">
            <p className="text-sm text-muted-foreground">Total Depositado</p>
            <p className="mt-1 text-2xl font-bold text-green-500">
              R$ {(user.totalDeposited ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-lg bg-secondary p-4">
            <p className="text-sm text-muted-foreground">Total Sacado</p>
            <p className="mt-1 text-2xl font-bold text-destructive">
              R$ {(user.totalWithdrawn ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-lg bg-secondary p-4">
            <p className="text-sm text-muted-foreground">Lucro/Prejuizo</p>
            <p
              className={cn(
                'mt-1 text-2xl font-bold',
                (user.totalWon ?? 0) - (user.totalWagered ?? 0) >= 0 ? 'text-green-500' : 'text-destructive'
              )}
            >
              R$ {((user.totalWon ?? 0) - (user.totalWagered ?? 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Bets History */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Historico de Apostas</h2>
        {userBets && userBets.bets.length > 0 ? (
          <div className="mt-4 space-y-3">
            {userBets.bets.map((bet) => {
              const event = bet.eventId as Event;
              return (
                <div
                  key={bet._id}
                  className="flex items-center justify-between rounded-lg bg-secondary p-4"
                >
                  <div>
                    <p className="font-medium">{event?.title || 'Evento removido'}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(bet.createdAt).toLocaleDateString('pt-BR')} • Odds: {bet.oddsAtPurchase.toFixed(2)}x
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">
                        R$ {(bet.amount ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      {bet.status === 'won' && (bet.payout ?? 0) > 0 && (
                        <p className="text-sm text-green-500">
                          +R$ {(bet.payout ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                    <BetStatusBadge status={bet.status} />
                  </div>
                </div>
              );
            })}
            {userBets.totalPages > 1 && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Mostrando {userBets.bets.length} de {userBets.total} apostas
              </p>
            )}
          </div>
        ) : (
          <p className="mt-4 text-muted-foreground">Nenhuma aposta encontrada</p>
        )}
      </div>

      {/* Modals */}
      {showToggleRoleModal && (
        <ToggleRoleModal
          user={user}
          onClose={() => setShowToggleRoleModal(false)}
          onConfirm={handleToggleRole}
          isSubmitting={isSubmitting}
        />
      )}

      {showAdjustBalanceModal && (
        <AdjustBalanceModal
          user={user}
          onClose={() => setShowAdjustBalanceModal(false)}
          onConfirm={handleAdjustBalance}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
