import { NavLink, useLocation } from "react-router-dom";
import { Home, MessageSquare, FolderOpen, LayoutGrid, User } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/build", icon: MessageSquare, label: "Build" },
  { path: "/projects", icon: FolderOpen, label: "Projects" },
  { path: "/templates", icon: LayoutGrid, label: "Templates" },
  { path: "/account", icon: User, label: "Account" },
];

const HIDDEN_ROUTES = ["/auth", "/reset-password"];
const HIDDEN_PREFIXES = ["/shared/"];

const BottomNav = () => {
  const location = useLocation();

  // Hide nav on auth pages
  if (HIDDEN_ROUTES.includes(location.pathname)) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-border bg-background/80 backdrop-blur-xl safe-area-bottom">
      <div className="mx-auto flex h-full max-w-lg items-center justify-around px-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              className="relative flex flex-col items-center justify-center gap-0.5 px-3 py-1"
            >
              <motion.div
                animate={{ y: isActive ? -2 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2 : 1.5}
                  className={isActive ? "text-foreground" : "text-muted-foreground"}
                />
              </motion.div>
              <span
                className={`text-[10px] tracking-wide ${
                  isActive ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
