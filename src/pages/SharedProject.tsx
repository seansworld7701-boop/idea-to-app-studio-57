import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft } from "lucide-react";
import ArtifactCard from "@/components/ArtifactCard";
import type { Json } from "@/integrations/supabase/types";

interface ProjectFile {
  name: string;
  content: string;
  language: string;
}

function parseFiles(files: Json | null): ProjectFile[] {
  if (!files || !Array.isArray(files)) return [];
  return files as unknown as ProjectFile[];
}

const SharedProject = () => {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!shareId) { setError(true); setLoading(false); return; }
    const load = async () => {
      const { data, error: err } = await supabase
        .from("projects")
        .select("*")
        .eq("share_id", shareId)
        .eq("is_shared", true)
        .single();
      if (err || !data) {
        setError(true);
      } else {
        setProject({ ...data, files: parseFiles(data.files) });
      }
      setLoading(false);
    };
    load();
  }, [shareId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  if (error || !project) {
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
      <h1 className="text-lg font-semibold text-foreground mb-1">{project.title}</h1>
      {project.prompt && (
        <p className="text-xs text-muted-foreground mb-4">{project.prompt}</p>
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
