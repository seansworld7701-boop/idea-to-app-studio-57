import { MessageSquare, RotateCcw, Maximize2, Minimize2 } from "lucide-react";
import { useState } from "react";
import type { PreviewData } from "@/pages/Build";

interface PreviewModeProps {
  data: PreviewData;
  onBack: () => void;
}

const PreviewMode = ({ data, onBack }: PreviewModeProps) => {
  const [isMobile, setIsMobile] = useState(false);

  const handleRefresh = () => {
    const iframe = document.querySelector<HTMLIFrameElement>("#preview-frame");
    if (iframe) {
      iframe.srcdoc = "";
      requestAnimationFrame(() => { iframe.srcdoc = data.html; });
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

        <span className="text-xs font-semibold text-foreground truncate max-w-[140px]">
          {data.title}
        </span>

        <div className="flex items-center gap-1">
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

      {/* Preview iframe */}
      <div className="flex-1 flex items-start justify-center bg-surface-0 overflow-hidden p-0">
        <iframe
          id="preview-frame"
          srcDoc={data.html}
          className={`h-full bg-background border-0 transition-all duration-300 ${
            isMobile ? "w-[375px] rounded-xl border border-border mt-4 shadow-2xl" : "w-full"
          }`}
          sandbox="allow-scripts"
          title="preview"
        />
      </div>
    </div>
  );
};

export default PreviewMode;
