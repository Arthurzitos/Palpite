'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Shield,
  ShieldOff,
  DollarSign,
  Loader2,
  AlertCircle,
  X,
  UserPlus,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAdminUsers } from '@/hooks/use-admin-users';
import { AdminUser } from '@/lib/api';
import { UserRole } from '@prediction-market/shared';

type FilterRole = 'all' | 'user' | 'admin';

const roleFilters: { value: FilterRole; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'user', label: 'Usuarios' },
  { value: 'admin', label: 'Admins' },
];

function UserRoleBadge({ role }: { role: string }) {
  const isAdmin = role === 'admin';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        isAdmin ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
      )}
    >
      {isAdmin ? 'Admin' : 'Usuario'}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color = 'primary',
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color?: 'primary' | 'green' | 'blue' | 'orange';
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-green-500/10 text-green-500',
    blue: 'bg-blue-500/10 text-blue-500',
    orange: 'bg-orange-500/10 text-orange-500',
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-4">
        <div className={cn('rounded-lg p-3', colorClasses[color])}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value.toLocaleString('pt-BR')}</p>
        </div>
      </div>
    </div>
  );
}

function UserActionsMenu({
  user,
  onToggleRole,
  onAdjustBalance,
  isSubmitting,
}: {
  user: AdminUser;
  onToggleRole: () => void;
  onAdjustBalance: () => void;
  isSubmitting: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

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
            <Link
              href={`/admin/users/${user._id}`}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
              onClick={() => setIsOpen(false)}
            >
              <Eye className="h-4 w-4" />
              Ver detalhes
            </Link>
            <button
              onClick={() => {
                onAdjustBalance();
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
            >
              <DollarSign className="h-4 w-4" />
              Ajustar saldo
            </button>
            <button
              onClick={() => {
                onToggleRole();
                setIsOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm',
                user.role === 'admin'
                  ? 'text-destructive hover:bg-destructive/10'
                  : 'text-primary hover:bg-primary/10'
              )}
            >
              {user.role === 'admin' ? (
                <>
                  <ShieldOff className="h-4 w-4" />
                  Remover admin
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Tornar admin
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
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

          <div className="rounded-lg bg-secondary p-4">
            <p className="text-sm text-muted-foreground">Usuario</p>
            <p className="font-medium">{user.username}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>

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
              Saldo atual: R$ {user.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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

export default function AdminUsersPage() {
  const {
    users,
    totalUsers,
    stats,
    isLoading,
    isSubmitting,
    error,
    fetchUsers,
    fetchUserStats,
    updateUserRole,
    adjustUserBalance,
    clearError,
  } = useAdminUsers();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<FilterRole>('all');
  const [toggleRoleModal, setToggleRoleModal] = useState<AdminUser | null>(null);
  const [adjustBalanceModal, setAdjustBalanceModal] = useState<AdminUser | null>(null);

  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats]);

  useEffect(() => {
    fetchUsers({
      role: roleFilter === 'all' ? undefined : roleFilter,
      search: search || undefined,
    });
  }, [fetchUsers, roleFilter, search]);

  const handleToggleRole = async () => {
    if (!toggleRoleModal) return;
    try {
      const newRole = toggleRoleModal.role === 'admin' ? UserRole.USER : UserRole.ADMIN;
      await updateUserRole(toggleRoleModal._id, newRole);
      setToggleRoleModal(null);
      fetchUserStats();
    } catch {
      // Error handled by store
    }
  };

  const handleAdjustBalance = async (
    amount: number,
    operation: 'add' | 'subtract',
    reason?: string
  ) => {
    if (!adjustBalanceModal) return;
    try {
      await adjustUserBalance(adjustBalanceModal._id, { amount, operation, reason });
      setAdjustBalanceModal(null);
    } catch {
      // Error handled by store
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Usuarios</h1>
        <p className="mt-1 text-muted-foreground">
          Gerencie os usuarios da plataforma
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total de Usuarios"
            value={stats.totalUsers}
            icon={Users}
            color="primary"
          />
          <StatCard
            label="Administradores"
            value={stats.totalAdmins}
            icon={Shield}
            color="blue"
          />
          <StatCard
            label="Usuarios Ativos"
            value={stats.activeUsers}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            label="Novos este mes"
            value={stats.newUsersThisMonth}
            icon={UserPlus}
            color="orange"
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
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-1">
            {roleFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setRoleFilter(filter.value)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  roleFilter === filter.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="rounded-2xl border border-border bg-card">
        {isLoading && users.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Nenhum usuario encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {users.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-4 hover:bg-muted/50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-lg font-bold text-primary">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/users/${user._id}`}
                        className="font-medium hover:text-primary"
                      >
                        {user.username}
                      </Link>
                      <UserRoleBadge role={user.role} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Saldo</p>
                    <p className="font-medium">
                      R$ {user.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Apostado</p>
                    <p className="font-medium">
                      R$ {user.totalWagered.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Desde</p>
                    <p className="font-medium">
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <UserActionsMenu
                    user={user}
                    onToggleRole={() => setToggleRoleModal(user)}
                    onAdjustBalance={() => setAdjustBalanceModal(user)}
                    isSubmitting={isSubmitting}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {toggleRoleModal && (
        <ToggleRoleModal
          user={toggleRoleModal}
          onClose={() => setToggleRoleModal(null)}
          onConfirm={handleToggleRole}
          isSubmitting={isSubmitting}
        />
      )}

      {adjustBalanceModal && (
        <AdjustBalanceModal
          user={adjustBalanceModal}
          onClose={() => setAdjustBalanceModal(null)}
          onConfirm={handleAdjustBalance}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
