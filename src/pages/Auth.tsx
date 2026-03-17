import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "@/hooks/use-toast";
import { Mail, Lock, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";

type Mode = "login" | "signup" | "forgot";

const Auth = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || "/build";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (mode !== "forgot" && !password) return;
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        toast({ title: "Welcome back!" });
        navigate(from, { replace: true });
      } else if (mode === "signup") {
        if (password.length < 6) {
          toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
          setLoading(false);
          return;
        }
        const authCallbackUrl = `${window.location.origin}/auth/callback`;
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: authCallbackUrl },
        });
        if (error) throw error;
        toast({ title: "Check your email", description: "We sent you a verification link." });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });
        if (error) throw error;
        toast({ title: "Check your email", description: "We sent you a password reset link." });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "login" ? "Welcome back" : mode === "signup" ? "Create account" : "Reset password";
  const subtitle = mode === "login"
    ? "Sign in to access your projects"
    : mode === "signup"
    ? "Start building with Dust AI"
    : "Enter your email to receive a reset link";

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="flex flex-col items-center gap-3">
          <img src={logo} alt="Dust AI" className="w-12 h-12 brightness-200 contrast-200" />
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground text-center">{subtitle}</p>
        </div>

        {/* Google Sign In */}
        {mode !== "forgot" && (
          <button
            type="button"
            disabled={googleLoading || loading}
            onClick={async () => {
              setGoogleLoading(true);
              const { error } = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (error) {
                toast({ title: "Error", description: String(error), variant: "destructive" });
              }
              setGoogleLoading(false);
            }}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-surface-1 py-3.5 text-sm font-medium text-foreground hover:bg-surface-1/80 active:scale-[0.97] transition-all disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            )}
            Continue with Google
          </button>
        )}

        {mode !== "forgot" && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-1 px-4 py-3 focus-within:border-foreground/20 transition-colors">
              <Mail size={18} className="text-muted-foreground shrink-0" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                required
                autoComplete="email"
              />
            </div>
            {mode !== "forgot" && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-1 px-4 py-3 focus-within:border-foreground/20 transition-colors">
                <Lock size={18} className="text-muted-foreground shrink-0" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  minLength={6}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </div>
            )}
          </div>

          {mode === "login" && (
            <button
              type="button"
              onClick={() => setMode("forgot")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Forgot password?
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3.5 text-sm font-medium text-background active:scale-[0.97] transition-transform disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                {mode === "login" ? "Sign In" : mode === "signup" ? "Sign Up" : "Send Reset Link"}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          {mode === "forgot" ? (
            <button onClick={() => setMode("login")} className="flex items-center gap-1 mx-auto text-foreground font-medium">
              <ArrowLeft size={14} /> Back to Sign In
            </button>
          ) : (
            <p>
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-foreground font-medium underline underline-offset-4"
              >
                {mode === "login" ? "Sign Up" : "Sign In"}
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
