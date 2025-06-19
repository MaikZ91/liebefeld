
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Filter, X } from 'lucide-react';

interface HeatmapFiltersProps {
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  dateFilter: string;
  setDateFilter: (date: string) => void;
}

export const HeatmapFilters: React.FC<HeatmapFiltersProps> = ({
  categories,
  selectedCategory,
  setSelectedCategory,
  dateFilter,
  setDateFilter
}) => {
  return (
    <Card className="p-4 bg-black/90 backdrop-blur border-gray-700">
      <h3 className="text-white font-bold mb-3 flex items-center gap-2">
        <Filter className="w-4 h-4" />
        Event Heatmap Bielefeld
      </h3>
      <div className="flex flex-wrap gap-2 mb-3">
        {categories.map((category) => (
          <Button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`text-xs px-3 py-1 rounded-full ${
              selectedCategory === category
                ? 'bg-red-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {category === 'all' ? 'Alle Kategorien' : category}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="bg-gray-800 border-gray-600 text-white text-xs py-1 px-2 rounded w-40"
        />
        {dateFilter && (
          <Button
            onClick={() => setDateFilter('')}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Card>
  );
};
