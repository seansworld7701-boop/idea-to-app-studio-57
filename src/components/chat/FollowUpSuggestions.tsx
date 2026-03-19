import { Sparkles, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

interface FollowUpSuggestionsProps {
  lastAssistantContent: string;
  onSuggestionClick: (s: string) => void;
}

function generateSuggestions(content: string): string[] {
  const lower = content.toLowerCase();
  const suggestions: string[] = [];

  // Check for code/web content
  const hasCode = content.includes("===FILE:") || content.includes("```");
  const hasHtml = lower.includes("<html") || lower.includes("<!doctype");
  const hasGame = lower.includes("game") || lower.includes("canvas") || lower.includes("three.js");
  const hasApi = lower.includes("api") || lower.includes("fetch") || lower.includes("endpoint");
  const hasForm = lower.includes("form") || lower.includes("input") || lower.includes("submit");
  const hasList = lower.includes("list") || lower.includes("table") || lower.includes("grid");
  const hasAuth = lower.includes("login") || lower.includes("auth") || lower.includes("password");

  if (hasCode || hasHtml) {
    suggestions.push("Make it responsive for mobile");
    if (!lower.includes("dark")) suggestions.push("Add dark/light theme toggle");
    suggestions.push("Add animations and transitions");
    if (!lower.includes("accessibility") && !lower.includes("aria")) suggestions.push("Improve accessibility");
  }

  if (hasGame) {
    suggestions.push("Add sound effects");
    suggestions.push("Add a leaderboard");
    suggestions.push("Increase difficulty over time");
  }

  if (hasApi) {
    suggestions.push("Add error handling");
    suggestions.push("Add loading states");
    suggestions.push("Cache the responses");
  }

  if (hasForm) {
    suggestions.push("Add form validation");
    suggestions.push("Add success/error feedback");
  }

  if (hasList) {
    suggestions.push("Add search & filter");
    suggestions.push("Add pagination");
  }

  if (hasAuth) {
    suggestions.push("Add password strength indicator");
    suggestions.push("Add forgot password flow");
  }

  // Generic but useful suggestions
  if (suggestions.length < 2) {
    suggestions.push("Explain how this works");
    suggestions.push("Improve the design");
    suggestions.push("Add more features");
  }

  return suggestions.slice(0, 3);
}

const FollowUpSuggestions = ({ lastAssistantContent, onSuggestionClick }: FollowUpSuggestionsProps) => {
  const suggestions = generateSuggestions(lastAssistantContent);

  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex flex-wrap gap-1.5 pt-1"
    >
      <Lightbulb size={11} className="text-muted-foreground mt-1.5 shrink-0" />
      {suggestions.map((s) => (
        <button
          key={s}
          onClick={() => onSuggestionClick(s)}
          className="rounded-lg border border-border bg-surface-1 px-2.5 py-1.5 text-[10px] text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all active:scale-[0.97]"
        >
          {s}
        </button>
      ))}
    </motion.div>
  );
};

export default FollowUpSuggestions;
