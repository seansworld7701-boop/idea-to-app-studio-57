import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Lock, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Also check URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      toast({ title: "Password updated!" });
      setTimeout(() => navigate("/build", { replace: true }), 2000);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery && !done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-6 pb-24">
        <p className="text-sm text-muted-foreground">Invalid or expired reset link.</p>
        <button onClick={() => navigate("/auth")} className="mt-4 text-sm text-foreground underline">
          Go to Sign In
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-6 pb-24 gap-4">
        <CheckCircle size={40} className="text-foreground" />
        <p className="text-sm font-medium text-foreground">Password updated successfully!</p>
        <p className="text-xs text-muted-foreground">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 pb-24">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <img src={logo} alt="Dust AI" className="w-12 h-12 brightness-200 contrast-200" />
          <h1 className="text-xl font-bold text-foreground">Set new password</h1>
          <p className="text-sm text-muted-foreground">Choose a new password for your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-1 px-4 py-3 focus-within:border-foreground/20 transition-colors">
              <Lock size={18} className="text-muted-foreground shrink-0" />
              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                minLength={6}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-1 px-4 py-3 focus-within:border-foreground/20 transition-colors">
              <Lock size={18} className="text-muted-foreground shrink-0" />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                minLength={6}
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3.5 text-sm font-medium text-background active:scale-[0.97] transition-transform disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <>Update Password <ArrowRight size={16} /></>}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
