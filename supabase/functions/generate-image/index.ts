import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { prompt } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try multiple model names for image generation
    const modelNames = [
      "gemini-2.0-flash-exp-image-generation",
      "gemini-2.0-flash-exp",
      "gemini-2.0-flash-preview-image-generation",
      "gemini-2.5-flash-preview-image-generation",
      "gemini-2.5-flash",
    ];

    let lastError = "";
    
    for (const modelName of modelNames) {
      try {
        console.log(`Trying model: ${modelName}`);
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: `Generate an image: ${prompt}` }],
                },
              ],
              generationConfig: {
                responseModalities: ["TEXT", "IMAGE"],
              },
            }),
          }
        );

        if (!response.ok) {
          const t = await response.text();
          console.error(`Model ${modelName} failed:`, response.status, t);
          lastError = t;
          if (response.status === 429) {
            return new Response(
              JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          continue;
        }

        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts || [];

        let text = "";
        const images: { type: string; image_url: { url: string } }[] = [];

        for (const part of parts) {
          if (part.text) {
            text += part.text;
          } else if (part.inlineData) {
            const mimeType = part.inlineData.mimeType || "image/png";
            const base64 = part.inlineData.data;
            images.push({
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}` },
            });
          }
        }

        if (images.length === 0) {
          console.log(`Model ${modelName} returned no images, trying next...`);
          lastError = "No image was generated";
          continue;
        }

        console.log(`Success with model: ${modelName}, generated ${images.length} image(s)`);
        return new Response(
          JSON.stringify({ text, images }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (e) {
        console.error(`Model ${modelName} error:`, e);
        lastError = e instanceof Error ? e.message : "Unknown error";
        continue;
      }
    }

    // All models failed — try Imagen API as fallback
    console.log("Trying Imagen API as fallback...");
    try {
      const imagenResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instances: [{ prompt }],
            parameters: {
              sampleCount: 1,
            },
          }),
        }
      );

      if (imagenResponse.ok) {
        const imagenData = await imagenResponse.json();
        const predictions = imagenData.predictions || [];
        if (predictions.length > 0 && predictions[0].bytesBase64Encoded) {
          const images = predictions.map((p: any) => ({
            type: "image_url",
            image_url: { url: `data:image/png;base64,${p.bytesBase64Encoded}` },
          }));
          console.log("Success with Imagen API");
          return new Response(
            JSON.stringify({ text: "", images }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        const t = await imagenResponse.text();
        console.error("Imagen API failed:", imagenResponse.status, t);
      }
    } catch (e) {
      console.error("Imagen fallback error:", e);
    }

    return new Response(
      JSON.stringify({ error: "Image generation is not available with your current API key. Please check that your Gemini API key has image generation enabled." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
