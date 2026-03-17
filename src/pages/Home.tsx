import { motion } from "framer-motion";
import logo from "@/assets/logo.png";
import { ArrowRight, Sparkles, Globe, Zap, Gamepad2, Code2, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const FEATURES: { title: string; desc: string; icon: LucideIcon }[] = [
  { title: "Websites", desc: "Landing pages, portfolios, blogs", icon: Globe },
  { title: "Web Apps", desc: "Todo apps, dashboards, tools", icon: Zap },
  { title: "Games", desc: "Canvas games, puzzles, arcades", icon: Gamepad2 },
  { title: "Code", desc: "Python, Java, Rust, Go & more", icon: Code2 },
];

const QUICK_START = [
  { label: "Portfolio Website", prompt: "Create a modern portfolio website with projects section, about me, and contact form" },
  { label: "Snake Game", prompt: "Build a snake game with scoring, levels, and mobile controls" },
  { label: "Todo App", prompt: "Make a beautiful todo list app with categories and local storage" },
  { label: "Calculator", prompt: "Build a scientific calculator with a clean modern UI" },
];

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-full px-5 pt-10 pb-24 gap-10">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center gap-5"
      >
        <div className="relative">
          <img src={logo} alt="Dust AI" className="w-16 h-16 brightness-200 contrast-200 drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]" />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 -right-1"
          >
            <Sparkles size={14} className="text-foreground/60" />
          </motion.div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Build anything, in text.
          </h1>
          <p className="text-sm text-muted-foreground max-w-[300px] mx-auto leading-relaxed">
            Type any idea. Get a working project. Powered by Dust AI.
          </p>
        </div>
        <button
          onClick={() => navigate("/build")}
          className="mt-2 flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-medium text-background active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          Start Building
          <ArrowRight size={16} />
        </button>
      </motion.div>

      {/* What you can build */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
          What you can build
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.05 }}
              className="rounded-xl border border-border bg-surface-1 p-4 space-y-1.5 hover:border-foreground/10 transition-colors"
            >
              <f.icon size={18} className="text-foreground/70" />
              <h3 className="text-sm font-medium text-foreground">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Quick Start */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
          Quick Start
        </h2>
        <div className="space-y-2">
          {QUICK_START.map((t, i) => (
            <motion.button
              key={t.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.04 }}
              onClick={() => navigate(`/build?prompt=${encodeURIComponent(t.prompt)}`)}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-surface-1 px-4 py-3.5 text-sm text-foreground hover:border-foreground/20 active:scale-[0.98] transition-all"
            >
              {t.label}
              <ArrowRight size={14} className="text-muted-foreground" />
            </motion.button>
          ))}
        </div>
      </motion.section>
    </div>
  );
};

export default HomePage;
