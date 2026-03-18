import { MessageSquare, RotateCcw, Maximize2, Minimize2, ExternalLink } from "lucide-react";
import { useState } from "react";
import type { PreviewData } from "@/pages/Build";

interface PreviewModeProps {
  data: PreviewData;
  onBack: () => void;
}

const PreviewMode = ({ data, onBack }: PreviewModeProps) => {
  const [isMobile, setIsMobile] = useState(false);

  // Create a blob URL so the iframe can load external CDN scripts (Three.js etc.)
  // srcdoc with sandbox="allow-scripts" blocks external resource loading
  const [blobUrl] = useState(() => {
    const blob = new Blob([data.html], { type: "text/html" });
    return URL.createObjectURL(blob);
  });

  const handleRefresh = () => {
    const iframe = document.querySelector<HTMLIFrameElement>("#preview-frame");
    if (iframe) {
      iframe.src = "about:blank";
      requestAnimationFrame(() => {
        const newBlob = new Blob([data.html], { type: "text/html" });
        iframe.src = URL.createObjectURL(newBlob);
      });
    }
  };

  const handleOpenExternal = () => {
    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.write(data.html);
      newWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-1/80 backdrop-blur-xl">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-xs font-medium text-background active:scale-95 transition-transform"
        >
          <MessageSquare size={14} />
          Back to Chat
        </button>

        <span className="text-xs font-semibold text-foreground truncate max-w-[100px]">
          {data.title}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={handleOpenExternal}
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
            title="Open in new tab"
          >
            <ExternalLink size={14} />
          </button>
          <button
            onClick={() => setIsMobile(!isMobile)}
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            {isMobile ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Preview iframe - using blob URL instead of srcdoc to allow external scripts */}
      <div className="flex-1 flex items-start justify-center bg-surface-0 overflow-hidden p-0">
        <iframe
          id="preview-frame"
          src={blobUrl}
          className={`h-full bg-background border-0 transition-all duration-300 ${
            isMobile ? "w-[375px] rounded-xl border border-border mt-4 shadow-2xl" : "w-full"
          }`}
          sandbox="allow-scripts allow-same-origin allow-popups allow-modals"
          title="preview"
        />
      </div>
    </div>
  );
};

export default PreviewMode;
