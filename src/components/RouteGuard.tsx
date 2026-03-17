import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

/**
 * Route guard component.
 * - requireAuth=true: redirects unauthenticated users to /auth
 * - requireAuth=false: redirects authenticated users away (e.g. from /auth to /)
 */
const RouteGuard = ({ children, requireAuth = true, redirectTo }: RouteGuardProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-full pb-24">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (requireAuth && !user) {
    return <Navigate to={redirectTo || "/auth"} state={{ from: location.pathname }} replace />;
  }

  if (!requireAuth && user) {
    return <Navigate to={redirectTo || "/"} replace />;
  }

  return <>{children}</>;
};

export default RouteGuard;
