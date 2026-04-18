// Tracks the onboarding funnel: landing -> interests -> name -> los geht's
import { supabase } from '@/integrations/supabase/client';

export type FunnelStep =
  | 'landing'
  | 'interest_selected'
  | 'name_entered'
  | 'completed_los_gehts';

const SESSION_KEY = 'onboarding_funnel_session_id';
const LANDING_KEY = 'onboarding_funnel_landing_logged';

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function getUtm() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || sessionStorage.getItem('utm_source'),
    utm_medium: params.get('utm_medium') || sessionStorage.getItem('utm_medium'),
    utm_campaign: params.get('utm_campaign') || sessionStorage.getItem('utm_campaign'),
  };
}

// Persist UTMs across the session
(function persistUtms() {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  ['utm_source', 'utm_medium', 'utm_campaign'].forEach((k) => {
    const v = params.get(k);
    if (v) sessionStorage.setItem(k, v);
  });
})();

export async function trackFunnelStep(
  step: FunnelStep,
  data?: { name?: string; interests?: string[] }
): Promise<void> {
  try {
    const session_id = getSessionId();
    const utm = getUtm();

    await supabase.from('onboarding_funnel_events').insert({
      session_id,
      step,
      name: data?.name ?? null,
      interests: data?.interests ?? null,
      referrer: document.referrer || null,
      landing_page: window.location.pathname + window.location.search,
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      user_agent: navigator.userAgent,
    });
  } catch (e) {
    console.error('Funnel tracking error:', e);
  }
}

export async function trackLandingOnce(): Promise<void> {
  if (sessionStorage.getItem(LANDING_KEY)) return;
  sessionStorage.setItem(LANDING_KEY, '1');
  await trackFunnelStep('landing');
}
