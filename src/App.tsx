// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom"; // Import useNavigate
import { useEffect, useState } from "react"; // Import useState
import Index from "./pages/Index";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import Impressum from "./pages/Impressum";
import Privacy from "./pages/Privacy";
import CSAEPolicies from "./pages/CSAEPolicies";
import Chat from "./pages/Chat";
import Challenge from "./pages/Challenge";
import { EventProvider } from "./contexts/EventContext";
import { initializeSupabase } from "./utils/initSupabase";

import Heatmap from '@/pages/Heatmap';
import { Layout } from './components/layouts/Layout';
import UserDirectory from "./components/users/UserDirectory";
import EventCalendar from "./components/EventCalendar";
import OnboardingManager from './components/OnboardingManager';

const queryClient = new QueryClient();

// Separate component for initialization that runs inside Router context
function AppInitializer() {
  useEffect(() => {
    // Initialize Supabase
    initializeSupabase()
      .then(success => {
        if (success) {
          console.log("Supabase initialized successfully");
        } else {
          console.warn("Supabase initialization had issues");
        }
      });

  }, []);

  return null;
}

// New component to handle navigation after onboarding, rendered inside BrowserRouter
const PostOnboardingNavigator = ({ 
  onboardingAction, 
  onNavigated 
}: { 
  onboardingAction: 'community_chat' | 'event_heatmap' | null; 
  onNavigated: () => void; 
}) => {
  const navigate = useNavigate();
  useEffect(() => {
    if (onboardingAction) {
      let targetPath = '/'; // Default to homepage/heatmap
      if (onboardingAction === 'community_chat') {
        // *** HIER IST DIE WICHTIGE ÄNDERUNG: Füge ?view=community hinzu ***
        targetPath = '/chat?view=community'; 
      } else if (onboardingAction === 'event_heatmap') {
        targetPath = '/heatmap'; 
      }
      navigate(targetPath);
      onNavigated(); // Reset the state in the parent (App) after navigation
    }
  }, [onboardingAction, navigate, onNavigated]);
  return null;
};


function App() {
  // State to hold the desired redirection target after onboarding
  const [onboardingRedirectTarget, setOnboardingRedirectTarget] = useState<'community_chat' | 'event_heatmap' | null>(null);

  // Callback function to be passed to OnboardingManager
  const handleOnboardingFinalAction = (action: 'community_chat' | 'event_heatmap') => {
    setOnboardingRedirectTarget(action);
  };

  // Callback to reset the redirect state after navigation
  const resetOnboardingRedirect = () => {
    setOnboardingRedirectTarget(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <EventProvider>
          {/* Pass the new callback prop to OnboardingManager */}
          <OnboardingManager onFinalAction={handleOnboardingFinalAction}>
            <Toaster />
            <Sonner position="top-center" />
            <BrowserRouter>
              <AppInitializer />
              {/* Render the navigator component inside BrowserRouter */}
              <PostOnboardingNavigator
                onboardingAction={onboardingRedirectTarget}
                onNavigated={resetOnboardingRedirect}
              />
              <Routes>
                {/* Heatmap as main page, now wrapped by Layout */}
                <Route path="/" element={<Layout><Heatmap /></Layout>} />
                <Route path="/heatmap" element={<Layout><Heatmap /></Layout>} />
                
                {/* Other pages */}
                <Route path="/index" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/challenge" element={<Challenge />} />
                <Route path="/impressum" element={<Impressum />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/policies" element={<CSAEPolicies />} />
                
                {/* Layout-wrapped pages */}
                <Route path="/users" element={<Layout><UserDirectory open={true} onOpenChange={() => {}} onSelectUser={() => {}} /></Layout>} />
                <Route path="/events" element={<EventCalendar />} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </OnboardingManager>
        </EventProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;