
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getChannelColor } from '@/utils/channelColors';

export type FilterGroup = 'Alle' | 'Ausgehen' | 'Kreativität' | 'Sport';

interface FilterBarProps {
  value: FilterGroup;
  onChange: (value: FilterGroup) => void;
  className?: string;
  variant?: 'dark' | 'light';
}

const options: FilterGroup[] = ['Alle', 'Ausgehen', 'Kreativität', 'Sport'];

const FilterBar: React.FC<FilterBarProps> = ({ value, onChange, className, variant = 'dark' }) => {
  const handleChange = (newValue: FilterGroup) => {
    console.log('FilterBar: changing from', value, 'to', newValue);
    onChange(newValue);
    
    // Save to localStorage if not "Alle"
    if (newValue !== 'Alle') {
      try {
        const { saveActiveCategory } = require('@/utils/chatPreferences');
        saveActiveCategory(newValue);
      } catch (error) {
        console.error('Error saving filter preference:', error);
      }
    }
  };

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
          const isAll = opt === 'Alle';
          const chipBase = 'px-3 h-7 text-xs rounded-full transition-colors';
          if (isAll) {
            return (
              <Button
                key={opt}
                size="sm"
                variant="ghost"
                onClick={() => handleChange(opt)}
                className={cn(
                  chipBase,
                  isActive
                    ? variant === 'light'
                      ? 'bg-gray-900 text-white border border-gray-800'
                      : 'bg-white/10 text-white border border-white/20'
                    : variant === 'light'
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-white hover:bg-white/10'
                )}
              >
                {opt}
              </Button>
            );
          }
          const type = (opt === 'Ausgehen' ? 'ausgehen' : opt === 'Kreativität' ? 'kreativität' : 'sport') as 'ausgehen' | 'kreativität' | 'sport';
          const colors = getChannelColor(type);
          return (
            <Button
              key={opt}
              size="sm"
              variant="ghost"
              onClick={() => handleChange(opt)}
              style={isActive ? { ...colors.bgStyle, ...colors.borderStyle, color: 'hsl(var(--foreground))' } : { ...colors.borderStyle, ...colors.textStyle }}
              className={cn(chipBase, 'border', !isActive && 'hover:bg-white/5')}
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
