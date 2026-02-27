'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Heart,
  Share2,
  Clock,
  Users,
  BarChart3,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useEvent } from '@/hooks/use-events';
import { usePlaceBet } from '@/hooks/use-bets';
import { useAuth } from '@/hooks/use-auth';
import { useFavorites } from '@/hooks/use-favorites';

const categoryMap: Record<string, string> = {
  sports: 'Esportes',
  crypto: 'Crypto',
  politics: 'Política',
  entertainment: 'Cultura',
  other: 'Outros',
};

const quickAmounts = [10, 50, 100, 500];

export default function MarketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const { event, isLoading: eventLoading, error: eventError, refetch } = useEvent(eventId);
  const { placeBet, isLoading: betLoading, error: betError } = usePlaceBet();
  const { user, isAuthenticated, fetchUser } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();

  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string | null>(null);
  const [amount, setAmount] = useState('100');
  const [success, setSuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const isFav = isFavorite(eventId);

  const handleFavorite = () => {
    toggleFavorite(eventId);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/markets/${eventId}`;
    const shareData = {
      title: event?.title || 'Mercado de Previsão',
      text: `Confira este palpite: ${event?.title}`,
      url: shareUrl,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      }
    } catch {
      // User cancelled or error - ignore
    }
  };

  if (eventLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="space-y-6">
        <Link
          href="/markets"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para mercados
        </Link>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
          <p className="text-destructive font-medium">{eventError || 'Evento não encontrado'}</p>
        </div>
      </div>
    );
  }

  const selectedOutcome = event.outcomes.find((o) => o._id === selectedOutcomeId);
  const numericAmount = parseFloat(amount) || 0;
  const selectedOdds = selectedOutcome?.odds || 1;
  const potentialReturn = numericAmount * selectedOdds;

  const handlePlaceBet = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!selectedOutcomeId || numericAmount <= 0) return;

    try {
      await placeBet(eventId, selectedOutcomeId, numericAmount);
      setSuccess(true);
      await fetchUser();
      await refetch();
      setTimeout(() => {
        setSuccess(false);
        setSelectedOutcomeId(null);
        setAmount('100');
      }, 3000);
    } catch {
      // Error is handled by usePlaceBet
    }
  };

  const isOpen = event.status === 'open';
  const isClosed = new Date(event.closesAt) <= new Date();

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/markets"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para mercados
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Market Header */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-purple-500/20 px-2 py-1 text-xs font-medium uppercase text-purple-400">
                  {categoryMap[event.category] || event.category}
                </span>
                {event.status === 'resolved' && (
                  <span className="flex items-center gap-1 rounded-md bg-green-500/20 px-2 py-1 text-xs font-medium text-green-400">
                    <CheckCircle className="h-3 w-3" />
                    RESOLVIDO
                  </span>
                )}
                {event.status === 'cancelled' && (
                  <span className="flex items-center gap-1 rounded-md bg-destructive/20 px-2 py-1 text-xs font-medium text-destructive">
                    <XCircle className="h-3 w-3" />
                    CANCELADO
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleFavorite}
                  className={cn(isFav && "text-red-500 hover:text-red-600")}
                >
                  <Heart className={cn("h-5 w-5", isFav && "fill-current")} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className={cn(shareSuccess && "text-green-500")}
                >
                  {shareSuccess ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            <h1 className="text-2xl font-bold mb-4">{event.title}</h1>
            <p className="text-muted-foreground mb-6">{event.description}</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-secondary p-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-xs">Volume</span>
                </div>
                <p className="font-semibold">
                  ${event.totalPool.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-xs">Outcomes</span>
                </div>
                <p className="font-semibold">{event.outcomes.length}</p>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs">Encerra</span>
                </div>
                <p className="font-semibold">
                  {new Date(event.closesAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          {/* Outcome Selection */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold mb-4">Escolha seu palpite</h2>

            {/* Progress Bar */}
            {event.outcomes.length >= 2 && event.totalPool > 0 && (
              <div className="mb-6 h-3 overflow-hidden rounded-full bg-destructive">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${(event.outcomes[0].totalPool / event.totalPool) * 100}%`,
                  }}
                />
              </div>
            )}

            <div className={cn(
              'grid gap-4',
              event.outcomes.length === 2 ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            )}>
              {event.outcomes.map((outcome, index) => {
                const isSelected = selectedOutcomeId === outcome._id;
                const isWinner = event.resolvedOutcomeId === outcome._id;
                const isFirst = index === 0;

                return (
                  <button
                    key={outcome._id}
                    onClick={() => isOpen && !isClosed && setSelectedOutcomeId(outcome._id)}
                    disabled={!isOpen || isClosed}
                    className={cn(
                      'flex flex-col items-center rounded-xl p-6 transition-all border-2',
                      isSelected
                        ? isFirst
                          ? 'bg-primary/20 border-primary'
                          : 'bg-destructive/20 border-destructive'
                        : isFirst
                          ? 'bg-primary/10 border-primary/20 hover:border-primary/40'
                          : 'bg-destructive/10 border-destructive/20 hover:border-destructive/40',
                      (!isOpen || isClosed) && 'opacity-60 cursor-not-allowed',
                      isWinner && 'ring-2 ring-green-500'
                    )}
                  >
                    <span className={cn(
                      'text-sm mb-2',
                      isFirst ? 'text-primary' : 'text-destructive'
                    )}>
                      {isFirst ? '✓' : '✗'} {outcome.label}
                    </span>
                    <span className={cn(
                      'text-4xl font-bold',
                      isFirst ? 'text-primary' : 'text-destructive'
                    )}>
                      {outcome.odds.toFixed(2)}x
                    </span>
                    <span className="text-xs text-muted-foreground mt-2">
                      Pool: ${outcome.totalPool.toLocaleString('pt-BR')}
                    </span>
                    {isWinner && (
                      <span className="mt-2 text-xs font-medium text-green-500">VENCEDOR</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resolution Info */}
          {event.status === 'resolved' && (
            <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <h2 className="font-semibold text-green-500">Evento Resolvido</h2>
              </div>
              {event.resolutionSource && (
                <p className="text-sm text-muted-foreground">
                  Fonte: {event.resolutionSource}
                </p>
              )}
              {event.resolvedAt && (
                <p className="text-sm text-muted-foreground">
                  Resolvido em: {new Date(event.resolvedAt).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          )}

          {/* Rules */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">Informações</h2>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Taxa de 3% cobrada no settlement
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Odds são calculadas pelo modelo pari-mutuel
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Evento cancelado = refund integral
              </li>
            </ul>
          </div>
        </div>

        {/* Bet Panel (Right Side) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold mb-4">Fazer Palpite</h2>

            {!isOpen || isClosed ? (
              <div className="flex h-40 items-center justify-center text-center text-sm text-muted-foreground">
                {isClosed ? 'Apostas encerradas para este evento' : 'Evento não está aberto para apostas'}
              </div>
            ) : success ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <p className="font-semibold text-green-500">Aposta realizada com sucesso!</p>
              </div>
            ) : selectedOutcome ? (
              <div className="space-y-4">
                {/* Selected Outcome */}
                <div className="rounded-lg bg-secondary p-4">
                  <p className="text-sm text-muted-foreground mb-2">Você selecionou</p>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'rounded px-2 py-1 text-xs font-semibold',
                      event.outcomes.indexOf(selectedOutcome) === 0
                        ? 'bg-primary/20 text-primary'
                        : 'bg-destructive/20 text-destructive'
                    )}>
                      {selectedOutcome.label}
                    </span>
                    <span className="text-muted-foreground">@</span>
                    <span className="font-semibold">{selectedOdds.toFixed(2)}x</span>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Valor</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      min="1"
                      max="10000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-8 text-xl font-semibold"
                    />
                  </div>
                </div>

                {/* Quick Amounts */}
                <div className="flex gap-2">
                  {quickAmounts.map((quickAmount) => (
                    <Button
                      key={quickAmount}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setAmount(quickAmount.toString())}
                    >
                      ${quickAmount}
                    </Button>
                  ))}
                </div>

                {/* Potential Return */}
                <div className="space-y-2 rounded-lg bg-secondary p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Investimento</span>
                    <span className="font-medium">
                      ${numericAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Retorno potencial</span>
                    <span className="font-semibold text-primary">
                      ${potentialReturn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Balance Info */}
                {isAuthenticated && user && (
                  <div className="text-sm text-muted-foreground text-center">
                    Saldo disponível: ${user.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                )}

                {/* Error */}
                {betError && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive text-center">
                    {betError}
                  </div>
                )}

                {/* Confirm Button */}
                <Button
                  className="w-full bg-primary hover:bg-primary/90 py-6 text-lg font-semibold"
                  onClick={handlePlaceBet}
                  disabled={betLoading || numericAmount <= 0}
                >
                  {betLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processando...
                    </>
                  ) : !isAuthenticated ? (
                    'FAZER LOGIN PARA APOSTAR'
                  ) : (
                    'CONFIRMAR PALPITE'
                  )}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setSelectedOutcomeId(null)}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-center text-sm text-muted-foreground">
                Selecione um outcome para fazer seu palpite
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
