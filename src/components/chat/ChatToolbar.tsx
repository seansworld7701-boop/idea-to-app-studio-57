import { Bookmark, BookmarkCheck, Search, Download, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: string[];
  sender?: string;
}

interface ChatToolbarProps {
  messages: Message[];
  pinnedIds: Set<string>;
  onTogglePin: (id: string) => void;
  onScrollToMessage: (id: string) => void;
  onExport: () => void;
}

const ChatToolbar = ({ messages, pinnedIds, onTogglePin, onScrollToMessage, onExport }: ChatToolbarProps) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPinned, setShowPinned] = useState(false);

  const searchResults = searchQuery.trim()
    ? messages.filter((m) =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10)
    : [];

  const pinnedMessages = messages.filter((m) => pinnedIds.has(m.id));

  return (
    <div className="flex items-center gap-1">
      {/* Search */}
      <button
        onClick={() => { setSearchOpen(!searchOpen); setShowPinned(false); }}
        className="flex items-center justify-center h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-1 transition-all"
        title="Search chat"
      >
        <Search size={13} />
      </button>

      {/* Pinned */}
      <button
        onClick={() => { setShowPinned(!showPinned); setSearchOpen(false); }}
        className={`flex items-center justify-center h-7 w-7 rounded-lg transition-all ${
          pinnedIds.size > 0 ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        } hover:bg-surface-1`}
        title="Pinned messages"
      >
        {pinnedIds.size > 0 ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
      </button>

      {/* Export */}
      <button
        onClick={onExport}
        className="flex items-center justify-center h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-1 transition-all"
        title="Export chat"
      >
        <Download size={13} />
      </button>

      {/* Search dropdown */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-10 left-2 right-2 z-50 rounded-xl border border-border bg-background shadow-xl overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
              <Search size={12} className="text-muted-foreground shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                autoFocus
                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
              />
              <button onClick={() => setSearchOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={12} />
              </button>
            </div>
            {searchQuery.trim() && (
              <div className="max-h-48 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-3">No results</p>
                ) : (
                  searchResults.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { onScrollToMessage(m.id); setSearchOpen(false); setSearchQuery(""); }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-surface-1 transition-colors border-b border-border/50 last:border-0"
                    >
                      <span className="text-[9px] text-muted-foreground uppercase">{m.role}</span>
                      <p className="text-foreground truncate">{m.content.slice(0, 80)}</p>
                    </button>
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pinned dropdown */}
      <AnimatePresence>
        {showPinned && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-10 left-2 right-2 z-50 rounded-xl border border-border bg-background shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-xs font-medium text-foreground">Pinned Messages</span>
              <button onClick={() => setShowPinned(false)} className="text-muted-foreground hover:text-foreground">
                <X size={12} />
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {pinnedMessages.length === 0 ? (
                <p className="text-[10px] text-muted-foreground text-center py-3">No pinned messages</p>
              ) : (
                pinnedMessages.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { onScrollToMessage(m.id); setShowPinned(false); }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-surface-1 transition-colors border-b border-border/50 last:border-0"
                  >
                    <span className="text-[9px] text-muted-foreground uppercase">{m.role}</span>
                    <p className="text-foreground truncate">{m.content.slice(0, 80)}</p>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatToolbar;
