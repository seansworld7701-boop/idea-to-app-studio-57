import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface ProjectFile {
  name: string;
  content: string;
  language: string;
}

function parseFiles(files: Json | null): ProjectFile[] {
  if (!files || !Array.isArray(files)) return [];
  return files as unknown as ProjectFile[];
}

function buildHtml(files: ProjectFile[]): string {
  const htmlFile = files.find((f) => f.name.endsWith(".html"));
  const cssFile = files.find((f) => f.name.endsWith(".css"));
  const jsFile = files.find((f) => f.name.endsWith(".js"));

  if (htmlFile) {
    let html = htmlFile.content;
    const isFullDoc = /<!doctype|<html/i.test(html);

    if (isFullDoc) {
      if (cssFile) {
        const styleTag = `<style>${cssFile.content}</style>`;
        if (html.includes("</head>")) {
          html = html.replace("</head>", `${styleTag}</head>`);
        }
      }
      if (jsFile) {
        const scriptTag = `<script>${jsFile.content}<\/script>`;
        if (html.includes("</body>")) {
          html = html.replace("</body>", `${scriptTag}</body>`);
        }
      }
      return html;
    }
  }

  const htmlContent = htmlFile?.content || "";
  const css = cssFile?.content || "";
  const js = jsFile?.content || "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0a;color:#fff}${css}</style>
</head>
<body>
${htmlContent}
<script>${js}<\/script>
</body>
</html>`;
}

const HostedApp = () => {
  const { slug } = useParams();
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return; }

    const load = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("title, files")
        .eq("slug", slug)
        .eq("is_hosted", true)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        const files = parseFiles(data.files);
        if (files.length === 0) {
          setNotFound(true);
        } else {
          setTitle(data.title);
          setHtml(buildHtml(files));
        }
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  if (notFound || !html) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-3">
        <p className="text-lg font-semibold text-foreground">App not found</p>
        <p className="text-sm text-muted-foreground">This app doesn't exist or isn't published.</p>
        <a href="/" className="text-xs text-muted-foreground hover:text-foreground underline mt-2">
          Go to Dust AI
        </a>
      </div>
    );
  }

  const blobUrl = URL.createObjectURL(new Blob([html], { type: "text/html" }));

  return (
    <div className="fixed inset-0 bg-background">
      {/* Full-screen iframe */}
      <iframe
        src={blobUrl}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-popups allow-modals"
        title={title}
      />

      {/* Dust AI watermark */}
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-black/80 backdrop-blur-sm border border-white/10 px-3 py-1.5 shadow-lg hover:bg-black/90 transition-colors group"
      >
        <img src="/favicon.png" alt="Dust AI" className="w-4 h-4 rounded-sm" />
        <span className="text-[10px] font-medium text-white/70 group-hover:text-white/90 transition-colors">
          Built with Dust AI
        </span>
      </a>
    </div>
  );
};

export default HostedApp;
