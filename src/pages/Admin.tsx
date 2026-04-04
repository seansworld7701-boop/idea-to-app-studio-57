import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Users, FolderKanban, Trash2, Loader2, RefreshCw, Search, UserX, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";

interface Profile {
  user_id: string;
  email: string | null;
  created_at: string;
}

interface Project {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_shared: boolean;
  is_hosted: boolean;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
}

const AdminPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "projects" | "roles">("users");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userProjects, setUserProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!user) return;
    checkAdmin();
  }, [user]);

  const checkAdmin = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
  };

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin, activeTab]);

  const loadData = async () => {
    setLoading(true);
    if (activeTab === "users") {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
      setProfiles((data as Profile[]) || []);
    } else if (activeTab === "projects") {
      const { data } = await supabase.from("projects").select("id, title, user_id, created_at, updated_at, is_shared, is_hosted").order("updated_at", { ascending: false }).limit(100);
      setProjects((data as Project[]) || []);
    } else if (activeTab === "roles") {
      const { data } = await supabase.from("user_roles").select("*");
      setRoles((data as UserRole[]) || []);
    }
    setLoading(false);
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Delete this project permanently?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setProjects(prev => prev.filter(p => p.id !== id));
      toast({ title: "Project deleted" });
    }
  };

  const handleViewUserProjects = async (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
      return;
    }
    setExpandedUser(userId);
    const { data } = await supabase.from("projects").select("id, title, user_id, created_at, updated_at, is_shared, is_hosted").eq("user_id", userId).order("updated_at", { ascending: false });
    setUserProjects((data as Project[]) || []);
  };

  if (authLoading || isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const filtered = <T extends { email?: string | null; title?: string }>(items: T[]) =>
    search
      ? items.filter(item => {
          const s = search.toLowerCase();
          return (
            ("email" in item && (item as any).email?.toLowerCase().includes(s)) ||
            ("title" in item && (item as any).title?.toLowerCase().includes(s)) ||
            ("user_id" in item && (item as any).user_id?.includes(s))
          );
        })
      : items;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Shield size={20} className="text-primary" />
        <h1 className="text-lg font-semibold text-foreground">Admin Dashboard</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-secondary p-1">
        {[
          { id: "users" as const, label: "Users", icon: Users },
          { id: "projects" as const, label: "Projects", icon: FolderKanban },
          { id: "roles" as const, label: "Roles", icon: Shield },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearch(""); }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search + Refresh */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
          <Search size={14} className="text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <button onClick={loadData} className="rounded-lg border border-border px-3 py-2 text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          {activeTab === "users" && filtered(profiles).map(profile => (
            <div key={profile.user_id} className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate">{profile.email || "No email"}</p>
                  <p className="text-[10px] text-muted-foreground">
                    ID: {profile.user_id.slice(0, 8)}... · Joined {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleViewUserProjects(profile.user_id)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <Eye size={11} />
                  Projects
                  {expandedUser === profile.user_id ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </button>
              </div>
              {expandedUser === profile.user_id && (
                <div className="mt-2 pl-3 border-l-2 border-border space-y-1">
                  {userProjects.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground py-1">No projects</p>
                  ) : (
                    userProjects.map(p => (
                      <div key={p.id} className="flex items-center justify-between py-1">
                        <span className="text-[11px] text-foreground truncate">{p.title}</span>
                        <span className="text-[9px] text-muted-foreground">{new Date(p.updated_at).toLocaleDateString()}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}

          {activeTab === "projects" && filtered(projects).map(project => (
            <div key={project.id} className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate">{project.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Owner: {project.user_id.slice(0, 8)}... · Updated {new Date(project.updated_at).toLocaleDateString()}
                    {project.is_shared && " · 🔗 Shared"}
                    {project.is_hosted && " · 🌐 Hosted"}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteProject(project.id)}
                  className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}

          {activeTab === "roles" && (
            <>
              {filtered(roles).map(role => (
                <div key={role.id} className="rounded-lg border border-border bg-background p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">{role.user_id.slice(0, 12)}...</p>
                    <p className="text-[10px] text-muted-foreground">Role: {role.role}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    role.role === "admin" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                  }`}>
                    {role.role}
                  </span>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground text-center pt-2">
                Roles are managed via the database. Contact the developer to change roles.
              </p>
            </>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 pt-2">
        <div className="rounded-lg border border-border bg-background p-3 text-center">
          <p className="text-lg font-semibold text-foreground">{profiles.length}</p>
          <p className="text-[10px] text-muted-foreground">Users</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-3 text-center">
          <p className="text-lg font-semibold text-foreground">{projects.length}</p>
          <p className="text-[10px] text-muted-foreground">Projects</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-3 text-center">
          <p className="text-lg font-semibold text-foreground">{roles.length}</p>
          <p className="text-[10px] text-muted-foreground">Roles</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
