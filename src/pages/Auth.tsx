import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";

type Mode = "login" | "signup";

const Auth = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || "/build";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        toast({ title: "Welcome back!" });
        navigate(from, { replace: true });
      } else {
        if (password.length < 6) {
          toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        toast({ title: "Account created!" });
        navigate(from, { replace: true });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "login" ? "Welcome back" : "Create account";
  const subtitle = mode === "login" ? "Sign in to access your projects" : "Start building with Dust AI";

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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3.5 text-sm font-medium text-background active:scale-[0.97] transition-transform disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                {mode === "login" ? "Sign In" : "Sign Up"}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-foreground font-medium underline underline-offset-4"
            >
              {mode === "login" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
