import { useState } from "react";
import { parseAIResponse } from "@/lib/ai-stream";

interface DiffFile {
  name: string;
  oldContent: string;
  newContent: string;
}

interface CodeDiffViewProps {
  previousFiles: { name: string; content: string; language: string }[];
  currentFiles: { name: string; content: string; language: string }[];
  onClose: () => void;
}

function computeLineDiff(oldLines: string[], newLines: string[]): { type: "same" | "add" | "remove"; content: string }[] {
  const result: { type: "same" | "add" | "remove"; content: string }[] = [];
  const maxLen = Math.max(oldLines.length, newLines.length);
  
  // Simple line-by-line diff
  let oi = 0, ni = 0;
  while (oi < oldLines.length || ni < newLines.length) {
    if (oi < oldLines.length && ni < newLines.length) {
      if (oldLines[oi] === newLines[ni]) {
        result.push({ type: "same", content: oldLines[oi] });
        oi++; ni++;
      } else {
        // Look ahead to find matching line
        let foundInNew = -1;
        for (let j = ni + 1; j < Math.min(ni + 5, newLines.length); j++) {
          if (oldLines[oi] === newLines[j]) { foundInNew = j; break; }
        }
        if (foundInNew > -1) {
          for (let j = ni; j < foundInNew; j++) {
            result.push({ type: "add", content: newLines[j] });
          }
          ni = foundInNew;
        } else {
          result.push({ type: "remove", content: oldLines[oi] });
          oi++;
          if (ni < newLines.length) {
            result.push({ type: "add", content: newLines[ni] });
            ni++;
          }
        }
      }
    } else if (oi < oldLines.length) {
      result.push({ type: "remove", content: oldLines[oi] });
      oi++;
    } else {
      result.push({ type: "add", content: newLines[ni] });
      ni++;
    }
  }
  return result;
}

const CodeDiffView = ({ previousFiles, currentFiles, onClose }: CodeDiffViewProps) => {
  const diffs: DiffFile[] = [];

  // Find changed and new files
  for (const curr of currentFiles) {
    const prev = previousFiles.find((f) => f.name === curr.name);
    if (!prev) {
      diffs.push({ name: curr.name, oldContent: "", newContent: curr.content });
    } else if (prev.content !== curr.content) {
      diffs.push({ name: curr.name, oldContent: prev.content, newContent: curr.content });
    }
  }
  // Find deleted files
  for (const prev of previousFiles) {
    if (!currentFiles.find((f) => f.name === prev.name)) {
      diffs.push({ name: prev.name, oldContent: prev.content, newContent: "" });
    }
  }

  const [activeFile, setActiveFile] = useState(0);

  if (diffs.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-1 p-4 text-center">
        <p className="text-xs text-muted-foreground">No changes detected</p>
        <button onClick={onClose} className="mt-2 text-xs text-foreground underline">Close</button>
      </div>
    );
  }

  const activeDiff = diffs[activeFile];
  const diffLines = computeLineDiff(
    activeDiff.oldContent.split("\n"),
    activeDiff.newContent.split("\n")
  );

  const additions = diffLines.filter((l) => l.type === "add").length;
  const deletions = diffLines.filter((l) => l.type === "remove").length;

  return (
    <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface-2/60 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-foreground">Changes</span>
          <span className="text-[9px] font-mono text-emerald-400">+{additions}</span>
          <span className="text-[9px] font-mono text-red-400">-{deletions}</span>
        </div>
        <button onClick={onClose} className="text-[10px] text-muted-foreground hover:text-foreground">✕</button>
      </div>

      {/* File tabs */}
      {diffs.length > 1 && (
        <div className="flex gap-0 border-b border-border overflow-x-auto bg-surface-2/30">
          {diffs.map((d, i) => (
            <button
              key={d.name}
              onClick={() => setActiveFile(i)}
              className={`px-3 py-1.5 text-[10px] font-mono whitespace-nowrap transition-colors ${
                activeFile === i ? "text-foreground bg-surface-1" : "text-muted-foreground"
              }`}
            >
              {d.name}
              {!d.oldContent && <span className="ml-1 text-emerald-400">new</span>}
              {!d.newContent && <span className="ml-1 text-red-400">del</span>}
            </button>
          ))}
        </div>
      )}

      {/* Diff content */}
      <pre className="p-3 overflow-x-auto max-h-48 text-[11px] font-mono leading-relaxed">
        {diffLines.map((line, i) => (
          <div
            key={i}
            className={`px-2 -mx-2 ${
              line.type === "add"
                ? "bg-emerald-500/10 text-emerald-300"
                : line.type === "remove"
                ? "bg-red-500/10 text-red-300"
                : "text-muted-foreground"
            }`}
          >
            <span className="inline-block w-4 text-right mr-2 opacity-40 select-none">
              {line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}
            </span>
            {line.content || " "}
          </div>
        ))}
      </pre>
    </div>
  );
};

export default CodeDiffView;
