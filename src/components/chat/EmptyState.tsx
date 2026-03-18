import { motion } from "framer-motion";
import logo from "@/assets/logo.png";
import { Sparkles, Globe, Gamepad2, Code2, Image, Box } from "lucide-react";

const CATEGORIES = [
  {
    icon: Globe,
    label: "Websites",
    prompts: [
      "Create a modern portfolio website with dark theme, animations, and contact form",
      "Build a restaurant landing page with menu, reviews, and online reservation",
    ],
  },
  {
    icon: Gamepad2,
    label: "2D Games",
    prompts: [
      "Build a Space Invaders game with power-ups, levels, and particle effects",
      "Create a platformer game with physics, enemies, and collectibles",
    ],
  },
  {
    icon: Box,
    label: "3D Games",
    prompts: [
      "Build a 3D racing game with Three.js — tracks, obstacles, and scoring",
      "Create a 3D maze game with first-person controls using Three.js",
    ],
  },
  {
    icon: Code2,
    label: "Apps",
    prompts: [
      "Make a Pomodoro timer app with stats, sounds, and beautiful UI",
      "Build a weather dashboard with animated icons and 5-day forecast",
    ],
  },
  {
    icon: Image,
    label: "AI Image",
    prompts: [
      "Generate an image of a cyberpunk city at night with neon lights",
      "Generate an image of a cute robot reading a book in a library",
    ],
  },
];

interface EmptyStateProps {
  onSuggestionClick: (s: string) => void;
}

const EmptyState = ({ onSuggestionClick }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center h-full px-4 gap-6">
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center gap-3"
    >
      <div className="relative">
        <img src={logo} alt="Dust AI" className="w-14 h-14 brightness-200 contrast-200" />
        <div className="absolute -bottom-1 -right-1 bg-foreground rounded-full p-1">
          <Sparkles size={10} className="text-background" />
        </div>
      </div>
      <h1 className="text-lg font-bold tracking-tight text-foreground">What should we build?</h1>
      <p className="text-xs text-muted-foreground text-center max-w-[260px]">
        Websites, games, 3D worlds, apps, or just chat. Attach images for AI analysis.
      </p>
    </motion.div>

    <div className="w-full max-w-sm space-y-3">
      {CATEGORIES.map((cat, ci) => (
        <motion.div
          key={cat.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + ci * 0.06 }}
          className="space-y-1.5"
        >
          <div className="flex items-center gap-1.5 px-1">
            <cat.icon size={12} className="text-muted-foreground" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{cat.label}</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {cat.prompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => onSuggestionClick(prompt)}
                className="rounded-xl border border-border bg-surface-1 px-3 py-2.5 text-left text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 hover:bg-surface-2 transition-all active:scale-[0.98] line-clamp-2"
              >
                {prompt}
              </button>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

export default EmptyState;
