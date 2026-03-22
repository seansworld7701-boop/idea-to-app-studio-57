import { motion } from "framer-motion";
import logo from "@/assets/logo.png";
import { Sparkles } from "lucide-react";

const SUGGESTION_PROMPTS = [
  "Create a portfolio website",
  "Build a snake game",
  "Make a todo list app",
  "Build a 3D maze game",
  "Create a quiz app",
  "Build a weather dashboard",
];

interface EmptyStateProps {
  onSuggestionClick: (s: string) => void;
}

const EmptyState = ({ onSuggestionClick }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center h-full px-6 gap-8">
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center gap-4"
    >
      <img src={logo} alt="Dust AI" className="w-14 h-14 brightness-200 contrast-200 drop-shadow-lg" />
      <h1 className="text-xl font-bold tracking-tight text-foreground">Build anything, in text.</h1>
      <p className="text-sm text-muted-foreground text-center max-w-[280px]">
        Websites, 3D games, apps, AI images — type an idea or attach a file.
      </p>
    </motion.div>
    <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
      {SUGGESTION_PROMPTS.map((prompt, i) => (
        <motion.button
          key={prompt}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + i * 0.04 }}
          onClick={() => onSuggestionClick(prompt)}
          className="rounded-xl border border-border bg-surface-1 px-3 py-3 text-left text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all active:scale-[0.97]"
        >
          {prompt}
        </motion.button>
      ))}
    </div>
  </div>
);

export default EmptyState;
