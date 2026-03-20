import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface DataItem {
  id: string;
  key: string;
  value: any;
  updated_at: string;
}

const CloudData = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("user_data")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error) setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const addItem = async () => {
    if (!newKey.trim() || !user) return;
    setSaving(true);
    let parsed: any;
    try {
      parsed = JSON.parse(newValue);
    } catch {
      parsed = newValue;
    }

    const { error } = await supabase.from("user_data").upsert(
      { user_id: user.id, key: newKey.trim(), value: parsed },
      { onConflict: "user_id,key" }
    );

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewKey("");
      setNewValue("");
      fetchData();
      toast({ title: "Saved" });
    }
    setSaving(false);
  };

  const deleteItem = async (id: string) => {
    await supabase.from("user_data").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
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
      {/* Add new */}
      <div className="space-y-2 p-3 rounded-xl bg-secondary/50 border border-border">
        <Input
          placeholder="Key (e.g. settings)"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          className="bg-background border-border text-sm"
        />
        <Input
          placeholder='Value (text or JSON)'
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="bg-background border-border text-sm"
        />
        <Button onClick={addItem} disabled={saving || !newKey.trim()} size="sm" className="w-full gap-1.5">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Save
        </Button>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-8">No data stored yet</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-2 p-3 rounded-xl bg-secondary/30 border border-border">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground font-mono truncate">{item.key}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate font-mono">
                  {typeof item.value === "string" ? item.value : JSON.stringify(item.value)}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => deleteItem(item.id)}>
                <Trash2 size={13} className="text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CloudData;
