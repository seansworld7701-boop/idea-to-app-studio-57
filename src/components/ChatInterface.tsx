import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  files?: { name: string; content: string; language: string }[];
  title?: string;
}

const SUGGESTION_PROMPTS = [
  "Create a portfolio website",
  "Build a snake game",
  "Make a todo list app",
  "Create a calculator",
];

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response for now
    setTimeout(() => {
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Here's your project based on: "${userMsg.content}"`,
        title: userMsg.content,
        files: [
          {
            name: "index.html",
            language: "html",
            content: `<!DOCTYPE html>\n<html>\n<head>\n  <title>${userMsg.content}</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Hello World</h1>\n  <script src="script.js"></script>\n</body>\n</html>`,
          },
          {
            name: "style.css",
            language: "css",
            content: `* { margin: 0; padding: 0; box-sizing: border-box; }\nbody { font-family: system-ui; background: #0a0a0a; color: #fff; }`,
          },
          {
            name: "script.js",
            language: "javascript",
            content: `console.log("Project initialized");`,
          },
        ],
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(false);
    }, 2000);
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
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isEmpty ? (
          <EmptyState onSuggestionClick={(s) => { setInput(s); inputRef.current?.focus(); }} />
        ) : (
          <div className="space-y-4 pt-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && <LoadingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-background/80 backdrop-blur-xl px-4 py-3 pb-20">
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-surface-1 px-4 py-2 focus-within:ring-1 focus-within:ring-foreground/20 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What are we building today?"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none max-h-32"
          />
          <button
            onClick={handleSend}
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
      <img src={logo} alt="Forge" className="w-12 h-12 invert" />
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        Build the web, in text.
      </h1>
      <p className="text-sm text-muted-foreground text-center max-w-[280px]">
        Type an idea and get a working project. Websites, apps, games — instantly.
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
  const [activeTab, setActiveTab] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  if (message.role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-foreground px-4 py-2.5 text-sm text-background">
          {message.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Explanation */}
      <div className="text-sm text-muted-foreground leading-relaxed">
        {message.content}
      </div>

      {/* Artifact card */}
      {message.files && (
        <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-surface-2/50 border-b border-border">
            <span className="text-xs font-medium text-foreground">{message.title}</span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {message.files.length} files
            </span>
          </div>

          {/* File tabs */}
          <div className="flex gap-0 border-b border-border overflow-x-auto">
            {message.files.map((file, idx) => (
              <button
                key={file.name}
                onClick={() => setActiveTab(idx)}
                className={`px-3 py-2 text-xs font-mono whitespace-nowrap transition-colors ${
                  activeTab === idx
                    ? "text-foreground bg-surface-2 border-b border-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {file.name}
              </button>
            ))}
          </div>

          {/* Code */}
          <pre className="p-4 overflow-x-auto max-h-48">
            <code className="text-[13px] leading-relaxed font-mono text-muted-foreground">
              {message.files[activeTab]?.content}
            </code>
          </pre>

          {/* Actions */}
          <div className="flex items-center gap-2 px-4 py-3 border-t border-border">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex-1 rounded-lg bg-foreground py-2 text-xs font-medium text-background active:scale-[0.97] transition-transform"
            >
              {showPreview ? "Hide Preview" : "Preview"}
            </button>
            <button
              onClick={() => {
                const code = message.files?.map(f => f.content).join("\n\n") || "";
                navigator.clipboard.writeText(code);
              }}
              className="rounded-lg border border-border px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Copy
            </button>
          </div>

          {/* Preview iframe */}
          <AnimatePresence>
            {showPreview && message.files && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 300 }}
                exit={{ height: 0 }}
                className="overflow-hidden border-t border-border"
              >
                <iframe
                  srcDoc={buildPreviewHtml(message.files)}
                  className="w-full h-[300px] bg-foreground"
                  sandbox="allow-scripts"
                  title="preview"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
    <img src={logo} alt="" className="w-6 h-6 invert animate-pulse-subtle" />
    <span className="text-sm text-muted-foreground">AI is building your project...</span>
  </motion.div>
);

function buildPreviewHtml(files: { name: string; content: string }[]): string {
  const html = files.find((f) => f.name.endsWith(".html"))?.content || "";
  const css = files.find((f) => f.name.endsWith(".css"))?.content || "";
  const js = files.find((f) => f.name.endsWith(".js"))?.content || "";
  return `${html}<style>${css}</style><script>${js}<\/script>`;
}

export default ChatInterface;
