import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import App from "./App.tsx";
import "./index.css";
import { initExternalTracking } from './services/externalTrackingService';
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

// Initialize external tracking (UTMs + page_view)
initExternalTracking();

// Register Service Worker for PWA — only in production, never in preview/iframe
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes('id-preview--') ||
  window.location.hostname.includes('lovableproject.com');

if (isPreviewHost || isInIframe) {
  // Clean up any stale SW registrations from preview context
  navigator.serviceWorker?.getRegistrations().then(regs =>
    regs.forEach(r => r.unregister())
  );
} else if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <EventProvider>
          <ChatPreferencesProvider>
            <App />
          </ChatPreferencesProvider>
        </EventProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>,
);
