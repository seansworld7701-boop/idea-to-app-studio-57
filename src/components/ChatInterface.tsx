import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, ChevronDown, Sparkles, Braces, MessageCircle, FileSearch, ScanEye, Wrench, Trash2, Paperclip, X, History, Mic, MicOff, Palette, GraduationCap, Rocket, Wand2, Code2, Bot, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { streamChat, fileToBase64, readFileAsText, parseAIResponse, type Msg, type ChatMode, type ContentPart, type PersonaId } from "@/lib/ai-stream";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { PreviewData } from "@/pages/Build";
import MessageBubble from "./chat/MessageBubble";
import EmptyState from "./chat/EmptyState";
import LoadingIndicator from "./chat/LoadingIndicator";
import FollowUpSuggestions from "./chat/FollowUpSuggestions";
import ChatToolbar from "./chat/ChatToolbar";
import CodeDiffView from "./chat/CodeDiffView";
import type { ActionType } from "./chat/ActionCard";

const MODES: { id: ChatMode; label: string; icon: typeof Braces; desc: string }[] = [
  { id: "all", label: "All", icon: Sparkles, desc: "Code + conversation" },
  { id: "vibe-code", label: "Vibe Code", icon: Braces, desc: "Code generation only" },
  { id: "chat", label: "Chat", icon: MessageCircle, desc: "Conversation only" },
  { id: "explain", label: "Explain", icon: FileSearch, desc: "Explain code in detail" },
  { id: "review", label: "Review", icon: ScanEye, desc: "Code review & audit" },
  { id: "debug", label: "Debug", icon: Wrench, desc: "Find & fix bugs" },
];

const PERSONAS: { id: PersonaId; label: string; icon: typeof Bot; desc: string }[] = [
  { id: "default", label: "Default", icon: Bot, desc: "Balanced all-rounder" },
  { id: "senior-dev", label: "Senior Dev", icon: Code2, desc: "Clean, scalable code" },
  { id: "designer", label: "Designer", icon: Palette, desc: "Pixel-perfect UI" },
  { id: "tutor", label: "Tutor", icon: GraduationCap, desc: "Step-by-step learning" },
  { id: "startup", label: "Startup CTO", icon: Zap, desc: "Ship fast, iterate" },
  { id: "creative", label: "Creative", icon: Wand2, desc: "Experimental & artistic" },
];

interface Attachment {
  file: File;
  preview: string;
  type: "image" | "file";
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: string[];
  attachments?: { name: string; preview: string; type: string }[];
  sender?: string;
}

interface ChatInterfaceProps {
  onOpenPreview?: (data: PreviewData) => void;
  initialPrompt?: string;
  projectId?: string;
  initialMessages?: Message[];
  initialProjectFiles?: { name: string; content: string; language: string }[];
}

const ChatInterface = ({ onOpenPreview, initialPrompt, projectId, initialMessages, initialProjectFiles }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>("all");
  const [persona, setPersona] = useState<PersonaId>("default");
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(projectId || null);
  const [currentProjectFiles, setCurrentProjectFiles] = useState<{ name: string; content: string; language: string }[]>(initialProjectFiles || []);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ id: string; title: string; updated_at: string }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [showDiff, setShowDiff] = useState(false);
  const [previousFiles, setPreviousFiles] = useState<{ name: string; content: string; language: string }[]>([]);
  const [approvedActions, setApprovedActions] = useState<Partial<Record<ActionType, true>>>(() => readApprovedActions(projectId || null));
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialPromptSent = useRef(false);
  const modeMenuRef = useRef<HTMLDivElement>(null);
  const personaMenuRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const lastSaveRef = useRef<number>(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 128) + "px";
    }
  }, [input]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) setModeMenuOpen(false);
      if (personaMenuRef.current && !personaMenuRef.current.contains(e.target as Node)) setPersonaMenuOpen(false);
    };
    if (modeMenuOpen || personaMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [modeMenuOpen, personaMenuOpen]);

  useEffect(() => {
    if (initialPrompt && !initialPromptSent.current && messages.length === 0) {
      initialPromptSent.current = true;
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    setApprovedActions(readApprovedActions(currentProjectId));
  }, [currentProjectId]);

  const loadChatHistory = useCallback(async () => {
    if (!user) return;

    const [{ data: ownProjects }, { data: collabs }] = await Promise.all([
      supabase
        .from("projects")
        .select("id, title, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(20),
      supabase
        .from("project_collaborators")
        .select("project_id")
        .eq("user_id", user.id),
    ]);

    let accessibleProjects = ownProjects || [];

    if (collabs && collabs.length > 0) {
      const ids = [...new Set(collabs.map((collab) => collab.project_id))];
      const { data: collaboratorProjects } = await supabase
        .from("projects")
        .select("id, title, updated_at")
        .in("id", ids);

      accessibleProjects = [...accessibleProjects, ...(collaboratorProjects || [])];
    }

    const deduped = Array.from(new Map(accessibleProjects.map((project) => [project.id, project])).values())
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 20);

    setChatHistory(deduped);
  }, [user]);

  useEffect(() => {
    if (showHistory) loadChatHistory();
  }, [showHistory, loadChatHistory]);

  useEffect(() => {
    if (!currentProjectId) return;
    const channel = supabase
      .channel(`project-${currentProjectId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'projects', filter: `id=eq.${currentProjectId}` },
        (payload) => {
          if (Date.now() - lastSaveRef.current < 2000) return;
          const newConversations = payload.new?.conversations;
          const newFiles = payload.new?.files;
          if (!newConversations || !Array.isArray(newConversations)) return;
          if (newFiles && Array.isArray(newFiles)) {
            setCurrentProjectFiles(newFiles as { name: string; content: string; language: string }[]);
          }
          setMessages((prev) => {
            if (prev.some(m => m.id === "streaming")) return prev;
            const incoming = (newConversations as any[]).map((m: any) => ({
              id: crypto.randomUUID(),
              role: m.role as "user" | "assistant",
              content: m.content,
              sender: m.sender,
            }));
            const lastPrev = prev[prev.length - 1]?.content;
            const lastIncoming = incoming[incoming.length - 1]?.content;
            if (incoming.length !== prev.length || lastIncoming !== lastPrev) return incoming;
            return prev;
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentProjectId]);

  const handleApproveAction = useCallback((type: ActionType) => {
    setApprovedActions((prev) => {
      if (prev[type]) return prev;

      const next = { ...prev, [type]: true };
      writeApprovedActions(currentProjectId, next);
      return next;
    });

    toast({
      title: "Capability enabled",
      description: "The AI will keep using this for the current project without asking again.",
    });
  }, [currentProjectId]);

  const saveProject = useCallback(async (allMessages: Message[], prompt: string, assistantContent: string) => {
    if (!user) return;
    const { files } = parseAIResponse(assistantContent);
    const nextFiles = files.length > 0 ? files : currentProjectFiles;
    const title = nextFiles.length > 0
      ? nextFiles[0]?.name.replace(/\.\w+$/, "") || "Untitled"
      : prompt.slice(0, 50) || "Chat";
    const conversations = allMessages.map((m) => ({
      role: m.role,
      content: m.content,
      sender: m.sender || user.email,
    }));

    try {
      lastSaveRef.current = Date.now();
      if (currentProjectId) {
        await supabase.from("projects").update({
          files: nextFiles.length > 0 ? (nextFiles as any) : undefined,
          conversations: conversations as any,
          updated_at: new Date().toISOString(),
        }).eq("id", currentProjectId);
      } else {
        const { data } = await supabase.from("projects").insert({
          user_id: user.id,
          title,
          prompt,
          files: nextFiles.length > 0 ? (nextFiles as any) : null,
          conversations: conversations as any,
        }).select("id").single();
        if (data) {
          migrateApprovedActions(null, data.id);
          setCurrentProjectId(data.id);
        }
      }

      if (files.length > 0) setCurrentProjectFiles(files);
    } catch (e) {
      console.error("Failed to save project:", e);
    }
  }, [user, currentProjectId, currentProjectFiles]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAttachments: Attachment[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: `${file.name} exceeds 10MB limit`, variant: "destructive" });
        continue;
      }
      const isImage = file.type.startsWith("image/");
      if (isImage) {
        const preview = await fileToBase64(file);
        newAttachments.push({ file, preview, type: "image" });
      } else {
        const textContent = await readFileAsText(file);
        newAttachments.push({ file, preview: textContent, type: "file" });
      }
    }
    setAttachments((prev) => [...prev, ...newAttachments].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (text?: string) => {
    const msgText = (text || input).trim();
    if ((!msgText && attachments.length === 0) || isLoading) return;

    const userAttachments = attachments.map((a) => ({ name: a.file.name, preview: a.preview, type: a.file.type }));
    const userImages = attachments.filter((a) => a.type === "image").map((a) => a.preview);

    // Build content text that includes file contents
    let fullContent = msgText;
    const textFiles = attachments.filter((a) => a.type === "file");
    if (textFiles.length > 0) {
      const fileContents = textFiles.map((a) => `--- File: ${a.file.name} ---\n${a.preview}`).join("\n\n");
      fullContent = fullContent
        ? `${fullContent}\n\nAttached files:\n${fileContents}`
        : `Please analyze these files:\n\n${fileContents}`;
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: fullContent,
      images: userImages.length > 0 ? userImages : undefined,
      attachments: userAttachments.length > 0 ? userAttachments : undefined,
      sender: user?.email || undefined,
    };

    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (lastAssistant) {
      const { files } = parseAIResponse(lastAssistant.content);
      if (files.length > 0) setPreviousFiles(files);
    }

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setAttachments([]);
    setIsLoading(true);
    setShowDiff(false);

    const buildMsgContent = async (): Promise<Msg[]> => {
      const history: Msg[] = [];

      // Find the latest project files from conversation to inject as context
      let latestFiles: { name: string; content: string }[] = currentProjectFiles.map((file) => ({
        name: file.name,
        content: file.content,
      }));

      if (latestFiles.length === 0) {
        for (let i = newMessages.length - 1; i >= 0; i--) {
          if (newMessages[i].role === "assistant") {
            const { files } = parseAIResponse(newMessages[i].content);
            if (files.length > 0) {
              latestFiles = files;
              break;
            }
          }
        }
      }

      for (const m of newMessages) {
        if (m.role === "user" && m.images && m.images.length > 0) {
          const parts: ContentPart[] = [{ type: "text", text: m.content || "What is this?" }];
          for (const imgUrl of m.images) parts.push({ type: "image_url", image_url: { url: imgUrl } });
          history.push({ role: "user", content: parts });
        } else {
          history.push({ role: m.role, content: m.content });
        }
      }

      // If there are project files and user is asking to modify, inject context
      if (latestFiles.length > 0 && history.length > 0) {
        const lastMsg = history[history.length - 1];
        if (lastMsg.role === "user" && typeof lastMsg.content === "string") {
          const approvedCapabilities = Object.keys(approvedActions);
          const capabilitiesPrefix = approvedCapabilities.length > 0
            ? `[APPROVED PROJECT CAPABILITIES]\n${approvedCapabilities.join(", ")}\n\n`
            : "";
          const contextPrefix = `[CURRENT PROJECT FILES for reference — apply changes to these]\n${latestFiles.map(f => `===FILE: ${f.name}===\n${f.content}\n===END_FILE===`).join("\n\n")}\n\n[USER REQUEST]\n`;
          lastMsg.content = capabilitiesPrefix + contextPrefix + lastMsg.content;
        }
      }

      return history;
    };

    const history = await buildMsgContent();
    let assistantSoFar = "";

    try {
      await streamChat({
        messages: history,
        mode,
        persona,
        approvedActions: Object.keys(approvedActions) as ActionType[],
        onDelta: (chunk) => {
          assistantSoFar += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.id === "streaming") {
              return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
            }
            return [...prev, { id: "streaming", role: "assistant", content: assistantSoFar }];
          });
        },
        onDone: () => {
          setMessages((prev) => {
            const final = prev.map((m) => (m.id === "streaming" ? { ...m, id: crypto.randomUUID() } : m));
            saveProject(final, msgText, assistantSoFar);
            return final;
          });
          setIsLoading(false);
        },
        onError: (error) => {
          toast({ title: "Error", description: error, variant: "destructive" });
          setIsLoading(false);
        },
      });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to get response", variant: "destructive" });
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (messages.length < 2) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return;
    setMessages((prev) => {
      const idx = prev.length - 1;
      if (prev[idx]?.role === "assistant") return prev.slice(0, idx);
      return prev;
    });
    setTimeout(() => handleSend(lastUserMsg.content), 100);
  };

  const handleClearChat = () => {
    setMessages([]);
    setCurrentProjectId(null);
    setCurrentProjectFiles([]);
    setAttachments([]);
    setPinnedIds(new Set());
    setPreviousFiles([]);
    setShowDiff(false);
    setApprovedActions({});
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(getProjectPermissionsStorageKey(null));
    }
  };

  const handleMicToggle = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setIsRecording(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Not supported", description: "Voice input is not supported in this browser.", variant: "destructive" });
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = navigator.language || "en-US";
      recognitionRef.current = recognition;
      let finalTranscript = "";
      recognition.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalTranscript += transcript + " ";
          else interim = transcript;
        }
        const combined = (finalTranscript + interim).trim();
        if (combined) setInput((prev) => {
          const base = prev.replace(/\s*\[listening...\]$/, "").trim();
          return base ? `${base} ${combined}` : combined;
        });
      };
      recognition.onerror = (e: any) => {
        recognitionRef.current = null;
        setIsRecording(false);
        if (e.error === "not-allowed" || e.error === "permission-denied") {
          toast({ title: "Microphone blocked", variant: "destructive" });
        }
      };
      recognition.onend = () => { recognitionRef.current = null; setIsRecording(false); };
      recognition.start();
      setIsRecording(true);
    } catch {
      toast({ title: "Error", description: "Could not start voice input", variant: "destructive" });
    }
  };

  useEffect(() => {
    return () => { recognitionRef.current?.stop(); };
  }, []);

  const handleLoadChat = async (id: string) => {
    const { data } = await supabase.from("projects").select("id, conversations, files").eq("id", id).single();
    if (data?.conversations && Array.isArray(data.conversations)) {
      setMessages((data.conversations as any[]).map((m: any) => ({
        id: crypto.randomUUID(), role: m.role, content: m.content,
      })));
      setCurrentProjectId(data.id);
      setCurrentProjectFiles(Array.isArray(data.files) ? (data.files as { name: string; content: string; language: string }[]) : []);
    }
    setShowHistory(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleOpenPreview = (html: string, title: string) => {
    onOpenPreview?.({ html, title });
  };

  const handleTogglePin = (id: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleScrollToMessage = (id: string) => {
    const el = messageRefs.current.get(id);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.classList.add("ring-1", "ring-foreground/20", "rounded-lg");
    setTimeout(() => el?.classList.remove("ring-1", "ring-foreground/20", "rounded-lg"), 2000);
  };

  const handleExportChat = () => {
    const md = messages.map((m) => {
      const role = m.role === "user" ? "**You**" : "**Dust AI**";
      return `${role}\n\n${m.content}\n\n---\n`;
    }).join("\n");
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dust-ai-chat.md";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Chat exported!" });
  };

  const handleSuggestionClick = useCallback((suggestion: string) => {
    if (isLoading) return;
    setInput(suggestion);
    setTimeout(() => handleSend(suggestion), 50);
  }, [isLoading, messages, mode, persona, user, currentProjectId, attachments]);

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant" && m.id !== "streaming");
  const currentFiles = lastAssistantMsg ? parseAIResponse(lastAssistantMsg.content).files : [];
  const hasDiff = previousFiles.length > 0 && currentFiles.length > 0;

  const isEmpty = messages.length === 0;
  const activeMode = MODES.find((m) => m.id === mode)!;
  const ActiveIcon = activeMode.icon;
  const activePersona = PERSONAS.find((p) => p.id === persona)!;
  const PersonaIcon = activePersona.icon;

  const placeholders: Record<ChatMode, string> = {
    "all": "Say hi or describe what to build...",
    "vibe-code": "Describe what to build...",
    "chat": "Ask anything...",
    "explain": "Paste code to explain...",
    "review": "Paste code to review...",
    "debug": "Describe the bug or paste code...",
  };

  const lastAssistantContent = messages.filter((m) => m.role === "assistant" && m.id !== "streaming").pop()?.content || "";
  const showSuggestions = !isLoading && lastAssistantContent && messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.id !== "streaming";

  return (
    <div className="flex flex-col h-full relative">
      {/* Top bar */}
      {!isEmpty && (
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 relative">
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <History size={12} />
            </button>
            <ChatToolbar
              messages={messages}
              pinnedIds={pinnedIds}
              onTogglePin={handleTogglePin}
              onScrollToMessage={handleScrollToMessage}
              onExport={handleExportChat}
            />
          </div>
          <div className="flex items-center gap-0.5">
            {hasDiff && (
              <button
                onClick={() => setShowDiff(!showDiff)}
                className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] transition-all ${
                  showDiff ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Code2 size={11} /> Diff
              </button>
            )}
            <button
              onClick={handleClearChat}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>
      )}

      {/* Chat history sidebar */}
      {showHistory && (
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-10 left-2 right-2 z-40 rounded-xl border border-border bg-background shadow-xl max-h-60 overflow-y-auto"
        >
          <div className="p-2 space-y-0.5">
            <div className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Recent Chats</div>
            {chatHistory.length === 0 ? (
              <div className="px-2 py-3 text-xs text-muted-foreground text-center">No previous chats</div>
            ) : (
              chatHistory.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => handleLoadChat(chat.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                    currentProjectId === chat.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <span className="truncate flex-1">{chat.title}</span>
                  <span className="text-[9px] text-muted-foreground/60 ml-2 shrink-0">{new Date(chat.updated_at).toLocaleDateString()}</span>
                </button>
              ))
            )}
          </div>
        </motion.div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-4" onClick={() => { showHistory && setShowHistory(false); }}>
        {isEmpty ? (
          <EmptyState onSuggestionClick={(s) => handleSend(s)} />
        ) : (
          <div className="space-y-4 pt-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                ref={(el) => { if (el) messageRefs.current.set(msg.id, el); }}
                className="transition-all duration-300"
              >
                <MessageBubble
                  message={msg}
                  isLoggedIn={!!user}
                  onOpenPreview={handleOpenPreview}
                  onRetry={msg.role === "assistant" && msg.id !== "streaming" ? handleRetry : undefined}
                  isPinned={pinnedIds.has(msg.id)}
                  onTogglePin={() => handleTogglePin(msg.id)}
                  approvedActions={approvedActions}
                  onApproveAction={handleApproveAction}
                />
              </div>
            ))}

            {/* Follow-up suggestions */}
            {showSuggestions && (
              <FollowUpSuggestions
                lastAssistantContent={lastAssistantContent}
                onSuggestionClick={handleSuggestionClick}
              />
            )}

            {/* Code diff */}
            {showDiff && hasDiff && (
              <CodeDiffView
                previousFiles={previousFiles}
                currentFiles={currentFiles}
                onClose={() => setShowDiff(false)}
              />
            )}

            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <LoadingIndicator />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background/80 backdrop-blur-xl px-4 py-3 pb-20">
        {/* Mode + Persona switcher */}
        <div className="flex items-center gap-1 mb-2">
          <div className="relative" ref={modeMenuRef}>
            <button
              onClick={() => { setModeMenuOpen((v) => !v); setPersonaMenuOpen(false); }}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <ActiveIcon size={12} />
              {activeMode.label}
              <ChevronDown size={10} className={`transition-transform ${modeMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {modeMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-full left-0 mb-1 w-48 rounded-xl border border-border bg-background shadow-lg overflow-hidden z-50"
              >
                {MODES.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => { setMode(m.id); setModeMenuOpen(false); }}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                        mode === m.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      }`}
                    >
                      <Icon size={13} />
                      <div>
                        <div className="font-medium">{m.label}</div>
                        <div className="text-[10px] text-muted-foreground">{m.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </div>

          <div className="w-px h-4 bg-border" />

          <div className="relative" ref={personaMenuRef}>
            <button
              onClick={() => { setPersonaMenuOpen((v) => !v); setModeMenuOpen(false); }}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <PersonaIcon size={12} />
              {activePersona.label}
              <ChevronDown size={10} className={`transition-transform ${personaMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {personaMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-full left-0 mb-1 w-52 rounded-xl border border-border bg-background shadow-lg overflow-hidden z-50"
              >
                {PERSONAS.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.id}
                      onClick={() => { setPersona(p.id); setPersonaMenuOpen(false); }}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                        persona === p.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      }`}
                    >
                      <Icon size={13} />
                      <div>
                        <div className="font-medium">{p.label}</div>
                        <div className="text-[10px] text-muted-foreground">{p.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>

        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
            {attachments.map((att, i) => (
              <div key={i} className="relative shrink-0 group">
                {att.type === "image" ? (
                  <img src={att.preview} alt={att.file.name} className="h-16 w-16 rounded-lg object-cover border border-border" />
                ) : (
                  <div className="h-16 w-16 rounded-lg border border-border bg-secondary flex flex-col items-center justify-center gap-1 px-1">
                    <Paperclip size={14} className="text-muted-foreground" />
                    <span className="text-[8px] text-muted-foreground truncate w-full text-center">{att.file.name}</span>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-foreground text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary px-3 py-2 focus-within:ring-1 focus-within:ring-foreground/20 transition-all">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-background/50 transition-all disabled:opacity-30"
          >
            <Paperclip size={18} />
          </button>
          <input ref={fileInputRef} type="file" multiple
            accept="image/*,.pdf,.txt,.md,.json,.csv,.xml,.html,.css,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.go,.rs,.sql,.yaml,.yml,.sh"
            onChange={handleFileSelect} className="hidden"
          />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholders[mode]}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none max-h-32 py-1 leading-normal"
          />
          <button
            onClick={handleMicToggle}
            disabled={isLoading}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all disabled:opacity-30 ${
              isRecording ? "bg-destructive text-destructive-foreground animate-pulse" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
            title={isRecording ? "Stop recording" : "Voice input"}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <button
            onClick={() => handleSend()}
            disabled={(!input.trim() && attachments.length === 0) || isLoading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background disabled:opacity-30 active:scale-95 transition-all"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
