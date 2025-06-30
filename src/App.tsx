
// File: src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import Impressum from "./pages/Impressum";
import Privacy from "./pages/Privacy";
import CSAEPolicies from "./pages/CSAEPolicies";
import Chat from "./pages/Chat";
import { EventProvider } from "./contexts/EventContext";
import { initializeSupabase } from "./utils/initSupabase";
import Heatmap from '@/pages/Heatmap';
import { Layout } from './components/layouts/Layout';
import UserDirectory from "./components/users/UserDirectory";
import EventCalendar from "./components/EventCalendar";

const queryClient = new QueryClient();

function App() {
  // Initialize Supabase when the app loads
  useEffect(() => {
    initializeSupabase()
      .then(success => {
        if (success) {
          console.log("Supabase initialized successfully");
        } else {
          console.warn("Supabase initialization had issues");
        }
      });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <EventProvider>
          <Toaster />
          <Sonner position="top-center" />
          <BrowserRouter>
            <Routes>
              {/* Heatmap als Hauptseite */}
              <Route path="/" element={<Heatmap />} />
              <Route path="/heatmap" element={<Heatmap />} />
              
              {/* Andere Seiten */}
              <Route path="/index" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/impressum" element={<Impressum />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/policies" element={<CSAEPolicies />} />
              
              {/* Layout-wrapped pages */}
              <Route path="/users" element={<Layout><UserDirectory open={true} onOpenChange={() => {}} onSelectUser={() => {}} /></Layout>} />
              <Route path="/events" element={<Layout><EventCalendar /></Layout>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </EventProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
