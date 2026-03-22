import { useState } from "react";
import { Cloud, Shield, Database, HardDrive, Key, MessageSquare, ChevronRight, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CloudChat from "@/components/cloud/CloudChat";
import CloudData from "@/components/cloud/CloudData";
import CloudFiles from "@/components/cloud/CloudFiles";
import CloudApiKeys from "@/components/cloud/CloudApiKeys";
import { useAuth } from "@/hooks/useAuth";

const services = [
  {
    id: "auth",
    icon: Shield,
    title: "Authentication",
    description: "Email/password login, Google sign-in, user sessions",
    status: "active" as const,
    tab: null,
  },
  {
    id: "database",
    icon: Database,
    title: "Database",
    description: "Key-value data store with per-user isolation",
    status: "active" as const,
    tab: "data",
  },
  {
    id: "storage",
    icon: HardDrive,
    title: "File Storage",
    description: "Upload, download, and manage files securely",
    status: "active" as const,
    tab: "files",
  },
  {
    id: "api-keys",
    icon: Key,
    title: "API Keys",
    description: "Generate and manage access keys for your apps",
    status: "active" as const,
    tab: "keys",
  },
  {
    id: "ai",
    icon: Zap,
    title: "AI Assistant",
    description: "Chat with Dust Cloud AI powered by Gemini",
    status: "active" as const,
    tab: "chat",
  },
];

const CloudPage = () => {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const { user } = useAuth();

  // If a tab is active, show that panel
  if (activeTab) {
    return (
      <div className="flex flex-col min-h-full pb-24">
        <div className="px-5 pt-6 pb-3">
          <button
            onClick={() => setActiveTab(null)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            ← Back to Cloud
          </button>
          <h2 className="text-base font-semibold text-foreground mt-2">
            {services.find((s) => s.tab === activeTab)?.title}
          </h2>
        </div>
        <div className="flex-1 px-5">
          {activeTab === "chat" && <CloudChat />}
          {activeTab === "data" && <CloudData />}
          {activeTab === "files" && <CloudFiles />}
          {activeTab === "keys" && <CloudApiKeys />}
        </div>
      </div>
    );
  }

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

      {/* Services grid */}
      <div className="px-5 pt-2 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">Services</p>
        <div className="space-y-2">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => service.tab && setActiveTab(service.tab)}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-secondary/30 border border-border hover:bg-secondary/60 transition-colors text-left group"
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
              {service.tab && (
                <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Usage hint */}
      <div className="px-5 pt-6">
        <div className="p-4 rounded-xl border border-border bg-secondary/20">
          <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1.5"><Zap size={12} /> Tip: AI auto-suggests Cloud</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            When you're building in the main chat, Dust AI will automatically suggest using Cloud services
            when your project needs authentication, data storage, or file uploads.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CloudPage;
