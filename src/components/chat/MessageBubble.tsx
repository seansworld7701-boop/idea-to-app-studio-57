import { motion } from "framer-motion";
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
}

const MessageBubble = ({ message, isLoggedIn, onOpenPreview }: MessageBubbleProps) => {
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
    </motion.div>
  );
};

export default MessageBubble;
