// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { useStatusBar } from "./hooks/useStatusBar";
import { EventProvider } from "./contexts/EventContext";
import { initializeSupabase } from "./utils/initSupabase";
import { initializeFCM } from "./services/firebaseMessaging";
import { useEventContext } from "./contexts/EventContext";
import { Layout } from './components/layouts/Layout';
import OnboardingManager from './components/OnboardingManager';
import { saveLastRoute, getLastRoute } from './utils/lastRouteStorage';
import { USERNAME_KEY } from './types/chatTypes';

// Lazy load route components for code splitting and performance optimization
const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Impressum = lazy(() => import("./pages/Impressum"));
const Privacy = lazy(() => import("./pages/Privacy"));
const CSAEPolicies = lazy(() => import("./pages/CSAEPolicies"));
const Chat = lazy(() => import("./pages/Chat"));
const Challenge = lazy(() => import("./pages/Challenge"));
const Heatmap = lazy(() => import('@/pages/Heatmap'));
const UserDirectory = lazy(() => import("./components/users/UserDirectory"));
const EventCalendar = lazy(() => import("./components/EventCalendar"));

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
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-screen">
                  <div className="animate-pulse text-muted-foreground">Lädt...</div>
                </div>
              }>
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
              </Suspense>
            </BrowserRouter>
          </OnboardingManager>
        </EventProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;