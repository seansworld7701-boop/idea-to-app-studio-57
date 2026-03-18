import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ChatInterface from "@/components/ChatInterface";
import PreviewMode from "@/components/PreviewMode";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export interface PreviewData {
  title: string;
  html: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: string[];
  attachments?: { name: string; preview: string; type: string }[];
}

const BuildPage = () => {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [searchParams] = useSearchParams();
  const [loadedMessages, setLoadedMessages] = useState<Message[] | undefined>(undefined);
  const [loadedProjectId, setLoadedProjectId] = useState<string | undefined>(undefined);
  const [isLoadingChat, setIsLoadingChat] = useState(true);
  const { user } = useAuth();

  const initialPrompt = searchParams.get("prompt") || undefined;
  const projectIdParam = searchParams.get("project") || undefined;

  // Load the most recent conversation on mount
  useEffect(() => {
    const loadLastChat = async () => {
      if (!user) {
        setIsLoadingChat(false);
        return;
      }

      try {
        // If a specific project is requested, load that
        const targetProjectId = projectIdParam;

        if (targetProjectId) {
          const { data } = await supabase
            .from("projects")
            .select("id, conversations")
            .eq("id", targetProjectId)
            .eq("user_id", user.id)
            .single();

          if (data?.conversations && Array.isArray(data.conversations)) {
            setLoadedMessages(
              (data.conversations as any[]).map((m: any) => ({
                id: crypto.randomUUID(),
                role: m.role,
                content: m.content,
              }))
            );
            setLoadedProjectId(data.id);
          }
        } else if (!initialPrompt) {
          // Load the most recent project's conversation
          const { data } = await supabase
            .from("projects")
            .select("id, conversations")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
            .limit(1)
            .single();

          if (data?.conversations && Array.isArray(data.conversations) && (data.conversations as any[]).length > 0) {
            setLoadedMessages(
              (data.conversations as any[]).map((m: any) => ({
                id: crypto.randomUUID(),
                role: m.role,
                content: m.content,
              }))
            );
            setLoadedProjectId(data.id);
          }
        }
      } catch {
        // No previous chat found, start fresh
      } finally {
        setIsLoadingChat(false);
      }
    };

    loadLastChat();
  }, [user, projectIdParam, initialPrompt]);

  if (preview) {
    return <PreviewMode data={preview} onBack={() => setPreview(null)} />;
  }

  if (isLoadingChat) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <ChatInterface
        onOpenPreview={setPreview}
        initialPrompt={initialPrompt}
        projectId={loadedProjectId || projectIdParam}
        initialMessages={loadedMessages}
      />
    </div>
  );
};

export default BuildPage;
