import { useState, useEffect } from "react";
import { Users, X, Trash2, Loader2, UserPlus, Crown, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface Collaborator {
  id: string;
  user_id: string;
  email: string;
  joined_at: string;
}

interface CollabPanelProps {
  projectId: string;
  projectTitle: string;
  onClose: () => void;
}

const MAX_COLLABORATORS = 3;

const CollabPanel = ({ projectId, projectTitle, onClose }: CollabPanelProps) => {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    loadCollaborators();
  }, [projectId]);

  const loadCollaborators = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("project_collaborators")
      .select("*")
      .eq("project_id", projectId);
    setCollaborators((data as Collaborator[]) || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    const email = emailInput.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      toast({ title: "Invalid email", variant: "destructive" });
      return;
    }
    if (email === user?.email) {
      toast({ title: "That's you!", description: "You're already the owner", variant: "destructive" });
      return;
    }
    if (collaborators.length >= MAX_COLLABORATORS) {
      toast({ title: "Limit reached", description: `Max ${MAX_COLLABORATORS} collaborators per project`, variant: "destructive" });
      return;
    }
    if (collaborators.some((c) => c.email === email)) {
      toast({ title: "Already added", variant: "destructive" });
      return;
    }

    setAdding(true);
    try {
      // Look up user by email in profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", email)
        .single();

      if (!profile) {
        toast({ title: "User not found", description: "They need to sign up on Dust AI first", variant: "destructive" });
        setAdding(false);
        return;
      }

      const { error } = await supabase.from("project_collaborators").insert({
        project_id: projectId,
        user_id: profile.user_id,
        email,
      });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Already a collaborator", variant: "destructive" });
        } else {
          throw error;
        }
      } else {
        toast({ title: "Collaborator added!", description: `${email} can now access this project` });
        setEmailInput("");
        loadCollaborators();
      }
    } catch {
      toast({ title: "Error", description: "Failed to add collaborator", variant: "destructive" });
    }
    setAdding(false);
  };

  const handleRemove = async (id: string, email: string) => {
    setRemoving(id);
    const { error } = await supabase
      .from("project_collaborators")
      .delete()
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to remove", variant: "destructive" });
    } else {
      setCollaborators((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Removed", description: `${email} removed from project` });
    }
    setRemoving(null);
  };

  const handleStopCollab = async () => {
    try {
      // Remove all collaborators
      await supabase
        .from("project_collaborators")
        .delete()
        .eq("project_id", projectId);
      setCollaborators([]);
      toast({ title: "Collaboration stopped", description: "All collaborators removed" });
      onClose();
    } catch {
      toast({ title: "Error", description: "Failed to stop collaboration", variant: "destructive" });
    }
  };

  const copyInviteInfo = () => {
    const text = `Join my project "${projectTitle}" on Dust AI! Sign up and ask me to add your email as a collaborator.`;
    navigator.clipboard.writeText(text);
    toast({ title: "Invite text copied!" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Users size={12} className="text-purple-400" />
            Collaborate
            <span className="text-[9px] text-muted-foreground ml-1">
              ({collaborators.length}/{MAX_COLLABORATORS})
            </span>
          </span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Owner */}
        <div className="flex items-center gap-2 rounded-lg bg-surface-1 border border-border p-2">
          <Crown size={12} className="text-amber-400 shrink-0" />
          <span className="text-[11px] text-foreground truncate flex-1">{user?.email}</span>
          <span className="text-[9px] text-muted-foreground">Owner</span>
        </div>

        {/* Collaborators list */}
        {loading ? (
          <div className="flex justify-center py-2">
            <Loader2 size={14} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          collaborators.map((c) => (
            <div key={c.id} className="flex items-center gap-2 rounded-lg bg-surface-1 border border-border p-2">
              <Users size={12} className="text-purple-400 shrink-0" />
              <span className="text-[11px] text-foreground truncate flex-1">{c.email}</span>
              <button
                onClick={() => handleRemove(c.id, c.email)}
                disabled={removing === c.id}
                className="text-muted-foreground hover:text-red-400 transition-colors shrink-0"
              >
                {removing === c.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              </button>
            </div>
          ))
        )}

        {/* Add collaborator */}
        {collaborators.length < MAX_COLLABORATORS && (
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="user@email.com"
              className="flex-1 rounded-lg border border-border bg-surface-1 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-purple-500/30"
            />
            <button
              onClick={handleAdd}
              disabled={adding}
              className="flex items-center gap-1 rounded-lg bg-purple-500 px-2.5 py-1.5 text-[11px] font-medium text-white active:scale-95 transition-transform disabled:opacity-50 shrink-0"
            >
              {adding ? <Loader2 size={11} className="animate-spin" /> : <UserPlus size={11} />}
              Add
            </button>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground">
          Collaborators can chat and build on this project together. Max {MAX_COLLABORATORS} users.
        </p>

        <div className="flex gap-2">
          <button
            onClick={copyInviteInfo}
            className="flex items-center gap-1.5 flex-1 justify-center rounded-lg border border-border py-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Copy size={11} />
            Copy invite text
          </button>
          {collaborators.length > 0 && (
            <button
              onClick={handleStopCollab}
              className="flex items-center gap-1.5 flex-1 justify-center rounded-lg border border-red-500/20 py-1.5 text-[11px] text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <X size={11} />
              Stop collab
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CollabPanel;