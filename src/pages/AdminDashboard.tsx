// src/pages/AdminDashboard.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Users, MousePointer, Eye, Clock, TrendingUp, 
  Activity, BarChart3, Map 
} from 'lucide-react';
import { format, subHours, startOfHour } from 'date-fns';
import { de } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ActivityHeatmap } from '@/components/admin/ActivityHeatmap';
import { UserJourneyAnalysis } from '@/components/admin/UserJourneyAnalysis';
import { LiveActivityFeed } from '@/components/admin/LiveActivityFeed';
import { TopPagesChart } from '@/components/admin/TopPagesChart';
import { UserRanking } from '@/components/admin/UserRanking';

interface ActivityStats {
  totalSessions: number;
  totalPageViews: number;
  totalClicks: number;
  avgTimeOnPage: number;
  activeUsersNow: number;
}

interface HourlyData {
  hour: string;
  count: number;
  users: string[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<ActivityStats>({
    totalSessions: 0,
    totalPageViews: 0,
    totalClicks: 0,
    avgTimeOnPage: 0,
    activeUsersNow: 0
  });
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchHourlyData();

    // Real-time subscription
    const channel = supabase
      .channel('admin-activity-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activity_logs'
        },
        () => {
          fetchStats();
          fetchHourlyData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const now = new Date();
      const last24h = subHours(now, 24);
      const last5min = subHours(now, 0.083); // ~5 minutes

      // Total sessions (unique session_ids in last 24h)
      const { data: sessions } = await supabase
        .from('user_activity_logs')
        .select('session_id')
        .gte('created_at', last24h.toISOString());
      
      const uniqueSessions = new Set(sessions?.map(s => s.session_id) || []);

      // Page views in last 24h (excluding /admin)
      const { count: pageViews } = await supabase
        .from('user_activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'page_view')
        .not('page_path', 'like', '%/admin%')
        .gte('created_at', last24h.toISOString());

      // Clicks in last 24h (excluding /admin)
      const { count: clicks } = await supabase
        .from('user_activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'click')
        .not('page_path', 'like', '%/admin%')
        .gte('created_at', last24h.toISOString());

      // Avg time on page
      const { data: timeData } = await supabase
        .from('user_activity_logs')
        .select('time_on_page')
        .eq('event_type', 'page_leave')
        .gte('created_at', last24h.toISOString())
        .not('time_on_page', 'is', null);

      const avgTime = timeData?.length 
        ? timeData.reduce((sum, d) => sum + (d.time_on_page || 0), 0) / timeData.length 
        : 0;

      // Active users now (sessions active in last 5 min)
      const { data: activeNow } = await supabase
        .from('user_activity_logs')
        .select('session_id')
        .gte('created_at', last5min.toISOString());

      const activeUsers = new Set(activeNow?.map(s => s.session_id) || []);

      setStats({
        totalSessions: uniqueSessions.size,
        totalPageViews: pageViews || 0,
        totalClicks: clicks || 0,
        avgTimeOnPage: Math.round(avgTime),
        activeUsersNow: activeUsers.size
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHourlyData = async () => {
    try {
      const now = new Date();
      const last24h = subHours(now, 24);

      const { data } = await supabase
        .from('user_activity_logs')
        .select('created_at, username')
        .gte('created_at', last24h.toISOString())
        .order('created_at', { ascending: true });

      // Group by hour with user tracking
      const hourData: Record<string, { count: number; users: Set<string> }> = {};
      
      for (let i = 0; i < 24; i++) {
        const hour = startOfHour(subHours(now, 23 - i));
        const key = format(hour, 'HH:mm');
        hourData[key] = { count: 0, users: new Set() };
      }

      data?.forEach(item => {
        const hour = format(new Date(item.created_at), 'HH:mm');
        const roundedHour = hour.split(':')[0] + ':00';
        if (hourData[roundedHour] !== undefined) {
          hourData[roundedHour].count++;
          if (item.username) {
            hourData[roundedHour].users.add(item.username);
          }
        }
      });

      setHourlyData(
        Object.entries(hourData).map(([hour, data]) => ({ 
          hour, 
          count: data.count,
          users: Array.from(data.users)
        }))
      );
    } catch (error) {
      console.error('Error fetching hourly data:', error);
    }
  };

  return (
    <div className="h-screen bg-background overflow-y-auto overflow-x-hidden">
      <div className="p-4 md:p-6 pb-32">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Activity Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              Echtzeit-Nutzeranalyse der letzten 24 Stunden
            </p>
          </div>
          <Badge variant="outline" className="animate-pulse">
            <Activity className="w-3 h-3 mr-1" />
            Live
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Sessions</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalSessions}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Page Views</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalPageViews}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <MousePointer className="w-4 h-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Clicks</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalClicks}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-muted-foreground">Ø Zeit/Seite</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.avgTimeOnPage}s</p>
            </CardContent>
          </Card>

          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Aktiv jetzt</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-primary">{stats.activeUsersNow}</p>
            </CardContent>
          </Card>
        </div>

        {/* Activity Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Aktivität (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 10 }}
                  interval={3}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value} Aktivitäten`, '']}
                  labelFormatter={(label) => `${label} Uhr`}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1}
                  fill="url(#colorActivity)"
                  label={({ x, y, index }) => {
                    const data = hourlyData[index];
                    if (!data?.users || data.users.length === 0) return null;
                    const displayName = data.users.length === 1 
                      ? data.users[0].substring(0, 8) 
                      : `${data.users[0].substring(0, 6)}+${data.users.length - 1}`;
                    return (
                      <text 
                        x={x} 
                        y={y - 8} 
                        fill="hsl(var(--muted-foreground))" 
                        fontSize={8} 
                        textAnchor="middle"
                      >
                        {displayName}
                      </text>
                    );
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tabs for detailed views */}
        <Tabs defaultValue="live" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="live">Live Feed</TabsTrigger>
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
            <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
            <TabsTrigger value="journey">User Journey</TabsTrigger>
            <TabsTrigger value="pages">Top Seiten</TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="mt-4">
            <LiveActivityFeed />
          </TabsContent>

          <TabsContent value="ranking" className="mt-4">
            <UserRanking />
          </TabsContent>

          <TabsContent value="heatmap" className="mt-4">
            <ActivityHeatmap />
          </TabsContent>

          <TabsContent value="journey" className="mt-4">
            <UserJourneyAnalysis />
          </TabsContent>

          <TabsContent value="pages" className="mt-4">
            <TopPagesChart />
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
}
