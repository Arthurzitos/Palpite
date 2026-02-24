'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MarketCard, StatsCards, CategoryTabs } from '@/components/markets';
import { Button } from '@/components/ui/button';
import { useEvents } from '@/hooks/use-events';
import { EventStatus } from '@prediction-market/shared';

function formatVolume(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toFixed(0);
}

function formatTimeRemaining(closesAt: string): string {
  const now = new Date();
  const closes = new Date(closesAt);
  const diff = closes.getTime() - now.getTime();

  if (diff <= 0) return 'Encerrado';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `Encerra ${days}d`;
  if (hours > 0) return `Encerra ${hours}h`;
  return `Encerra ${minutes}m`;
}

const categoryMap: Record<string, string> = {
  sports: 'Esportes',
  crypto: 'Crypto',
  politics: 'Política',
  entertainment: 'Cultura',
  other: 'Outros',
};

function MarketsContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const [activeCategory, setActiveCategory] = useState(categoryParam || 'all');
  const [page, setPage] = useState(1);

  const filters = useMemo(() => ({
    status: EventStatus.OPEN,
    category: activeCategory !== 'all' ? activeCategory : undefined,
    page,
    limit: 20,
  }), [activeCategory, page]);

  const { events, isLoading, error, pagination, refetch } = useEvents(filters);

  useEffect(() => {
    if (categoryParam) {
      setActiveCategory(categoryParam);
    }
  }, [categoryParam]);

  useEffect(() => {
    setPage(1);
    refetch(filters);
  }, [activeCategory]);

  const handleSelectOutcome = (marketId: string, outcomeId: string, outcome: 'yes' | 'no') => {
    console.log('Selected:', { marketId, outcomeId, outcome });
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  const marketCards = events.map((event) => {
    const outcomes = event.outcomes.slice(0, 2);
    const yesOutcome = outcomes[0];
    const noOutcome = outcomes[1] || { _id: '', label: 'Não', odds: 0, totalPool: 0 };

    const yesOdds = yesOutcome?.odds ? Math.round(yesOutcome.odds * 100 / (yesOutcome.odds + (noOutcome?.odds || 1))) : 50;
    const noOdds = 100 - yesOdds;

    return {
      id: event._id,
      title: event.title,
      category: categoryMap[event.category] || event.category,
      isLive: false,
      volume: formatVolume(event.totalPool),
      traders: '-',
      endsIn: formatTimeRemaining(event.closesAt),
      outcomes: [
        { id: yesOutcome?._id || '', label: yesOutcome?.label || 'Sim', odds: yesOdds, change: 0 },
        { id: noOutcome?._id || '', label: noOutcome?.label || 'Não', odds: noOdds, change: 0 },
      ] as [{ id: string; label: string; odds: number; change: number }, { id: string; label: string; odds: number; change: number }],
    };
  });

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-8">
        <div className="flex gap-1 mb-4">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-1">Preveja o futuro.</h1>
        <h2 className="text-4xl font-bold text-primary mb-4">Lucre com isso.</h2>
        <p className="text-muted-foreground max-w-lg">
          Mercados de previsão em tempo real. Aposte em política, esportes, crypto e mais.
        </p>

        {/* Stats */}
        <div className="mt-8">
          <StatsCards />
        </div>

        {/* System info */}
        <div className="mt-4 text-right text-xs text-muted-foreground font-mono">
          SYS.LIVE // {new Date().toLocaleDateString('pt-BR')}
        </div>
      </div>

      {/* Category Tabs */}
      <CategoryTabs
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Loading State */}
      {isLoading && page === 1 && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && events.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-medium">Nenhum mercado encontrado</p>
          <p className="text-muted-foreground">
            Tente outra categoria ou volte mais tarde.
          </p>
        </div>
      )}

      {/* Markets Grid */}
      {marketCards.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {marketCards.map((market) => (
            <MarketCard
              key={market.id}
              {...market}
              onSelectOutcome={handleSelectOutcome}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {pagination.page < pagination.totalPages && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="lg"
            className="rounded-full px-8"
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading ? 'Carregando...' : 'Carregar mais mercados'}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function MarketsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    }>
      <MarketsContent />
    </Suspense>
  );
}
