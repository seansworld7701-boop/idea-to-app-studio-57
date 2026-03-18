import { useState } from "react";
import { Download, Copy, Eye, Check, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface ArtifactFile {
  name: string;
  content: string;
  language: string;
}

interface ArtifactCardProps {
  title: string;
  files: ArtifactFile[];
  isLoggedIn: boolean;
  onOpenPreview?: (html: string, title: string) => void;
}

function buildPreviewHtml(files: ArtifactFile[]): string {
  const htmlFile = files.find((f) => f.name.endsWith(".html"));
  const cssFile = files.find((f) => f.name.endsWith(".css"));
  const jsFile = files.find((f) => f.name.endsWith(".js"));

  // If the HTML file is a complete document (has <!DOCTYPE or <html), use it as base
  // and inject CSS/JS if they're separate files
  if (htmlFile) {
    let html = htmlFile.content;
    const isFullDoc = /<!doctype|<html/i.test(html);

    if (isFullDoc) {
      // Inject separate CSS into <head> if exists
      if (cssFile) {
        const styleTag = `<style>${cssFile.content}</style>`;
        if (html.includes("</head>")) {
          html = html.replace("</head>", `${styleTag}</head>`);
        } else if (html.includes("<body")) {
          html = html.replace(/<body/i, `${styleTag}<body`);
        }
      }
      // Inject separate JS before </body> if exists
      if (jsFile) {
        const scriptTag = `<script>${jsFile.content}<\/script>`;
        if (html.includes("</body>")) {
          html = html.replace("</body>", `${scriptTag}</body>`);
        } else {
          html += scriptTag;
        }
      }
      return html;
    }
  }

  // Fallback: build a complete document from parts
  const htmlContent = htmlFile?.content || "";
  const css = cssFile?.content || "";
  const js = jsFile?.content || "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0a;color:#fff}
${css}
</style>
</head>
<body>
${htmlContent}
<script>${js}<\/script>
</body>
</html>`;
}

const ArtifactCard = ({ title, files, isLoggedIn, onOpenPreview }: ArtifactCardProps) => {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleDownload = async () => {
    if (!isLoggedIn) { navigate("/auth"); return; }
    const zip = new JSZip();
    files.forEach((f) => zip.file(f.name, f.content));
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${title.replace(/\s+/g, "-").toLowerCase()}.zip`);
  };

  const handleCopy = () => {
    const code = files.map((f) => `// ${f.name}\n${f.content}`).join("\n\n");
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePreview = () => {
    if (!isLoggedIn) { navigate("/auth"); return; }
    onOpenPreview?.(buildPreviewHtml(files), title);
  };

  const hasPreview = files.some((f) => f.name.endsWith(".html"));

  return (
    <div className="rounded-2xl border border-border bg-surface-1 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface-2/60 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          </div>
          <span className="text-xs font-semibold text-foreground ml-1">{title}</span>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono bg-surface-2 px-2 py-0.5 rounded-full">
          {files.length} file{files.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* File tabs */}
      <div className="flex gap-0 border-b border-border overflow-x-auto bg-surface-2/30">
        {files.map((file, idx) => (
          <button
            key={file.name}
            onClick={() => setActiveTab(idx)}
            className={`px-3 py-2 text-xs font-mono whitespace-nowrap transition-colors relative ${
              activeTab === idx
                ? "text-foreground bg-surface-1"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {file.name}
            {activeTab === idx && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
            )}
          </button>
        ))}
      </div>

      {/* Code */}
      <pre className="p-4 overflow-x-auto max-h-56 bg-background/50">
        <code className="text-[12px] leading-relaxed font-mono text-muted-foreground">
          {files[activeTab]?.content}
        </code>
      </pre>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-surface-2/30">
        {hasPreview && (
          <button
            onClick={handlePreview}
            className="flex items-center gap-1.5 flex-1 justify-center rounded-xl bg-foreground py-2.5 text-xs font-medium text-background active:scale-[0.97] transition-transform"
          >
            {!isLoggedIn ? <Lock size={13} /> : <Eye size={14} />}
            Preview
          </button>
        )}
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 flex-1 justify-center rounded-xl bg-foreground py-2.5 text-xs font-medium text-background active:scale-[0.97] transition-transform"
        >
          {!isLoggedIn ? <Lock size={13} /> : <Download size={14} />}
          Download
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
};

export default ArtifactCard;
