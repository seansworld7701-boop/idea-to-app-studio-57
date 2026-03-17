import { useState } from "react";
import { motion } from "framer-motion";
import { LogOut, Trash2, HelpCircle, ExternalLink, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const AccountPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  // Route guard handles unauthenticated state
  if (!user) return null;

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    navigate("/");
  };

  const handleDeleteAllProjects = async () => {
    if (!confirm("Delete all your projects? This can't be undone.")) return;
    const { error } = await supabase.from("projects").delete().eq("user_id", user.id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete projects", variant: "destructive" });
    } else {
      toast({ title: "All projects deleted" });
    }
  };

  return (
    <div className="flex flex-col min-h-full px-5 pt-8 pb-24 gap-6">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-1 border border-border">
          <img src={logo} alt="" className="w-6 h-6 brightness-200 contrast-200" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-foreground truncate">Account</h1>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <button
          onClick={handleDeleteAllProjects}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-1 transition-colors"
        >
          <Trash2 size={18} />
          Delete All Projects
        </button>
        <a
          href="mailto:support@dustai.app"
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-1 transition-colors"
        >
          <HelpCircle size={18} />
          Help & Support
          <ExternalLink size={12} className="ml-auto opacity-50" />
        </a>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-1 transition-colors"
        >
          {signingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
          Sign Out
        </button>
      </motion.div>

      {/* Footer */}
      <div className="mt-auto pt-8 text-center space-y-1">
        <p className="text-[10px] text-muted-foreground/50">Dust AI v1.0</p>
        <p className="text-[10px] text-muted-foreground/40">
          Built by Shivam Choudhury · <a href="tel:+919330249895" className="hover:text-muted-foreground transition-colors">+91 9330249895</a>
        </p>
      </div>
    </div>
  );
};

export default AccountPage;
