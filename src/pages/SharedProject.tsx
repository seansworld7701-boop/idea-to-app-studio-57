import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ArrowLeft, GitFork, Eye, FileCode, MessageSquare } from "lucide-react";
import ArtifactCard from "@/components/ArtifactCard";
import PreviewMode from "@/components/PreviewMode";
import { toast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

interface ProjectFile {
  name: string;
  content: string;
  language: string;
}

interface Conversation {
  role: "user" | "assistant";
  content: string;
  sender?: string;
}

interface SharedProjectData {
  title: string;
  prompt: string | null;
  files: ProjectFile[];
  conversations: Conversation[];
}

function parseFiles(files: Json | null): ProjectFile[] {
  if (!files || !Array.isArray(files)) return [];
  return files as unknown as ProjectFile[];
}

function parseConversations(conversations: Json | null): Conversation[] {
  if (!conversations || !Array.isArray(conversations)) return [];
  return conversations as unknown as Conversation[];
}

const SharedProject = () => {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<SharedProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [forking, setForking] = useState(false);
  const [preview, setPreview] = useState<{ html: string; title: string } | null>(null);

  useEffect(() => {
    if (!shareId) { setNotFound(true); setLoading(false); return; }
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("title, prompt, files, conversations")
          .eq("share_id", shareId)
          .eq("is_shared", true)
          .single();
        if (error || !data) {
          setNotFound(true);
        } else {
          setProject({
            title: data.title,
            prompt: data.prompt,
            files: parseFiles(data.files),
            conversations: parseConversations(data.conversations),
          });
        }
      } catch {
        setNotFound(true);
      }
      setLoading(false);
    };
    load();
  }, [shareId]);

  const handleFork = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to fork this project" });
      navigate("/auth");
      return;
    }
    if (!project) return;

    setForking(true);
    try {
      const { data, error } = await supabase.from("projects").insert({
        user_id: user.id,
        title: `${project.title} (fork)`,
        prompt: project.prompt,
        files: project.files.length > 0 ? (project.files as any) : null,
        conversations: project.conversations.length > 0 ? (project.conversations as any) : null,
      }).select("id").single();

      if (error) throw error;
      toast({ title: "Project forked!", description: "Opening in builder..." });
      navigate(`/build?project=${data.id}`);
    } catch {
      toast({ title: "Error", description: "Failed to fork project", variant: "destructive" });
    } finally {
      setForking(false);
    }
  };

  const handlePreview = () => {
    if (!project) return;
    const htmlFile = project.files.find((f) => f.name.endsWith(".html"));
    if (htmlFile) {
      setPreview({ html: htmlFile.content, title: project.title });
    } else {
      toast({ title: "No preview", description: "No HTML file found to preview" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-5">
        <p className="text-sm text-muted-foreground">Project not found or not shared</p>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-foreground"
        >
          <ArrowLeft size={14} /> Go Home
        </button>
      </div>
    );
  }

  if (preview) {
    return <PreviewMode data={preview} onBack={() => setPreview(null)} />;
  }

  const hasHtml = project.files.some((f) => f.name.endsWith(".html"));

  return (
    <div className="min-h-screen px-5 pt-8 pb-24">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Back
      </button>

      {/* Project header */}
      <div className="space-y-3 mb-6">
        <h1 className="text-lg font-semibold text-foreground">{project.title}</h1>
        {project.prompt && (
          <p className="text-xs text-muted-foreground leading-relaxed">{project.prompt}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <FileCode size={12} /> {project.files.length} file{project.files.length !== 1 ? "s" : ""}
          </span>
          {project.conversations.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MessageSquare size={12} /> {project.conversations.length} messages
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-6">
        {hasHtml && (
          <button
            onClick={handlePreview}
            className="flex items-center gap-1.5 flex-1 justify-center rounded-lg border border-border py-2.5 text-xs font-medium text-foreground hover:bg-surface-1 transition-colors"
          >
            <Eye size={14} /> Preview
          </button>
        )}
        {user ? (
          <button
            onClick={handleFork}
            disabled={forking}
            className="flex items-center gap-1.5 flex-1 justify-center rounded-lg bg-foreground py-2.5 text-xs font-medium text-background active:scale-95 transition-transform disabled:opacity-50"
          >
            {forking ? <Loader2 size={14} className="animate-spin" /> : <GitFork size={14} />}
            Fork & Build
          </button>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="flex items-center gap-1.5 flex-1 justify-center rounded-lg bg-foreground py-2.5 text-xs font-medium text-background active:scale-95 transition-transform"
          >
            Sign in to Fork
          </button>
        )}
      </div>

      {/* Files */}
      {project.files.length > 0 && (
        <ArtifactCard
          title={project.title}
          files={project.files}
          isLoggedIn={false}
          onOpenPreview={() => {}}
        />
      )}

      {/* Conversation preview */}
      {project.conversations.length > 0 && (
        <div className="mt-6 space-y-3">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Conversation</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto rounded-lg border border-border bg-surface-1 p-3">
            {project.conversations.slice(0, 20).map((msg, i) => (
              <div key={i} className={`text-xs leading-relaxed ${msg.role === "user" ? "text-foreground" : "text-muted-foreground"}`}>
                <span className="font-medium text-[10px] uppercase tracking-wider opacity-50">
                  {msg.role === "user" ? (msg.sender?.split("@")[0] || "User") : "AI"}:
                </span>{" "}
                {msg.content.slice(0, 200)}{msg.content.length > 200 ? "..." : ""}
              </div>
            ))}
            {project.conversations.length > 20 && (
              <p className="text-[10px] text-muted-foreground text-center pt-2">
                +{project.conversations.length - 20} more messages (fork to see all)
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedProject;
