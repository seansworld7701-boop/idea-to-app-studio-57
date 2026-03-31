import { Cloud, Shield, Database, HardDrive, Key, Lock, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const services = [
  {
    id: "auth",
    icon: Shield,
    title: "Authentication",
    description: "Email/password login, Google sign-in, user sessions",
    status: "active" as const,
  },
  {
    id: "database",
    icon: Database,
    title: "Database",
    description: "Key-value data store with per-user isolation",
    status: "active" as const,
  },
  {
    id: "storage",
    icon: HardDrive,
    title: "File Storage",
    description: "Upload, download, and manage files securely",
    status: "active" as const,
  },
  {
    id: "api-keys",
    icon: Key,
    title: "API Keys",
    description: "Generate and manage access keys for your apps",
    status: "active" as const,
  },
];

const CloudPage = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-full pb-24">
      {/* Header */}
      <div className="px-5 pt-8 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary border border-border">
            <Cloud size={20} className="text-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Dust Cloud</h1>
            <p className="text-xs text-muted-foreground">Backend services for your projects</p>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="px-5 py-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">All systems operational</span>
          {user && (
            <span className="text-[10px] text-muted-foreground/50 ml-auto font-mono truncate max-w-[140px]">
              {user.email}
            </span>
          )}
        </div>
      </div>

      {/* Locked notice */}
      <div className="px-5 py-3">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-secondary/30">
          <Lock size={14} className="text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            Cloud services are managed automatically by the AI assistant. Ask the AI in Build to enable or configure services.
          </p>
        </div>
      </div>

      {/* Services grid (read-only) */}
      <div className="px-5 pt-2 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">Services</p>
        <div className="space-y-2">
          {services.map((service) => (
            <div
              key={service.id}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-secondary/30 border border-border text-left"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary border border-border shrink-0">
                <service.icon size={16} className="text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{service.title}</p>
                  <span className="text-[9px] font-medium uppercase tracking-wider text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">
                    Active
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usage hint */}
      <div className="px-5 pt-6">
        <div className="p-4 rounded-xl border border-border bg-secondary/20">
          <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1.5"><Zap size={12} /> How to use Cloud</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Cloud services are configured through the AI assistant in Build. When your project needs
            authentication, data storage, or file uploads, the AI will show an action card to enable it.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CloudPage;
