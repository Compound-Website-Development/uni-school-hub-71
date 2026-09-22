import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token } = await req.json();
    if (typeof token !== "string" || token.length < 16 || token.length > 200) {
      return json({ error: "Invalid QR code" }, 400);
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    const { data: student, error: studentError } = await admin
      .from("students")
      .select("user_id, student_id")
      .eq("public_token", token)
      .eq("status", "active")
      .maybeSingle();

    if (studentError || !student?.user_id || !student.student_id) {
      return json({ error: "QR code is invalid or inactive" }, 404);
    }

    const email = `pupil.${String(student.student_id).toLowerCase().replace(/[^a-z0-9]/g, "")}@imagemakers.local`;
    const { data: link, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (linkError || !link?.properties?.hashed_token) {
      return json({ error: "Unable to start student session" }, 500);
    }

    return json({ token_hash: link.properties.hashed_token });
  } catch {
    return json({ error: "Unable to authenticate QR code" }, 500);
  }
});
