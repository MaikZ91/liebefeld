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

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
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
