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
    <div className={cn("flex gap-3 overflow-x-auto scrollbar-none", className)}>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 border",
            selectedCategory === category.id
              ? "bg-green-500 text-black border-green-500"
              : "bg-neutral-800/80 text-white border-neutral-700 hover:bg-neutral-700"
          )}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
};

export default CategorySelector;