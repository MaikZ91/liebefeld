import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import { EventProvider } from './contexts/EventContext';
import { ChatPreferencesProvider } from './contexts/ChatPreferencesContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

async function start() {
  // In preview or with ?no-sw=1, unregister any old Service Workers to avoid cached, truncated bundles
  if (typeof window !== 'undefined') {
    const bypassSW = window.location.hostname.endsWith('lovableproject.com') || window.location.search.includes('no-sw=1');
    if (bypassSW && 'serviceWorker' in navigator) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
        if ('caches' in window) {
          const keys = await (window as any).caches.keys();
          await Promise.all(keys.map((k: string) => (window as any).caches.delete(k)));
        }
        console.log('[SW] Unregistered old service workers and cleared caches');
      } catch (err) {
        console.warn('[SW] Cleanup failed', err);
      }
    }
  }

  const { default: App } = await import('./App.tsx');

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <EventProvider>
          <ChatPreferencesProvider>
            <App />
          </ChatPreferencesProvider>
        </EventProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}

start();

