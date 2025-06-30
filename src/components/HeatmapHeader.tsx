
import React from 'react';
import LiveTicker from './LiveTicker';
import { useEvents } from '@/hooks/useEvents';

interface HeatmapHeaderProps {
  selectedCity?: string;
}

const HeatmapHeader: React.FC<HeatmapHeaderProps> = ({ selectedCity = 'bielefeld' }) => {
  const { events, isLoading } = useEvents();

  return (
    <div className="absolute top-0 left-0 right-0 z-[1002] bg-black/90 backdrop-blur-sm border-b border-gray-800">
      <LiveTicker 
        events={events} 
        isLoadingEvents={isLoading}
        selectedCity={selectedCity}
      />
    </div>
  );
};

export default HeatmapHeader;
