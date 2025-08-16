import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
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
