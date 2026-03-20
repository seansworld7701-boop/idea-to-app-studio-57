import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import MaintenanceMode from "@/components/MaintenanceMode";
import RouteGuard from "@/components/RouteGuard";

const MAINTENANCE_MODE = true;
import BottomNav from "@/components/BottomNav";
import HomePage from "@/pages/Home";
import BuildPage from "@/pages/Build";
import ProjectsPage from "@/pages/Projects";
import TemplatesPage from "@/pages/Templates";
import AccountPage from "@/pages/Account";
import AuthPage from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import AuthCallback from "@/pages/AuthCallback";
import SharedProject from "@/pages/SharedProject";
import HostedApp from "@/pages/HostedApp";
import CloudPage from "@/pages/Cloud";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  if (MAINTENANCE_MODE) {
    return <MaintenanceMode />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="flex flex-col h-[100dvh] bg-background">
                <div className="flex-1 overflow-y-auto">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/build" element={<RouteGuard><BuildPage /></RouteGuard>} />
                    <Route path="/projects" element={<RouteGuard><ProjectsPage /></RouteGuard>} />
                    <Route path="/templates" element={<TemplatesPage />} />
                    <Route path="/cloud" element={<RouteGuard><CloudPage /></RouteGuard>} />
                    <Route path="/account" element={<RouteGuard><AccountPage /></RouteGuard>} />
                    <Route path="/auth" element={<RouteGuard requireAuth={false} redirectTo="/build"><AuthPage /></RouteGuard>} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/shared/:shareId" element={<SharedProject />} />
                    <Route path="/app/:slug" element={<HostedApp />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
                <BottomNav />
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};


export default App;
