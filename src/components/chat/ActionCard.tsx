import { Shield, Database, Key, HardDrive, Zap, Check, Loader2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type ActionType = "backend" | "database" | "storage" | "api_key" | "auth";

interface ActionCardProps {
  type: ActionType;
  title: string;
  description: string;
  onAllow: () => void;
}

const ACTION_CONFIG: Record<ActionType, { icon: typeof Database; gradient: string; bg: string; accent: string }> = {
  backend: {
    icon: Zap,
    gradient: "from-amber-500/20 to-orange-500/10",
    bg: "bg-amber-500/10",
    accent: "text-amber-400",
  },
  database: {
    icon: Database,
    gradient: "from-blue-500/20 to-cyan-500/10",
    bg: "bg-blue-500/10",
    accent: "text-blue-400",
  },
  storage: {
    icon: HardDrive,
    gradient: "from-emerald-500/20 to-green-500/10",
    bg: "bg-emerald-500/10",
    accent: "text-emerald-400",
  },
  api_key: {
    icon: Key,
    gradient: "from-purple-500/20 to-violet-500/10",
    bg: "bg-purple-500/10",
    accent: "text-purple-400",
  },
  auth: {
    icon: Shield,
    gradient: "from-rose-500/20 to-pink-500/10",
    bg: "bg-rose-500/10",
    accent: "text-rose-400",
  },
};

const ActionCard = ({ type, title, description, onAllow }: ActionCardProps) => {
  const [status, setStatus] = useState<"pending" | "loading" | "allowed">("pending");
  const config = ACTION_CONFIG[type] || ACTION_CONFIG.backend;
  const Icon = config.icon;

  const handleAllow = () => {
    setStatus("loading");
    setTimeout(() => {
      setStatus("allowed");
      onAllow();
    }, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-xl border border-border bg-gradient-to-br ${config.gradient} p-[1px] my-3`}
    >
      <div className="rounded-[11px] bg-card/95 backdrop-blur-sm p-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${config.bg} shrink-0`}>
            <Icon size={18} className={config.accent} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <span className={`text-[9px] font-medium uppercase tracking-widest px-1.5 py-0.5 rounded-full ${config.bg} ${config.accent}`}>
                Required
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
          </div>
        </div>

        {/* Action row */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/50 font-mono">
            dust.cloud.{type}
          </span>

          <AnimatePresence mode="wait">
            {status === "pending" && (
              <motion.button
                key="allow"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={handleAllow}
                className="flex items-center gap-1.5 rounded-lg bg-foreground text-background px-4 py-2 text-xs font-semibold hover:opacity-90 active:scale-[0.97] transition-all shadow-sm"
              >
                Allow
                <ArrowRight size={12} />
              </motion.button>
            )}
            {status === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-xs text-muted-foreground"
              >
                <Loader2 size={12} className="animate-spin" />
                Enabling...
              </motion.div>
            )}
            {status === "allowed" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-xs text-emerald-400 font-medium"
              >
                <Check size={12} />
                Enabled
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default ActionCard;

/** Detect action requests in AI response text */
export function detectActionRequests(content: string): {
  type: ActionType;
  title: string;
  description: string;
}[] {
  const actions: { type: ActionType; title: string; description: string }[] = [];

  // Pattern: ===ACTION: type | title | description===
  const actionRegex = /===ACTION:\s*(\w+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*===/gm;
  let match;
  while ((match = actionRegex.exec(content)) !== null) {
    const type = match[1] as ActionType;
    if (["backend", "database", "storage", "api_key", "auth"].includes(type)) {
      actions.push({ type, title: match[2].trim(), description: match[3].trim() });
    }
  }

  return actions;
}

/** Remove action tags from display text */
export function stripActionTags(content: string): string {
  return content.replace(/===ACTION:\s*\w+\s*\|[^=]*===/g, "").trim();
}
