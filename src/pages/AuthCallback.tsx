import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const AUTH_ERROR_MESSAGE = "This sign-in link is invalid or has expired. Please try again.";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const handleAuthCallback = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const next = url.searchParams.get("next");
        const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
        const hashType = hashParams.get("type");
        const hasRecoveryTokens = Boolean(hashParams.get("access_token") && hashParams.get("refresh_token"));

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        if (!mounted) return;

        if (hashType === "recovery" || hasRecoveryTokens) {
          navigate("/reset-password", { replace: true });
          return;
        }

        if (next && next.startsWith("/")) {
          navigate(next, { replace: true });
          return;
        }

        navigate("/build", { replace: true });
      } catch (error: unknown) {
        const description = error instanceof Error ? error.message : AUTH_ERROR_MESSAGE;
        toast({
          title: "Authentication failed",
          description,
          variant: "destructive",
        });
        navigate("/auth", { replace: true });
      }
    };

    void handleAuthCallback();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 pb-24">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 size={28} className="animate-spin text-foreground" />
        <h1 className="text-lg font-semibold text-foreground">Signing you in…</h1>
        <p className="text-sm text-muted-foreground">Please wait while we finish your authentication.</p>
      </div>
    </div>
  );
};

export default AuthCallback;
