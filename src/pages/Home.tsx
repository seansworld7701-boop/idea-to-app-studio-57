import { motion } from "framer-motion";
import logo from "@/assets/logo.png";
import { ArrowRight, Globe, Zap, Gamepad2, Code2, Image, Box, Sparkles, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const FEATURES: { title: string; desc: string; icon: LucideIcon; color: string }[] = [
  { title: "Websites", desc: "Portfolios, landing pages, blogs", icon: Globe, color: "from-blue-500/20 to-cyan-500/10" },
  { title: "Web Apps", desc: "Dashboards, tools, utilities", icon: Zap, color: "from-yellow-500/20 to-orange-500/10" },
  { title: "2D Games", desc: "Canvas games, puzzles, arcades", icon: Gamepad2, color: "from-green-500/20 to-emerald-500/10" },
  { title: "3D Games", desc: "Three.js worlds, 3D engines", icon: Box, color: "from-purple-500/20 to-pink-500/10" },
  { title: "AI Images", desc: "Generate images from text", icon: Image, color: "from-rose-500/20 to-red-500/10" },
  { title: "Code", desc: "Python, Java, Rust, Go & more", icon: Code2, color: "from-indigo-500/20 to-blue-500/10" },
];

const QUICK_START = [
  { label: "🌐 Modern Portfolio", prompt: "Create a modern portfolio website with dark theme, smooth animations, projects gallery, and contact form" },
  { label: "🎮 3D Racing Game", prompt: "Build a 3D racing game with Three.js — car controls, obstacles, scoring, and multiple tracks" },
  { label: "🐍 Snake Game", prompt: "Build a neon-themed snake game with scoring, levels, particle effects, and mobile controls" },
  { label: "🖼️ AI Image", prompt: "Generate an image of a futuristic city floating in the clouds at sunset" },
  { label: "⏱️ Pomodoro Timer", prompt: "Make a beautiful Pomodoro timer app with stats, ambient sounds, and dark theme" },
  { label: "🧊 3D Cube World", prompt: "Build a 3D voxel world explorer with Three.js — terrain generation, first-person camera, day/night cycle" },
];

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-full px-5 pt-8 pb-24 gap-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center gap-5"
      >
        <div className="relative">
          <img src={logo} alt="Dust AI" className="w-16 h-16 brightness-200 contrast-200 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-dashed border-foreground/10"
            style={{ width: "80px", height: "80px", top: "-8px", left: "-8px" }}
          />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Build anything with AI
          </h1>
          <p className="text-sm text-muted-foreground max-w-[300px] mx-auto leading-relaxed">
            Websites, 3D games, apps, AI images — just describe it and Dust AI builds it.
          </p>
        </div>
        <button
          onClick={() => navigate("/build")}
          className="mt-1 flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-medium text-background active:scale-95 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]"
        >
          <Sparkles size={16} />
          Start Building
          <ArrowRight size={16} />
        </button>
      </motion.div>

      {/* Capabilities */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest px-1">
          What you can build
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.04 }}
              className={`rounded-xl border border-border bg-gradient-to-br ${f.color} p-3.5 space-y-1.5 hover:border-foreground/15 transition-all cursor-pointer active:scale-[0.98]`}
              onClick={() => navigate("/build")}
            >
              <f.icon size={18} className="text-foreground/80" />
              <h3 className="text-sm font-medium text-foreground">{f.title}</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{f.desc}</p>
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
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest px-1">
          Try these
        </h2>
        <div className="space-y-2">
          {QUICK_START.map((t, i) => (
            <motion.button
              key={t.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.03 }}
              onClick={() => navigate(`/build?prompt=${encodeURIComponent(t.prompt)}`)}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-surface-1 px-4 py-3.5 text-sm text-foreground hover:border-foreground/20 hover:bg-surface-2 active:scale-[0.98] transition-all"
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
