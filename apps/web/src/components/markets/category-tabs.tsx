'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Flame,
  Landmark,
  Bitcoin,
  Trophy,
  Palette,
  LineChart,
  Globe,
} from 'lucide-react';

interface Category {
  id: string;
  label: string;
  icon?: React.ElementType;
  emoji?: string;
}

const categories: Category[] = [
  { id: 'all', label: 'Todos' },
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'politica', label: 'Política', icon: Landmark },
  { id: 'crypto', label: 'Crypto', emoji: '₿' },
  { id: 'esportes', label: 'Esportes', icon: Trophy },
  { id: 'cultura', label: 'Cultura', icon: Palette },
  { id: 'economia', label: 'Economia', icon: LineChart },
  { id: 'mundo', label: 'Mundo', icon: Globe },
];

interface CategoryTabsProps {
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
}

function CategoryTabsContent({
  activeCategory: controlledActiveCategory,
  onCategoryChange,
}: CategoryTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Use URL as source of truth, fallback to prop
  const activeCategory = controlledActiveCategory ?? searchParams.get('category') ?? 'all';

  const handleCategoryChange = (category: string) => {
    // Call the callback if provided
    onCategoryChange?.(category);

    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    if (category === 'all') {
      params.delete('category');
      params.delete('filter');
    } else if (category === 'trending') {
      params.delete('category');
      params.set('filter', 'trending');
    } else {
      params.set('category', category);
      params.delete('filter');
    }

    const queryString = params.toString();
    router.push(`/markets${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {categories.map((category) => {
        const isActive = activeCategory === category.id ||
          (category.id === 'trending' && searchParams.get('filter') === 'trending');
        const Icon = category.icon;
        return (
          <button
            key={category.id}
            onClick={() => handleCategoryChange(category.id)}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {category.emoji && <span className="text-sm">{category.emoji}</span>}
            {Icon && <Icon className="h-4 w-4" />}
            {category.label}
          </button>
        );
      })}
    </div>
  );
}

export function CategoryTabs(props: CategoryTabsProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((category) => (
          <div
            key={category.id}
            className="h-9 w-20 animate-pulse rounded-full bg-muted"
          />
        ))}
      </div>
    }>
      <CategoryTabsContent {...props} />
    </Suspense>
  );
}
