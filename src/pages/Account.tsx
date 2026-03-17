import { motion } from "framer-motion";
import { User, LogOut, Settings, HelpCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const AccountPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-5 pb-24 gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-1 border border-border">
          <User size={24} className="text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">Sign in to save projects</p>
        <button
          onClick={() => navigate("/auth")}
          className="flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background active:scale-95 transition-transform"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full px-5 pt-8 pb-24 gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Account</h1>
        <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        {[
          { icon: Settings, label: "Settings", action: () => {} },
          { icon: HelpCircle, label: "Help & Support", action: () => {} },
          {
            icon: LogOut,
            label: "Sign Out",
            action: async () => {
              await signOut();
              navigate("/");
            },
          },
        ].map(({ icon: Icon, label, action }) => (
          <button
            key={label}
            onClick={action}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-1 transition-colors"
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </motion.div>
    </div>
  );
};

export default AccountPage;
