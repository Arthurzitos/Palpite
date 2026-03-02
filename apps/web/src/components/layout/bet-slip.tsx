'use client';

import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { betsApi, Bet, Event } from '@/lib/api';
import { BetSlipItem } from '@/hooks/use-bet-slip';

interface BetSlipProps {
  items?: BetSlipItem[];
  onRemoveItem?: (id: string) => void;
  onConfirm?: (amount: number) => void;
  isPlacingBet?: boolean;
  error?: string | null;
  onClearError?: () => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

const quickAmounts = [10, 50, 100, 500];

export function BetSlip({ items = [], onRemoveItem, onConfirm, isPlacingBet, error, onClearError, isExpanded = false, onToggleExpanded }: BetSlipProps) {
  const [amount, setAmount] = useState<string>('100');
  const [recentBets, setRecentBets] = useState<{ id: string; title: string; status: string }[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);

  useEffect(() => {
    const fetchRecentBets = async () => {
      try {
        const data = await betsApi.getMyBets({ limit: 5 });
        const formatted = data.bets.map((bet) => {
          const event = bet.eventId as Event;
          const eventTitle = typeof event === 'object' ? event.title : 'Evento';
          const odds = Math.round(bet.oddsAtPurchase * 100);
          return {
            id: bet._id,
            title: `${eventTitle.substring(0, 20)}... @ ${odds}¢`,
            status: bet.status === 'pending' ? 'ABERTO' : bet.status === 'won' ? 'GANHOU' : 'PERDEU',
          };
        });
        setRecentBets(formatted);
      } catch {
        // Silently fail for recent bets
      } finally {
        setIsLoadingRecent(false);
      }
    };

    fetchRecentBets();
  }, [items]); // Refresh when items change (after placing a bet)

  const numericAmount = parseFloat(amount.replace(',', '.')) || 0;
  const selectedItem = items[0];
  const potentialReturn = selectedItem
    ? numericAmount * (100 / selectedItem.odds)
    : 0;
  const returnPercentage = selectedItem
    ? ((100 / selectedItem.odds - 1) * 100).toFixed(1)
    : 0;

  // Minimized state - show only toggle button
  if (!isExpanded) {
    return (
      <aside className="fixed right-0 top-1/2 -translate-y-1/2 z-40 hidden xl:block">
        <Button
          onClick={onToggleExpanded}
          className="h-24 w-12 rounded-l-lg rounded-r-none bg-card border border-r-0 border-border hover:bg-muted flex flex-col items-center justify-center gap-2"
          variant="ghost"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-xs font-medium writing-mode-vertical rotate-180" style={{ writingMode: 'vertical-rl' }}>
            Palpite
          </span>
          {items.length > 0 && (
            <span className="absolute -top-2 -left-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {items.length}
            </span>
          )}
        </Button>
      </aside>
    );
  }

  return (
    <aside className="fixed right-0 top-0 z-40 h-screen w-[var(--betslip-width)] border-l border-border bg-background hidden xl:block transition-all duration-300">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={onToggleExpanded}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <h2 className="font-semibold">Seu Palpite</h2>
          </div>
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
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription className="flex items-center justify-between">
                    {error}
                    <button onClick={onClearError} className="text-xs underline">
                      Fechar
                    </button>
                  </AlertDescription>
                </Alert>
              )}
              <Button
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base"
                onClick={() => onConfirm?.(numericAmount)}
                disabled={isPlacingBet || numericAmount <= 0}
              >
                {isPlacingBet ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    PROCESSANDO...
                  </>
                ) : (
                  'CONFIRMAR PALPITE'
                )}
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
              {isLoadingRecent ? (
                <div className="flex justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : recentBets.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Nenhum palpite recente
                </p>
              ) : (
                recentBets.map((bet) => (
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
                          : bet.status === 'GANHOU'
                          ? 'bg-primary/20 text-primary'
                          : 'bg-destructive/20 text-destructive'
                      )}
                    >
                      {bet.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
