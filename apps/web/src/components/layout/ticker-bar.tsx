'use client';

import { cn } from '@/lib/utils';

interface TickerItem {
  id: string;
  title: string;
  price: number;
  change: number;
}

const mockTickerData: TickerItem[] = [
  { id: '1', title: 'SpaceX Mars 2027', price: 15, change: -0.5 },
  { id: '2', title: 'Oscar Melhor Filme', price: 45, change: 1.8 },
  { id: '3', title: 'Trump 2028', price: 23, change: -3.2 },
  { id: '4', title: 'ETH > $10K', price: 29, change: 8.4 },
  { id: '5', title: 'Lula reeleito?', price: 67, change: 2.3 },
  { id: '6', title: 'BTC > $150K', price: 42, change: -1.2 },
  { id: '7', title: 'Copa 2026 Brasil', price: 32, change: 0.8 },
  { id: '8', title: 'Fed corta juros', price: 78, change: 5.1 },
];

function TickerItemComponent({ item }: { item: TickerItem }) {
  const isPositive = item.change >= 0;

  return (
    <div className="flex items-center gap-3 whitespace-nowrap px-4 border-r border-border/50">
      <span className="text-xs text-muted-foreground">{item.title}</span>
      <span className="text-sm font-semibold">{item.price}¢</span>
      <span
        className={cn(
          'text-xs font-medium',
          isPositive ? 'text-primary' : 'text-destructive'
        )}
      >
        ~{isPositive ? '+' : ''}{item.change}%
      </span>
    </div>
  );
}

export function TickerBar() {
  return (
    <div className="relative h-8 overflow-hidden border-b border-border bg-background">
      <div className="ticker-scroll flex items-center h-full">
        {/* Duplicate for seamless loop */}
        {[...mockTickerData, ...mockTickerData].map((item, index) => (
          <TickerItemComponent key={`${item.id}-${index}`} item={item} />
        ))}
      </div>
    </div>
  );
}
