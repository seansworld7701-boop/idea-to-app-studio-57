import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, Trash2, Loader2, ArrowRight, MessageSquare, Share2, Globe, Copy, Download, X, Link2, Eye, EyeOff, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import CollabPanel from "@/components/CollabPanel";
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
  collabCount?: number;
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
  const [collabProjects, setCollabProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [hostingProject, setHostingProject] = useState<string | null>(null);
  const [slugInput, setSlugInput] = useState("");
  const [sharePanel, setSharePanel] = useState<string | null>(null);
  const [collabPanel, setCollabPanel] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const load = async () => {
      // Load own projects
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

      // Load projects where user is a collaborator
      const { data: collabs } = await supabase
        .from("project_collaborators")
        .select("project_id")
        .eq("user_id", user.id);

      if (collabs && collabs.length > 0) {
        const ids = collabs.map((c: any) => c.project_id);
        const { data: collabData } = await supabase
          .from("projects")
          .select("*")
          .in("id", ids)
          .order("updated_at", { ascending: false });
        if (collabData) {
          setCollabProjects(collabData.map((p: any) => ({
            ...p,
            files: parseFiles(p.files),
            conversations: parseConversations(p.conversations),
          })));
        }
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
    navigate(`/build?project=${p.id}`);
  };

  const handleEnableShare = async (p: Project) => {
    try {
      const shareId = p.share_id || crypto.randomUUID().slice(0, 8);
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
      toast({ title: "Sharing enabled", description: "Link copied to clipboard" });
    } catch {
      toast({ title: "Error", description: "Failed to share", variant: "destructive" });
    }
  };

  const handleDisableShare = async (p: Project) => {
    try {
      const { error } = await supabase.from("projects").update({
        is_shared: false,
        share_id: null,
      }).eq("id", p.id);
      if (error) throw error;
      setProjects((prev) => prev.map((proj) =>
        proj.id === p.id ? { ...proj, is_shared: false, share_id: null } : proj
      ));
      toast({ title: "Sharing disabled" });
    } catch {
      toast({ title: "Error", description: "Failed to disable sharing", variant: "destructive" });
    }
  };

  const copyShareLink = async (shareId: string) => {
    const url = `${window.location.origin}/shared/${shareId}`;
    await navigator.clipboard.writeText(url);
    toast({ title: "Link copied!" });
  };

  const handleHost = async (p: Project) => {
    const slug = slugInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/--+/g, "-");
    if (!slug || slug.length < 2) {
      toast({ title: "Invalid name", description: "Use at least 2 characters (a-z, 0-9, hyphens)", variant: "destructive" });
      return;
    }
    if (p.files.length === 0) {
      toast({ title: "No files", description: "This project has no files to host", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase.from("projects").update({ is_hosted: true, slug }).eq("id", p.id);
      if (error) {
        if (error.code === "23505") {
          toast({ title: "Name taken", description: "Try another name.", variant: "destructive" });
        } else throw error;
        return;
      }
      setProjects((prev) => prev.map((proj) => proj.id === p.id ? { ...proj, is_hosted: true, slug } : proj));
      const url = `${window.location.origin}/app/${slug}`;
      await navigator.clipboard.writeText(url);
      toast({ title: "App published!", description: "Link copied to clipboard" });
      setHostingProject(null);
      setSlugInput("");
    } catch {
      toast({ title: "Error", description: "Failed to publish app", variant: "destructive" });
    }
  };

  const handleUnhost = async (p: Project) => {
    try {
      await supabase.from("projects").update({ is_hosted: false, slug: null }).eq("id", p.id);
      setProjects((prev) => prev.map((proj) => proj.id === p.id ? { ...proj, is_hosted: false, slug: null } : proj));
      toast({ title: "App unpublished" });
    } catch {
      toast({ title: "Error", description: "Failed to unpublish", variant: "destructive" });
    }
  };

  const copyHostedUrl = async (slug: string) => {
    const url = `${window.location.origin}/app/${slug}`;
    await navigator.clipboard.writeText(url);
    toast({ title: "Link copied!" });
  };

  const handleExport = async (p: Project) => {
    if (p.files.length === 0) {
      toast({ title: "No files", description: "This project has no files to export", variant: "destructive" });
      return;
    }
    const zip = new JSZip();
    for (const file of p.files) zip.file(file.name, file.content);
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${p.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.zip`);
    toast({ title: "Downloaded!", description: `${p.files.length} file(s) exported` });
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-full pb-24">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  const totalProjects = projects.length + collabProjects.length;

  const renderProjectCard = (p: Project, i: number, isCollab: boolean) => (
    <motion.div
      key={p.id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.03 }}
      className="rounded-xl border border-border bg-surface-1 px-4 py-3.5 space-y-2.5"
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-foreground truncate">{p.title}</h3>
            {isCollab && (
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 text-[9px] font-medium text-purple-400">
                <Users size={8} /> Collab
              </span>
            )}
            {p.is_shared && !isCollab && (
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 text-[9px] font-medium text-blue-400">
                <Link2 size={8} /> Shared
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {p.files.length} file{p.files.length !== 1 ? "s" : ""}
            {p.conversations.length > 0 && ` · ${p.conversations.length} messages`}
            {" · "}
            {new Date(p.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Hosted badge */}
      {p.is_hosted && p.slug && (
        <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5">
          <Globe size={12} className="text-emerald-400" />
          <span className="text-[10px] font-mono text-emerald-400 truncate">/app/{p.slug}</span>
          <button onClick={() => copyHostedUrl(p.slug!)} className="ml-auto p-0.5 text-emerald-400/60 hover:text-emerald-400 transition-colors">
            <Copy size={11} />
          </button>
        </div>
      )}

      {/* Share panel - only for owned projects */}
      {!isCollab && (
        <AnimatePresence>
          {sharePanel === p.id && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="rounded-lg border border-border bg-background p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">Share project</span>
                  <button onClick={() => setSharePanel(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={14} /></button>
                </div>
                {p.is_shared && p.share_id ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 rounded-lg bg-surface-1 border border-border p-2">
                      <Link2 size={12} className="text-muted-foreground shrink-0" />
                      <span className="text-[10px] font-mono text-muted-foreground truncate flex-1">{window.location.origin}/shared/{p.share_id}</span>
                      <button onClick={() => copyShareLink(p.share_id!)} className="shrink-0 rounded-md bg-foreground px-2 py-1 text-[10px] font-medium text-background active:scale-95 transition-transform">Copy</button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Anyone with the link can view and fork this project.</p>
                    <button onClick={() => handleDisableShare(p)} className="flex items-center gap-1.5 w-full justify-center rounded-lg border border-red-500/20 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                      <EyeOff size={12} /> Disable sharing
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[10px] text-muted-foreground">Generate a public link. Signed-in users can fork it.</p>
                    <button onClick={() => handleEnableShare(p)} className="flex items-center gap-1.5 w-full justify-center rounded-lg bg-foreground py-2 text-xs font-medium text-background active:scale-95 transition-transform">
                      <Eye size={12} /> Enable sharing
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Collab panel - only for owned projects */}
      {!isCollab && (
        <AnimatePresence>
          {collabPanel === p.id && (
            <CollabPanel
              projectId={p.id}
              projectTitle={p.title}
              onClose={() => setCollabPanel(null)}
            />
          )}
        </AnimatePresence>
      )}

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => handleContinue(p)}
          className="flex items-center gap-1.5 flex-1 justify-center rounded-lg bg-foreground py-2 text-xs font-medium text-background active:scale-[0.97] transition-transform"
        >
          <MessageSquare size={13} />
          {isCollab ? "Open" : "Continue"}
        </button>

        {!isCollab && (
          <>
            {p.is_hosted ? (
              <button onClick={() => handleUnhost(p)} className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                <Globe size={13} /> Live
              </button>
            ) : (
              <button
                onClick={() => { setHostingProject(hostingProject === p.id ? null : p.id); setSlugInput(p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30)); }}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Globe size={13} /> Host
              </button>
            )}

            <button onClick={() => handleExport(p)} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors" title="Download as ZIP">
              <Download size={13} />
            </button>
            <button
              onClick={() => { setSharePanel(sharePanel === p.id ? null : p.id); setCollabPanel(null); }}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-colors ${p.is_shared ? "border-blue-500/30 text-blue-400 hover:bg-blue-500/10" : "border-border text-muted-foreground hover:text-foreground"}`}
              title="Share"
            >
              <Share2 size={13} />
            </button>
            <button
              onClick={() => { setCollabPanel(collabPanel === p.id ? null : p.id); setSharePanel(null); }}
              className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 px-3 py-2 text-xs text-purple-400 hover:bg-purple-500/10 transition-colors"
              title="Collaborate"
            >
              <Users size={13} />
            </button>
            <button
              onClick={() => handleDelete(p.id)}
              disabled={deleting === p.id}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
            >
              {deleting === p.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          </>
        )}
      </div>

      {/* Hosting slug input */}
      {!isCollab && hostingProject === p.id && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex items-center gap-2 pt-1">
          <div className="flex items-center flex-1 rounded-lg border border-border bg-surface-2/50 overflow-hidden">
            <span className="text-[10px] text-muted-foreground pl-2.5 shrink-0">/app/</span>
            <input
              type="text"
              value={slugInput}
              onChange={(e) => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="my-app"
              className="flex-1 bg-transparent text-xs text-foreground py-2 pr-2 outline-none font-mono"
              maxLength={30}
            />
          </div>
          <button onClick={() => handleHost(p)} className="rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background active:scale-[0.97] transition-transform shrink-0">
            Publish
          </button>
        </motion.div>
      )}
    </motion.div>
  );

  return (
    <div className="flex flex-col min-h-full px-5 pt-8 pb-24 gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Projects</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {totalProjects} project{totalProjects !== 1 ? "s" : ""} saved
        </p>
      </div>

      {totalProjects === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center flex-1 gap-3 py-16"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-1 border border-border">
            <FolderOpen size={20} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No projects yet</p>
          <p className="text-xs text-muted-foreground/60 text-center max-w-[240px]">Start building to see your projects here</p>
          <button onClick={() => navigate("/build")} className="mt-2 flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-medium text-background active:scale-95 transition-transform">
            Start Building <ArrowRight size={14} />
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {/* Own projects */}
          {projects.length > 0 && (
            <div className="space-y-2">
              {projects.map((p, i) => renderProjectCard(p, i, false))}
            </div>
          )}

          {/* Collab projects */}
          {collabProjects.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users size={12} className="text-purple-400" />
                Collaborations
              </h2>
              {collabProjects.map((p, i) => renderProjectCard(p, i, true))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;