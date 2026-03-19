import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ArrowLeft, GitFork } from "lucide-react";
import ArtifactCard from "@/components/ArtifactCard";
import { toast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

interface ProjectFile {
  name: string;
  content: string;
  language: string;
}

interface SharedProjectData {
  title: string;
  prompt: string | null;
  files: ProjectFile[];
}

function parseFiles(files: Json | null): ProjectFile[] {
  if (!files || !Array.isArray(files)) return [];
  return files as unknown as ProjectFile[];
}

const SharedProject = () => {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<SharedProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [forking, setForking] = useState(false);

  useEffect(() => {
    if (!shareId) { setNotFound(true); setLoading(false); return; }
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("title, prompt, files")
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
        conversations: null,
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

  return (
    <div className="min-h-screen px-5 pt-8 pb-24">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Back
      </button>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-semibold text-foreground">{project.title}</h1>
        {user && project.files.length > 0 && (
          <button
            onClick={handleFork}
            disabled={forking}
            className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background active:scale-95 transition-transform disabled:opacity-50"
          >
            {forking ? <Loader2 size={13} className="animate-spin" /> : <GitFork size={13} />}
            Fork
          </button>
        )}
      </div>
      {project.prompt && (
        <p className="text-xs text-muted-foreground mb-4">{project.prompt}</p>
      )}
      {!user && (
        <div className="rounded-lg border border-border bg-surface-1 p-3 mb-4">
          <p className="text-xs text-muted-foreground">
            <button onClick={() => navigate("/auth")} className="text-foreground underline">Sign in</button> to fork this project and build on it.
          </p>
        </div>
      )}
      {project.files.length > 0 && (
        <ArtifactCard
          title={project.title}
          files={project.files}
          isLoggedIn={false}
          onOpenPreview={() => {}}
        />
      )}
    </div>
  );
};

export default SharedProject;