// src/components/admin/TopPagesChart.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { subDays } from 'date-fns';

interface PageData {
  page: string;
  views: number;
  avgTime: number;
  avgScroll: number;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--primary) / 0.8)',
  'hsl(var(--primary) / 0.6)',
  'hsl(var(--primary) / 0.4)',
  'hsl(var(--primary) / 0.3)',
];

export function TopPagesChart() {
  const [pageData, setPageData] = useState<PageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPageData();
  }, []);

  const fetchPageData = async () => {
    try {
      const sevenDaysAgo = subDays(new Date(), 7);

      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('page_path, event_type, time_on_page, scroll_depth')
        .gte('created_at', sevenDaysAgo.toISOString());

      if (error) throw error;

      // Aggregate by page
      const pageMap = new Map<string, { 
        views: number; 
        totalTime: number; 
        timeCount: number;
        totalScroll: number;
        scrollCount: number;
      }>();

      data?.forEach(item => {
        const page = item.page_path;
        
        if (!pageMap.has(page)) {
          pageMap.set(page, { 
            views: 0, 
            totalTime: 0, 
            timeCount: 0,
            totalScroll: 0,
            scrollCount: 0
          });
        }

        const stats = pageMap.get(page)!;

        if (item.event_type === 'page_view') {
          stats.views++;
        }

        if (item.time_on_page) {
          stats.totalTime += item.time_on_page;
          stats.timeCount++;
        }

        if (item.scroll_depth) {
          stats.totalScroll += item.scroll_depth;
          stats.scrollCount++;
        }
      });

      // Convert to array and sort by views
      const result: PageData[] = Array.from(pageMap.entries())
        .map(([page, stats]) => ({
          page: page.length > 20 ? page.slice(0, 20) + '...' : page,
          views: stats.views,
          avgTime: stats.timeCount > 0 ? Math.round(stats.totalTime / stats.timeCount) : 0,
          avgScroll: stats.scrollCount > 0 ? Math.round(stats.totalScroll / stats.scrollCount) : 0
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      setPageData(result);
    } catch (error) {
      console.error('Error fetching page data:', error);
    } finally {
      setLoading(false);
    }
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
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Top Seiten (Views)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pageData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis 
                type="category" 
                dataKey="page" 
                tick={{ fontSize: 10 }} 
                width={100}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="views" radius={[0, 4, 4, 0]}>
                {pageData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Engagement pro Seite</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pageData.slice(0, 8).map((page, index) => (
              <div key={page.page} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium truncate max-w-[60%]">
                    {page.page}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {page.views} views
                  </span>
                </div>
                
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Ø Zeit: {page.avgTime}s</span>
                  <span>Ø Scroll: {page.avgScroll}%</span>
                </div>

                {/* Progress bars */}
                <div className="flex gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ 
                        width: `${Math.min((page.avgTime / 120) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${page.avgScroll}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs text-muted-foreground">Zeit (max 2min)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">Scroll-Tiefe</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
