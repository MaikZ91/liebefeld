
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type FilterGroup = 'Alle' | 'Ausgehen' | 'Kreativität' | 'Sport';

interface FilterBarProps {
  value: FilterGroup;
  onChange: (value: FilterGroup) => void;
  className?: string;
}

const options: FilterGroup[] = ['Alle', 'Ausgehen', 'Kreativität', 'Sport'];

const FilterBar: React.FC<FilterBarProps> = ({ value, onChange, className }) => {
  return (
    <div className={cn('w-full flex items-center gap-1', className)}>
      <div className="inline-flex bg-black/60 border border-white/20 rounded-full p-0.5 backdrop-blur-sm">
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
                  ? 'bg-white text-black hover:bg-white'
                  : 'text-white hover:bg-white/10',
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
