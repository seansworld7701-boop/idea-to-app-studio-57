import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Paperclip, Image as ImageIcon, X } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import logo from "@/assets/logo.png";
import ArtifactCard from "./ArtifactCard";
import { streamChat, parseAIResponse, type Msg } from "@/lib/ai-stream";
import { toast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: { name: string; url: string; type: string }[];
}

const SUGGESTION_PROMPTS = [
  "Create a portfolio website",
  "Build a snake game",
  "Make a todo list app",
  "Write a Python sorting algorithm",
];

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<{ name: string; url: string; type: string; file: File }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAttachments = Array.from(files).map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
      file,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (text?: string) => {
    const msgText = (text || input).trim();
    if ((!msgText && attachments.length === 0) || isLoading) return;

    const messageAttachments = attachments.map(({ name, url, type }) => ({ name, url, type }));
    const attachmentContext = attachments.length > 0
      ? `\n[User attached: ${attachments.map((a) => a.name).join(", ")}]`
      : "";

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: msgText,
      attachments: messageAttachments.length > 0 ? messageAttachments : undefined,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttachments([]);
    setIsLoading(true);

    const history: Msg[] = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: msgText + attachmentContext },
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
            return [
              ...prev,
              { id: "streaming", role: "assistant", content: assistantSoFar },
            ];
          });
        },
        onDone: () => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === "streaming" ? { ...m, id: crypto.randomUUID() } : m
            )
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <LoadingIndicator />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-background/80 backdrop-blur-xl px-4 py-3 pb-20">
        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
            {attachments.map((att, i) => (
              <div key={i} className="relative shrink-0 rounded-lg border border-border bg-surface-1 p-1">
                {att.type.startsWith("image/") ? (
                  <img src={att.url} alt={att.name} className="h-14 w-14 rounded object-cover" />
                ) : (
                  <div className="h-14 w-14 rounded bg-surface-2 flex items-center justify-center">
                    <span className="text-[9px] text-muted-foreground font-mono text-center px-1 truncate">{att.name}</span>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-foreground text-background flex items-center justify-center"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-surface-1 px-3 py-2 focus-within:ring-1 focus-within:ring-foreground/20 transition-all">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <Paperclip size={18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.txt,.pdf,.doc,.docx,.js,.ts,.py,.html,.css,.json,.csv"
            onChange={handleAttach}
            className="hidden"
          />
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
            disabled={(!input.trim() && attachments.length === 0) || isLoading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background disabled:opacity-30 active:scale-95 transition-all"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
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
      <img src={logo} alt="Forge" className="w-14 h-14 invert drop-shadow-lg" />
      <h1 className="text-xl font-bold tracking-tight text-foreground">
        Build the web, in text.
      </h1>
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

const MessageBubble = ({ message }: { message: Message }) => {
  if (message.role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-end gap-2"
      >
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex gap-1.5 flex-wrap justify-end">
            {message.attachments.map((att, i) =>
              att.type.startsWith("image/") ? (
                <img key={i} src={att.url} alt={att.name} className="h-20 w-20 rounded-xl object-cover border border-border" />
              ) : (
                <div key={i} className="rounded-xl border border-border bg-surface-1 px-3 py-2 text-xs text-muted-foreground font-mono">
                  {att.name}
                </div>
              )
            )}
          </div>
        )}
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-foreground px-4 py-2.5 text-sm text-background">
          {message.content}
        </div>
      </motion.div>
    );
  }

  const { explanation, files } = parseAIResponse(message.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {explanation && (
        <div className="text-sm text-muted-foreground leading-relaxed prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{explanation}</ReactMarkdown>
        </div>
      )}
      {files.length > 0 && (
        <ArtifactCard
          title={files[0]?.name.replace(/\.\w+$/, "") || "Project"}
          files={files}
        />
      )}
    </motion.div>
  );
};

const LoadingIndicator = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex items-center gap-3 py-4"
  >
    <img src={logo} alt="" className="w-7 h-7 invert animate-pulse" />
    <span className="text-sm text-muted-foreground">Building...</span>
  </motion.div>
);

export default ChatInterface;
