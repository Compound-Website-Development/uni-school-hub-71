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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const randomPassword = () => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
};

/**
 * Exchanges a pupil's ID-card QR token for a sign-in link.
 * If the pupil has no login yet, one is created and linked on first scan,
 * so imported pupils work without a separate provisioning step.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token } = await req.json();
    if (typeof token !== "string" || !UUID_RE.test(token)) {
      return json({ error: "Invalid QR code" }, 400);
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });

    const { data: student, error: studentError } = await admin
      .from("students")
      .select("id, user_id, student_id, first_name, last_name")
      .eq("public_token", token)
      .eq("status", "active")
      .maybeSingle();

    if (studentError || !student) return json({ error: "QR code is invalid or inactive" }, 404);

    let email: string | null = null;

    if (student.user_id) {
      const { data: u } = await admin.auth.admin.getUserById(student.user_id);
      email = u?.user?.email ?? null;
    }

    if (!email) {
      // Stable login address tied to the pupil record (not the admission number, which the school may edit).
      email = `pupil.${String(student.id).replace(/-/g, "")}@imagemakers.local`;
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password: randomPassword(),
        email_confirm: true,
        app_metadata: { role: "student" },
        user_metadata: { first_name: student.first_name, last_name: student.last_name },
      });
      let userId = created?.user?.id;
      if (createError || !userId) {
        // Account may already exist from an earlier partial attempt.
        const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        userId = list?.users.find((u) => u.email?.toLowerCase() === email)?.id;
        if (!userId) return json({ error: "Unable to start student session" }, 500);
      }
      await admin.from("students").update({ user_id: userId }).eq("id", student.id);
      await admin.from("user_roles").upsert({ user_id: userId, role: "student" }, { onConflict: "user_id,role" });
    }

    const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (linkError || !link?.properties?.hashed_token) {
      return json({ error: "Unable to start student session" }, 500);
    }

    return json({ token_hash: link.properties.hashed_token });
  } catch {
    return json({ error: "Unable to authenticate QR code" }, 500);
  }
});
