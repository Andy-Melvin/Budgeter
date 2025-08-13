import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { CurrencyProvider } from "@/hooks/useCurrency";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Income from "./pages/Income";
import Assets from "./pages/Assets";
import Goals from "./pages/Goals";
import Budget from "./pages/Budget";
import Transactions from "./pages/Transactions";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

import { useState, useEffect } from "react";
import { initializeMobileApp } from "@/lib/mobile-config";
import { simpleOfflineSync } from "@/lib/offline-sync-simple";
import { OfflineIndicator } from "@/components/OfflineIndicator";

function App() {
  // Create QueryClient with stable reference
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
      },
    },
  }));

  // Initialize mobile app features and offline sync
  useEffect(() => {
    initializeMobileApp();
    
    // Set up offline sync
    const handleOnline = () => {
      console.log('Back online, syncing data...');
      simpleOfflineSync.syncOfflineData();
    };

    const handleOffline = () => {
      console.log('Gone offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync if online
    if (navigator.onLine) {
      simpleOfflineSync.syncOfflineData();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CurrencyProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Dashboard />} />
                    <Route path="income" element={<Income />} />
                    <Route path="assets" element={<Assets />} />
                    <Route path="goals" element={<Goals />} />
                    <Route path="budget" element={<Budget />} />
                    <Route path="transactions" element={<Transactions />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
            <OfflineIndicator />
          </CurrencyProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
