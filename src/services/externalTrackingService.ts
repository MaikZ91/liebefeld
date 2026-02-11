// External tracking integration
const TOKEN = "ba2e7568-350e-4c92-b779-016819560f17";
const API = "https://uamkwgaxhegokdkeogbh.supabase.co/functions/v1";
const UTM_KEYS = ["utm_source", "utm_campaign", "utm_content"];
const PREFIX = "trk_";
const SID_KEY = "trk_session_id";

function getSession(): string {
  let s = sessionStorage.getItem(SID_KEY);
  if (!s) {
    s = "sess_" + Math.random().toString(36).slice(2, 18);
    sessionStorage.setItem(SID_KEY, s);
  }
  return s;
}

function captureUtms(): void {
  const params = new URLSearchParams(location.search);
  UTM_KEYS.forEach((k) => {
    const v = params.get(k);
    if (v && !localStorage.getItem(PREFIX + k)) localStorage.setItem(PREFIX + k, v);
  });
}

function getUtm(): Record<string, string | null> {
  const u: Record<string, string | null> = {};
  UTM_KEYS.forEach((k) => { u[k] = localStorage.getItem(PREFIX + k) || null; });
  return u;
}

export function trkEvent(name: string, props?: Record<string, unknown>): void {
  const utm = getUtm();
  fetch(API + "/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: TOKEN, session_id: getSession(), event_name: name, properties: props || {}, ...utm })
  }).catch(() => {});
}

export function trkLead(email: string, message?: string): void {
  const utm = getUtm();
  fetch(API + "/lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: TOKEN, email, message: message || null, ...utm })
  }).catch(() => {});
}

export function initExternalTracking(): void {
  captureUtms();
  trkEvent("page_view", { url: location.href, title: document.title });
}
