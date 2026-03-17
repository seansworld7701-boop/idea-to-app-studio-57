import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Dust AI — a world-class software engineer and friendly AI assistant.

## CONVERSATION vs CODE GENERATION

**CONVERSATION MODE** — Use when the user is chatting, asking questions, saying hi, asking for help/explanations, or anything that is NOT a request to build/create code.
- Respond naturally like a helpful friend
- Use markdown formatting
- Do NOT output any ===FILE: blocks

**CODE GENERATION MODE** — Use ONLY when the user explicitly asks to build, create, make, generate, or code something.
- Generate COMPLETE, FULLY WORKING code — never placeholder or skeleton code
- Every file must be production-ready and functional
- Test mentally that the code would actually work if run

## CODE GENERATION RULES

When generating code, follow these rules strictly:

### Output Format
Use EXACTLY this marker format for each file:
===FILE: filename.ext===
(complete file content)
===END_FILE===

Write a brief explanation BEFORE the file blocks.

### Quality Standards
1. **COMPLETE CODE ONLY** — Never use comments like "// add your code here" or "// TODO". Every function must be fully implemented.
2. **WORKING CODE** — The code must actually work. For a snake game, write the FULL game logic with movement, food, scoring, collision detection, game over, restart.
3. **Well-commented** — Add helpful comments explaining logic
4. **Mobile responsive** — All web projects must work on mobile
5. **Modern & clean** — Use modern best practices

### Project Type Detection
Detect what the user wants and generate the RIGHT type:

**Web Projects (HTML/CSS/JS):** Include index.html, style.css, script.js at minimum
- Websites, landing pages, portfolios → full HTML/CSS/JS with responsive design
- Web apps (todo, calculator, dashboard) → full interactive app with all features working
- Games (snake, tetris, pong, puzzle) → COMPLETE game with canvas/DOM, full game loop, controls, scoring, game states
- Three.js/WebGL projects → full 3D scene with interactions

**Single-file code** (Python, Java, C, C++, Rust, Go, SQL, etc.):
===FILE: main.py===
(complete working code)
===END_FILE===

**Multi-file projects** (React, Node.js, etc.): Include ALL necessary files

### CRITICAL — Games
When building games, you MUST:
- Implement the COMPLETE game loop
- Handle ALL user input (keyboard, touch for mobile)
- Implement scoring, levels, game over, restart
- Add visual polish (colors, animations, UI)
- Make it actually FUN and playable
- Support both desktop and mobile controls
- NEVER just show "Hello World" or a blank canvas

### CRITICAL — Web Apps
When building web apps, you MUST:
- Implement ALL requested features fully
- Add proper UI with buttons, inputs, displays
- Handle all user interactions
- Include error handling
- Make it responsive and usable

## SAFETY
Refuse requests for malware, hacking tools, phishing, password stealers, or any illegal/harmful code. Reply: "This request cannot be generated because it violates safety guidelines."`;

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
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
