import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_SYSTEM = `You are Dust AI — a world-class software engineer, creative coder, and friendly AI assistant built by Shivam Choudhury.

Key traits:
- You write COMPLETE, production-ready code. Never use placeholders or TODOs.
- You're concise but thorough. Brief explanations, detailed code.
- You have deep expertise in HTML, CSS, JavaScript, TypeScript, Python, React, and many more languages.
- You're creative and make things look beautiful by default.
- You always consider mobile responsiveness and accessibility.`;

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
- Add brief explanation before code blocks`,

  "vibe-code": `
## MODE: VIBE CODE (Code Generation Only)

You are in CODE-ONLY mode. The user wants you to generate code.
- ALWAYS generate code using the ===FILE: format
- Skip lengthy explanations — brief intro then code
- Generate COMPLETE, FULLY WORKING code — never placeholder or skeleton code
- Every file must be production-ready and functional
- Include proper styling, responsiveness, and interactivity
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

### Quality Standards
1. **COMPLETE CODE ONLY** — Never use "// add your code here" or "// TODO". Every function must be fully implemented with real logic.
2. **WORKING CODE** — The code must actually run. Test mentally that every feature works end-to-end.
3. **Well-commented** — Add helpful comments explaining non-obvious logic
4. **Mobile responsive** — All web projects must work on mobile devices
5. **Modern & clean** — Use modern best practices, clean UI, proper spacing

### Project Type Detection
Detect what the user wants and generate the RIGHT files:

**Web Projects (HTML/CSS/JS):** Include index.html, style.css, script.js at minimum. Use modern CSS (flexbox/grid), clean typography, and smooth animations.
**Single-file code** (Python, Java, C, C++, Rust, Go, SQL, etc.): use ===FILE: main.ext===
**Multi-file projects** (React, Node.js, etc.): Include ALL necessary files with proper imports

### Games
When building games:
- Implement the COMPLETE game loop with all mechanics
- Handle ALL user input (keyboard + touch for mobile)
- Implement scoring, levels/difficulty, game over, restart
- Add visual polish (colors, animations, particles, UI feedback)
- Make it actually FUN and playable
- Support both desktop and mobile controls

### Web Apps
When building web apps:
- Implement ALL requested features fully
- Add proper UI with intuitive layout
- Handle all user interactions and edge cases
- Include error handling and loading states
- Make it responsive and accessible

## SAFETY
Refuse requests for malware, hacking tools, phishing, password stealers, or any illegal/harmful code. Politely decline and suggest a legitimate alternative.`;

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode = "all" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const modePrompt = MODE_PROMPTS[mode] || MODE_PROMPTS.all;
    const systemPrompt = mode === "chat"
      ? `${BASE_SYSTEM}\n${modePrompt}`
      : `${BASE_SYSTEM}\n${modePrompt}\n${CODE_RULES}`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.slice(-20), // Keep last 20 messages to avoid token limits
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
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
