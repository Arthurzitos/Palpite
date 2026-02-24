'use client';

import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Calendar,
  LogOut,
  Settings,
  Shield,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user?.username || 'Usuário'}</h1>
            <p className="text-muted-foreground">{user?.email || 'email@example.com'}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Membro desde {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-primary">
            R$ {user?.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
          </p>
          <p className="text-xs text-muted-foreground">Saldo</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold">
            R$ {user?.totalWagered?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
          </p>
          <p className="text-xs text-muted-foreground">Total Apostado</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-primary">
            R$ {user?.totalWon?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
          </p>
          <p className="text-xs text-muted-foreground">Total Ganho</p>
        </div>
      </div>

      {/* Account Info */}
      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="font-semibold">Informações da Conta</h2>
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Nome de usuário</p>
                <p className="text-sm text-muted-foreground">{user?.username || 'N/A'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{user?.email || 'N/A'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Membro desde</p>
                <p className="text-sm text-muted-foreground">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="font-semibold">Configurações</h2>
        </div>
        <div className="divide-y divide-border">
          <button className="flex w-full items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Notificações</span>
            </div>
            <span className="text-sm text-muted-foreground">Ativadas</span>
          </button>
          <button className="flex w-full items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Segurança</span>
            </div>
            <span className="text-sm text-muted-foreground">2FA desativado</span>
          </button>
          <button className="flex w-full items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Preferências</span>
            </div>
          </button>
        </div>
      </div>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={handleLogout}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sair da conta
      </Button>
    </div>
  );
}
