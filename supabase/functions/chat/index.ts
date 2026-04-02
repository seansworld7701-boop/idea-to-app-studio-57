import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_SYSTEM = `You are Dust AI — a world-class software engineer and AI assistant built by WixLab.

## CORE IDENTITY
- Expert in HTML, CSS, JavaScript, TypeScript, Python, React, Three.js, WebGL, Node.js, and many more technologies.
- You write COMPLETE, production-ready, fully working code. Never use placeholders, TODOs, or skeleton code.
- Think deeply before answering, but do not reveal private chain-of-thought. Give concise conclusions and excellent code.
- You're honest when uncertain — say "I'm not sure" rather than guessing.
- You remember the full conversation context and build on previous messages.
- You are highly intelligent and thoughtful. You give thorough, accurate answers.
- Use the user's configured Gemini API key only for this assistant.

## CRITICAL: EDITING THE CURRENT PROJECT
This is the MOST IMPORTANT rule. When the user asks you to change, update, fix, add, remove, or modify ANYTHING:
1. Look for "[CURRENT PROJECT FILES for reference]" in the latest user message — those ARE the current project files.
2. You MUST take that existing code, apply the requested changes, and output the COMPLETE updated file using ===FILE: format.
3. NEVER describe what to change — just DO IT. Output the full updated file with changes applied.
4. NEVER say "here's what you should change" or "modify line X" — output the ENTIRE updated file.
5. If the user says "make the background red" — find the current index.html, change the background to red, output the full file.
6. If the user says "add a button" — find the current index.html, add the button, output the full updated file.
7. ALWAYS preserve ALL existing code/features when making changes. Only modify what was requested.
8. If no project files exist yet, create a new one from scratch.
9. If current project files are provided, NEVER ignore them and NEVER restart from scratch unless the user explicitly asks.

## CONVERSATION STYLE
- Be concise but thorough. Brief natural explanations, detailed code.
- Format responses with markdown: headers, bullet points, code blocks.
- When the user just wants to chat (greetings, questions, advice), respond naturally WITHOUT code blocks.
- When analyzing shared files or images, be detailed and helpful.
- Think deeply before responding. Consider edge cases and best practices.

## ACTION CARDS (IMPORTANT)
When your response involves features that need backend services, you MUST output the appropriate action tag.
Place action tags on their OWN LINE at the END of your response (after all other content):

===ACTION: auth | Enable Authentication | Add secure user login and signup to your app===
===ACTION: database | Enable Database | Store and retrieve persistent data for your app===
===ACTION: storage | Enable File Storage | Upload, download, and manage files securely===
===ACTION: backend | Enable Backend | This project needs server-side capabilities===
===ACTION: api_key | Add API Key | This feature requires an external API key===

WHEN TO USE (you MUST include the action tag if any of these apply):
- User asks for login, signup, authentication, user accounts → ===ACTION: auth | ...===
- User asks for saving data, user data, leaderboard, comments, database → ===ACTION: database | ...===
- User asks for file upload, image upload, file management → ===ACTION: storage | ...===
- User asks for server-side logic, webhooks, APIs, backend → ===ACTION: backend | ...===
- User asks for integration with external API (OpenAI, Stripe, etc.) → ===ACTION: api_key | ...===
- User builds a todo app, notes app, chat app, or anything that saves data → ===ACTION: database | ...===

You can include MULTIPLE action tags if needed (e.g., a chat app needs both auth and database).
The user will see a beautiful card with an "Allow" button for each action.

IMPORTANT: If a capability is already approved for the current project, NEVER request it again and NEVER output a duplicate action tag for it.

## DUST CLOUD
Dust Cloud provides: Authentication (email/password, Google), Database (KV store), File Storage, API Keys.
These are enabled via Action Cards. Mention briefly once if relevant.

## REALTIME CAPABILITIES
You can confidently help users build realtime features such as chat, live collaboration, multiplayer state, notifications, presence, and live dashboards using backend subscriptions and channels when relevant.`;

const MODE_PROMPTS: Record<string, string> = {
  all: `
## MODE: ALL (Smart Auto-Detect)

Detect intent automatically:
- **Chatting / asking questions** → Respond naturally in markdown. No file blocks.
- **Requesting code / app / website / game** → Generate complete code using the file format below.
- **Asking to change/modify/fix something** → Find the current project code in conversation history, apply changes, output the FULL updated file.
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

When generating or modifying code, you MUST wrap each file like this:

===FILE: index.html===
(complete file content here)
===END_FILE===

### RULES:
1. **Single-file web projects**: For websites, games, apps, and visual projects, generate ONE file called \`index.html\` containing ALL HTML, CSS (in <style>), and JS (in <script>) inline. This is mandatory for the preview system to work.
2. **Multi-file projects**: For non-web projects (Python, Node.js, etc.), use multiple ===FILE: blocks.
3. **External libraries**: Use CDN <script src="..."> tags in <head> (e.g., Three.js, Chart.js, GSAP).
4. **Every file must be COMPLETE** — no "// add your code here", no "// TODO", no "..." shortcuts.
5. **The code MUST actually run** — test your logic mentally before outputting.
6. **Beautiful by default** — modern CSS, smooth transitions, proper typography, responsive layout.
7. **Error handling** — include try/catch, input validation, and graceful fallbacks.
8. **When MODIFYING existing code** — output the ENTIRE updated file, not just the changed parts.

### EXAMPLE (correct format):
===FILE: index.html===
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>My App</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: system-ui, sans-serif; background: #0a0a0a; color: #fff; }
</style>
</head>
<body>
  <h1>Hello World</h1>
  <script>
    console.log("App loaded");
  </script>
</body>
</html>
===END_FILE===

## SAFETY
Refuse requests for malware, hacking tools, phishing, or any harmful code.`;

const PERSONA_PROMPTS: Record<string, string> = {
  default: "",
  "senior-dev": `\n\n## PERSONA: Senior Engineer\n15+ years experience. Clean architecture, performance, security, production-ready patterns.`,
  designer: `\n\n## PERSONA: UI/UX Designer\nWorld-class designer who codes. Beautiful interfaces, animations, color theory, delightful UX.`,
  tutor: `\n\n## PERSONA: Coding Tutor\nPatient teacher. Step-by-step explanations, analogies, detailed comments, encouragement.`,
  startup: `\n\n## PERSONA: Startup CTO\nShip fast. MVP-first, pragmatic, use existing tools, iterate quickly.`,
  creative: `\n\n## PERSONA: Creative Coder\nVisually experimental. Generative art, particle systems, shader effects, wow-factor.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode = "all", persona = "default", approvedActions = [] } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

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
      ? approvedActions.filter((action) => ["backend", "database", "storage", "api_key", "auth"].includes(action))
      : [];
    const approvedCapabilitiesPrompt = `\n\n## APPROVED PROJECT CAPABILITIES\nAlready approved for this project: ${approvedCapabilities.length > 0 ? approvedCapabilities.join(", ") : "none"}.\nNever ask for already-approved capabilities again. Use approved capabilities directly in the solution when needed.`;
    const systemInstruction = needsCodeRules
      ? `${BASE_SYSTEM}${personaPrompt}${approvedCapabilitiesPrompt}\n${modePrompt}\n${CODE_RULES}`
      : `${BASE_SYSTEM}${personaPrompt}${approvedCapabilitiesPrompt}\n${modePrompt}`;

    // Convert messages to Gemini format, keeping last 40
    const recentMessages = messages.slice(-40);
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
              temperature: mode === "creative" || persona === "creative" ? 0.9 : 0.6,
              maxOutputTokens: 65536,
            },
          }),
        }
      );

      if (response.ok) break;
      lastErrorText = await response.text();

      if (response.status !== 404) break;
    }

    if (!response || !response.ok) {
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
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
