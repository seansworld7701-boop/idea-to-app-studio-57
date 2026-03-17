import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import BottomNav from "@/components/BottomNav";
import HomePage from "@/pages/Home";
import BuildPage from "@/pages/Build";
import ProjectsPage from "@/pages/Projects";
import TemplatesPage from "@/pages/Templates";
import AccountPage from "@/pages/Account";
import AuthPage from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import SharedProject from "@/pages/SharedProject";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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
                  <Route path="/build" element={<BuildPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/templates" element={<TemplatesPage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/shared/:shareId" element={<SharedProject />} />
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

export default App;
