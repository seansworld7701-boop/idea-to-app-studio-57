import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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

  return (
    <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface-2/50 border-b border-border">
        <span className="text-xs font-medium text-foreground">{title}</span>
        <span className="text-[10px] text-muted-foreground font-mono">
          {files.length} files
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
      <pre className="p-4 overflow-x-auto max-h-48">
        <code className="text-[13px] leading-relaxed font-mono text-muted-foreground">
          {files[activeTab]?.content}
        </code>
      </pre>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-border">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex-1 rounded-lg bg-foreground py-2 text-xs font-medium text-background active:scale-[0.97] transition-transform"
        >
          {showPreview ? "Hide Preview" : "Preview"}
        </button>
        <button
          onClick={() => {
            const code = files.map((f) => f.content).join("\n\n");
            navigator.clipboard.writeText(code);
          }}
          className="rounded-lg border border-border px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Copy
        </button>
      </div>

      {/* Preview iframe */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 300 }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <iframe
              srcDoc={buildPreviewHtml(files)}
              className="w-full h-[300px] bg-foreground"
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
