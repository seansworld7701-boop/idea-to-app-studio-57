import { motion } from "framer-motion";
import logo from "@/assets/logo.png";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const FEATURES = [
  { title: "Websites", desc: "Landing pages, portfolios, blogs" },
  { title: "Web Apps", desc: "Todo apps, dashboards, tools" },
  { title: "Games", desc: "Canvas games, puzzles, arcades" },
  { title: "Code", desc: "Python, Java, Rust, Go & more" },
];

const RECENT_TEMPLATES = [
  "Portfolio Website",
  "Snake Game",
  "Todo App",
  "Calculator",
];

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-full px-5 pt-8 pb-24 gap-10">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center gap-5"
      >
        <img src={logo} alt="Dust" className="w-16 h-16 invert drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Build anything, in text.
          </h1>
          <p className="text-sm text-muted-foreground max-w-[300px] mx-auto">
            Type any idea. Get a working project. Powered by Dust AI.
          </p>
        </div>
        <button
          onClick={() => navigate("/build")}
          className="mt-2 flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-medium text-background active:scale-95 transition-transform"
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
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-surface-1 p-4 space-y-1"
            >
              <h3 className="text-sm font-medium text-foreground">{f.title}</h3>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
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
          {RECENT_TEMPLATES.map((t) => (
            <button
              key={t}
              onClick={() => navigate("/build")}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-surface-1 px-4 py-3.5 text-sm text-foreground hover:border-foreground/20 active:scale-[0.98] transition-all"
            >
              {t}
              <ArrowRight size={14} className="text-muted-foreground" />
            </button>
          ))}
        </div>
      </motion.section>
    </div>
  );
};

export default HomePage;
