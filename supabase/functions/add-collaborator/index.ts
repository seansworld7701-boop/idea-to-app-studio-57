import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Authentication required" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const publishableKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
      return json({ error: "Backend configuration is incomplete" }, 500);
    }

    const userClient = createClient(supabaseUrl, publishableKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: authData, error: authError } = await userClient.auth.getUser();

    if (authError || !authData.user) {
      return json({ error: "Authentication required" }, 401);
    }

    const body = await req.json().catch(() => null);
    const projectId = typeof body?.projectId === "string" ? body.projectId : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!projectId) {
      return json({ error: "Project is required" }, 400);
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Enter a valid email address" }, 400);
    }

    const ownerId = authData.user.id;

    const { data: project, error: projectError } = await adminClient
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .maybeSingle();

    if (projectError || !project) {
      return json({ error: "Project not found" }, 404);
    }

    if (project.user_id !== ownerId) {
      return json({ error: "Only the project owner can add collaborators" }, 403);
    }

    const { count, error: countError } = await adminClient
      .from("project_collaborators")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId);

    if (countError) {
      return json({ error: "Could not verify collaborator limits" }, 500);
    }

    if ((count ?? 0) >= 3) {
      return json({ error: "This project already has the maximum number of collaborators" }, 400);
    }

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    if (profileError || !profile) {
      return json({ error: "User not found. They need to sign up first." }, 404);
    }

    if (profile.user_id === ownerId) {
      return json({ error: "You are already the owner of this project" }, 400);
    }

    const { data: existingCollaborator } = await adminClient
      .from("project_collaborators")
      .select("id")
      .eq("project_id", projectId)
      .eq("email", email)
      .maybeSingle();

    if (existingCollaborator) {
      return json({ error: "This person is already a collaborator" }, 409);
    }

    const { error: insertError } = await adminClient
      .from("project_collaborators")
      .insert({
        project_id: projectId,
        user_id: profile.user_id,
        email,
      });

    if (insertError) {
      return json({ error: "Failed to add collaborator" }, 500);
    }

    return json({ success: true });
  } catch (error) {
    console.error("add-collaborator error", error);
    return json({ error: "Unexpected error while adding collaborator" }, 500);
  }
});