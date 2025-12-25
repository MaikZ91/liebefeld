// src/components/admin/LiveActivityFeed.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MousePointer, Eye, ArrowDown, LogOut, Zap, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import type { Json } from '@/integrations/supabase/types';

interface ActivityLog {
  id: string;
  username: string;
  session_id: string;
  event_type: string;
  event_target: string | null;
  event_data: Json | null;
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
        .not('page_path', 'like', '%/admin%')
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

  const formatUsername = (username: string): string => {
    if (username.startsWith('Guest_')) {
      return username;
    }
    if (username.toLowerCase() === 'anonymous') {
      return 'Anonymous';
    }
    return username;
  };

  const extractReferrer = (activity: ActivityLog): string | null => {
    if (activity.event_type !== 'page_view') return null;
    const eventData = activity.event_data as Record<string, unknown> | null;
    const referrer = eventData?.referrer as string | undefined;
    if (!referrer || referrer.length < 5) return null;
    return referrer;
  };

  const isFromLandingPage = (referrer: string | null): boolean => {
    if (!referrer) return false;
    return referrer.includes('tribe-swipe-launch') || referrer.includes('tribe-swipe-lauch');
  };

  const formatReferrerShort = (referrer: string): string => {
    try {
      const url = new URL(referrer);
      return url.hostname.replace('www.', '');
    } catch {
      return referrer.slice(0, 30);
    }
  };

  const formatEventDetails = (activity: ActivityLog): { text: string; showPreview: boolean } => {
    switch (activity.event_type) {
      case 'click':
        return { text: 'Klickte auf:', showPreview: true };
      case 'page_view':
        return { text: `Besuchte ${activity.page_path}`, showPreview: false };
      case 'scroll':
        return { text: `Scrollte zu ${activity.scroll_depth}%`, showPreview: false };
      case 'page_leave':
        return { text: `Verließ nach ${activity.time_on_page}s`, showPreview: false };
      case 'interaction':
        return { text: 'Interagierte mit:', showPreview: true };
      default:
        return { text: activity.event_type, showPreview: false };
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
            {activities.map((activity, index) => {
              const referrer = extractReferrer(activity);
              const fromLanding = isFromLandingPage(referrer);
              
              return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.02 }}
                className={`flex items-center gap-3 py-2 border-b border-border/50 last:border-0 ${
                  fromLanding ? 'bg-green-500/10 rounded-lg px-2 -mx-2' : ''
                }`}
              >
                <Badge 
                  variant="secondary" 
                  className={`${eventColors[activity.event_type] || 'bg-muted'} px-2`}
                >
                  {eventIcons[activity.event_type]}
                </Badge>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {formatUsername(activity.username)}
                    </p>
                    {fromLanding && (
                      <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0">
                        Landing
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span>{formatEventDetails(activity).text}</span>
                    {formatEventDetails(activity).showPreview && activity.event_target && (
                      <span className="font-medium text-foreground bg-muted px-2 py-0.5 rounded text-xs max-w-[200px] truncate">
                        "{activity.event_target}"
                      </span>
                    )}
                    {referrer && (
                      <span className="flex items-center gap-1 text-[10px] text-blue-500">
                        <ExternalLink className="w-2.5 h-2.5" />
                        {formatReferrerShort(referrer)}
                      </span>
                    )}
                  </div>
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
              );
            })}
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
