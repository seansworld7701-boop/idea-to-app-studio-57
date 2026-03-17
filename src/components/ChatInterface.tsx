import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, ChevronDown, Sparkles, Code2, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { streamChat, parseAIResponse, type Msg } from "@/lib/ai-stream";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { PreviewData } from "@/pages/Build";
import MessageBubble from "./chat/MessageBubble";
import EmptyState from "./chat/EmptyState";
import LoadingIndicator from "./chat/LoadingIndicator";

type ChatMode = "all" | "vibe-code" | "chat";

const MODES: { id: ChatMode; label: string; icon: typeof Sparkles; desc: string }[] = [
  { id: "all", label: "All", icon: Sparkles, desc: "Code + conversation" },
  { id: "vibe-code", label: "Vibe Code", icon: Code2, desc: "Code generation only" },
  { id: "chat", label: "Chat", icon: MessageSquare, desc: "Conversation only" },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  onOpenPreview?: (data: PreviewData) => void;
  initialPrompt?: string;
}

const ChatInterface = ({ onOpenPreview, initialPrompt }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>("all");
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialPromptSent = useRef(false);
  const modeMenuRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 128) + "px";
    }
  }, [input]);

  // Auto-send initial prompt from templates/quick start
  useEffect(() => {
    if (initialPrompt && !initialPromptSent.current && messages.length === 0) {
      initialPromptSent.current = true;
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  const saveProject = useCallback(async (content: string, prompt: string) => {
    if (!user) return;
    const { files } = parseAIResponse(content);
    if (files.length === 0) return;
    const title = files[0]?.name.replace(/\.\w+$/, "") || "Untitled";
    try {
      await supabase.from("projects").insert({
        user_id: user.id,
        title,
        prompt,
        files: files as any,
      });
    } catch { /* silent */ }
  }, [user]);

  const handleSend = async (text?: string) => {
    const msgText = (text || input).trim();
    if (!msgText || isLoading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: msgText };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const history: Msg[] = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: msgText },
    ];

    let assistantSoFar = "";

    try {
      await streamChat({
        messages: history,
        onDelta: (chunk) => {
          assistantSoFar += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.id === "streaming") {
              return prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
              );
            }
            return [...prev, { id: "streaming", role: "assistant", content: assistantSoFar }];
          });
        },
        onDone: () => {
          setMessages((prev) =>
            prev.map((m) => (m.id === "streaming" ? { ...m, id: crypto.randomUUID() } : m))
          );
          setIsLoading(false);
          // Auto-save project
          saveProject(assistantSoFar, msgText);
        },
        onError: (error) => {
          toast({ title: "Error", description: error, variant: "destructive" });
          setIsLoading(false);
        },
      });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to get response", variant: "destructive" });
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleOpenPreview = (html: string, title: string) => {
    onOpenPreview?.({ html, title });
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isEmpty ? (
          <EmptyState onSuggestionClick={(s) => handleSend(s)} />
        ) : (
          <div className="space-y-4 pt-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} isLoggedIn={!!user} onOpenPreview={handleOpenPreview} />
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && <LoadingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background/80 backdrop-blur-xl px-4 py-3 pb-20">
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-surface-1 px-3 py-2 focus-within:ring-1 focus-within:ring-foreground/20 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Say hi or describe what to build..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none max-h-32"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background disabled:opacity-30 active:scale-95 transition-all"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
