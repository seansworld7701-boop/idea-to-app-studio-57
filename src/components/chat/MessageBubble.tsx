import { motion } from "framer-motion";
import { Copy, Check, RefreshCw } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import ArtifactCard from "../ArtifactCard";
import { parseAIResponse } from "@/lib/ai-stream";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface MessageBubbleProps {
  message: Message;
  isLoggedIn: boolean;
  onOpenPreview: (html: string, title: string) => void;
  onRetry?: () => void;
}

const MessageBubble = ({ message, isLoggedIn, onOpenPreview, onRetry }: MessageBubbleProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.role === "user") {
    return (
      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-end gap-2">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-foreground px-4 py-2.5 text-sm text-background break-words">
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
      {/* Message actions */}
      {message.id !== "streaming" && (
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? "Copied" : "Copy"}
          </button>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              <RefreshCw size={11} />
              Retry
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default MessageBubble;
