
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

const ChatLoadingSkeleton = () => {
  return (
    <div className="flex flex-col h-full w-full p-4 space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 bg-gray-800" />
        <Skeleton className="h-8 w-8 rounded-full bg-gray-800" />
      </div>
      
      {/* Messages skeleton */}
      <div className="flex-grow space-y-4">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="flex items-start space-x-2">
            <Skeleton className="h-8 w-8 rounded-full bg-gray-800" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 bg-gray-800" />
              <Skeleton className={`h-12 ${i % 2 === 0 ? 'w-72' : 'w-48'} bg-gray-800`} />
            </div>
          </div>
        ))}
      </div>
      
      {/* Input skeleton */}
      <div className="flex space-x-2">
        <Skeleton className="h-12 flex-grow bg-gray-800" />
        <Skeleton className="h-12 w-12 bg-gray-800" />
      </div>
    </div>
  );
};

export default ChatLoadingSkeleton;
