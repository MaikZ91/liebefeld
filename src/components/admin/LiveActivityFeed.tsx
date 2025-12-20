// src/components/admin/LiveActivityFeed.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MousePointer, Eye, ArrowDown, LogOut, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface ActivityLog {
  id: string;
  username: string;
  session_id: string;
  event_type: string;
  event_target: string | null;
  page_path: string;
  scroll_depth: number | null;
  time_on_page: number | null;
  created_at: string;
}

const eventIcons: Record<string, React.ReactNode> = {
  click: <MousePointer className="w-3 h-3" />,
  page_view: <Eye className="w-3 h-3" />,
  scroll: <ArrowDown className="w-3 h-3" />,
  page_leave: <LogOut className="w-3 h-3" />,
  interaction: <Zap className="w-3 h-3" />
};

const eventColors: Record<string, string> = {
  click: 'bg-green-500/20 text-green-600',
  page_view: 'bg-blue-500/20 text-blue-600',
  scroll: 'bg-purple-500/20 text-purple-600',
  page_leave: 'bg-orange-500/20 text-orange-600',
  interaction: 'bg-pink-500/20 text-pink-600'
};

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivities();

    // Real-time subscription
    const channel = supabase
      .channel('live-activity-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activity_logs'
        },
        (payload) => {
          setActivities(prev => [payload.new as ActivityLog, ...prev.slice(0, 49)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRecentActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatEventDetails = (activity: ActivityLog) => {
    switch (activity.event_type) {
      case 'click':
        return activity.event_target || 'Element geklickt';
      case 'page_view':
        return `Besuchte ${activity.page_path}`;
      case 'scroll':
        return `Scrollte zu ${activity.scroll_depth}%`;
      case 'page_leave':
        return `Verließ nach ${activity.time_on_page}s`;
      case 'interaction':
        return activity.event_target || 'Interaktion';
      default:
        return activity.event_type;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded-lg" />
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
          Live Aktivitäten
          <Badge variant="outline" className="animate-pulse text-xs">
            Echtzeit
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <AnimatePresence>
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.02 }}
                className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0"
              >
                <Badge 
                  variant="secondary" 
                  className={`${eventColors[activity.event_type] || 'bg-muted'} px-2`}
                >
                  {eventIcons[activity.event_type]}
                </Badge>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {activity.username}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {formatEventDetails(activity)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { 
                      addSuffix: true, 
                      locale: de 
                    })}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 font-mono">
                    {activity.session_id.slice(0, 8)}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {activities.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Noch keine Aktivitäten aufgezeichnet
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
