import { motion } from "framer-motion";
import { Copy, Check, RefreshCw, Download, Bookmark, BookmarkCheck } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import ArtifactCard from "../ArtifactCard";
import { parseAIResponse } from "@/lib/ai-stream";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: string[];
  attachments?: { name: string; preview: string; type: string }[];
  sender?: string;
}

interface MessageBubbleProps {
  message: Message;
  isLoggedIn: boolean;
  onOpenPreview: (html: string, title: string) => void;
  onRetry?: () => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
}

const MessageBubble = ({ message, isLoggedIn, onOpenPreview, onRetry, isPinned, onTogglePin }: MessageBubbleProps) => {
  const [copied, setCopied] = useState(false);
  const [expandedImg, setExpandedImg] = useState<string | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = (url: string, index: number) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `dust-ai-image-${index + 1}.png`;
    link.click();
  };

  if (message.role === "user") {
    return (
      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-end gap-2">
        {/* Sender label for collab */}
        {message.sender && (
          <span className="text-[10px] text-muted-foreground/60 mr-1">{message.sender.split("@")[0]}</span>
        )}
        {/* User attached images */}
        {message.images && message.images.length > 0 && (
          <div className="flex gap-1.5 flex-wrap justify-end max-w-[85%]">
            {message.images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Attachment ${i + 1}`}
                className="h-24 w-24 rounded-xl object-cover border border-border"
              />
            ))}
          </div>
        )}
        {/* User attached files (non-image) */}
        {message.attachments && message.attachments.filter((a) => !a.type.startsWith("image/")).length > 0 && (
          <div className="flex gap-1.5 flex-wrap justify-end max-w-[85%]">
            {message.attachments.filter((a) => !a.type.startsWith("image/")).map((att, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface-1 px-3 py-1.5 text-xs text-muted-foreground">
                📎 {att.name}
              </div>
            ))}
          </div>
        )}
        {message.content && (
          <div className="max-w-[85%] rounded-2xl rounded-br-md bg-foreground px-4 py-2.5 text-sm text-background break-words">
            {message.content}
          </div>
        )}
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

      {/* AI generated images */}
      {message.images && message.images.length > 0 && (
        <div className="space-y-2">
          {message.images.map((img, i) => (
            <div key={i} className="relative group">
              <img
                src={img}
                alt={`Generated image ${i + 1}`}
                className="rounded-xl border border-border max-w-full max-h-80 object-contain cursor-pointer"
                onClick={() => setExpandedImg(img)}
              />
              <button
                onClick={() => handleDownloadImage(img, i)}
                className="absolute top-2 right-2 h-8 w-8 rounded-lg bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Download size={14} className="text-foreground" />
              </button>
            </div>
          ))}
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

      {/* Expanded image modal */}
      {expandedImg && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-sm p-4"
          onClick={() => setExpandedImg(null)}
        >
          <img
            src={expandedImg}
            alt="Expanded"
            className="max-w-full max-h-full object-contain rounded-xl"
          />
        </div>
      )}
    </motion.div>
  );
};

export default MessageBubble;
