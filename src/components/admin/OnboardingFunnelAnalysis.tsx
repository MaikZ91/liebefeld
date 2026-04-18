import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Users, UserCheck, MousePointer, CheckCircle2, TrendingDown } from 'lucide-react';

interface FunnelEvent {
  id: string;
  session_id: string;
  step: string;
  name: string | null;
  interests: string[] | null;
  referrer: string | null;
  landing_page: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  user_agent: string | null;
  created_at: string;
}

interface SessionData {
  session_id: string;
  firstSeen: string;
  lastSeen: string;
  referrer: string | null;
  landing_page: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  user_agent: string | null;
  steps: Set<string>;
  name: string | null;
  interests: string[] | null;
}

const STEP_LABELS: Record<string, string> = {
  landing: 'Gelandet',
  interest_selected: 'Interesse',
  name_entered: 'Name',
  completed_los_gehts: "Los geht's",
};

function getSourceLabel(s: SessionData): string {
  if (s.utm_source) return s.utm_source;
  if (!s.referrer) return 'Direkt';
  try {
    const host = new URL(s.referrer).hostname.replace('www.', '');
    return host;
  } catch {
    return s.referrer.slice(0, 30);
  }
}

function getDevice(ua: string | null): string {
  if (!ua) return '—';
  if (/iPhone|iPad/.test(ua)) return 'iOS';
  if (/Android/.test(ua)) return 'Android';
  if (/Mobile/.test(ua)) return 'Mobile';
  return 'Desktop';
}

export function OnboardingFunnelAnalysis() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('onboarding-funnel-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'onboarding_funnel_events' },
        () => fetchData()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('onboarding_funnel_events')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(2000);
      if (error) throw error;

      const map = new Map<string, SessionData>();
      (data as FunnelEvent[] | null)?.forEach((e) => {
        let s = map.get(e.session_id);
        if (!s) {
          s = {
            session_id: e.session_id,
            firstSeen: e.created_at,
            lastSeen: e.created_at,
            referrer: e.referrer,
            landing_page: e.landing_page,
            utm_source: e.utm_source,
            utm_medium: e.utm_medium,
            utm_campaign: e.utm_campaign,
            user_agent: e.user_agent,
            steps: new Set(),
            name: null,
            interests: null,
          };
          map.set(e.session_id, s);
        }
        s.steps.add(e.step);
        s.lastSeen = e.created_at;
        if (e.name) s.name = e.name;
        if (e.interests && e.interests.length > 0) s.interests = e.interests;
      });

      const arr = Array.from(map.values()).sort(
        (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
      );
      setSessions(arr);
    } catch (err) {
      console.error('Error loading funnel data:', err);
    } finally {
      setLoading(false);
    }
  };

  // KPIs
  const total = sessions.length;
  const withInterest = sessions.filter((s) => s.steps.has('interest_selected')).length;
  const withName = sessions.filter((s) => s.steps.has('name_entered')).length;
  const completed = sessions.filter((s) => s.steps.has('completed_los_gehts')).length;
  const conversion = total > 0 ? Math.round((completed / total) * 100) : 0;
  const dropInterest = total > 0 ? Math.round(((total - withInterest) / total) * 100) : 0;
  const dropName = withInterest > 0 ? Math.round(((withInterest - withName) / withInterest) * 100) : 0;
  const dropFinal = withName > 0 ? Math.round(((withName - completed) / withName) * 100) : 0;

  // Source breakdown
  const sourceCounts = new Map<string, number>();
  sessions.forEach((s) => {
    const src = getSourceLabel(s);
    sourceCounts.set(src, (sourceCounts.get(src) || 0) + 1);
  });
  const topSources = Array.from(sourceCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

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
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Sessions</span>
            </div>
            <p className="text-2xl font-bold mt-1">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Interesse gewählt</span>
            </div>
            <p className="text-2xl font-bold mt-1">{withInterest}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Name eingegeben</span>
            </div>
            <p className="text-2xl font-bold mt-1">{withName}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Los geht's ({conversion}%)</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-primary">{completed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Drop-off */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            Funnel Drop-off
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { label: 'Landing → Interesse', value: 100 - dropInterest, drop: dropInterest, count: withInterest },
            { label: 'Interesse → Name', value: 100 - dropName, drop: dropName, count: withName },
            { label: 'Name → Los geht\'s', value: 100 - dropFinal, drop: dropFinal, count: completed },
          ].map((row) => (
            <div key={row.label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium">
                  {row.count} <span className="text-muted-foreground">({row.value}% weiter, {row.drop}% Drop)</span>
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${row.value}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Top Sources */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Top Traffic-Quellen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {topSources.map(([src, count]) => (
              <Badge key={src} variant="secondary" className="text-xs">
                {src}: {count}
              </Badge>
            ))}
            {topSources.length === 0 && (
              <p className="text-xs text-muted-foreground">Noch keine Daten</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Sessions im Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {sessions.map((s) => {
                const completed = s.steps.has('completed_los_gehts');
                return (
                  <div
                    key={s.session_id}
                    className={`p-3 border rounded-lg ${
                      completed ? 'border-primary/40 bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {s.name || <span className="text-muted-foreground italic">Kein Name</span>}
                          </span>
                          {completed && (
                            <Badge className="bg-primary text-primary-foreground text-[10px] h-5">
                              ✓ Konvertiert
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px] h-5">
                            {getDevice(s.user_agent)}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {format(new Date(s.firstSeen), 'dd.MM. HH:mm', { locale: de })} ·{' '}
                          ID: {s.session_id.slice(0, 8)}
                        </p>
                      </div>
                    </div>

                    {/* Funnel steps */}
                    <div className="flex items-center gap-1 mb-2 flex-wrap">
                      {(['landing', 'interest_selected', 'name_entered', 'completed_los_gehts'] as const).map(
                        (step, i) => {
                          const done = s.steps.has(step);
                          return (
                            <div key={step} className="flex items-center gap-1">
                              <div
                                className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                  done
                                    ? 'bg-primary/20 text-primary'
                                    : 'bg-muted text-muted-foreground/50'
                                }`}
                              >
                                {STEP_LABELS[step]}
                              </div>
                              {i < 3 && <span className="text-muted-foreground/30 text-xs">→</span>}
                            </div>
                          );
                        }
                      )}
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                      <div>
                        <span className="text-muted-foreground">Quelle: </span>
                        <span className="font-medium">{getSourceLabel(s)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Landing: </span>
                        <span className="font-medium truncate">{s.landing_page || '/'}</span>
                      </div>
                      {s.utm_campaign && (
                        <div>
                          <span className="text-muted-foreground">Kampagne: </span>
                          <span className="font-medium">{s.utm_campaign}</span>
                        </div>
                      )}
                      {s.utm_medium && (
                        <div>
                          <span className="text-muted-foreground">Medium: </span>
                          <span className="font-medium">{s.utm_medium}</span>
                        </div>
                      )}
                      {s.interests && s.interests.length > 0 && (
                        <div className="md:col-span-2">
                          <span className="text-muted-foreground">Interessen: </span>
                          <span className="font-medium">{s.interests.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {sessions.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">
                  Noch keine Onboarding-Sessions getrackt
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
