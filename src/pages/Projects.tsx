import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FolderOpen, Trash2, Eye, Loader2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

interface ProjectFile {
  name: string;
  content: string;
  language: string;
}

interface Project {
  id: string;
  title: string;
  prompt: string | null;
  files: ProjectFile[];
  created_at: string;
}

function parseFiles(files: Json | null): ProjectFile[] {
  if (!files || !Array.isArray(files)) return [];
  return files as unknown as ProjectFile[];
}

const ProjectsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetch = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        toast({ title: "Error", description: "Failed to load projects", variant: "destructive" });
      } else {
        setProjects((data || []).map((p) => ({ ...p, files: parseFiles(p.files) })));
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete project", variant: "destructive" });
    } else {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Project deleted" });
    }
    setDeleting(null);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-5 pb-24 gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-1 border border-border">
          <FolderOpen size={22} className="text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">Sign in to save projects</p>
        <button
          onClick={() => navigate("/auth")}
          className="flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background active:scale-95 transition-transform"
        >
          Sign In
          <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-full pb-24">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full px-5 pt-8 pb-24 gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Projects</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {projects.length} project{projects.length !== 1 ? "s" : ""} saved
        </p>
      </div>

      {projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center flex-1 gap-3 py-16"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-1 border border-border">
            <FolderOpen size={20} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No projects yet</p>
          <p className="text-xs text-muted-foreground/60 text-center max-w-[240px]">
            Start building to see your projects here
          </p>
          <button
            onClick={() => navigate("/build")}
            className="mt-2 flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-medium text-background active:scale-95 transition-transform"
          >
            Start Building <ArrowRight size={14} />
          </button>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {projects.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface-1 px-4 py-3.5"
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-foreground truncate">{p.title}</h3>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {p.files.length} file{p.files.length !== 1 ? "s" : ""} · {new Date(p.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                disabled={deleting === p.id}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive-foreground hover:bg-destructive/20 transition-colors shrink-0"
              >
                {deleting === p.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
