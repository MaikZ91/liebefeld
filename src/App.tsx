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

import { useEventContext } from "./contexts/EventContext";
import { Layout } from './components/layouts/Layout';
import OnboardingManager from './components/OnboardingManager';
import { saveLastRoute, getLastRoute } from './utils/lastRouteStorage';
import { USERNAME_KEY } from './types/chatTypes';
import { useActivityTracking } from './hooks/useActivityTracking';

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
const Tribe = lazy(() => import("./pages/Tribe"));
const UserDirectory = lazy(() => import("./components/users/UserDirectory"));
const EventCalendar = lazy(() => import("./components/EventCalendar"));

// SEO Landing Pages
const PartyBielefeld = lazy(() => import("./pages/seo/PartyBielefeld"));
const KonzerteBielefeld = lazy(() => import("./pages/seo/KonzerteBielefeld"));
const SportBielefeld = lazy(() => import("./pages/seo/SportBielefeld"));
const KunstBielefeld = lazy(() => import("./pages/seo/KunstBielefeld"));
const EventsHeute = lazy(() => import("./pages/seo/EventsHeute"));
const EventsWochenende = lazy(() => import("./pages/seo/EventsWochenende"));

// Blog Pages
const Blog = lazy(() => import("./pages/Blog"));
const BlogArticle = lazy(() => import("./pages/BlogArticle"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

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

  }, [selectedCity]);

  return null;
}

// Component to track current route, handle initial navigation, and activity tracking
const RouteTracker = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hasNavigatedToLastRoute, setHasNavigatedToLastRoute] = useState(false);

  // Initialize activity tracking
  useActivityTracking();

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
              <Suspense fallback={null}>
                <Routes>
                  {/* Tribe as main page */}
                  <Route path="/" element={<Tribe />} />
                  
                  {/* Old heatmap page */}
                  <Route path="/old" element={<Layout><Heatmap /></Layout>} />
                  <Route path="/heatmap" element={<Layout><Heatmap /></Layout>} />
                  
                  {/* Other pages */}
                  <Route path="/index" element={<Index />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/challenge" element={<Challenge />} />
                  <Route path="/impressum" element={<Impressum />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/policies" element={<CSAEPolicies />} />
                  
                  {/* SEO Landing Pages */}
                  <Route path="/party-bielefeld" element={<PartyBielefeld />} />
                  <Route path="/konzerte-bielefeld" element={<KonzerteBielefeld />} />
                  <Route path="/sport-bielefeld" element={<SportBielefeld />} />
                  <Route path="/kunst-bielefeld" element={<KunstBielefeld />} />
                  <Route path="/events-heute" element={<EventsHeute />} />
                  <Route path="/events-wochenende" element={<EventsWochenende />} />
                  
                  {/* Blog Pages */}
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogArticle />} />
                  
                  {/* Admin Dashboard */}
                  <Route path="/admin" element={<AdminDashboard />} />
                  
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