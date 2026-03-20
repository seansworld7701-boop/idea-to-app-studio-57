import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Copy, Key } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
}

const generateKey = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "dust_";
  for (let i = 0; i < 40; i++) key += chars[Math.floor(Math.random() * chars.length)];
  return key;
};

const hashKey = async (key: string) => {
  const encoded = new TextEncoder().encode(key);
  const buffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const CloudApiKeys = () => {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  const fetchKeys = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_api_keys")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setKeys(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchKeys(); }, [user]);

  const createKey = async () => {
    if (!name.trim() || !user) return;
    setCreating(true);
    const key = generateKey();
    const hash = await hashKey(key);

    const { error } = await supabase.from("user_api_keys").insert({
      user_id: user.id,
      name: name.trim(),
      key_hash: hash,
      key_prefix: key.slice(0, 12) + "...",
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewKey(key);
      setName("");
      fetchKeys();
    }
    setCreating(false);
  };

  const deleteKey = async (id: string) => {
    await supabase.from("user_api_keys").delete().eq("id", id);
    setKeys((prev) => prev.filter((k) => k.id !== id));
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({ title: "Copied to clipboard" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4">
      {/* New key reveal */}
      {newKey && (
        <div className="p-3 rounded-xl bg-secondary border border-border space-y-2">
          <p className="text-xs text-foreground font-medium">Your new API key (copy now — won't show again):</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[10px] text-muted-foreground bg-background rounded-lg px-2.5 py-2 overflow-x-auto font-mono">
              {newKey}
            </code>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyKey(newKey)}>
              <Copy size={13} />
            </Button>
          </div>
          <Button variant="secondary" size="sm" className="w-full text-xs" onClick={() => setNewKey(null)}>
            Done
          </Button>
        </div>
      )}

      {/* Create */}
      <div className="flex gap-2">
        <Input
          placeholder="Key name (e.g. Production)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-secondary border-border text-sm"
        />
        <Button onClick={createKey} disabled={creating || !name.trim()} size="sm" className="gap-1.5 shrink-0">
          {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Create
        </Button>
      </div>

      {/* List */}
      {keys.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-8">No API keys created yet</p>
      ) : (
        <div className="space-y-2">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center gap-2.5 p-3 rounded-xl bg-secondary/30 border border-border">
              <Key size={14} className="text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">{k.name}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{k.key_prefix}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => deleteKey(k.id)}>
                <Trash2 size={13} className="text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CloudApiKeys;
