import { Shield, Database, Key, HardDrive, Zap, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export type ActionType = "backend" | "database" | "storage" | "api_key" | "auth";

interface ActionCardProps {
  type: ActionType;
  title: string;
  description: string;
  onAllow: () => void;
}

const ACTION_ICONS: Record<ActionType, typeof Database> = {
  backend: Zap,
  database: Database,
  storage: HardDrive,
  api_key: Key,
  auth: Shield,
};

const ActionCard = ({ type, title, description, onAllow }: ActionCardProps) => {
  const [status, setStatus] = useState<"pending" | "loading" | "allowed">("pending");
  const Icon = ACTION_ICONS[type] || Zap;

  const handleAllow = () => {
    setStatus("loading");
    setTimeout(() => {
      setStatus("allowed");
      onAllow();
    }, 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-secondary/30 p-4 my-2"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary shrink-0">
          <Icon size={16} className="text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        {status === "pending" && (
          <button
            onClick={handleAllow}
            className="rounded-lg bg-foreground text-background px-4 py-1.5 text-xs font-medium hover:opacity-90 active:scale-[0.97] transition-all"
          >
            Allow
          </button>
        )}
        {status === "loading" && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-4 py-1.5">
            <Loader2 size={12} className="animate-spin" /> Enabling...
          </div>
        )}
        {status === "allowed" && (
          <div className="flex items-center gap-1.5 text-xs text-foreground px-4 py-1.5">
            <Check size={12} /> Enabled
          </div>
        )}
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
  const actionRegex = /===ACTION:\s*(\w+)\s*\|\s*(.+?)\s*\|\s*(.+?)===$/gm;
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
