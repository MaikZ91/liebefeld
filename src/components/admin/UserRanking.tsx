// src/components/admin/UserRanking.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, TrendingUp, Eye, MousePointer, Clock } from 'lucide-react';
import { format, subDays, startOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';

interface UserStats {
  username: string;
  displayName: string;
  pageViews: number;
  clicks: number;
  totalTime: number;
  sessions: number;
  scrollDepth: number;
}

export function UserRanking() {
  const [dailyStats, setDailyStats] = useState<UserStats[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();

    const channel = supabase
      .channel('user-ranking-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_activity_logs'
      }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const extractDisplayName = (username: string): string => {
    // Extract "Guest_XXXX" format or show full username
    if (username.startsWith('Guest_')) {
      return username; // Keep full Guest_XXXX format
    }
    if (username.toLowerCase().includes('anonymous') || username.toLowerCase() === 'anonymous') {
      return 'Anonymous';
    }
    return username;
  };

  const fetchStats = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = startOfMonth(now);

      // Fetch daily data (excluding /admin paths)
      const { data: dailyData } = await supabase
        .from('user_activity_logs')
        .select('*')
        .gte('created_at', todayStart.toISOString())
        .not('page_path', 'like', '%/admin%');

      // Fetch monthly data (excluding /admin paths)
      const { data: monthlyData } = await supabase
        .from('user_activity_logs')
        .select('*')
        .gte('created_at', monthStart.toISOString())
        .not('page_path', 'like', '%/admin%');

      setDailyStats(processStats(dailyData || []));
      setMonthlyStats(processStats(monthlyData || []));
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const processStats = (data: any[]): UserStats[] => {
    const userMap = new Map<string, UserStats>();

    data.forEach(log => {
      if (!userMap.has(log.username)) {
        userMap.set(log.username, {
          username: log.username,
          displayName: extractDisplayName(log.username),
          pageViews: 0,
          clicks: 0,
          totalTime: 0,
          sessions: 0,
          scrollDepth: 0
        });
      }

      const stats = userMap.get(log.username)!;

      if (log.event_type === 'page_view') {
        stats.pageViews++;
      }
      if (log.event_type === 'click') {
        stats.clicks++;
      }
      if (log.event_type === 'page_leave' && log.time_on_page) {
        stats.totalTime += log.time_on_page;
      }
      if (log.scroll_depth) {
        stats.scrollDepth = Math.max(stats.scrollDepth, log.scroll_depth);
      }
    });

    // Count unique sessions per user
    const sessionsByUser = new Map<string, Set<string>>();
    data.forEach(log => {
      if (!sessionsByUser.has(log.username)) {
        sessionsByUser.set(log.username, new Set());
      }
      sessionsByUser.get(log.username)!.add(log.session_id);
    });

    userMap.forEach((stats, username) => {
      stats.sessions = sessionsByUser.get(username)?.size || 0;
    });

    // Sort by activity score (weighted: clicks + pageViews + time/10)
    return Array.from(userMap.values())
      .sort((a, b) => {
        const scoreA = a.clicks * 2 + a.pageViews + Math.floor(a.totalTime / 10);
        const scoreB = b.clicks * 2 + b.pageViews + Math.floor(b.totalTime / 10);
        return scoreB - scoreA;
      });
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 text-center text-sm font-bold text-muted-foreground">{index + 1}</span>;
  };

  const RankingList = ({ stats }: { stats: UserStats[] }) => (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2">
        {stats.map((user, index) => (
          <div
            key={user.username}
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              index === 0 ? 'bg-yellow-500/10 border-yellow-500/30' :
              index === 1 ? 'bg-gray-500/10 border-gray-500/30' :
              index === 2 ? 'bg-amber-500/10 border-amber-500/30' :
              'bg-background border-border'
            }`}
          >
            <div className="w-8 flex justify-center">
              {getRankIcon(index)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user.displayName}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {user.pageViews}
                </span>
                <span className="flex items-center gap-1">
                  <MousePointer className="w-3 h-3" />
                  {user.clicks}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {Math.floor(user.totalTime / 60)}m
                </span>
              </div>
            </div>

            <div className="text-right">
              <Badge variant="secondary" className="text-xs">
                {user.sessions} Sessions
              </Badge>
            </div>
          </div>
        ))}

        {stats.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Noch keine Daten vorhanden
          </div>
        )}
      </div>
    </ScrollArea>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          User Ranking nach Aktivität
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="daily">Heute ({dailyStats.length})</TabsTrigger>
            <TabsTrigger value="monthly">Monat ({monthlyStats.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            <RankingList stats={dailyStats} />
          </TabsContent>

          <TabsContent value="monthly">
            <RankingList stats={monthlyStats} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
