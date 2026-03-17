import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import logo from "@/assets/logo.png";
import ArtifactCard from "./ArtifactCard";
import { streamChat, parseAIResponse, type Msg } from "@/lib/ai-stream";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { PreviewData } from "@/pages/Build";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTION_PROMPTS = [
  "Create a portfolio website",
  "Build a snake game",
  "Make a todo list app",
  "Write a Python sorting algorithm",
];

interface ChatInterfaceProps {
  onOpenPreview?: (data: PreviewData) => void;
}

const ChatInterface = ({ onOpenPreview }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

const EmptyState = ({ onSuggestionClick }: { onSuggestionClick: (s: string) => void }) => (
  <div className="flex flex-col items-center justify-center h-full px-6 gap-8">
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center gap-4"
    >
      <img src={logo} alt="Dust" className="w-14 h-14 brightness-200 contrast-200 drop-shadow-lg" />
      <h1 className="text-xl font-bold tracking-tight text-foreground">Build anything, in text.</h1>
      <p className="text-sm text-muted-foreground text-center max-w-[280px]">
        Type an idea and get a working project — or just say hi for a chat.
      </p>
    </motion.div>
    <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
      {SUGGESTION_PROMPTS.map((prompt) => (
        <motion.button
          key={prompt}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => onSuggestionClick(prompt)}
          className="rounded-xl border border-border bg-surface-1 px-3 py-3 text-left text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all active:scale-[0.97]"
        >
          {prompt}
        </motion.button>
      ))}
    </div>
  </div>
);

const MessageBubble = ({
  message,
  isLoggedIn,
  onOpenPreview,
}: {
  message: Message;
  isLoggedIn: boolean;
  onOpenPreview: (html: string, title: string) => void;
}) => {
  if (message.role === "user") {
    return (
      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-end gap-2">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-foreground px-4 py-2.5 text-sm text-background">
          {message.content}
        </div>
      </motion.div>
    );
  }

  const { explanation, files } = parseAIResponse(message.content);

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      {explanation && (
        <div className="text-sm text-muted-foreground leading-relaxed prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{explanation}</ReactMarkdown>
        </div>
      )}
      {files.length > 0 && (
        <ArtifactCard
          title={files[0]?.name.replace(/\.\w+$/, "") || "Project"}
          files={files}
          isLoggedIn={isLoggedIn}
          onOpenPreview={onOpenPreview}
        />
      )}
    </motion.div>
  );
};

const LoadingIndicator = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 py-4">
    <img src={logo} alt="" className="w-7 h-7 animate-pulse" />
    <span className="text-sm text-muted-foreground">Thinking...</span>
  </motion.div>
);

export default ChatInterface;
