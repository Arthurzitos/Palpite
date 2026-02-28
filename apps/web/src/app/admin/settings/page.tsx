'use client';

import {
  Settings,
  Percent,
  DollarSign,
  Clock,
  Shield,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

function SettingCard({ title, description, icon: Icon, children }: SettingCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-primary/10 p-3">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

function SettingRow({
  label,
  value,
  type = 'text',
}: {
  label: string;
  value: string | number | boolean;
  type?: 'text' | 'boolean' | 'currency';
}) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      {type === 'boolean' ? (
        <span
          className={cn(
            'flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
            value ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'
          )}
        >
          {value ? (
            <>
              <CheckCircle className="h-3 w-3" />
              Ativado
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3" />
              Desativado
            </>
          )}
        </span>
      ) : type === 'currency' ? (
        <span className="font-medium">R$ {Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
      ) : (
        <span className="font-medium">{value}</span>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  // Configuracoes hardcoded para MVP
  // Em uma implementacao futura, estas viriam de uma API
  const platformSettings = {
    rakePercentage: 3,
    minBetAmount: 1,
    maxBetAmount: 10000,
    currency: 'BRL',
  };

  const paymentSettings = {
    pixEnabled: true,
    cryptoEnabled: true,
    minDeposit: 10,
    minWithdraw: 50,
  };

  const securitySettings = {
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
  };

  const maintenanceSettings = {
    maintenanceMode: false,
    maintenanceMessage: 'Sistema em manutencao. Voltaremos em breve.',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Configuracoes</h1>
        <p className="mt-1 text-muted-foreground">
          Visualize as configuracoes da plataforma
        </p>
      </div>

      {/* Info Banner */}
      <div className="flex items-center gap-3 rounded-lg bg-blue-500/10 p-4">
        <AlertCircle className="h-5 w-5 text-blue-500" />
        <p className="text-sm text-blue-500">
          As configuracoes abaixo sao definidas via variaveis de ambiente. Para modifica-las, atualize as
          configuracoes do servidor e reinicie a aplicacao.
        </p>
      </div>

      {/* Platform Settings */}
      <SettingCard
        title="Plataforma"
        description="Configuracoes gerais da plataforma de apostas"
        icon={Settings}
      >
        <SettingRow
          label="Taxa de Rake"
          value={`${platformSettings.rakePercentage}%`}
        />
        <SettingRow
          label="Aposta Minima"
          value={platformSettings.minBetAmount}
          type="currency"
        />
        <SettingRow
          label="Aposta Maxima"
          value={platformSettings.maxBetAmount}
          type="currency"
        />
        <SettingRow label="Moeda" value={platformSettings.currency} />
      </SettingCard>

      {/* Payment Settings */}
      <SettingCard
        title="Pagamentos"
        description="Metodos de pagamento e limites"
        icon={CreditCard}
      >
        <SettingRow label="PIX" value={paymentSettings.pixEnabled} type="boolean" />
        <SettingRow
          label="Criptomoedas"
          value={paymentSettings.cryptoEnabled}
          type="boolean"
        />
        <SettingRow
          label="Deposito Minimo"
          value={paymentSettings.minDeposit}
          type="currency"
        />
        <SettingRow
          label="Saque Minimo"
          value={paymentSettings.minWithdraw}
          type="currency"
        />
      </SettingCard>

      {/* Security Settings */}
      <SettingCard
        title="Seguranca"
        description="Configuracoes de seguranca e sessao"
        icon={Shield}
      >
        <SettingRow
          label="Tempo de Sessao"
          value={`${securitySettings.sessionTimeout} minutos`}
        />
        <SettingRow
          label="Tentativas de Login"
          value={`${securitySettings.maxLoginAttempts} tentativas`}
        />
        <SettingRow
          label="Tempo de Bloqueio"
          value={`${securitySettings.lockoutDuration} minutos`}
        />
      </SettingCard>

      {/* Maintenance Settings */}
      <SettingCard
        title="Manutencao"
        description="Status de manutencao do sistema"
        icon={Clock}
      >
        <SettingRow
          label="Modo Manutencao"
          value={maintenanceSettings.maintenanceMode}
          type="boolean"
        />
        <SettingRow
          label="Mensagem"
          value={maintenanceSettings.maintenanceMessage}
        />
      </SettingCard>

      {/* Future Implementation Note */}
      <div className="rounded-2xl border border-dashed border-border bg-muted/50 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-muted p-3">
            <Settings className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">Edicao de Configuracoes</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              A edicao de configuracoes via interface sera implementada em uma versao futura.
              Por enquanto, as configuracoes sao gerenciadas via variaveis de ambiente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
