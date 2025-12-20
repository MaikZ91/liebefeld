// src/components/admin/ActivityHeatmap.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, subDays, startOfDay, addHours } from 'date-fns';
import { de } from 'date-fns/locale';

interface HeatmapCell {
  day: number;
  hour: number;
  count: number;
}

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function ActivityHeatmap() {
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>([]);
  const [maxCount, setMaxCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeatmapData();
  }, []);

  const fetchHeatmapData = async () => {
    try {
      const sevenDaysAgo = subDays(new Date(), 7);

      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString());

      if (error) throw error;

      // Initialize all cells
      const cells: Record<string, number> = {};
      for (let d = 0; d < 7; d++) {
        for (let h = 0; h < 24; h++) {
          cells[`${d}-${h}`] = 0;
        }
      }

      // Count activities per day/hour
      data?.forEach(item => {
        const date = new Date(item.created_at);
        const day = (date.getDay() + 6) % 7; // Monday = 0
        const hour = date.getHours();
        cells[`${day}-${hour}`]++;
      });

      const result: HeatmapCell[] = [];
      let max = 0;

      Object.entries(cells).forEach(([key, count]) => {
        const [day, hour] = key.split('-').map(Number);
        result.push({ day, hour, count });
        if (count > max) max = count;
      });

      setHeatmapData(result);
      setMaxCount(max);
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColor = (count: number) => {
    if (count === 0) return 'bg-muted/30';
    const intensity = Math.min(count / Math.max(maxCount, 1), 1);
    
    if (intensity < 0.25) return 'bg-primary/20';
    if (intensity < 0.5) return 'bg-primary/40';
    if (intensity < 0.75) return 'bg-primary/60';
    return 'bg-primary/90';
  };

  const getCellData = (day: number, hour: number) => {
    return heatmapData.find(c => c.day === day && c.hour === hour)?.count || 0;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Aktivitäts-Heatmap (letzte 7 Tage)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Hour labels */}
            <div className="flex ml-8 mb-1">
              {HOURS.filter(h => h % 3 === 0).map(hour => (
                <div 
                  key={hour} 
                  className="text-[10px] text-muted-foreground"
                  style={{ width: `${100/8}%` }}
                >
                  {hour}:00
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            {DAYS.map((day, dayIndex) => (
              <div key={day} className="flex items-center mb-1">
                <div className="w-8 text-xs text-muted-foreground">{day}</div>
                <div className="flex-1 flex gap-[2px]">
                  {HOURS.map(hour => {
                    const count = getCellData(dayIndex, hour);
                    return (
                      <div
                        key={hour}
                        className={`flex-1 h-6 rounded-sm ${getColor(count)} transition-colors hover:ring-2 hover:ring-primary/50 cursor-pointer`}
                        title={`${day} ${hour}:00 - ${count} Aktivitäten`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4">
              <span className="text-xs text-muted-foreground">Weniger</span>
              <div className="flex gap-1">
                <div className="w-4 h-4 rounded-sm bg-muted/30" />
                <div className="w-4 h-4 rounded-sm bg-primary/20" />
                <div className="w-4 h-4 rounded-sm bg-primary/40" />
                <div className="w-4 h-4 rounded-sm bg-primary/60" />
                <div className="w-4 h-4 rounded-sm bg-primary/90" />
              </div>
              <span className="text-xs text-muted-foreground">Mehr</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
