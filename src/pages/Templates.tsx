import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TEMPLATES = [
  { title: "Portfolio Website", desc: "Personal portfolio with projects showcase", prompt: "Create a modern portfolio website with hero section, projects grid, about me, skills, and contact form. Use a dark theme with smooth animations." },
  { title: "Landing Page", desc: "Marketing landing page with CTA", prompt: "Build a product landing page with hero, features section, testimonials, pricing cards, and a call to action. Modern and responsive." },
  { title: "Todo App", desc: "Task management application", prompt: "Make a todo list app with categories, priorities, due dates, search/filter, and local storage persistence. Clean minimal UI." },
  { title: "Snake Game", desc: "Classic snake game with canvas", prompt: "Create a snake game with canvas rendering, scoring system, increasing difficulty, game over/restart, and mobile touch controls." },
  { title: "Calculator", desc: "Scientific calculator app", prompt: "Build a scientific calculator with basic and advanced operations, history, keyboard support, and a sleek dark UI." },
  { title: "Blog Page", desc: "Minimal blog with posts", prompt: "Create a minimal blog website with a homepage listing posts, individual post pages, categories, and a clean reading experience." },
  { title: "Weather App", desc: "Weather dashboard with forecasts", prompt: "Build a weather dashboard app that shows current conditions, 5-day forecast, search by city, with beautiful weather icons and animations." },
  { title: "Chat UI", desc: "Real-time chat interface", prompt: "Create a modern chat application UI with message bubbles, typing indicators, user avatars, and a clean dark theme." },
];

const TemplatesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-full px-5 pt-8 pb-24 gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Templates</h1>
        <p className="text-xs text-muted-foreground mt-1">Start from a template — one tap to build</p>
      </div>

      <div className="space-y-2">
        {TEMPLATES.map((t, i) => (
          <motion.button
            key={t.title}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => navigate(`/build?prompt=${encodeURIComponent(t.prompt)}`)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-surface-1 px-4 py-4 text-left active:scale-[0.98] transition-all hover:border-foreground/20"
          >
            <div className="space-y-0.5">
              <h3 className="text-sm font-medium text-foreground">{t.title}</h3>
              <p className="text-xs text-muted-foreground">{t.desc}</p>
            </div>
            <ArrowRight size={14} className="text-muted-foreground shrink-0 ml-3" />
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default TemplatesPage;
