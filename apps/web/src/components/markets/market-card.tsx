'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFavorites } from '@/hooks/use-favorites';

interface MarketOutcome {
  id: string;
  label: string;
  odds: number;
  change: number;
}

interface MarketCardProps {
  id: string;
  title: string;
  category: string;
  isLive?: boolean;
  volume: string;
  traders: string;
  endsIn: string;
  outcomes: [MarketOutcome, MarketOutcome];
  onSelectOutcome?: (marketId: string, outcomeId: string, outcome: 'yes' | 'no') => void;
}

const categoryColors: Record<string, string> = {
  política: 'bg-muted text-muted-foreground',
  crypto: 'bg-muted text-muted-foreground',
  esportes: 'bg-muted text-muted-foreground',
  economia: 'bg-muted text-muted-foreground',
  cultura: 'bg-muted text-muted-foreground',
  mundo: 'bg-muted text-muted-foreground',
  tech: 'bg-muted text-muted-foreground',
};

export function MarketCard({
  id,
  title,
  category,
  isLive,
  volume,
  traders,
  endsIn,
  outcomes,
  onSelectOutcome,
}: MarketCardProps) {
  const [yesOutcome, noOutcome] = outcomes;
  const yesPercentage = (yesOutcome.odds / (yesOutcome.odds + noOutcome.odds)) * 100;
  const { toggleFavorite, isFavorite } = useFavorites();
  const [shareSuccess, setShareSuccess] = useState(false);
  const isFav = isFavorite(id);

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(id);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = `${window.location.origin}/markets/${id}`;
    const shareData = {
      title: title,
      text: `Confira este palpite: ${title}`,
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

  return (
    <div className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'rounded px-2 py-1 text-xs font-medium uppercase tracking-wide',
              categoryColors[category.toLowerCase()] || 'bg-muted text-muted-foreground'
            )}
          >
            {category}
          </span>
          {isLive && (
            <span className="flex items-center gap-1.5 rounded bg-destructive/20 px-2 py-1 text-xs font-semibold text-destructive">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
              LIVE
            </span>
          )}
        </div>
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              isFav ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={handleFavorite}
          >
            <Heart className={cn("h-4 w-4", isFav && "fill-current")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              shareSuccess ? "text-green-500" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={handleShare}
          >
            {shareSuccess ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Title */}
      <Link href={`/markets/${id}`}>
        <h3 className="mb-4 text-lg font-bold leading-tight hover:text-primary transition-colors">
          {title}
        </h3>
      </Link>

      {/* Progress Bar */}
      <div className="mb-4 h-1 overflow-hidden rounded-full bg-destructive">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${yesPercentage}%` }}
        />
      </div>

      {/* Outcome Buttons */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        {/* Yes Button */}
        <button
          onClick={() => onSelectOutcome?.(id, yesOutcome.id, 'yes')}
          className="flex flex-col items-center rounded-lg bg-primary/10 p-3 transition-all hover:bg-primary/20 border border-primary/30 hover:border-primary/50"
        >
          <span className="text-xs font-medium text-primary">✓ SIM</span>
          <span className="text-2xl font-bold text-primary">{yesOutcome.odds}¢</span>
          <span
            className={cn(
              'text-xs font-medium',
              yesOutcome.change >= 0 ? 'text-primary' : 'text-destructive'
            )}
          >
            ~{yesOutcome.change >= 0 ? '+' : ''}{yesOutcome.change}%
          </span>
        </button>

        {/* No Button */}
        <button
          onClick={() => onSelectOutcome?.(id, noOutcome.id, 'no')}
          className="flex flex-col items-center rounded-lg bg-destructive/10 p-3 transition-all hover:bg-destructive/20 border border-destructive/30 hover:border-destructive/50"
        >
          <span className="text-xs font-medium text-destructive">✗ NÃO</span>
          <span className="text-2xl font-bold text-destructive">{noOutcome.odds}¢</span>
          <span
            className={cn(
              'text-xs font-medium',
              noOutcome.change >= 0 ? 'text-primary' : 'text-destructive'
            )}
          >
            ~{noOutcome.change >= 0 ? '+' : ''}{noOutcome.change}%
          </span>
        </button>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>R$ {volume}</span>
        <span>•</span>
        <span>{traders} traders</span>
        <span>•</span>
        <span>{endsIn}</span>
      </div>
    </div>
  );
}
