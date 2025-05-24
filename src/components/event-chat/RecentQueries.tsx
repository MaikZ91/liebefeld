
import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { RecentQueriesProps } from './types';

const RecentQueries: React.FC<RecentQueriesProps> = ({
  showRecentQueries,
  setShowRecentQueries,
  queriesToRender,
  handleExamplePromptClick
}) => {
  if (queriesToRender.length === 0) return null;
  
  return (
    <div className={`absolute bottom-[60px] left-0 right-0 bg-gray-900/95 backdrop-blur-sm rounded-t-lg border border-red-500/20 transition-all duration-300 z-50 ${showRecentQueries ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
      <div className="p-3 border-b border-red-500/20">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-red-400">Letzte Community-Anfragen</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRecentQueries(false)}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="p-2 max-h-[150px] overflow-y-auto">
        {queriesToRender.map((query, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            className="w-full justify-start text-left text-sm py-2 text-red-200 hover:bg-red-950/30"
            onClick={() => handleExamplePromptClick(query)}
          >
            {query}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default RecentQueries;
