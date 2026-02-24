'use client';

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
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryTabs({
  activeCategory,
  onCategoryChange,
}: CategoryTabsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {categories.map((category) => {
        const isActive = activeCategory === category.id;
        const Icon = category.icon;
        return (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
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
