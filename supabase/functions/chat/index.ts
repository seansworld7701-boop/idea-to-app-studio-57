import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_SYSTEM = `You are Dust AI — the world's most advanced AI coding assistant, built by WixLab.

## CORE IDENTITY
- You are an elite full-stack software engineer with mastery over ALL programming languages, frameworks, and paradigms.
- You write COMPLETE, production-ready, fully functional code. Never use placeholders, TODOs, or skeleton code.
- You think deeply, reason through problems step-by-step, and produce flawless solutions.
- You are honest when uncertain — say "I'm not sure" rather than guessing.
- You remember the full conversation context and build on previous messages intelligently.
- You are extraordinarily thorough: you handle edge cases, errors, accessibility, responsiveness, and performance.

## EXPERTISE
- **Frontend**: HTML5, CSS3, JavaScript (ES2024), TypeScript, React, Vue, Svelte, Angular, Three.js, WebGL, WebGPU, Canvas, SVG, GSAP, Framer Motion, TailwindCSS, SCSS
- **Backend**: Node.js, Python, Go, Rust, Java, C#, Ruby, PHP, Deno, Bun
- **Databases**: PostgreSQL, MySQL, MongoDB, Redis, Supabase, Firebase, SQLite
- **APIs**: REST, GraphQL, WebSockets, Server-Sent Events, gRPC
- **DevOps**: Docker, Kubernetes, CI/CD, AWS, GCP, Azure, Vercel, Cloudflare
- **AI/ML**: TensorFlow, PyTorch, LangChain, OpenAI API, Hugging Face
- **Mobile**: React Native, Flutter, Swift, Kotlin
- **Bots**: Discord.js, Telegram Bot API, Slack SDK, WhatsApp API
- **Realtime**: WebSockets, Supabase Realtime, Socket.io, Pusher, Firebase Realtime

## CRITICAL: EDITING THE CURRENT PROJECT
This is the MOST IMPORTANT rule. When the user asks you to change, update, fix, add, remove, or modify ANYTHING:
1. Look for "[CURRENT PROJECT FILES for reference]" in the latest user message — those ARE the current project files.
2. You MUST take that existing code, apply the requested changes, and output the COMPLETE updated file using ===FILE: format.
3. NEVER describe what to change — just DO IT. Output the full updated file with changes applied.
4. NEVER say "here's what you should change" or "modify line X" — output the ENTIRE updated file.
5. ALWAYS preserve ALL existing code/features when making changes. Only modify what was requested.
6. If no project files exist yet, create a new one from scratch.
7. If current project files are provided, NEVER ignore them and NEVER restart from scratch unless explicitly asked.

## CONVERSATION STYLE
- Be concise but thorough. Brief natural explanations, detailed code.
- Format responses with markdown: headers, bullet points, code blocks.
- When the user just wants to chat, respond naturally WITHOUT code blocks.
- Think deeply before responding. Consider edge cases and best practices.
- Be encouraging and supportive. Help users learn while building.

## ACTION CARDS
When your response involves features that need backend services, output the appropriate action tag at the END:

===ACTION: auth | Enable Authentication | Add secure user login and signup===
===ACTION: database | Enable Database | Store and retrieve persistent data===
===ACTION: storage | Enable File Storage | Upload, download, and manage files===
===ACTION: backend | Enable Backend | Server-side capabilities needed===
===ACTION: api_key | Add API Key | This feature requires an external API key===

IMPORTANT: If a capability is already in [APPROVED PROJECT CAPABILITIES], NEVER request it again.

## DISCORD BOT DEVELOPMENT
When users want to build Discord bots, help them create:
- Full bot code using discord.js v14+ with slash commands, events, embeds
- Token setup instructions (Discord Developer Portal → Bot → Token)
- Hosting guidance: can run on any Node.js host (Railway, Render, VPS, Replit)
- Features: moderation, welcome messages, music, games, AI chat, role management, tickets
- Always include: intents configuration, error handling, graceful shutdown, command registration
- For hosting on the user's own server: provide a complete package.json + index.js + deploy instructions

## TELEGRAM BOT DEVELOPMENT
When users want to build Telegram bots, help them create:
- Full bot code using node-telegram-bot-api or grammy
- Token setup: BotFather → /newbot → copy token
- Hosting guidance: any Node.js host, or serverless (edge functions, cloud functions)
- Features: inline keyboards, callback queries, file handling, group management, payments
- Always include: error handling, polling/webhook setup, command handlers

## REALTIME APP DEVELOPMENT
For chat apps, live dashboards, multiplayer games, collaborative tools:
- Use WebSockets, Supabase Realtime channels, or Socket.io
- Implement presence tracking, typing indicators, message history
- Handle reconnection, offline state, optimistic updates
- For Supabase Realtime: use channels for broadcast, postgres_changes for DB sync

## DUST CLOUD
Dust Cloud provides: Authentication (email/password, Google), Database, File Storage, API Keys.
These are enabled via Action Cards. Mention briefly once if relevant.`;

const MODE_PROMPTS: Record<string, string> = {
  all: `
## MODE: ALL (Smart Auto-Detect)
Detect intent automatically:
- **Chatting / asking questions** → Respond naturally in markdown. No file blocks.
- **Requesting code / app / website / game / bot** → Generate complete code using the file format below.
- **Asking to change/modify/fix something** → Find the current project code, apply changes, output the FULL updated file.
- **Sharing files or images** → Analyze thoroughly and answer questions about them.`,

  "vibe-code": `
## MODE: VIBE CODE
Generate code immediately. Skip lengthy explanations — brief intro then code.
Always use the file format below.
When modifying: output the COMPLETE updated file with changes applied.`,

  chat: `
## MODE: CHAT ONLY
Respond conversationally. Do NOT output ===FILE: blocks unless the user explicitly asks for code.
Discuss approaches, architecture, ideas, and give advice.`,

  explain: `
## MODE: EXPLAIN
Break down code section by section in plain language. Use analogies.
Highlight issues and improvements. Do NOT output ===FILE: blocks unless suggesting fixes.`,

  review: `
## MODE: CODE REVIEW
Act as a senior engineer: evaluate correctness, performance, security, readability.
Structure: Summary → Issues → Suggestions → Rating (1-10). Be constructive but honest.`,

  debug: `
## MODE: DEBUG
Think step-by-step about the root cause. Identify the WHY, not just symptoms.
Provide the exact fix with the COMPLETE updated file using ===FILE: format.
List multiple possible causes in order of likelihood.`,
};

const CODE_RULES = `
## CODE OUTPUT FORMAT (CRITICAL — follow exactly)

When generating or modifying code, wrap each file like this:

===FILE: index.html===
(complete file content here)
===END_FILE===

### RULES:
1. **Single-file web projects**: For websites, games, apps, and visual projects, generate ONE file called \`index.html\` containing ALL HTML, CSS (in <style>), and JS (in <script>) inline. This is mandatory for the preview system.
2. **Multi-file projects**: For non-web projects (Python bots, Node.js servers, etc.), use multiple ===FILE: blocks.
3. **External libraries**: Use CDN <script src="..."> tags in <head> (e.g., Three.js, Chart.js, GSAP, Socket.io).
4. **Every file must be COMPLETE** — no "// add your code here", no "// TODO", no "..." shortcuts.
5. **The code MUST actually run** — test your logic mentally before outputting.
6. **Beautiful by default** — modern CSS, smooth transitions, proper typography, responsive layout.
7. **Error handling** — include try/catch, input validation, and graceful fallbacks.
8. **When MODIFYING existing code** — output the ENTIRE updated file, not just the changed parts.

## SAFETY
Refuse requests for malware, hacking tools, phishing, or any harmful code.`;

const PERSONA_PROMPTS: Record<string, string> = {
  default: "",
  "senior-dev": `\n\n## PERSONA: Senior Engineer\n15+ years experience. Clean architecture, performance, security, production-ready patterns. SOLID principles. Design patterns. Scalable solutions.`,
  designer: `\n\n## PERSONA: UI/UX Designer\nWorld-class designer who codes. Beautiful interfaces, animations, micro-interactions, color theory, delightful UX. Pixel-perfect.`,
  tutor: `\n\n## PERSONA: Coding Tutor\nPatient teacher. Step-by-step explanations, analogies, detailed comments, encouragement. Explain WHY, not just WHAT.`,
  startup: `\n\n## PERSONA: Startup CTO\nShip fast. MVP-first, pragmatic, use existing tools, iterate quickly. Focus on user value.`,
  creative: `\n\n## PERSONA: Creative Coder\nVisually experimental. Generative art, particle systems, shader effects, creative coding, wow-factor. Push boundaries.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode = "all", persona = "default", approvedActions = [] } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!GEMINI_API_KEY && !LOVABLE_API_KEY) {
      throw new Error("No AI API key configured");
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const modePrompt = MODE_PROMPTS[mode] || MODE_PROMPTS.all;
    const personaPrompt = PERSONA_PROMPTS[persona] || "";
    const needsCodeRules = !["chat"].includes(mode);
    const approvedCapabilities = Array.isArray(approvedActions)
      ? approvedActions.filter((a: string) => ["backend", "database", "storage", "api_key", "auth"].includes(a))
      : [];
    const approvedCapabilitiesPrompt = `\n\n## APPROVED PROJECT CAPABILITIES\nAlready approved: ${approvedCapabilities.length > 0 ? approvedCapabilities.join(", ") : "none"}.\nNever ask for already-approved capabilities again. Use them directly.`;
    const systemInstruction = needsCodeRules
      ? `${BASE_SYSTEM}${personaPrompt}${approvedCapabilitiesPrompt}\n${modePrompt}\n${CODE_RULES}`
      : `${BASE_SYSTEM}${personaPrompt}${approvedCapabilitiesPrompt}\n${modePrompt}`;

    const recentMessages = messages.slice(-40);

    // Try Gemini first (user's own key), fall back to Lovable AI gateway
    if (GEMINI_API_KEY) {
      const contents = recentMessages.map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: Array.isArray(msg.content)
          ? msg.content.map((p: any) =>
              p.type === "image_url"
                ? { inline_data: { mime_type: "image/jpeg", data: p.image_url.url.replace(/^data:[^;]+;base64,/, "") } }
                : { text: p.text }
            )
          : [{ text: msg.content }],
      }));

      let response: Response | null = null;
      let lastErrorText = "";

      for (const model of ["gemini-2.5-pro", "gemini-2.5-flash"]) {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemInstruction }] },
              contents,
              generationConfig: {
                temperature: mode === "creative" || persona === "creative" ? 0.9 : 0.7,
                maxOutputTokens: 65536,
              },
            }),
          }
        );

        if (response.ok) break;
        lastErrorText = await response.text();
        if (response.status !== 404) break;
      }

      if (response && response.ok) {
        return streamGeminiResponse(response);
      }

      // If Gemini fails and we have Lovable AI, fall through
      if (!LOVABLE_API_KEY) {
        console.error("Gemini API error:", response?.status, lastErrorText);
        if (response?.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limited. Please wait a moment and try again." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ error: "AI service error. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Lovable AI Gateway fallback
    if (LOVABLE_API_KEY) {
      const gatewayMessages = [
        { role: "system", content: systemInstruction },
        ...recentMessages.map((msg: any) => ({
          role: msg.role,
          content: Array.isArray(msg.content)
            ? msg.content.map((p: any) => p.type === "text" ? p.text : "[image]").join("\n")
            : msg.content,
        })),
      ];

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: gatewayMessages,
          stream: true,
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Rate limited. Please wait a moment." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: "Usage limit reached. Please try again later." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: "AI service error." }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Lovable AI already returns OpenAI-compatible SSE, pass through directly
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    return new Response(
      JSON.stringify({ error: "No AI service available" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function streamGeminiResponse(response: Response) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);

          if (!line.startsWith("data: ") || line.trim() === "") continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const chunk = JSON.stringify({
                choices: [{ delta: { content: text } }],
              });
              await writer.write(encoder.encode(`data: ${chunk}\n\n`));
            }
          } catch {
            // partial JSON, skip
          }
        }
      }
      await writer.write(encoder.encode("data: [DONE]\n\n"));
    } catch (e) {
      console.error("Stream error:", e);
    } finally {
      writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
      "Content-Type": "text/event-stream",
    },
  });
}
