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
import { Layout } from './components/layouts/Layout'; // Import the Layout component
import UserDirectory from "./components/users/UserDirectory"; // Import UserDirectory
import EventCalendar from "./components/EventCalendar"; // Import EventCalendar

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
              {/* Wrap pages that should have the layout here */}
              <Route path="/" element={<Chat />} />
              <Route path="/index" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/impressum" element={<Impressum />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/policies" element={<CSAEPolicies />} />
              
              {/* Heatmap page now wrapped by Layout */}
              <Route path="/heatmap" element={<Layout><Heatmap /></Layout>} /> 

              {/* New routes for Users and Events, wrapped by Layout */}
              <Route path="/users" element={<Layout><UserDirectory open={true} onOpenChange={() => {}} onSelectUser={() => {}} /></Layout>} />
              <Route path="/events" element={<Layout><EventCalendar /></Layout>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </EventProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;