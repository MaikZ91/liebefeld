// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom"; // Import useNavigate and useLocation
import { useEffect, useState } from "react"; // Import useState
import { useStatusBar } from "./hooks/useStatusBar";
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
import { initializeFCM } from "./services/firebaseMessaging";
import { useEventContext } from "./contexts/EventContext";
import Heatmap from '@/pages/Heatmap';
import { Layout } from './components/layouts/Layout';
import UserDirectory from "./components/users/UserDirectory";
import EventCalendar from "./components/EventCalendar";
import OnboardingManager from './components/OnboardingManager';
import { saveLastRoute, getLastRoute } from './utils/lastRouteStorage';
import { USERNAME_KEY } from './types/chatTypes';

const queryClient = new QueryClient();

// Separate component for initialization that runs inside Router context
function AppInitializer() {
  const { selectedCity } = useEventContext();

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

    // Initialize or update Firebase Cloud Messaging token with city preference
    initializeFCM(selectedCity);
  }, [selectedCity]);

  return null;
}

// Component to track current route and handle initial navigation
const RouteTracker = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hasNavigatedToLastRoute, setHasNavigatedToLastRoute] = useState(false);

  // Track current route
  useEffect(() => {
    saveLastRoute(location.pathname, location.search);
  }, [location.pathname, location.search]);

  // Navigate to last route on initial load (only if user has completed onboarding)
  useEffect(() => {
    if (!hasNavigatedToLastRoute) {
      const username = localStorage.getItem(USERNAME_KEY);
      const hasValidUsername = username && username !== 'Anonymous' && username !== 'User' && username.trim().length > 0;
      
      if (hasValidUsername) {
        const lastRoute = getLastRoute();
        if (lastRoute && lastRoute !== location.pathname + location.search && location.pathname === '/') {
          navigate(lastRoute, { replace: true });
        }
      }
      setHasNavigatedToLastRoute(true);
    }
  }, [navigate, location, hasNavigatedToLastRoute]);

  return null;
};

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
  // Initialize status bar for mobile app
  useStatusBar();
  
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
              <RouteTracker />
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
                <Route path="/events" element={<Layout><EventCalendar /></Layout>} />
                
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