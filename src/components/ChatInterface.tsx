import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, ChevronDown, Sparkles, Braces, MessageCircle, FileSearch, ScanEye, Wrench, Trash2, Paperclip, X, History, Mic, MicOff, Cpu } from "lucide-react";
import { motion } from "framer-motion";
import { streamChat, generateImage, fileToBase64, parseAIResponse, type Msg, type ChatMode, type ContentPart, type AIModel, AI_MODELS } from "@/lib/ai-stream";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { PreviewData } from "@/pages/Build";
import MessageBubble from "./chat/MessageBubble";
import EmptyState from "./chat/EmptyState";
import LoadingIndicator from "./chat/LoadingIndicator";

const MODES: { id: ChatMode; label: string; icon: typeof Braces; desc: string }[] = [
  { id: "all", label: "All", icon: Sparkles, desc: "Code + conversation" },
  { id: "vibe-code", label: "Vibe Code", icon: Braces, desc: "Code generation only" },
  { id: "chat", label: "Chat", icon: MessageCircle, desc: "Conversation only" },
  { id: "explain", label: "Explain", icon: FileSearch, desc: "Explain code in detail" },
  { id: "review", label: "Review", icon: ScanEye, desc: "Code review & audit" },
  { id: "debug", label: "Debug", icon: Wrench, desc: "Find & fix bugs" },
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
}

interface ChatInterfaceProps {
  onOpenPreview?: (data: PreviewData) => void;
  initialPrompt?: string;
  projectId?: string;
  initialMessages?: Message[];
}

const ChatInterface = ({ onOpenPreview, initialPrompt, projectId, initialMessages }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ChatMode>("all");
  const [selectedModel, setSelectedModel] = useState<AIModel>("auto");
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(projectId || null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ id: string; title: string; updated_at: string }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const initialPromptSent = useRef(false);
  const modeMenuRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

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
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) {
        setModeMenuOpen(false);
      }
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setModelMenuOpen(false);
      }
    };
    if (modeMenuOpen || modelMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [modeMenuOpen, modelMenuOpen]);

  useEffect(() => {
    if (initialPrompt && !initialPromptSent.current && messages.length === 0) {
      initialPromptSent.current = true;
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  // Load chat history for the sidebar
  const loadChatHistory = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("projects")
      .select("id, title, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(20);
    if (data) setChatHistory(data);
  }, [user]);

  useEffect(() => {
    if (showHistory) loadChatHistory();
  }, [showHistory, loadChatHistory]);

  const saveProject = useCallback(async (allMessages: Message[], prompt: string, assistantContent: string) => {
    if (!user) return;
    const { files } = parseAIResponse(assistantContent);
    const title = files.length > 0
      ? files[0]?.name.replace(/\.\w+$/, "") || "Untitled"
      : prompt.slice(0, 50) || "Chat";
    // Don't store base64 images in conversations (too large)
    const conversations = allMessages.map((m) => ({ role: m.role, content: m.content }));

    try {
      if (currentProjectId) {
        await supabase.from("projects").update({
          files: files.length > 0 ? (files as any) : undefined,
          conversations: conversations as any,
          updated_at: new Date().toISOString(),
        }).eq("id", currentProjectId);
      } else {
        const { data } = await supabase.from("projects").insert({
          user_id: user.id,
          title,
          prompt,
          files: files.length > 0 ? (files as any) : null,
          conversations: conversations as any,
        }).select("id").single();
        if (data) setCurrentProjectId(data.id);
      }
    } catch (e) {
      console.error("Failed to save project:", e);
    }
  }, [user, currentProjectId]);

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
      const preview = isImage ? await fileToBase64(file) : "";
      newAttachments.push({ file, preview, type: isImage ? "image" : "file" });
    }

    setAttachments((prev) => [...prev, ...newAttachments].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const detectImageGenRequest = (text: string): boolean => {
    const lower = text.toLowerCase();
    const patterns = [
      /generate\s+(an?\s+)?image/,
      /create\s+(an?\s+)?image/,
      /draw\s+(me\s+)?(an?\s+)?/,
      /make\s+(me\s+)?(an?\s+)?image/,
      /generate\s+(an?\s+)?picture/,
      /create\s+(an?\s+)?picture/,
      /make\s+(an?\s+)?picture/,
      /image\s+of\b/,
      /picture\s+of\b/,
      /illustration\s+of\b/,
      /generate\s+(an?\s+)?illustration/,
    ];
    return patterns.some((p) => p.test(lower));
  };

  const handleSend = async (text?: string) => {
    const msgText = (text || input).trim();
    if ((!msgText && attachments.length === 0) || isLoading) return;

    const userAttachments = attachments.map((a) => ({
      name: a.file.name,
      preview: a.preview,
      type: a.file.type,
    }));

    const userImages = attachments.filter((a) => a.type === "image").map((a) => a.preview);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: msgText,
      images: userImages.length > 0 ? userImages : undefined,
      attachments: userAttachments.length > 0 ? userAttachments : undefined,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    const currentAttachments = [...attachments];
    setAttachments([]);
    setIsLoading(true);

    // Image generation request
    if (detectImageGenRequest(msgText) && currentAttachments.length === 0) {
      setIsGeneratingImage(true);
      try {
        const result = await generateImage(msgText);
        const imageUrls = result.images?.map((img) => img.image_url.url) || [];
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.text || "Here's the generated image:",
          images: imageUrls,
        };
        const final = [...newMessages, assistantMsg];
        setMessages(final);
        saveProject(final, msgText, result.text || "");
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : "Image generation failed";
        toast({ title: "Error", description: errMsg, variant: "destructive" });
      } finally {
        setIsLoading(false);
        setIsGeneratingImage(false);
      }
      return;
    }

    // Build multimodal message for AI
    const buildMsgContent = async (): Promise<Msg[]> => {
      const history: Msg[] = [];
      for (const m of newMessages) {
        if (m.role === "user" && m.images && m.images.length > 0) {
          const parts: ContentPart[] = [{ type: "text", text: m.content || "What is this?" }];
          for (const imgUrl of m.images) {
            parts.push({ type: "image_url", image_url: { url: imgUrl } });
          }
          history.push({ role: "user", content: parts });
        } else {
          history.push({ role: m.role, content: m.content });
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
        model: selectedModel,
        onDelta: (chunk) => {
          assistantSoFar += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.id === "streaming") {
              return prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
              );
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
    setAttachments([]);
  };

  const handleMicToggle = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Not supported", description: "Voice input is not supported in this browser. Try Chrome.", variant: "destructive" });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    const baseInput = input;

    recognition.onresult = (event: any) => {
      let final = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      const text = (final + interim).trim();
      setInput(baseInput ? `${baseInput} ${text}` : text);
    };

    recognition.onerror = (e: any) => {
      console.error("Speech recognition error:", e.error);
      setIsRecording(false);
      if (e.error === "not-allowed") {
        toast({ title: "Microphone blocked", description: "Please allow microphone access in your browser settings", variant: "destructive" });
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    setIsRecording(true);
  };

  useEffect(() => {
    return () => { recognitionRef.current?.stop(); };
  }, []);

  const handleLoadChat = async (id: string) => {
    const { data } = await supabase
      .from("projects")
      .select("id, conversations")
      .eq("id", id)
      .single();

    if (data?.conversations && Array.isArray(data.conversations)) {
      setMessages(
        (data.conversations as any[]).map((m: any) => ({
          id: crypto.randomUUID(),
          role: m.role,
          content: m.content,
        }))
      );
      setCurrentProjectId(data.id);
    }
    setShowHistory(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleOpenPreview = (html: string, title: string) => {
    onOpenPreview?.({ html, title });
  };

  const isEmpty = messages.length === 0;
  const activeMode = MODES.find((m) => m.id === mode)!;
  const ActiveIcon = activeMode.icon;

  const placeholders: Record<ChatMode, string> = {
    "all": "Say hi or describe what to build...",
    "vibe-code": "Describe what to build...",
    "chat": "Ask anything...",
    "explain": "Paste code to explain...",
    "review": "Paste code to review...",
    "debug": "Describe the bug or paste code...",
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Top bar */}
      {!isEmpty && (
        <div className="flex items-center justify-between px-4 pt-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-surface-1 transition-all"
          >
            <History size={12} />
            History
          </button>
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-surface-1 transition-all"
          >
            <Trash2 size={12} />
            New chat
          </button>
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
            <div className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Recent Chats
            </div>
            {chatHistory.length === 0 ? (
              <div className="px-2 py-3 text-xs text-muted-foreground text-center">No previous chats</div>
            ) : (
              chatHistory.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => handleLoadChat(chat.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                    currentProjectId === chat.id
                      ? "bg-surface-1 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-1/50"
                  }`}
                >
                  <span className="truncate flex-1">{chat.title}</span>
                  <span className="text-[9px] text-muted-foreground/60 ml-2 shrink-0">
                    {new Date(chat.updated_at).toLocaleDateString()}
                  </span>
                </button>
              ))
            )}
          </div>
        </motion.div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-4" onClick={() => showHistory && setShowHistory(false)}>
        {isEmpty ? (
          <EmptyState onSuggestionClick={(s) => handleSend(s)} />
        ) : (
          <div className="space-y-4 pt-4">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isLoggedIn={!!user}
                onOpenPreview={handleOpenPreview}
                onRetry={msg.role === "assistant" && msg.id !== "streaming" ? handleRetry : undefined}
              />
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <LoadingIndicator text={isGeneratingImage ? "Generating image..." : undefined} />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background/80 backdrop-blur-xl px-4 py-3 pb-20">
        {/* Mode switcher */}
        <div className="relative mb-2" ref={modeMenuRef}>
          <button
            onClick={() => setModeMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-surface-1 transition-all"
          >
            <ActiveIcon size={14} />
            {activeMode.label}
            <ChevronDown size={12} className={`transition-transform ${modeMenuOpen ? "rotate-180" : ""}`} />
          </button>
          {modeMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-full left-0 mb-1 w-52 rounded-xl border border-border bg-background shadow-lg overflow-hidden z-50"
            >
              {MODES.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => { setMode(m.id); setModeMenuOpen(false); }}
                    className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs transition-colors ${
                      mode === m.id ? "bg-surface-1 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface-1/50"
                    }`}
                  >
                    <Icon size={14} />
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

        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
            {attachments.map((att, i) => (
              <div key={i} className="relative shrink-0 group">
                {att.type === "image" ? (
                  <img
                    src={att.preview}
                    alt={att.file.name}
                    className="h-16 w-16 rounded-lg object-cover border border-border"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg border border-border bg-surface-1 flex flex-col items-center justify-center gap-1 px-1">
                    <Paperclip size={14} className="text-muted-foreground" />
                    <span className="text-[8px] text-muted-foreground truncate w-full text-center">
                      {att.file.name}
                    </span>
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

        <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface-1 px-3 py-2 focus-within:ring-1 focus-within:ring-foreground/20 transition-all">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-background/50 transition-all disabled:opacity-30"
          >
            <Paperclip size={18} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.md,.json,.csv,.xml,.html,.css,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.go,.rs,.sql,.yaml,.yml,.sh"
            onChange={handleFileSelect}
            className="hidden"
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

          {/* Mic button */}
          <button
            onClick={handleMicToggle}
            disabled={isLoading}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all disabled:opacity-30 ${
              isRecording
                ? "bg-red-500 text-white animate-pulse"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
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
