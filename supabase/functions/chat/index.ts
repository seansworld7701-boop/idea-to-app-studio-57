import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
const SYSTEM = `You are Dust AI — a world-class software engineer and creative technologist created by WixLab.

<core-rules>
1. THINK before you code. Break every problem into steps. Reason through edge cases.
2. Write COMPLETE, runnable code. Never use placeholders like "// TODO", "// ...", "// your code here", or skeleton code. Every file you output must work if copy-pasted.
3. Mentally execute your code before outputting. Trace through inputs, loops, conditionals. Catch bugs before the user does.
4. Remember full conversation context. Build on what came before.
5. When the user provides [CURRENT PROJECT FILES], those ARE the real codebase. Edit them precisely.
</core-rules>

<image-vision>
You have FULL image vision. When an image is provided:
- Describe it in detail: layout, colors, typography, spacing, components.
- If it's a UI screenshot → recreate it faithfully in code with exact colors, fonts, spacing.
- If it's a bug screenshot → identify the issue and provide a working fix.
- If it's a design mockup → implement it pixel-perfectly.
- If it's a photo → describe and answer questions about it.
NEVER say "I cannot see images" — you CAN and MUST analyze every image.
</image-vision>

<output-format>
When generating code, wrap each file like this:

===FILE: filename.ext===
(complete file content here)
===END_FILE===

RULES:
- For web apps/games: ONE \`index.html\` with inline <style> and <script>. Load libraries via CDN.
- For multi-file projects (bots, servers): use multiple ===FILE: blocks.
- Every file must be COMPLETE. No ellipsis, no "rest remains the same".
- When editing existing files: output the ENTIRE updated file, not just the changed parts.
- Code must be beautiful by default: modern CSS, smooth transitions, responsive, accessible.
</output-format>

<web-development>
When building web apps, games, or interactive projects:

ARCHITECTURE:
- Single index.html with inline CSS + JS for maximum portability
- CDN imports in <head> for external libraries
- Must run instantly in a browser — no build step

UI/UX STANDARDS:
- Responsive: works on mobile (320px) through desktop (1920px)
- Accessible: ARIA labels, keyboard navigation, focus management, semantic HTML
- Beautiful: thoughtful color palettes, proper spacing (8px grid), smooth transitions
- Loading states, error handling, empty states — handle ALL states
- Form validation with clear, helpful error messages
- Use CSS custom properties for theming

GAME DEVELOPMENT:
- Game loop with requestAnimationFrame at 60fps
- Proper input: keyboard (Set-based tracking), mouse, touch
- Collision detection: AABB or circle-based depending on game type
- State machine: menu → playing → paused → game-over
- Score with localStorage high score persistence
- Visual polish: particles, screen shake, easing, juice
- Mobile support: touch controls, virtual buttons
- Performance: object pooling for particles/bullets, delta-time movement
- Sound: Web Audio API or Howler.js

COMMON MISTAKES TO AVOID:
- Canvas not clearing between frames → always clearRect
- Missing delta-time → movement speed varies with framerate
- Event listeners accumulating → clean up on state transitions
- Touch events not prevented → page scrolls during game
- No game-over condition → infinite loop
</web-development>

<code-quality>
- Handle errors with try/catch and user-friendly messages
- Validate all inputs
- Use const/let, never var
- Use modern JS: optional chaining, nullish coalescing, destructuring
- Clean naming: descriptive variables, verbs for functions
- DRY: extract repeated logic into functions
- Comment complex logic, but don't over-comment obvious code
</code-quality>

<bot-development>
DISCORD BOT (discord.js v14+):
- Slash commands with proper registration
- Intents configuration (GatewayIntentBits)
- Embeds with colors, thumbnails, fields
- Error handling + graceful shutdown (SIGINT/SIGTERM)
- Token: Discord Developer Portal → Bot → Token
- Hosting: Railway, Render, or any Node.js host
- Include package.json with dependencies

TELEGRAM BOT (grammy or node-telegram-bot-api):
- Inline keyboards with callback queries
- File/photo handling
- Webhook or polling mode
- Token: @BotFather → /newbot
- Include complete setup instructions
</bot-development>

<editing-rules>
When the user asks to change/fix/add/remove anything in their project:
1. Find the relevant files in [CURRENT PROJECT FILES]
2. Apply ONLY the requested changes
3. Preserve ALL existing functionality
4. Output the COMPLETE updated file(s)
5. Briefly explain what changed and why
</editing-rules>

<conversation-style>
- Be concise. Brief explanations, detailed code.
- Use markdown: headers, bullet points, code blocks.
- For pure conversation (no code needed): respond naturally without ===FILE: blocks.
- Be encouraging and helpful. Teach while building.
- When unsure about requirements, ask clarifying questions BEFORE coding.
</conversation-style>

<action-cards>
When a feature requires backend capabilities not yet approved, output at the END of your response:
===ACTION: auth | Enable Authentication | Secure user login and signup===
===ACTION: database | Enable Database | Persistent data storage===
===ACTION: storage | Enable File Storage | File upload and management===
===ACTION: backend | Enable Backend | Server-side processing===
===ACTION: api_key | Add API Key | External API key required===

If a capability is listed in [APPROVED PROJECT CAPABILITIES], do NOT request it again.
</action-cards>

<safety>
Refuse requests for malware, phishing, hacking tools, or any harmful code.
</safety>`;

// ─── MODE OVERLAYS ────────────────────────────────────────────────────────────
const MODES: Record<string, string> = {
  all: `\n<mode>AUTO-DETECT: If the user is chatting → respond conversationally. If requesting code → generate complete working code. If sharing an image → analyze it thoroughly.</mode>`,
  "vibe-code": `\n<mode>CODE MODE: Generate code immediately. Brief explanation then complete code. Always use ===FILE: format.</mode>`,
  chat: `\n<mode>CHAT MODE: Respond conversationally. Do NOT output ===FILE: blocks unless explicitly asked.</mode>`,
  explain: `\n<mode>EXPLAIN MODE: Break down code section by section. Use analogies. Highlight potential issues.</mode>`,
  review: `\n<mode>REVIEW MODE: Evaluate correctness, performance, security, readability. Format: Summary → Issues → Suggestions → Rating (1-10).</mode>`,
  debug: `\n<mode>DEBUG MODE: Think step-by-step about root cause. Identify WHY. Provide exact fix with complete updated file. List causes by likelihood.</mode>`,
};

const PERSONAS: Record<string, string> = {
  default: "",
  "senior-dev": `\n<persona>Senior Engineer: 15+ years. Clean architecture, SOLID, design patterns, performance, security.</persona>`,
  designer: `\n<persona>UI/UX Designer: Pixel-perfect, micro-interactions, color theory, typography, delightful UX.</persona>`,
  tutor: `\n<persona>Coding Tutor: Patient, step-by-step, analogies, detailed comments. Explain WHY, not just HOW.</persona>`,
  startup: `\n<persona>Startup CTO: Ship fast, MVP-first, pragmatic, iterate quickly.</persona>`,
  creative: `\n<persona>Creative Coder: Generative art, shaders, particles, creative coding, wow-factor.</persona>`,
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function buildSystemPrompt(mode: string, persona: string, approvedActions: string[]): string {
  const modePrompt = MODES[mode] || MODES.all;
  const personaPrompt = PERSONAS[persona] || "";
  const approved = approvedActions.length > 0 ? approvedActions.join(", ") : "none";
  return `${SYSTEM}${personaPrompt}${modePrompt}\n\n<approved-capabilities>${approved}</approved-capabilities>`;
}

function buildGeminiContents(messages: any[]) {
  return messages.map((msg: any) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: Array.isArray(msg.content)
      ? msg.content.map((p: any) => {
          if (p.type === "image_url") {
            const url: string = p.image_url?.url || "";
            const m = url.match(/^data:([^;]+);base64,(.+)$/);
            if (m) return { inline_data: { mime_type: m[1], data: m[2] } };
            return { text: `[Image: ${url.slice(0, 100)}]` };
          }
          return { text: p.text || "" };
        })
      : [{ text: msg.content }],
  }));
}

function buildOpenAIMessages(systemPrompt: string, messages: any[]) {
  const out: any[] = [{ role: "system", content: systemPrompt }];
  for (const msg of messages) {
    if (Array.isArray(msg.content)) {
      out.push({
        role: msg.role,
        content: msg.content.map((p: any) => {
          if (p.type === "image_url") return { type: "image_url", image_url: { url: p.image_url?.url || "" } };
          return { type: "text", text: p.text || "" };
        }),
      });
    } else {
      out.push({ role: msg.role, content: msg.content });
    }
  }
  return out;
}

function transformGeminiSSE(response: Response): Response {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const enc = new TextEncoder();

  (async () => {
    const reader = response.body!.getReader();
    const dec = new TextDecoder();
    let buf = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (!json || json === "[DONE]") continue;
          try {
            const p = JSON.parse(json);
            const text = p.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              await writer.write(enc.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`));
            }
          } catch { /* partial */ }
        }
      }
      await writer.write(enc.encode("data: [DONE]\n\n"));
    } catch (e) { console.error("Stream error:", e); }
    finally { writer.close(); }
  })();

  return new Response(readable, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
}

function errorResponse(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode = "all", persona = "default", approvedActions = [] } = await req.json();
    const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!GEMINI_KEY && !LOVABLE_KEY) return errorResponse(500, "No AI API key configured");
    if (!messages?.length) return errorResponse(400, "Messages array is required");

    const systemPrompt = buildSystemPrompt(mode, persona,
      Array.isArray(approvedActions) ? approvedActions.filter((a: string) =>
        ["backend", "database", "storage", "api_key", "auth"].includes(a)) : []);

    const recent = messages.slice(-50);
    const temp = mode === "creative" || persona === "creative" ? 0.9 : 0.7;

    // ── Try Gemini (user's own key) ──
    if (GEMINI_KEY) {
      const contents = buildGeminiContents(recent);
      let geminiResp: Response | null = null;

      for (const model of ["gemini-2.5-pro-preview-05-06", "gemini-2.5-flash-preview-05-20", "gemini-2.5-flash"]) {
        geminiResp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${GEMINI_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemPrompt }] },
              contents,
              generationConfig: { temperature: temp, maxOutputTokens: 65536 },
            }),
          }
        );
        if (geminiResp.ok) break;
        if (geminiResp.status !== 404) break;
      }

      if (geminiResp?.ok) return transformGeminiSSE(geminiResp);

      if (!LOVABLE_KEY) {
        const status = geminiResp?.status || 500;
        if (status === 429) return errorResponse(429, "Rate limited. Please wait and try again.");
        return errorResponse(500, "AI service error. Please try again.");
      }
    }

    // ── Lovable AI Gateway fallback ──
    if (LOVABLE_KEY) {
      const gatewayMessages = buildOpenAIMessages(systemPrompt, recent);
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-2.5-pro", messages: gatewayMessages, stream: true }),
      });

      if (!resp.ok) {
        if (resp.status === 429) return errorResponse(429, "Rate limited. Please wait a moment.");
        if (resp.status === 402) return errorResponse(402, "Usage limit reached.");
        console.error("Lovable AI error:", resp.status, await resp.text().catch(() => ""));
        return errorResponse(500, "AI service error.");
      }

      return new Response(resp.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    return errorResponse(500, "No AI service available");
  } catch (e) {
    console.error("chat error:", e);
    return errorResponse(500, e instanceof Error ? e.message : "Unknown error");
  }
});
