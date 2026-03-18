import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FolderOpen, Trash2, Loader2, ArrowRight, MessageSquare, Share2, Check, Globe, Link2, Copy } from "lucide-react";
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

interface Conversation {
  role: "user" | "assistant";
  content: string;
}

interface Project {
  id: string;
  title: string;
  prompt: string | null;
  files: ProjectFile[];
  conversations: Conversation[];
  is_shared: boolean;
  share_id: string | null;
  is_hosted: boolean;
  slug: string | null;
  created_at: string;
}

function parseFiles(files: Json | null): ProjectFile[] {
  if (!files || !Array.isArray(files)) return [];
  return files as unknown as ProjectFile[];
}

function parseConversations(conversations: Json | null): Conversation[] {
  if (!conversations || !Array.isArray(conversations)) return [];
  return conversations as unknown as Conversation[];
}

const ProjectsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [sharing, setSharing] = useState<string | null>(null);
  const [hostingProject, setHostingProject] = useState<string | null>(null);
  const [slugInput, setSlugInput] = useState("");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const load = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) {
        toast({ title: "Error", description: "Failed to load projects", variant: "destructive" });
      } else {
        setProjects((data || []).map((p: any) => ({
          ...p,
          files: parseFiles(p.files),
          conversations: parseConversations(p.conversations),
        })));
      }
      setLoading(false);
    };
    load();
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

  const handleContinue = (p: Project) => {
    if (p.conversations.length > 0) {
      const msgs = encodeURIComponent(JSON.stringify(p.conversations));
      navigate(`/build?project=${p.id}&messages=${msgs}`);
    } else if (p.prompt) {
      navigate(`/build?project=${p.id}&prompt=${encodeURIComponent(p.prompt)}`);
    } else {
      navigate(`/build?project=${p.id}`);
    }
  };

  const handleShare = async (p: Project) => {
    setSharing(p.id);
    try {
      if (p.is_shared && p.share_id) {
        // Already shared, copy link
        const url = `${window.location.origin}/shared/${p.share_id}`;
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied!" });
      } else {
        // Enable sharing
        const shareId = crypto.randomUUID().slice(0, 8);
        const { error } = await supabase.from("projects").update({
          is_shared: true,
          share_id: shareId,
        }).eq("id", p.id);
        if (error) throw error;
        setProjects((prev) => prev.map((proj) =>
          proj.id === p.id ? { ...proj, is_shared: true, share_id: shareId } : proj
        ));
        const url = `${window.location.origin}/shared/${shareId}`;
        await navigator.clipboard.writeText(url);
        toast({ title: "Share link copied!" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to share", variant: "destructive" });
    }
    setSharing(null);
  };

  // Route guard handles unauthenticated state
  if (!user) return null;

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
              className="rounded-xl border border-border bg-surface-1 px-4 py-3.5 space-y-2.5"
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-foreground truncate">{p.title}</h3>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {p.files.length} file{p.files.length !== 1 ? "s" : ""}
                    {p.conversations.length > 0 && ` · ${p.conversations.length} messages`}
                    {" · "}
                    {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleContinue(p)}
                  className="flex items-center gap-1.5 flex-1 justify-center rounded-lg bg-foreground py-2 text-xs font-medium text-background active:scale-[0.97] transition-transform"
                >
                  <MessageSquare size={13} />
                  Continue
                </button>
                <button
                  onClick={() => handleShare(p)}
                  disabled={sharing === p.id}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {p.is_shared ? <Check size={13} /> : <Share2 size={13} />}
                  {p.is_shared ? "Copied" : "Share"}
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={deleting === p.id}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
                >
                  {deleting === p.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
