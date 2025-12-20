// src/components/admin/UserJourneyAnalysis.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Clock, MousePointer } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface JourneyStep {
  page_path: string;
  event_type: string;
  time_on_page: number | null;
  scroll_depth: number | null;
  clicks: number;
  created_at: string;
}

interface UserSession {
  session_id: string;
  username: string;
  steps: JourneyStep[];
  totalTime: number;
  totalClicks: number;
}

export function UserJourneyAnalysis() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1000);

      if (error) throw error;

      // Group by session
      const sessionMap = new Map<string, UserSession>();

      data?.forEach(log => {
        if (!sessionMap.has(log.session_id)) {
          sessionMap.set(log.session_id, {
            session_id: log.session_id,
            username: log.username,
            steps: [],
            totalTime: 0,
            totalClicks: 0
          });
        }

        const session = sessionMap.get(log.session_id)!;
        
        if (log.event_type === 'page_view' || log.event_type === 'page_leave') {
          // Find existing step for this page or create new
          let step = session.steps.find(s => 
            s.page_path === log.page_path && 
            s.event_type === 'page_view' &&
            !s.time_on_page
          );

          if (log.event_type === 'page_view') {
            session.steps.push({
              page_path: log.page_path,
              event_type: log.event_type,
              time_on_page: null,
              scroll_depth: null,
              clicks: 0,
              created_at: log.created_at
            });
          } else if (log.event_type === 'page_leave' && step) {
            step.time_on_page = log.time_on_page;
            step.scroll_depth = log.scroll_depth;
            session.totalTime += log.time_on_page || 0;
          }
        }

        if (log.event_type === 'click') {
          const lastStep = session.steps[session.steps.length - 1];
          if (lastStep) {
            lastStep.clicks++;
          }
          session.totalClicks++;
        }
      });

      // Convert to array and sort by recent activity
      const sessionsArray = Array.from(sessionMap.values())
        .filter(s => s.steps.length > 0)
        .sort((a, b) => {
          const aTime = new Date(a.steps[a.steps.length - 1]?.created_at || 0).getTime();
          const bTime = new Date(b.steps[b.steps.length - 1]?.created_at || 0).getTime();
          return bTime - aTime;
        })
        .slice(0, 20);

      setSessions(sessionsArray);
      if (sessionsArray.length > 0) {
        setSelectedSession(sessionsArray[0].session_id);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentSession = sessions.find(s => s.session_id === selectedSession);

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
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">User Journey Analyse</CardTitle>
          <Select value={selectedSession || ''} onValueChange={setSelectedSession}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Session wählen" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map(session => (
                <SelectItem key={session.session_id} value={session.session_id}>
                  {session.username} ({session.steps.length} Seiten)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {currentSession ? (
          <div className="space-y-4">
            {/* Session Summary */}
            <div className="flex gap-4 p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Nutzer</p>
                <p className="font-medium">{currentSession.username}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gesamtzeit</p>
                <p className="font-medium">{currentSession.totalTime}s</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Klicks</p>
                <p className="font-medium">{currentSession.totalClicks}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Seiten</p>
                <p className="font-medium">{currentSession.steps.length}</p>
              </div>
            </div>

            {/* Journey Steps */}
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {currentSession.steps.map((step, index) => (
                  <div key={index} className="relative">
                    {index > 0 && (
                      <div className="absolute left-4 -top-2 h-4 w-px bg-border" />
                    )}
                    
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {index + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{step.page_path}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {step.time_on_page !== null && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {step.time_on_page}s
                            </span>
                          )}
                          {step.clicks > 0 && (
                            <span className="flex items-center gap-1">
                              <MousePointer className="w-3 h-3" />
                              {step.clicks} Klicks
                            </span>
                          )}
                          {step.scroll_depth !== null && (
                            <span>↓ {step.scroll_depth}%</span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {format(new Date(step.created_at), 'HH:mm:ss')}
                      </p>
                    </div>

                    {index < currentSession.steps.length - 1 && (
                      <div className="flex justify-center py-1">
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Keine Sessions vorhanden
          </div>
        )}
      </CardContent>
    </Card>
  );
}
