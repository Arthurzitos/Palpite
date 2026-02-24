'use client';

import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface BetSlipItem {
  id: string;
  eventTitle: string;
  outcome: 'yes' | 'no';
  odds: number;
}

interface BetSlipProps {
  items?: BetSlipItem[];
  onRemoveItem?: (id: string) => void;
  onConfirm?: (amount: number) => void;
}

const quickAmounts = [10, 50, 100, 500];

const recentBets = [
  { id: '1', title: 'BTC > $150K @ 42¢', status: 'ABERTO' },
  { id: '2', title: 'Copa 2026 Brasil @ 28¢', status: 'GANHOU' },
];

export function BetSlip({ items = [], onRemoveItem, onConfirm }: BetSlipProps) {
  const [amount, setAmount] = useState<string>('100');

  const numericAmount = parseFloat(amount.replace(',', '.')) || 0;
  const selectedItem = items[0];
  const potentialReturn = selectedItem
    ? numericAmount * (100 / selectedItem.odds)
    : 0;
  const returnPercentage = selectedItem
    ? ((100 / selectedItem.odds - 1) * 100).toFixed(1)
    : 0;

  return (
    <aside className="fixed right-0 top-0 z-40 h-screen w-[var(--betslip-width)] border-l border-border bg-background hidden xl:block">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <h2 className="font-semibold">Seu Palpite</h2>
          {items.length > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {items.length}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {selectedItem ? (
            <div className="space-y-4">
              {/* Selected Bet */}
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-3 flex items-start justify-between">
                  <p className="text-sm text-muted-foreground leading-tight">
                    {selectedItem.eventTitle}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 -mt-1 -mr-1"
                    onClick={() => onRemoveItem?.(selectedItem.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded px-2 py-1 text-xs font-bold',
                      selectedItem.outcome === 'yes'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-destructive/20 text-destructive'
                    )}
                  >
                    {selectedItem.outcome === 'yes' ? '✓ SIM' : '✗ NÃO'}
                  </span>
                  <span className="text-sm text-muted-foreground">@</span>
                  <span className="font-bold">{selectedItem.odds}¢</span>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Valor</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    R$
                  </span>
                  <Input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-12 pl-12 text-2xl font-bold bg-secondary border-0"
                  />
                </div>
              </div>

              {/* Quick Amounts */}
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setAmount(quickAmount.toString())}
                  >
                    R${quickAmount}
                  </Button>
                ))}
              </div>

              {/* Potential Return */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Retorno potencial
                </span>
                <span className="font-bold text-primary">
                  R$ {potentialReturn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (+{returnPercentage}%)
                </span>
              </div>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-center text-sm text-muted-foreground">
              Selecione um palpite nos mercados para começar
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4">
          {selectedItem && (
            <>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total investido</span>
                <span className="font-semibold">
                  R$ {numericAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Retorno potencial</span>
                <span className="font-semibold text-primary">
                  R$ {potentialReturn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <Button
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base"
                onClick={() => onConfirm?.(numericAmount)}
              >
                CONFIRMAR PALPITE
              </Button>
            </>
          )}

          {/* Recent Bets */}
          <div className={cn('mt-4', selectedItem && 'pt-4 border-t border-border')}>
            <button className="flex w-full items-center justify-between text-sm text-muted-foreground hover:text-foreground">
              Palpites Recentes
              <ChevronDown className="h-4 w-4" />
            </button>
            <div className="mt-3 space-y-2">
              {recentBets.map((bet) => (
                <div
                  key={bet.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{bet.title}</span>
                  <span
                    className={cn(
                      'rounded px-2 py-0.5 text-xs font-bold',
                      bet.status === 'ABERTO'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/20 text-primary'
                    )}
                  >
                    {bet.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
