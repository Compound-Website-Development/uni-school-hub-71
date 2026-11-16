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

/** Readable, stable password derived from the staff email. */
const makePassword = async (email: string) => {
  const words = ["Sky", "Light", "Wisdom", "Pearl", "Emerald", "Topaz", "Ruby", "Zircon", "Faith", "Hope"];
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email.trim().toLowerCase()));
  const bytes = new Uint8Array(digest);
  const number = (bytes[0] * 256 + bytes[1]) % 9000 + 1000;
  const w = words[bytes[2] % words.length];
  const n = number;
  return `Ims-${w}${n}`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const caller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: claims, error: claimsError } = await caller.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(url, serviceKey);

    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: claims.claims.sub,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "Admins only" }, 403);

    const { data: teachers, error: teachersError } = await admin
      .from("teachers")
      .select("id, first_name, last_name, email, department, user_id")
      .not("email", "is", null)
      .order("employee_id");
    if (teachersError) throw teachersError;

    const { data: existingUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const byEmail = new Map((existingUsers?.users ?? []).map((u) => [u.email?.toLowerCase(), u]));

    const results: Array<Record<string, unknown>> = [];

    for (const t of teachers ?? []) {
      const email = String(t.email).trim().toLowerCase();
      const existing = byEmail.get(email);
      const password = await makePassword(email);

      if (existing) {
        if (!t.user_id) await admin.from("teachers").update({ user_id: existing.id }).eq("id", t.id);
        const { error: resetError } = await admin.auth.admin.updateUserById(existing.id, { password });
        if (resetError) {
          results.push({
            name: `${t.first_name} ${t.last_name}`,
            email,
            department: t.department,
            password: null,
            status: `error: ${resetError.message}`,
          });
          continue;
        }
        await admin
          .from("user_roles")
          .upsert({ user_id: existing.id, role: "teacher" }, { onConflict: "user_id,role" });
        results.push({
          name: `${t.first_name} ${t.last_name}`,
          email,
          department: t.department,
          password,
          status: "password_reset",
        });
        continue;
      }

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { role: "teacher" },
        user_metadata: {
          first_name: t.first_name,
          last_name: t.last_name,
        },
      });

      if (createError || !created?.user) {
        results.push({
          name: `${t.first_name} ${t.last_name}`,
          email,
          department: t.department,
          password: null,
          status: `error: ${createError?.message ?? "unknown"}`,
        });
        continue;
      }

      await admin.from("teachers").update({ user_id: created.user.id }).eq("id", t.id);
      await admin
        .from("user_roles")
        .upsert({ user_id: created.user.id, role: "teacher" }, { onConflict: "user_id,role" });

      results.push({
        name: `${t.first_name} ${t.last_name}`,
        email,
        department: t.department,
        password,
        status: "created",
      });
    }

    return json({ count: results.length, accounts: results });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
