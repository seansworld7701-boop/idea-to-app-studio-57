import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TEMPLATES = [
  { title: "Portfolio Website", desc: "Personal portfolio with projects showcase", category: "Website", prompt: "Create a modern portfolio website with hero section, projects grid, about me, skills, and contact form. Use a dark theme with smooth animations." },
  { title: "Landing Page", desc: "Marketing landing page with CTA", category: "Website", prompt: "Build a product landing page with hero, features section, testimonials, pricing cards, and a call to action. Modern and responsive." },
  { title: "E-commerce Store", desc: "Online shop with product listings", category: "Website", prompt: "Build an e-commerce storefront with product grid, product detail pages, shopping cart, and checkout flow. Dark modern UI." },
  { title: "Todo App", desc: "Task management application", category: "App", prompt: "Make a todo list app with categories, priorities, due dates, search/filter, and local storage persistence. Clean minimal UI." },
  { title: "Snake Game", desc: "Classic snake game with canvas", category: "Game", prompt: "Create a snake game with canvas rendering, scoring system, increasing difficulty, game over/restart, and mobile touch controls." },
  { title: "Calculator", desc: "Scientific calculator app", category: "App", prompt: "Build a scientific calculator with basic and advanced operations, history, keyboard support, and a sleek dark UI." },
  { title: "Blog Page", desc: "Minimal blog with posts", category: "Website", prompt: "Create a minimal blog website with a homepage listing posts, individual post pages, categories, and a clean reading experience." },
  { title: "Weather App", desc: "Weather dashboard with forecasts", category: "App", prompt: "Build a weather dashboard app that shows current conditions, 5-day forecast, search by city, with beautiful weather icons and animations." },
  { title: "Chat UI", desc: "Real-time chat interface", category: "App", prompt: "Create a modern chat application UI with message bubbles, typing indicators, user avatars, and a clean dark theme." },
  { title: "Tic Tac Toe", desc: "Two-player board game", category: "Game", prompt: "Build a tic tac toe game with single-player AI mode, score tracking, win animations, and a clean responsive UI." },
  { title: "Pomodoro Timer", desc: "Focus productivity timer", category: "App", prompt: "Create a pomodoro timer app with work/break sessions, customizable durations, sound notifications, and session history." },
  { title: "Quiz App", desc: "Interactive trivia quiz", category: "App", prompt: "Build a quiz app with multiple-choice questions, score tracking, timer per question, results summary, and a sleek dark UI." },
];

const CATEGORIES = ["All", "Website", "App", "Game"];

const TemplatesPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = TEMPLATES.filter((t) => {
    const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || t.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col min-h-full px-5 pt-8 pb-24 gap-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Templates</h1>
        <p className="text-xs text-muted-foreground mt-1">Start from a template — one tap to build</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-1 px-3.5 py-2.5 focus-within:border-foreground/20 transition-colors">
        <Search size={16} className="text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              category === c
                ? "bg-foreground text-background"
                : "bg-surface-1 text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Template list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No templates found</p>
        ) : (
          filtered.map((t, i) => (
            <motion.button
              key={t.title}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => navigate(`/build?prompt=${encodeURIComponent(t.prompt)}`)}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-surface-1 px-4 py-4 text-left active:scale-[0.98] transition-all hover:border-foreground/20"
            >
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-foreground">{t.title}</h3>
                  <span className="text-[10px] text-muted-foreground/60 bg-surface-1 border border-border rounded px-1.5 py-0.5">{t.category}</span>
                </div>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </div>
              <ArrowRight size={14} className="text-muted-foreground shrink-0 ml-3" />
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
};

export default TemplatesPage;
