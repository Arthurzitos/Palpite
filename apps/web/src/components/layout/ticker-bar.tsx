'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TickerItem {
  id: string;
  title: string;
  price: number;
  change: number;
}

const mockTickerData: TickerItem[] = [
  { id: '1', title: 'Bitcoin $150K em 2026', price: 44, change: 2.5 },
  { id: '2', title: 'Brasil Copa 2026', price: 68, change: -1.2 },
  { id: '3', title: 'Lula Reeleito 2026', price: 52, change: 0.8 },
  { id: '4', title: 'Fed Taxa 4%', price: 31, change: -2.1 },
  { id: '5', title: 'Ethereum $10K', price: 28, change: 3.2 },
  { id: '6', title: 'Trump 2028', price: 45, change: 1.5 },
  { id: '7', title: 'SpaceX Mars 2030', price: 15, change: 0.3 },
  { id: '8', title: 'Apple $300', price: 62, change: -0.7 },
];

function TickerItemComponent({ item }: { item: TickerItem }) {
  const isPositive = item.change >= 0;

  return (
    <Link
      href={`/markets/${item.id}`}
      className="inline-flex items-center gap-3 px-4 text-sm hover:text-primary transition-colors"
    >
      <span className="font-medium truncate max-w-[200px]">{item.title}</span>
      <span className="font-bold text-primary">{item.price}%</span>
      <span
        className={cn(
          'flex items-center gap-0.5 text-xs font-medium',
          isPositive ? 'text-primary' : 'text-destructive'
        )}
      >
        {isPositive ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        {isPositive ? '+' : ''}
        {item.change.toFixed(1)}%
      </span>
    </Link>
  );
}

export function TickerBar() {
  // Duplicate items for seamless infinite scroll
  const items = [...mockTickerData, ...mockTickerData];

  return (
    <div className="h-8 overflow-hidden bg-card/50 border-b border-border">
      <div className="h-full flex items-center whitespace-nowrap ticker-scroll">
        {items.map((item, index) => (
          <TickerItemComponent key={`${item.id}-${index}`} item={item} />
        ))}
      </div>
    </div>
  );
}
