import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import ChatInterface from "@/components/ChatInterface";
import PreviewMode from "@/components/PreviewMode";

export interface PreviewData {
  title: string;
  html: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const BuildPage = () => {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [searchParams] = useSearchParams();
  const initialPrompt = searchParams.get("prompt") || undefined;
  const projectId = searchParams.get("project") || undefined;

  // Parse initial messages from search params (for re-opening projects)
  const initialMessages: Message[] | undefined = (() => {
    const raw = searchParams.get("messages");
    if (!raw) return undefined;
    try {
      const parsed = JSON.parse(decodeURIComponent(raw));
      if (Array.isArray(parsed)) {
        return parsed.map((m: any) => ({
          id: crypto.randomUUID(),
          role: m.role,
          content: m.content,
        }));
      }
    } catch { /* ignore */ }
    return undefined;
  })();

  if (preview) {
    return <PreviewMode data={preview} onBack={() => setPreview(null)} />;
  }

  return (
    <div className="h-full flex flex-col">
      <ChatInterface
        onOpenPreview={setPreview}
        initialPrompt={initialPrompt}
        projectId={projectId}
        initialMessages={initialMessages}
      />
    </div>
  );
};

export default BuildPage;
