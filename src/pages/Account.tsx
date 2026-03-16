import { motion } from "framer-motion";
import { User, LogIn, Settings, HelpCircle } from "lucide-react";

const AccountPage = () => {
  return (
    <div className="flex flex-col min-h-full px-5 pt-8 pb-24 gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Account</h1>
        <p className="text-xs text-muted-foreground mt-1">Manage your account</p>
      </div>

      {/* Not signed in state */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-4 py-10"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-1 border border-border">
          <User size={24} className="text-muted-foreground" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-foreground">Sign in to save projects</p>
          <p className="text-xs text-muted-foreground">Your work will be synced across devices</p>
        </div>
        <button className="flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background active:scale-95 transition-transform">
          <LogIn size={16} />
          Sign In
        </button>
      </motion.div>

      {/* Menu items */}
      <div className="space-y-1">
        {[
          { icon: Settings, label: "Settings" },
          { icon: HelpCircle, label: "Help & Support" },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-1 transition-colors"
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AccountPage;
