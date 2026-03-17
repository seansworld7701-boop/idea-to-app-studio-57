import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Copy, Eye, EyeOff, Check } from "lucide-react";
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
}

function buildPreviewHtml(files: ArtifactFile[]): string {
  const html = files.find((f) => f.name.endsWith(".html"))?.content || "";
  const css = files.find((f) => f.name.endsWith(".css"))?.content || "";
  const js = files.find((f) => f.name.endsWith(".js"))?.content || "";
  return `${html}<style>${css}</style><script>${js}<\/script>`;
}

const ArtifactCard = ({ title, files }: ArtifactCardProps) => {
  const [activeTab, setActiveTab] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
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

  const hasPreview = files.some((f) => f.name.endsWith(".html"));

  return (
    <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface-2/50 border-b border-border">
        <span className="text-xs font-medium text-foreground">{title}</span>
        <span className="text-[10px] text-muted-foreground font-mono">
          {files.length} file{files.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* File tabs */}
      <div className="flex gap-0 border-b border-border overflow-x-auto">
        {files.map((file, idx) => (
          <button
            key={file.name}
            onClick={() => setActiveTab(idx)}
            className={`px-3 py-2 text-xs font-mono whitespace-nowrap transition-colors ${
              activeTab === idx
                ? "text-foreground bg-surface-2 border-b border-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {file.name}
          </button>
        ))}
      </div>

      {/* Code */}
      <pre className="p-4 overflow-x-auto max-h-52">
        <code className="text-[13px] leading-relaxed font-mono text-muted-foreground">
          {files[activeTab]?.content}
        </code>
      </pre>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-border">
        {hasPreview && (
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1.5 flex-1 justify-center rounded-lg bg-foreground py-2.5 text-xs font-medium text-background active:scale-[0.97] transition-transform"
          >
            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPreview ? "Hide" : "Preview"}
          </button>
        )}
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 flex-1 justify-center rounded-lg bg-foreground py-2.5 text-xs font-medium text-background active:scale-[0.97] transition-transform"
        >
          <Download size={14} />
          Download
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {/* Preview iframe */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 350 }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <iframe
              srcDoc={buildPreviewHtml(files)}
              className="w-full h-[350px] bg-white"
              sandbox="allow-scripts"
              title="preview"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ArtifactCard;
