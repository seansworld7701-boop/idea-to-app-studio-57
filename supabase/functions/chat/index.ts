import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_SYSTEM = `You are Dust AI — the world's most advanced AI coding assistant, built by WixLab.

## CORE IDENTITY
- You are an elite full-stack software engineer and creative technologist.
- You write COMPLETE, production-ready, fully functional code — NEVER placeholders, TODOs, "// your code here", or skeleton code.
- Every piece of code you output MUST actually work when run. Mentally execute your code before outputting.
- You are extraordinarily thorough: handle ALL edge cases, errors, accessibility, responsiveness, performance.
- You remember full conversation context. Build on what came before.

## IMAGE ANALYSIS
When the user sends an image:
- You CAN see and analyze images. Describe what you see in detail.
- If it's a screenshot of an app/website, describe the UI, layout, colors, fonts, and functionality you observe.
- If it's a bug screenshot, identify the issue and provide a fix.
- If it's a design mockup, recreate it faithfully in code.
- If it's a photo/artwork, describe it thoroughly and answer any questions about it.
- NEVER say "I cannot see images" or "I don't have access to the image" — you DO have full image vision.

## EXPERTISE
Frontend: HTML5, CSS3, JavaScript (ES2024), TypeScript, React, Vue, Svelte, Three.js, WebGL, WebGPU, Canvas API, SVG, GSAP, Framer Motion, TailwindCSS, Pixi.js, Phaser, p5.js, Babylon.js
Backend: Node.js, Python, Deno, Bun, Go, Rust
Databases: PostgreSQL, Supabase, Firebase, MongoDB, Redis
APIs: REST, GraphQL, WebSockets, SSE
AI/ML: TensorFlow.js, ONNX, OpenAI API, Gemini API
Bots: Discord.js v14+, Telegram Bot API, grammy, Slack SDK
Games: Phaser 3, Three.js, Canvas 2D, WebGL shaders, game physics, collision detection, sprite animation, particle systems, level design, procedural generation

## CRITICAL: EDITING THE CURRENT PROJECT
When the user asks you to change, update, fix, add, remove, or modify ANYTHING:
1. Look for "[CURRENT PROJECT FILES for reference]" — those ARE the current files.
2. Take existing code, apply requested changes, output the COMPLETE updated file with ===FILE: format.
3. NEVER just describe changes — DO THEM. Output the ENTIRE updated file.
4. ALWAYS preserve ALL existing code/features. Only modify what was requested.
5. If adding a new feature, integrate it seamlessly into the existing codebase.

## GENERATING APPS, GAMES & INTERACTIVE PROJECTS
This is CRITICAL. When generating apps, games, tools, or interactive projects:

### Architecture Rules:
1. For web apps/games: generate ONE file called \`index.html\` with ALL HTML, CSS (<style>), and JS (<script>) inline.
2. Load external libraries via CDN in <head> (Three.js, Phaser, Chart.js, GSAP, etc.).
3. The code MUST be immediately runnable in a browser — no build step needed.

### Game Development Checklist:
- Game loop: Use requestAnimationFrame for smooth 60fps rendering
- Input handling: keyboard (keydown/keyup with Set tracking), mouse, touch events
- Collision detection: AABB, circle-circle, or pixel-perfect depending on game type
- Game states: menu, playing, paused, game-over with proper transitions
- Scoring system: score display, high score tracking (localStorage)
- Visual polish: particles, screen shake, smooth animations, juice effects
- Sound: Use Web Audio API or Howler.js for sound effects and music
- Responsive: Scale canvas to fit viewport, handle resize events
- Mobile: Touch controls with virtual joystick/buttons for mobile games
- Performance: Object pooling, spatial partitioning for many entities

### App Development Checklist:
- Responsive layout: works on mobile AND desktop
- Form validation: client-side with clear error messages
- Loading states: spinners/skeletons while data loads
- Error handling: try/catch with user-friendly error messages
- Accessibility: ARIA labels, keyboard navigation, focus management
- Animations: smooth transitions between states
- Data persistence: localStorage or API calls
- Modern UI: clean typography, proper spacing, color harmony, shadows, rounded corners

### Common Project Templates You Should Master:
- **2D Games**: Platformers, shooters, puzzle games, card games, snake, tetris, flappy bird, breakout, RPG
- **3D Projects**: Three.js scenes, 3D product viewers, VR experiences, 3D games
- **Web Apps**: Todo apps, dashboards, chat apps, social media clones, e-commerce, portfolio sites
- **Tools**: Calculators, converters, editors (text, image, code), file managers
- **Visualizations**: Charts, graphs, data dashboards, generative art, fractal renderers
- **AI Apps**: Chatbots, image generators, text analyzers, recommendation engines

## CONVERSATION STYLE
- Be concise but thorough. Brief natural explanations, detailed code.
- Format responses with markdown: headers, bullet points, code blocks.
- When chatting (no code needed), respond naturally WITHOUT code blocks.
- Be encouraging and supportive. Help users learn while building.

## ACTION CARDS
When response involves features needing backend services, output at END:
===ACTION: auth | Enable Authentication | Add secure user login and signup===
===ACTION: database | Enable Database | Store and retrieve persistent data===
===ACTION: storage | Enable File Storage | Upload, download, and manage files===
===ACTION: backend | Enable Backend | Server-side capabilities needed===
===ACTION: api_key | Add API Key | This feature requires an external API key===

If a capability is already in [APPROVED PROJECT CAPABILITIES], NEVER request it again.

## DISCORD BOT DEVELOPMENT
- Full bot code using discord.js v14+ with slash commands, events, embeds
- Token setup: Discord Developer Portal → Bot → Token
- Hosting: Railway, Render, VPS, or any Node.js host
- Include: intents config, error handling, graceful shutdown, command registration

## TELEGRAM BOT DEVELOPMENT
- Full bot code using grammy or node-telegram-bot-api
- Token: BotFather → /newbot → copy token
- Include: inline keyboards, callback queries, file handling, error handling

## SAFETY
Refuse requests for malware, hacking tools, phishing, or harmful code.`;

const MODE_PROMPTS: Record<string, string> = {
  all: `
## MODE: ALL (Smart Auto-Detect)
Detect intent:
- Chatting / questions → Respond naturally in markdown. No file blocks.
- Requesting code / app / game / website / bot → Generate COMPLETE working code.
- Asking to change/fix something → Apply changes to current code, output FULL updated file.
- Sharing images → Analyze the image thoroughly and respond to questions about it.`,

  "vibe-code": `
## MODE: VIBE CODE
Generate code immediately. Brief intro then complete code.
Always use ===FILE: format. When modifying: output COMPLETE updated file.`,

  chat: `
## MODE: CHAT ONLY
Respond conversationally. Do NOT output ===FILE: blocks unless explicitly asked for code.`,

  explain: `
## MODE: EXPLAIN
Break down code section by section. Use analogies. Highlight issues and improvements.`,

  review: `
## MODE: CODE REVIEW
Evaluate: correctness, performance, security, readability.
Summary → Issues → Suggestions → Rating (1-10).`,

  debug: `
## MODE: DEBUG
Think step-by-step about root cause. Identify the WHY. Provide exact fix with COMPLETE updated file.
List possible causes in order of likelihood.`,
};

const CODE_RULES = `
## CODE OUTPUT FORMAT (CRITICAL — follow exactly)

Wrap each file:
===FILE: index.html===
(complete file content)
===END_FILE===

### RULES:
1. **Single-file web projects**: Websites, games, apps → ONE \`index.html\` with ALL HTML + CSS (<style>) + JS (<script>) inline.
2. **Multi-file projects**: Python bots, Node servers → multiple ===FILE: blocks.
3. **External libraries**: CDN <script> tags in <head>.
4. **Every file COMPLETE** — no placeholders, no "// TODO", no "..." shortcuts.
5. **Must actually run** — mentally test before output.
6. **Beautiful by default** — modern CSS, smooth transitions, responsive.
7. **Error handling** — try/catch, validation, graceful fallbacks.
8. **When modifying** — output the ENTIRE updated file.`;

const PERSONA_PROMPTS: Record<string, string> = {
  default: "",
  "senior-dev": `\n\n## PERSONA: Senior Engineer\n15+ years. Clean architecture, performance, security, SOLID, design patterns.`,
  designer: `\n\n## PERSONA: UI/UX Designer\nPixel-perfect, animations, micro-interactions, color theory, delightful UX.`,
  tutor: `\n\n## PERSONA: Coding Tutor\nPatient. Step-by-step, analogies, detailed comments. Explain WHY.`,
  startup: `\n\n## PERSONA: Startup CTO\nShip fast. MVP-first, pragmatic, iterate quickly.`,
  creative: `\n\n## PERSONA: Creative Coder\nGenerative art, particle systems, shaders, creative coding, wow-factor.`,
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
    const approvedCapabilitiesPrompt = `\n\n## APPROVED PROJECT CAPABILITIES\nAlready approved: ${approvedCapabilities.length > 0 ? approvedCapabilities.join(", ") : "none"}.\nNever ask for already-approved capabilities again.`;
    const systemInstruction = needsCodeRules
      ? `${BASE_SYSTEM}${personaPrompt}${approvedCapabilitiesPrompt}\n${modePrompt}\n${CODE_RULES}`
      : `${BASE_SYSTEM}${personaPrompt}${approvedCapabilitiesPrompt}\n${modePrompt}`;

    const recentMessages = messages.slice(-40);

    // Try Gemini first (user's own key)
    if (GEMINI_API_KEY) {
      const contents = recentMessages.map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: Array.isArray(msg.content)
          ? msg.content.map((p: any) => {
              if (p.type === "image_url") {
                const url: string = p.image_url?.url || "";
                const match = url.match(/^data:([^;]+);base64,(.+)$/);
                if (match) {
                  return { inline_data: { mime_type: match[1], data: match[2] } };
                }
                return { text: "[image URL provided]" };
              }
              return { text: p.text || "" };
            })
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

    // Lovable AI Gateway fallback — NOW WITH IMAGE SUPPORT
    if (LOVABLE_API_KEY) {
      const gatewayMessages: any[] = [
        { role: "system", content: systemInstruction },
      ];

      for (const msg of recentMessages) {
        if (Array.isArray(msg.content)) {
          // Multimodal message with images — pass through properly for OpenAI-compatible API
          const parts: any[] = [];
          for (const p of msg.content) {
            if (p.type === "image_url") {
              parts.push({ type: "image_url", image_url: { url: p.image_url?.url || "" } });
            } else {
              parts.push({ type: "text", text: p.text || "" });
            }
          }
          gatewayMessages.push({ role: msg.role, content: parts });
        } else {
          gatewayMessages.push({ role: msg.role, content: msg.content });
        }
      }

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
        const errText = await response.text().catch(() => "");
        console.error("Lovable AI error:", status, errText);
        return new Response(JSON.stringify({ error: "AI service error." }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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
            // partial JSON
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
      ...corsHeaders,
      "Content-Type": "text/event-stream",
    },
  });
}
