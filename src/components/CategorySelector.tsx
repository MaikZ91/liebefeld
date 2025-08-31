import React from 'react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  label: string;
  color?: string;
}

interface CategorySelectorProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  className?: string;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  className
}) => {
  return (
    <div className={cn("flex gap-2 overflow-x-auto scrollbar-none py-2", className)}>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0",
            selectedCategory === category.id
              ? "bg-foreground text-background shadow-md"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
            // Category-specific colors when active
            selectedCategory === category.id && category.id === 'sport' && "bg-sport-primary text-white",
            selectedCategory === category.id && category.id === 'ausgehen' && "bg-ausgehen-primary text-white", 
            selectedCategory === category.id && category.id === 'kreativität' && "bg-kreativität-primary text-white"
          )}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
};

export default CategorySelector;