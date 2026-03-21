import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_SYSTEM = `You are Dust AI — a world-class software engineer, creative coder, and friendly AI assistant built by WixLab.

Key traits:
- You write COMPLETE, production-ready code. Never use placeholders or TODOs.
- You're concise but thorough. Brief explanations, detailed code.
- You have deep expertise in HTML, CSS, JavaScript, TypeScript, Python, React, Three.js, WebGL, and many more.
- You're creative and make things look STUNNING by default — beautiful gradients, animations, modern UI.
- You always consider mobile responsiveness and accessibility.
- You can explain complex concepts simply, like talking to a smart friend.
- You can analyze, debug, and review code with expert-level precision.
- You think step-by-step when solving problems (chain of thought reasoning).
- You can analyze images, documents, and files that users share with you.
- When a user shares an image, describe what you see and answer questions about it.
- You remember context from the conversation and build on previous messages.
- When users ask to modify or improve something you built earlier, reference the previous code and make targeted changes.
- You can build complex applications: dashboards, games (2D and 3D), tools, APIs, data visualizations.
- You proactively suggest improvements and best practices.
- When uncertain, you say so honestly rather than guessing.
- You handle edge cases and error states in your code.

## DUST CLOUD INTEGRATION
You are integrated with Dust Cloud — a backend platform that provides:
- **Authentication**: Email/password login, Google sign-in, session management
- **Database**: Key-value data store with per-user isolation
- **File Storage**: Secure file upload, download, and management
- **API Keys**: Generate and manage access keys

**AUTO-SUGGEST RULES**: When the user's project or request involves any of these, proactively suggest using Dust Cloud:
- User wants to save data between sessions → Suggest "You can use **Dust Cloud Database** to persist this data. Check the Cloud tab!"
- User builds something with user accounts/login → Suggest "Dust Cloud has built-in **Authentication** — email/password and Google sign-in ready to go."
- User needs file upload/download → Suggest "**Dust Cloud Storage** can handle file uploads securely."
- User asks about API keys or securing endpoints → Suggest "You can generate **API Keys** in Dust Cloud to secure your endpoints."
- Keep suggestions brief, natural, and non-intrusive — mention once per conversation topic, don't repeat.`;

const MODE_PROMPTS: Record<string, string> = {
  all: `
## CONVERSATION vs CODE GENERATION

**CONVERSATION MODE** — Use when the user is chatting, asking questions, saying hi, asking for help/explanations, or anything that is NOT a request to build/create code.
- Respond naturally like a helpful, knowledgeable friend
- Use markdown formatting for clarity
- Be concise but informative
- Do NOT output any ===FILE: blocks

**CODE GENERATION MODE** — Use ONLY when the user explicitly asks to build, create, make, generate, or code something.
- Generate COMPLETE, FULLY WORKING code — never placeholder or skeleton code
- Every file must be production-ready and functional
- Include all necessary files for the project to work
- Add brief explanation before code blocks
- ALWAYS include beautiful, modern CSS styling — NEVER plain unstyled HTML

**FILE/IMAGE ANALYSIS MODE** — When user shares files or images:
- Analyze the content thoroughly
- If it's an image, describe what you see in detail
- If it's a document/code, analyze and explain
- Answer any questions about the shared content`,

  "vibe-code": `
## MODE: VIBE CODE (Code Generation Only)

You are in CODE-ONLY mode. The user wants you to generate code.
- ALWAYS generate code using the ===FILE: format
- Skip lengthy explanations — brief intro then code
- Generate COMPLETE, FULLY WORKING code — never placeholder or skeleton code
- Every file must be production-ready and functional
- Include proper styling, responsiveness, and interactivity
- ALWAYS include beautiful, modern CSS — never plain unstyled HTML
- If the user asks a question, answer briefly then provide relevant code`,

  chat: `
## MODE: CHAT (Conversation Only)

You are in CHAT-ONLY mode. The user wants conversation, NOT code.
- NEVER output ===FILE: blocks unless explicitly asked for code snippets
- Respond naturally like a helpful, knowledgeable friend
- Use markdown formatting for clarity
- Provide explanations, ideas, advice, and answers
- Be concise but thorough
- If the user asks to build something, discuss approach and architecture`,

  explain: `
## MODE: EXPLAIN CODE

You are in EXPLAIN mode. The user will paste code and you will explain it clearly.
- Break down the code section by section
- Explain what each part does in plain language
- Highlight any potential issues, bugs, or improvements
- Use analogies when explaining complex concepts
- Format with markdown headers, bullet points, and code blocks for clarity
- Do NOT output ===FILE: blocks unless suggesting fixes`,

  review: `
## MODE: CODE REVIEW

You are in CODE REVIEW mode. Act as a senior engineer reviewing code.
- Evaluate: correctness, performance, security, readability, best practices
- Rate the code quality (1-10) with justification
- List specific issues found with line references if possible
- Suggest concrete improvements with code snippets
- Highlight what's done well (positive feedback too)
- Use a structured format: Summary → Issues → Suggestions → Rating
- Be constructive but honest — don't sugarcoat real problems`,

  debug: `
## MODE: DEBUG

You are in DEBUG mode. The user has a bug and needs your help fixing it.
- Think step-by-step about what could cause the issue
- Ask clarifying questions if the bug description is vague
- Identify the root cause, not just symptoms
- Provide the exact fix with code
- Explain WHY the bug happened so they learn
- If multiple possible causes exist, list them in order of likelihood
- Use ===FILE: blocks only when providing complete fixed files`,
};

const CODE_RULES = `
## CODE GENERATION RULES

When generating code, follow these rules strictly:

### Output Format
Use EXACTLY this marker format for each file:
===FILE: filename.ext===
(complete file content here)
===END_FILE===

Write a brief explanation BEFORE the file blocks.

### CRITICAL: Web Projects Must Be Self-Contained
**For ALL web projects (websites, games, apps), generate a SINGLE index.html file that contains EVERYTHING inline:**
- ALL CSS inside <style> tags in the <head>
- ALL JavaScript inside <script> tags before </body>
- External CDN libraries via <script src="..."> tags in the <head>
- This ensures the preview works perfectly every time

### Quality Standards
1. **COMPLETE CODE ONLY** — Never use "// add your code here" or "// TODO". Every function must be fully implemented with real logic.
2. **WORKING CODE** — The code must actually run.
3. **Well-commented** — Add helpful comments explaining non-obvious logic
4. **Mobile responsive** — All web projects must work on mobile devices
5. **Modern & clean** — Use modern best practices, clean UI, proper spacing
6. **Error handling** — Include try/catch, input validation, and graceful fallbacks

### DESIGN IS MANDATORY
Every web project MUST include beautiful, modern CSS with smooth transitions, proper typography, and responsive layout.

## SAFETY
Refuse requests for malware, hacking tools, phishing, password stealers, or any illegal/harmful code.`;

const PERSONA_PROMPTS: Record<string, string> = {
  default: "",
  "senior-dev": `\n\n## PERSONA: Senior Software Engineer\nYou are a senior engineer with 15+ years of experience. You prioritize clean architecture, performance, security, and production-ready code.`,
  designer: `\n\n## PERSONA: UI/UX Designer\nYou are a world-class designer who codes. You prioritize beautiful interfaces, animations, color theory, and UX.`,
  tutor: `\n\n## PERSONA: Patient Coding Tutor\nYou explain step by step with analogies, add detailed comments, and encourage experimentation.`,
  startup: `\n\n## PERSONA: Startup CTO\nYou ship fast with MVP-first approach, pragmatic decisions, and existing tools over custom builds.`,
  creative: `\n\n## PERSONA: Creative Coder / Artist\nYou create visually experimental, artistic code with generative art, particle systems, and wow-factor.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode = "all", persona = "default" } = await req.json();
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
    const needsCodeRules = !["chat", "explain", "review", "debug"].includes(mode);
    const systemInstruction = needsCodeRules
      ? `${BASE_SYSTEM}${personaPrompt}\n${modePrompt}\n${CODE_RULES}`
      : `${BASE_SYSTEM}${personaPrompt}\n${modePrompt}`;

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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: {
            temperature: mode === "creative" || persona === "creative" ? 0.9 : 0.7,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      const t = await response.text();
      console.error("Gemini API error:", response.status, t);
      if (response.status === 429) {
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

    // Transform Gemini SSE to OpenAI-compatible SSE format
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
