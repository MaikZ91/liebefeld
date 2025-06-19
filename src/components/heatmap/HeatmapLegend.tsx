
import React from 'react';
import { Card } from '@/components/ui/card';

export const HeatmapLegend: React.FC = () => {
  return (
    <Card className="p-4 bg-black/90 backdrop-blur border-gray-700 text-white text-sm">
      <h4 className="font-bold mb-2">Legende:</h4>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-[#ef4444]"></span> Sehr beliebt (20+ Teilnehmer/Likes)
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-[#f97316]"></span> Beliebt (10-19 Teilnehmer/Likes)
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-[#eab308]"></span> Moderat (5-9 Teilnehmer/Likes)
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-[#22c55e]"></span> Neu/Gering (0-4 Teilnehmer/Likes)
        </div>
      </div>
    </Card>
  );
};
