import { useState, useEffect, useRef } from "react";
import { Upload, Trash2, File, Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface FileItem {
  name: string;
  id: string;
  created_at: string;
  metadata: { size: number; mimetype: string } | null;
}

const CloudFiles = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    if (!user) return;
    const { data, error } = await supabase.storage.from("user-files").list(user.id, {
      sortBy: { column: "created_at", order: "desc" },
    });
    if (!error) setFiles(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchFiles(); }, [user]);

  const uploadFile = async (file: globalThis.File) => {
    if (!user) return;
    setUploading(true);
    const path = `${user.id}/${file.name}`;
    const { error } = await supabase.storage.from("user-files").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Uploaded" });
      fetchFiles();
    }
    setUploading(false);
  };

  const deleteFile = async (name: string) => {
    if (!user) return;
    await supabase.storage.from("user-files").remove([`${user.id}/${name}`]);
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const downloadFile = async (name: string) => {
    if (!user) return;
    const { data, error } = await supabase.storage.from("user-files").download(`${user.id}/${name}`);
    if (error || !data) return;
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
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
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
      />
      <Button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full gap-1.5"
        size="sm"
      >
        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        Upload File
      </Button>

      {files.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-8">No files uploaded yet</p>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-2.5 p-3 rounded-xl bg-secondary/30 border border-border">
              <File size={16} className="text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                {file.metadata?.size && (
                  <p className="text-[10px] text-muted-foreground">{formatSize(file.metadata.size)}</p>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => downloadFile(file.name)}>
                <Download size={13} className="text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => deleteFile(file.name)}>
                <Trash2 size={13} className="text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CloudFiles;
