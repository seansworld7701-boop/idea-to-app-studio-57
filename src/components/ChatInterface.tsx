import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, ChevronDown, Sparkles, Braces, MessageCircle, FileSearch, ScanEye, Wrench, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { streamChat, parseAIResponse, type Msg, type ChatMode } from "@/lib/ai-stream";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { PreviewData } from "@/pages/Build";
import MessageBubble from "./chat/MessageBubble";
import EmptyState from "./chat/EmptyState";
import LoadingIndicator from "./chat/LoadingIndicator";

const MODES: { id: ChatMode; label: string; icon: typeof Braces; desc: string }[] = [
  { id: "all", label: "All", icon: Sparkles, desc: "Code + conversation" },
  { id: "vibe-code", label: "Vibe Code", icon: Braces, desc: "Code generation only" },
  { id: "chat", label: "Chat", icon: MessageCircle, desc: "Conversation only" },
  { id: "explain", label: "Explain", icon: FileSearch, desc: "Explain code in detail" },
  { id: "review", label: "Review", icon: ScanEye, desc: "Code review & audit" },
  { id: "debug", label: "Debug", icon: Wrench, desc: "Find & fix bugs" },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  onOpenPreview?: (data: PreviewData) => void;
  initialPrompt?: string;
  projectId?: string;
  initialMessages?: Message[];
}

const ChatInterface = ({ onOpenPreview, initialPrompt, projectId, initialMessages }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>("all");
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(projectId || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialPromptSent = useRef(false);
  const modeMenuRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 128) + "px";
    }
  }, [input]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) {
        setModeMenuOpen(false);
      }
    };
    if (modeMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [modeMenuOpen]);

  useEffect(() => {
    if (initialPrompt && !initialPromptSent.current && messages.length === 0) {
      initialPromptSent.current = true;
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  const saveProject = useCallback(async (allMessages: Message[], prompt: string, assistantContent: string) => {
    if (!user) return;
    const { files } = parseAIResponse(assistantContent);
    const title = files.length > 0
      ? files[0]?.name.replace(/\.\w+$/, "") || "Untitled"
      : prompt.slice(0, 50) || "Chat";
    const conversations = allMessages.map((m) => ({ role: m.role, content: m.content }));

    try {
      if (currentProjectId) {
        await supabase.from("projects").update({
          files: files.length > 0 ? (files as any) : undefined,
          conversations: conversations as any,
        }).eq("id", currentProjectId);
      } else {
        const { data } = await supabase.from("projects").insert({
          user_id: user.id,
          title,
          prompt,
          files: files.length > 0 ? (files as any) : null,
          conversations: conversations as any,
        }).select("id").single();
        if (data) setCurrentProjectId(data.id);
      }
    } catch (e) {
      console.error("Failed to save project:", e);
    }
  }, [user, currentProjectId]);

  const handleSend = async (text?: string) => {
    const msgText = (text || input).trim();
    if (!msgText || isLoading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: msgText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    const history: Msg[] = newMessages.map((m) => ({ role: m.role, content: m.content }));
    let assistantSoFar = "";

    try {
      await streamChat({
        messages: history,
        mode,
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
          setMessages((prev) => {
            const final = prev.map((m) => (m.id === "streaming" ? { ...m, id: crypto.randomUUID() } : m));
            saveProject(final, msgText, assistantSoFar);
            return final;
          });
          setIsLoading(false);
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

  const handleRetry = () => {
    if (messages.length < 2) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return;
    // Remove the last assistant message and retry
    setMessages((prev) => {
      const idx = prev.length - 1;
      if (prev[idx]?.role === "assistant") return prev.slice(0, idx);
      return prev;
    });
    setTimeout(() => handleSend(lastUserMsg.content), 100);
  };

  const handleClearChat = () => {
    setMessages([]);
    setCurrentProjectId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleOpenPreview = (html: string, title: string) => {
    onOpenPreview?.({ html, title });
  };

  const isEmpty = messages.length === 0;
  const activeMode = MODES.find((m) => m.id === mode)!;
  const ActiveIcon = activeMode.icon;

  const placeholders: Record<ChatMode, string> = {
    "all": "Say hi or describe what to build...",
    "vibe-code": "Describe what to build...",
    "chat": "Ask anything...",
    "explain": "Paste code to explain...",
    "review": "Paste code to review...",
    "debug": "Describe the bug or paste code...",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top bar with clear chat */}
      {!isEmpty && (
        <div className="flex items-center justify-end px-4 pt-2">
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-surface-1 transition-all"
          >
            <Trash2 size={12} />
            New chat
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isEmpty ? (
          <EmptyState onSuggestionClick={(s) => handleSend(s)} />
        ) : (
          <div className="space-y-4 pt-4">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isLoggedIn={!!user}
                onOpenPreview={handleOpenPreview}
                onRetry={msg.role === "assistant" && msg.id !== "streaming" ? handleRetry : undefined}
              />
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && <LoadingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background/80 backdrop-blur-xl px-4 py-3 pb-20">
        {/* Mode switcher */}
        <div className="relative mb-2" ref={modeMenuRef}>
          <button
            onClick={() => setModeMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-surface-1 transition-all"
          >
            <ActiveIcon size={14} />
            {activeMode.label}
            <ChevronDown size={12} className={`transition-transform ${modeMenuOpen ? "rotate-180" : ""}`} />
          </button>
          {modeMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-full left-0 mb-1 w-52 rounded-xl border border-border bg-background shadow-lg overflow-hidden z-50"
            >
              {MODES.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => { setMode(m.id); setModeMenuOpen(false); }}
                    className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs transition-colors ${
                      mode === m.id ? "bg-surface-1 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface-1/50"
                    }`}
                  >
                    <Icon size={14} />
                    <div>
                      <div className="font-medium">{m.label}</div>
                      <div className="text-[10px] text-muted-foreground">{m.desc}</div>
                    </div>
                  </button>
                );
              })}
            </motion.div>
          )}
        </div>
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-surface-1 px-3 py-2 focus-within:ring-1 focus-within:ring-foreground/20 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholders[mode]}
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
