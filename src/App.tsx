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
import Challenge from "./pages/Challenge";
import { EventProvider } from "./contexts/EventContext";
import { initializeSupabase } from "./utils/initSupabase";
import { initializeFCM } from "./services/firebaseMessaging";
import { useEventContext } from "./contexts/EventContext";
import Heatmap from '@/pages/Heatmap';
import { Layout } from './components/layouts/Layout';
import UserDirectory from "./components/users/UserDirectory";
import EventCalendar from "./components/EventCalendar";
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


function App() {
  // Initialize status bar for mobile app
  useStatusBar();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <EventProvider>
          <Toaster />
          <Sonner position="top-center" />
          <BrowserRouter>
            <AppInitializer />
            <RouteTracker />
            <Routes>
              {/* Heatmap as main page, now wrapped by Layout */}
              <Route path="/" element={<Layout><Heatmap /></Layout>} />
              <Route path="/heatmap" element={<Layout><Heatmap /></Layout>} />
              
              {/* Other pages */}
              <Route path="/index" element={<Index />} />
              <Route path="/about" element={<About />} />
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
        </EventProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;