
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type FilterGroup = 'Alle' | 'Ausgehen' | 'Kreativität' | 'Sport';

interface FilterBarProps {
  value: FilterGroup;
  onChange: (value: FilterGroup) => void;
  className?: string;
  variant?: 'dark' | 'light';
}

const options: FilterGroup[] = ['Alle', 'Ausgehen', 'Kreativität', 'Sport'];

const FilterBar: React.FC<FilterBarProps> = ({ value, onChange, className, variant = 'dark' }) => {
  return (
    <div className={cn('w-full flex items-center gap-1', className)}>
      <div
        className={cn(
          'inline-flex rounded-full p-0.5',
          variant === 'light'
            ? 'bg-white/80 border border-gray-200'
            : 'bg-black/60 border border-white/20 backdrop-blur-sm'
        )}
      >
        {options.map((opt) => {
          const isActive = value === opt;
          return (
            <Button
              key={opt}
              size="sm"
              variant="ghost"
              onClick={() => onChange(opt)}
              className={cn(
                'px-3 h-7 text-xs rounded-full transition-colors',
                isActive
                  ? variant === 'light'
                    ? 'bg-gray-900 text-white hover:bg-gray-900'
                    : 'bg-white text-black hover:bg-white'
                  : variant === 'light'
                    ? 'text-gray-700 hover:bg-gray-100'
                    : 'text-white hover:bg-white/10'
              )}
            >
              {opt}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default FilterBar;
